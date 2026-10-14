const express = require('express');
const { ErroProjeto, MAX_BYTES } = require('../services/projetos/projetos.service');

function criarRotasProjetos({ authService, projetosService, limitador }) {
  const router = express.Router();
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.use(limitador);
  router.use(async (req, res, next) => {
    try {
      req.tokenProjeto = (req.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
      const usuario = await authService.obterUsuario(req.tokenProjeto);
      req.donoProjeto = usuario.usuario_id;
      if (!req.donoProjeto) throw new ErroProjeto('Sessão inválida.', 401);
      next();
    } catch (error) { res.status(error.statusCode || 401).json({ ok: false, error: 'Entre na conta para acessar seus projetos.' }); }
  });
  const handler = fn => async (req, res) => {
    try { res.json({ ok: true, ...await fn(req) }); }
    catch (error) {
      res.status(error instanceof ErroProjeto ? error.statusCode : 503).json({
        ok: false, error: error instanceof ErroProjeto ? error.message : 'Não foi possível acessar os projetos. Tente novamente.'
      });
    }
  };
  router.get('/', handler(req => projetosService.listar(req.tokenProjeto, req.donoProjeto, {
    offset: req.query.offset === undefined ? 0 : Number(req.query.offset),
    limit: req.query.limit === undefined ? 20 : Number(req.query.limit)
  })));
  router.put('/:id', express.json({ limit: MAX_BYTES }), handler(async req => ({ projeto: await projetosService.salvar(req.tokenProjeto, req.donoProjeto, req.params.id, req.body) })));
  router.get('/:id', handler(async req => ({ projeto: await projetosService.carregar(req.tokenProjeto, req.donoProjeto, req.params.id) })));
  router.delete('/:id', handler(req => projetosService.remover(req.tokenProjeto, req.donoProjeto, req.params.id)));
  router.delete('/', handler(req => projetosService.limpar(req.tokenProjeto, req.donoProjeto)));
  return router;
}
module.exports = { criarRotasProjetos };
