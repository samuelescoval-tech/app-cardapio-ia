const express = require('express');
const path = require('path');
require('dotenv').config();

const { gerarPlano, getGeminiStatus } = require('./src/services/ai/gemini.service');
const { montarPromptPlanejamento } = require('./src/prompts/event.prompt');
const { calcularMotorEvento, aplicarMotorAoPlano } = require('./src/services/planning/motor.service');
const { validarEvento, ErroValidacaoEvento } = require('./src/utils/validate-event');

const app = express();
const demoAccessKey = process.env.DEMO_ACCESS_KEY;

app.use(express.json({ limit: '20kb' }));

// Serve os arquivos estáticos da pasta public/
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
    res.json({
        ok: true,
        ai: getGeminiStatus(),
        demo_access: {
            required: Boolean(demoAccessKey)
        },
        planning: {
            motor_local: true,
            prompt_backend: true
        }
    });
});

async function gerarCardapioHandler(req, res) {
    try {
        if (demoAccessKey && req.get('x-demo-access-key') !== demoAccessKey) {
            return res.status(401).json({
                ok: false,
                error: "Senha de teste inválida ou ausente."
            });
        }

        const evento = validarEvento(req.body.evento);
        console.log('📨 Evento recebido:', evento.tipo, `| ${evento.pessoas} pessoas`);
        
        const motor = calcularMotorEvento(evento);
        console.log('⚙️ Motor: Calculado');
        
        const prompt = montarPromptPlanejamento(evento, motor);
        console.log('📝 Prompt:', `${prompt.length} chars`);

        const resposta = await gerarPlano(prompt);
        if (motor && resposta.plano) {
            resposta.plano = aplicarMotorAoPlano(resposta.plano, motor);
            resposta.meta = {
                ...(resposta.meta || {}),
                motor_local: true,
                prompt_backend: true
            };
        }

        res.json(resposta);

    } catch (error) {
        if (error instanceof ErroValidacaoEvento) {
            return res.status(400).json({
                ok: false,
                error: error.message,
                campo: error.campo
            });
        }

        console.error("❌ Erro no Gemini:", error);
        res.status(500).json({
            ok: false,
            error: "Erro ao gerar planejamento. Verifique sua chave de API.",
            meta: {
                erro: error.message
            }
        });
    }
}

app.post('/gerar-cardapio', gerarCardapioHandler);

// Força a abertura do index.html na rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
    app.listen(process.env.PORT || 3000, () => console.log(`✅ Chef IA Rodando! Acesse: http://localhost:${process.env.PORT || 3000}`));
}

module.exports = { app, gerarCardapioHandler };
