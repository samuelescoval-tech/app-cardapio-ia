// Ponto de entrada da Vercel (Plano 14, fase 5): reaproveita o mesmo app
// Express de server.js, sem duplicar rotas nem logica.
const { app } = require("../server");

module.exports = app;
