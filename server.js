const express = require('express');
const path = require('path');
require('dotenv').config();

const { gerarPlano, getGeminiStatus } = require('./src/services/ai/gemini.service');
const { montarPromptPlanejamento } = require('./src/prompts/event.prompt');
const { calcularMotorEvento, aplicarMotorAoPlano } = require('./src/services/planning/motor.service');

const app = express();
app.use(express.json());

// Serve os arquivos estáticos da pasta public/
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
    res.json({
        ok: true,
        ai: getGeminiStatus(),
        planning: {
            motor_local: true,
            prompt_backend: true
        }
    });
});

app.post('/gerar-cardapio', async (req, res) => {
    try {
        console.log('📨 Requisição recebida:', JSON.stringify(req.body).substring(0, 200));
        
        const evento = req.body.evento;
        console.log('📋 Evento:', evento ? 'Sim' : 'Não');
        
        const motor = evento ? calcularMotorEvento(evento) : null;
        console.log('⚙️ Motor:', motor ? 'Calculado' : 'Null');
        
        const prompt = req.body.prompt || (evento ? montarPromptPlanejamento(evento, motor) : null);
        console.log('📝 Prompt:', prompt ? `${prompt.length} chars` : 'Null');

        if (!prompt) {
            console.log('❌ Erro: Prompt é obrigatório');
            return res.status(400).json({
                error: "Prompt ou dados do evento são obrigatórios.",
                ok: false,
                debug: { evento: !!evento, motor: !!motor, prompt: !!prompt }
            });
        }

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
        console.error("❌ Erro no Gemini:", error);
        res.status(500).json({
            ok: false,
            error: "Erro ao gerar planejamento. Verifique sua chave de API.",
            meta: {
                erro: error.message
            }
        });
    }
});

// Força a abertura do index.html na rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(process.env.PORT || 3000, () => console.log(`✅ Chef IA Rodando! Acesse: http://localhost:${process.env.PORT || 3000}`));
