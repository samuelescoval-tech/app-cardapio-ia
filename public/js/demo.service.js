// Exemplo editorial fixo: nunca chama IA, banco de dados ou bancos de imagens.
function criarExemploDemonstracao() {
    return {
        evento: {
            tipo: 'Jantar de aniversário',
            pessoas: 20,
            criancas: 0,
            estilo: 'Recepção acolhedora',
            duracao: '4 horas',
            local: 'Salão reservado',
            observacoes: 'Exemplo fictício, sem restrições alimentares informadas.'
        },
        plano: {
            resumo_chef: 'Um jantar fictício para 20 pessoas, com preparo simples, serviço por etapas e compras organizadas por setor.',
            cardapio: [
                { id: 'demo-entrada', nome: 'Bruschettas de tomate e manjericão', categoria: 'Entrada', descricao: 'Pão tostado, tomate fresco e manjericão.' },
                { id: 'demo-principal', nome: 'Frango assado com ervas', categoria: 'Principal', descricao: 'Sobrecoxas desossadas marinadas com ervas e limão.' },
                { id: 'demo-acompanhamento', nome: 'Arroz com legumes', categoria: 'Acompanhamento', descricao: 'Arroz soltinho com cenoura e vagem.' },
                { id: 'demo-sobremesa', nome: 'Mousse de chocolate', categoria: 'Sobremesa', descricao: 'Porções individuais servidas geladas.' },
                { id: 'demo-bebida', nome: 'Água aromatizada com limão', categoria: 'Bebida', descricao: 'Jarras com limão e hortelã, sem açúcar.' }
            ],
            motor_logistica: {
                perfil: 'Jantar de aniversário · exemplo',
                duracao: '4 horas',
                espaco: 'Salão reservado',
                alimentacao: [
                    { item: 'Entrada', quantidade: '3 unidades por pessoa' },
                    { item: 'Prato principal', quantidade: '180 g por pessoa' }
                ],
                bebidas: [{ item: 'Água e água aromatizada', quantidade: '12 litros no total' }],
                staff: [{ funcao: 'Cozinha e apoio de serviço', quantidade: 2 }]
            },
            lista_compras: [
                { item: 'Pão para bruschetta', quantidade: '60 unidades', setor: 'Padaria', natureza: 'Compra direta' },
                { item: 'Sobrecoxa de frango desossada', quantidade: '4 kg', setor: 'Açougue', natureza: 'Compra direta' },
                { item: 'Arroz', quantidade: '1,5 kg', setor: 'Mercearia', natureza: 'Compra direta' },
                { item: 'Tomate', quantidade: '1,5 kg', setor: 'Hortifruti', natureza: 'Compra direta' },
                { item: 'Chocolate meio amargo', quantidade: '800 g', setor: 'Mercearia', natureza: 'Compra direta' }
            ],
            receitas: [
                {
                    nome: 'Frango assado com ervas',
                    ingredientes: [
                        { item: 'Sobrecoxa desossada', quantidade: '4', unidade: 'kg' },
                        { item: 'Limão', quantidade: '3', unidade: 'unidades' },
                        { item: 'Ervas frescas', quantidade: '1', unidade: 'xícara' }
                    ],
                    preparo_passos: ['Marinar o frango com ervas e limão.', 'Assar até atingir ponto seguro e dourar.', 'Descansar antes de porcionar e servir.'],
                    tempo: '1h30',
                    rendimento: '20 porções'
                },
                {
                    nome: 'Mousse de chocolate',
                    ingredientes: [{ item: 'Chocolate meio amargo', quantidade: '800', unidade: 'g' }],
                    preparo_passos: ['Derreter o chocolate em banho-maria.', 'Incorporar os demais ingredientes e porcionar.', 'Gelar até firmar.'],
                    tempo: '40 minutos + geladeira',
                    rendimento: '20 taças pequenas'
                }
            ],
            cronograma: [
                { hora: '17:00', atividade: 'Preparo e organização', descricao: 'Finalizar mise en place e deixar a sobremesa gelando.' },
                { hora: '18:30', atividade: 'Recepção', descricao: 'Receber convidados e servir as bruschettas.' },
                { hora: '19:30', atividade: 'Jantar', descricao: 'Servir prato principal e acompanhamento.' },
                { hora: '21:00', atividade: 'Sobremesa e despedida', descricao: 'Servir o mousse e organizar a saída.' }
            ],
            utensilios: [
                { item: 'Assadeiras grandes', quantidade: '4 unidades' },
                { item: 'Rechauds ou travessas aquecidas', quantidade: '3 unidades' },
                { item: 'Taças para sobremesa', quantidade: '24 unidades' }
            ],
            local: [{ tipo: 'Salão reservado', capacidade: '20 convidados', pros: 'Cozinha e área de apoio no mesmo espaço.', contras: 'Confirmar ventilação e refrigeração.', recomendado: true }],
            layout: [{ nome: 'Recepção e jantar', descricao: 'Mesa de entradas próxima à chegada e jantar em uma ilha de serviço separada.' }],
            decoracao: { temas: ['Editorial acolhedor'], itens: [{ nome: 'Mesa posta', descricao: 'Tecidos neutros, folhagens e velas seguras.' }], iluminacao: 'Luz indireta e quente nas áreas de convivência.' },
            equipe_obs: [{ nome: 'Segurança alimentar', descricao: 'Manter preparos quentes e frios dentro das condições adequadas e revisar alergias antes do evento real.' }],
            entretenimento: [{ nome: 'Playlist ambiente', descricao: 'Seleção musical discreta durante recepção e jantar.' }],
            lembrancinhas: [{ nome: 'Cartão de agradecimento', descricao: 'Um cartão simples por convidado, opcional.' }]
        }
    };
}

if (typeof window !== 'undefined') window.karamuDemo = { criarExemploDemonstracao };
if (typeof module !== 'undefined' && module.exports) module.exports = { criarExemploDemonstracao };
