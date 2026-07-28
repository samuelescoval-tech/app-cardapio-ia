const express = require('express');
const path = require('path');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
// quiet: true suprime as dicas promocionais que o proprio pacote dotenv
// imprime no console a cada carregamento (inclusive links para outros
// produtos do mantenedor, sem relacao com este projeto).
require('dotenv').config({ quiet: true });

const { gerarPlano, getGeminiStatus, criarGeminiService } = require('./src/services/ai/gemini.service');
const { montarPromptPlanejamento } = require('./src/prompts/event.prompt');
const { calcularMotorEvento, aplicarMotorAoPlano } = require('./src/services/planning/motor.service');
const { obterDiretrizCulinaria } = require('./src/services/planning/culinary-matrix.service');
const { validarEvento, ErroValidacaoEvento } = require('./src/utils/validate-event');
const { validarHistoricoCulinario } = require('./src/utils/validate-culinary-history');
const { criarContextoVariedade, avaliarVariedadePlano } = require('./src/services/planning/culinary-variety.service');
const { criarSpoonacularService, SpoonacularError } = require('./src/services/recipes/spoonacular.service');
const { criarOpenverseService } = require('./src/services/images/openverse.service');
const { criarImageSelectionService } = require('./src/services/images/image-selection.service');
const { avaliarQualidadeEvento } = require('./src/services/planning/event-quality.service');
const { avaliarRendimentoAlimentar } = require('./src/services/planning/food-yield.service');
const { criarSupabaseAuthService, ErroAutenticacao } = require('./src/services/auth/supabase-auth.service');
const { criarFornecedoresService, ErroFornecedor } = require('./src/services/personalizacao/fornecedores.service');
const { criarFotosService, ErroFoto } = require('./src/services/personalizacao/fotos.service');
const { criarChaveIAService, ErroChaveIA } = require('./src/services/personalizacao/chave-ia.service');

const app = express();
// Necessario para o express-rate-limit identificar o IP real do cliente
// atras do proxy da Vercel (1 hop); sem isso ele usaria sempre o IP do
// proxy e todo mundo cairia no mesmo balde de limite.
app.set('trust proxy', 1);
const demoAccessKey = process.env.DEMO_ACCESS_KEY;
const spoonacularService = criarSpoonacularService();
const openverseService = criarOpenverseService();
const imageSelectionService = criarImageSelectionService({ openverseService });
const supabaseAuthService = criarSupabaseAuthService();
const fornecedoresService = criarFornecedoresService();
const fotosService = criarFotosService();
const chaveIAService = criarChaveIAService();

// Cabecalhos de seguranca (Plano 15, auditoria). O front-end usa onclick=""
// e style="" inline em varios lugares, entao script-src/style-src precisam
// de 'unsafe-inline'; ainda assim, frame-ancestors bloqueia clickjacking e
// img-src/font-src/connect-src ficam restritos as origens realmente usadas.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"]
        }
    }
}));

const limitadorAuth = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }
});

const limitadorGeracao = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Muitas solicitacoes seguidas. Aguarde um minuto e tente novamente." }
});

// Fornecedores e fotos nao chamam nenhuma IA/API externa (so Supabase), mas
// sem isso um usuario autenticado podia escrever sem nenhum limite e estourar
// a cota gratuita de banco/storage do Supabase (Plano 15, revisao apos remover
// o gate de DEMO_ACCESS_KEY dessas rotas).
const limitadorPersonalizacao = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Muitas solicitacoes seguidas. Aguarde um minuto e tente novamente." }
});

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
            event_coherence_blocks: true,
            recipe_operational_recovery: true,
            beverage_volume_reconciliation: true,
            event_quality_gate: true,
            food_yield_gate: true
        },
        recipe_references: spoonacularService.getStatus(),
        visual_references: openverseService.getStatus(),
        visual_library: {
            configured: true,
            strategy: "local-first",
            version: "1.0.0"
        },
        auth: supabaseAuthService.getStatus()
    });
});

function validarCredenciais(body) {
    const email = String(body?.email || "").trim().slice(0, 200);
    const senha = String(body?.senha || "");
    if (!email || !email.includes("@")) {
        throw new ErroAutenticacao("Informe um e-mail valido.", 400);
    }
    if (senha.length < 6) {
        throw new ErroAutenticacao("A senha deve ter pelo menos 6 caracteres.", 400);
    }
    return { email, senha };
}

async function registrarHandler(req, res) {
    try {
        const { email, senha } = validarCredenciais(req.body);
        const resultado = await supabaseAuthService.cadastrar(email, senha);
        res.json({ ok: true, ...resultado });
    } catch (error) {
        if (error instanceof ErroAutenticacao) {
            return res.status(error.statusCode).json({ ok: false, error: error.message });
        }
        console.error("❌ Erro no cadastro:", error.message);
        res.status(500).json({ ok: false, error: "Nao foi possivel completar o cadastro." });
    }
}

async function loginHandler(req, res) {
    try {
        const { email, senha } = validarCredenciais(req.body);
        const resultado = await supabaseAuthService.login(email, senha);
        res.json({ ok: true, ...resultado });
    } catch (error) {
        if (error instanceof ErroAutenticacao) {
            return res.status(error.statusCode).json({ ok: false, error: error.message });
        }
        console.error("❌ Erro no login:", error.message);
        res.status(500).json({ ok: false, error: "Nao foi possivel completar o login." });
    }
}

async function perfilHandler(req, res) {
    try {
        const token = (req.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
        const usuario = await supabaseAuthService.obterUsuario(token);
        res.json({ ok: true, ...usuario });
    } catch (error) {
        if (error instanceof ErroAutenticacao) {
            return res.status(error.statusCode).json({ ok: false, error: error.message });
        }
        console.error("❌ Erro ao obter perfil:", error.message);
        res.status(500).json({ ok: false, error: "Nao foi possivel obter o perfil." });
    }
}

app.post('/api/auth/registrar', limitadorAuth, registrarHandler);
app.post('/api/auth/login', limitadorAuth, loginHandler);
app.get('/api/auth/perfil', perfilHandler);

function obterToken(req) {
    return (req.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

function tratarErroPersonalizacao(error, res, mensagemPadrao) {
    if (error instanceof ErroAutenticacao || error instanceof ErroFornecedor || error instanceof ErroFoto || error instanceof ErroChaveIA) {
        return res.status(error.statusCode).json({ ok: false, error: error.message });
    }
    console.error("❌ Erro na personalizacao:", error.message);
    res.status(500).json({ ok: false, error: mensagemPadrao });
}

async function listarFornecedoresHandler(req, res) {
    try {
        const token = obterToken(req);
        await supabaseAuthService.obterUsuario(token);
        const fornecedores = await fornecedoresService.listar(token);
        res.json({ ok: true, fornecedores });
    } catch (error) {
        tratarErroPersonalizacao(error, res, "Nao foi possivel listar os fornecedores.");
    }
}

async function criarFornecedorHandler(req, res) {
    try {
        const token = obterToken(req);
        const usuario = await supabaseAuthService.obterUsuario(token);
        const fornecedor = await fornecedoresService.criar(token, usuario.usuario_id, req.body);
        res.json({ ok: true, fornecedor });
    } catch (error) {
        tratarErroPersonalizacao(error, res, "Nao foi possivel criar o fornecedor.");
    }
}

async function atualizarFornecedorHandler(req, res) {
    try {
        const token = obterToken(req);
        await supabaseAuthService.obterUsuario(token);
        const fornecedor = await fornecedoresService.atualizar(token, req.params.id, req.body);
        res.json({ ok: true, fornecedor });
    } catch (error) {
        tratarErroPersonalizacao(error, res, "Nao foi possivel atualizar o fornecedor.");
    }
}

async function removerFornecedorHandler(req, res) {
    try {
        const token = obterToken(req);
        await supabaseAuthService.obterUsuario(token);
        const resultado = await fornecedoresService.remover(token, req.params.id);
        res.json({ ok: true, ...resultado });
    } catch (error) {
        tratarErroPersonalizacao(error, res, "Nao foi possivel remover o fornecedor.");
    }
}

app.get('/api/fornecedores', limitadorPersonalizacao, listarFornecedoresHandler);
app.post('/api/fornecedores', limitadorPersonalizacao, criarFornecedorHandler);
app.put('/api/fornecedores/:id', limitadorPersonalizacao, atualizarFornecedorHandler);
app.delete('/api/fornecedores/:id', limitadorPersonalizacao, removerFornecedorHandler);

async function listarFotosHandler(req, res) {
    try {
        const token = obterToken(req);
        await supabaseAuthService.obterUsuario(token);
        const fotos = await fotosService.listar(token);
        res.json({ ok: true, fotos });
    } catch (error) {
        tratarErroPersonalizacao(error, res, "Nao foi possivel listar as fotos.");
    }
}

async function criarFotoHandler(req, res) {
    try {
        const token = obterToken(req);
        const usuario = await supabaseAuthService.obterUsuario(token);
        const foto = await fotosService.criar(token, usuario.usuario_id, req.body);
        res.json({ ok: true, foto });
    } catch (error) {
        tratarErroPersonalizacao(error, res, "Nao foi possivel enviar a foto.");
    }
}

async function removerFotoHandler(req, res) {
    try {
        const token = obterToken(req);
        await supabaseAuthService.obterUsuario(token);
        const resultado = await fotosService.remover(token, req.params.id);
        res.json({ ok: true, ...resultado });
    } catch (error) {
        tratarErroPersonalizacao(error, res, "Nao foi possivel remover a foto.");
    }
}

app.get('/api/fotos', limitadorPersonalizacao, listarFotosHandler);
app.post('/api/fotos', limitadorPersonalizacao, express.json({ limit: '8mb' }), criarFotoHandler);
app.delete('/api/fotos/:id', limitadorPersonalizacao, removerFotoHandler);

async function obterStatusChaveIAHandler(req, res) {
    try {
        const token = obterToken(req);
        await supabaseAuthService.obterUsuario(token);
        const status = await chaveIAService.obterStatus(token);
        res.json({ ok: true, ...status });
    } catch (error) {
        tratarErroPersonalizacao(error, res, "Nao foi possivel consultar a chave de IA.");
    }
}

async function salvarChaveIAHandler(req, res) {
    try {
        const token = obterToken(req);
        const usuario = await supabaseAuthService.obterUsuario(token);
        const resultado = await chaveIAService.salvar(token, usuario.usuario_id, req.body);
        res.json({ ok: true, ...resultado });
    } catch (error) {
        tratarErroPersonalizacao(error, res, "Nao foi possivel salvar a chave de IA.");
    }
}

async function removerChaveIAHandler(req, res) {
    try {
        const token = obterToken(req);
        const usuario = await supabaseAuthService.obterUsuario(token);
        const resultado = await chaveIAService.remover(token, usuario.usuario_id);
        res.json({ ok: true, ...resultado });
    } catch (error) {
        tratarErroPersonalizacao(error, res, "Nao foi possivel remover a chave de IA.");
    }
}

app.get('/api/perfil/chave-ia', limitadorPersonalizacao, obterStatusChaveIAHandler);
app.put('/api/perfil/chave-ia', limitadorPersonalizacao, salvarChaveIAHandler);
app.delete('/api/perfil/chave-ia', limitadorPersonalizacao, removerChaveIAHandler);

async function obterChaveIAUsuarioOuNulo(req) {
    const token = obterToken(req);
    if (!token) return null;
    try {
        await supabaseAuthService.obterUsuario(token);
        return await chaveIAService.obterChaveDecifrada(token);
    } catch {
        return null;
    }
}

async function gerarCardapioHandler(req, res) {
    try {
        // Usuario com a propria chave Gemini configurada (Plano 16, item 2) nao
        // consome a cota compartilhada, entao a senha demo nao se aplica a ele.
        const chaveIAUsuario = await obterChaveIAUsuarioOuNulo(req);
        if (!chaveIAUsuario && demoAccessKey && req.get('x-demo-access-key') !== demoAccessKey) {
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

        const gerarPlanoComChave = chaveIAUsuario
            ? criarGeminiService({ apiKey: chaveIAUsuario }).gerarPlano
            : gerarPlano;
        const resposta = await gerarPlanoComChave(prompt, { diretrizCulinaria, evento });
        resposta.meta = { ...(resposta.meta || {}), chave_ia_propria: Boolean(chaveIAUsuario) };
        if (resposta.ok && resposta.plano) {
            resposta.plano.variedade_culinaria = avaliarVariedadePlano(resposta.plano, contextoVariedade);
            resposta.plano.contexto_evento = diretrizCulinaria.contexto_evento;
        }
        if (motor && resposta.plano) {
            resposta.plano = aplicarMotorAoPlano(resposta.plano, motor);
            resposta.plano.rendimento_alimentar = avaliarRendimentoAlimentar(resposta.plano, evento, motor);
            resposta.plano.avaliacao_evento = avaliarQualidadeEvento(resposta.plano, evento, diretrizCulinaria);
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
                blocos_cardapio: resposta.plano.blocos_cardapio?.length || 0,
                receitas_recuperadas: resposta.plano.qualidade_culinaria?.cobertura?.receitas_recuperadas || 0,
                reconciliacao_bebidas_status: resposta.plano.reconciliacao_bebidas?.status || "nao_avaliado",
                grupos_bebidas_ajustados: resposta.plano.reconciliacao_bebidas?.grupos?.filter(grupo => grupo.status === "ajustado").length || 0,
                nota_evento: resposta.plano.avaliacao_evento?.nota ?? null,
                status_avaliacao_evento: resposta.plano.avaliacao_evento?.status || "nao_avaliado",
                rendimento_alimentar_status: resposta.plano.rendimento_alimentar?.status || "nao_avaliado"
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

app.post('/gerar-cardapio', limitadorGeracao, gerarCardapioHandler);

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

async function buscarImagensEventoHandler(req, res) {
    try {
        if (demoAccessKey && req.get('x-demo-access-key') !== demoAccessKey) {
            return res.status(401).json({ ok: false, error: "Senha de teste invalida ou ausente." });
        }
        const evento = validarEvento(req.body?.evento);
        const pratos = Array.isArray(req.body?.pratos)
            ? req.body.pratos.slice(0, 20).map((item, indice) => ({
                id: String(item?.id || `prato-${indice + 1}`).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80),
                nome: String(item?.nome || "").slice(0, 120),
                categoria: String(item?.categoria || "").slice(0, 80)
            }))
            : [];
        const resultado = await imageSelectionService.selecionarParaEvento(evento, pratos);
        res.json({ ok: true, ...resultado });
    } catch (error) {
        if (error instanceof ErroValidacaoEvento) {
            return res.status(400).json({ ok: false, error: error.message, campo: error.campo });
        }
        console.error("❌ Erro nas imagens do evento:", error.message);
        res.status(500).json({ ok: false, error: "Nao foi possivel preparar imagens para o evento." });
    }
}

app.post('/api/imagens-evento', buscarImagensEventoHandler);

// Força a abertura do index.html na rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
    app.listen(process.env.PORT || 3000, () => console.log(`✅ Chef IA Rodando! Acesse: http://localhost:${process.env.PORT || 3000}`));
}

// A exportacao padrao precisa ser a propria funcao Express (nao um objeto),
// pois o preset "Express" da Vercel exige isso do modulo apontado por
// package.json.main. Os handlers continuam disponiveis como propriedades
// para os testes que fazem `const { app, xHandler } = require('../server')`.
module.exports = app;
Object.assign(module.exports, {
    app, gerarCardapioHandler, buscarReferenciasHandler, buscarImagensEventoHandler,
    registrarHandler, loginHandler, perfilHandler,
    listarFornecedoresHandler, criarFornecedorHandler, atualizarFornecedorHandler, removerFornecedorHandler,
    listarFotosHandler, criarFotoHandler, removerFotoHandler,
    obterStatusChaveIAHandler, salvarChaveIAHandler, removerChaveIAHandler
});
