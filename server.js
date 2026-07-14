const express = require('express');
const path = require('path');
require('dotenv').config();

const { gerarPlano, getGeminiStatus } = require('./src/services/ai/gemini.service');
const { montarPromptPlanejamento } = require('./src/prompts/event.prompt');
const { calcularMotorEvento, aplicarMotorAoPlano } = require('./src/services/planning/motor.service');
const { obterDiretrizCulinaria } = require('./src/services/planning/culinary-matrix.service');
const { validarEvento, ErroValidacaoEvento } = require('./src/utils/validate-event');
const { validarHistoricoCulinario } = require('./src/utils/validate-culinary-history');
const { criarContextoVariedade, avaliarVariedadePlano } = require('./src/services/planning/culinary-variety.service');
const { criarSpoonacularService, SpoonacularError } = require('./src/services/recipes/spoonacular.service');

const app = express();
const demoAccessKey = process.env.DEMO_ACCESS_KEY;
const spoonacularService = criarSpoonacularService();

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
            prompt_backend: true,
            culinary_variety_history: true,
            advanced_event_context: true,
            operational_complexity: true,
            event_coherence_blocks: true
        },
        recipe_references: spoonacularService.getStatus()
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
        
        const diretrizCulinaria = obterDiretrizCulinaria(evento);
        const motor = calcularMotorEvento(evento, diretrizCulinaria);
        const historicoCulinario = validarHistoricoCulinario(req.body.historico_culinario);
        const contextoVariedade = criarContextoVariedade(evento, diretrizCulinaria, historicoCulinario);
        console.log('⚙️ Motor: Calculado');
        
        const prompt = montarPromptPlanejamento(evento, motor, diretrizCulinaria, contextoVariedade);
        console.log('📝 Prompt:', `${prompt.length} chars`);

        const resposta = await gerarPlano(prompt, { diretrizCulinaria, evento });
        if (resposta.ok && resposta.plano) {
            resposta.plano.variedade_culinaria = avaliarVariedadePlano(resposta.plano, contextoVariedade);
            resposta.plano.contexto_evento = diretrizCulinaria.contexto_evento;
        }
        if (motor && resposta.plano) {
            resposta.plano = aplicarMotorAoPlano(resposta.plano, motor);
            resposta.meta = {
                ...(resposta.meta || {}),
                motor_local: true,
                prompt_backend: true,
                historicos_culinarios_considerados: contextoVariedade.historicos_considerados,
                qualidade_culinaria: resposta.plano.qualidade_culinaria?.status !== "revisar",
                qualidade_culinaria_status: resposta.plano.qualidade_culinaria?.status || "nao_avaliado",
                ajustes_culinarios: resposta.plano.qualidade_culinaria?.ajustes?.length || 0,
                avisos_culinarios: resposta.plano.qualidade_culinaria?.avisos?.length || 0,
                variedade_culinaria_status: resposta.plano.variedade_culinaria?.status || "nao_avaliado",
                repeticoes_culinarias_a_revisar: resposta.plano.variedade_culinaria?.repeticoes_a_revisar?.length || 0,
                blocos_cardapio: resposta.plano.blocos_cardapio?.length || 0
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

async function buscarReferenciasHandler(req, res) {
    try {
        if (demoAccessKey && req.get('x-demo-access-key') !== demoAccessKey) {
            return res.status(401).json({
                ok: false,
                error: "Senha de teste inválida ou ausente."
            });
        }

        const resultado = await spoonacularService.buscarReferencias(req.body?.query);
        res.json({ ok: true, ...resultado });
    } catch (error) {
        if (error instanceof SpoonacularError) {
            return res.status(error.statusCode).json({
                ok: false,
                error: error.message
            });
        }

        console.error("❌ Erro nas referencias externas:", error.message);
        res.status(500).json({
            ok: false,
            error: "Não foi possível consultar referências externas."
        });
    }
}

app.post('/api/referencias-receitas', buscarReferenciasHandler);

// Força a abertura do index.html na rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
    app.listen(process.env.PORT || 3000, () => console.log(`✅ Chef IA Rodando! Acesse: http://localhost:${process.env.PORT || 3000}`));
}

module.exports = { app, gerarCardapioHandler, buscarReferenciasHandler };
