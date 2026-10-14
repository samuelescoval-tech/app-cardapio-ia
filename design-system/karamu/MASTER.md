# Karamu — identidade editorial

Base visual aplicada localmente em 2026-10-14, na branch
`feature/identidade-visual`. A direção existente foi preservada e organizada
após o usuário apontar dupla rolagem e títulos desproporcionais na apresentação.
Este registro orienta as próximas telas; não declara a Sprint 6A concluída.

[Guia editável no Figma](https://www.figma.com/design/GhvrTeIvj1Y92o0G4Jt0Xy?node-id=3-2)
— página `01 · Identidade editorial`, quadro `Karamu / Fundamentos visuais`.
Contém duas coleções, 24 variáveis primitivas e 24 semânticas com aliases,
oito estilos de texto e uma sombra compartilhada. Cores e espaços apontam para
os nomes reais das variáveis CSS. O quadro usa textos editáveis e auto layout;
foi inspecionado visualmente. É um guia de fundamentos, não um protótipo completo
das jornadas nem uma biblioteca completa de componentes.

## Direção

- Gastronomia editorial: acolhedora, clara e organizada.
- Creme e texto escuro na ferramenta; preto suave e texto creme na apresentação.
- Dourado para acentos, ação e estado ativo. Títulos sem brilho dourado.
- Preservar o logo Karamu, Montserrat 800 e chapéu. Na navegação, logo maior e
  palavra menor na seção ativa; relação inversa na outra seção.
- Formulários, fornecedores/produtos, fotos e projetos compartilham fundamentos,
  mas cada fluxo mantém sua função e os comportamentos já homologados.

## Tipografia

| Uso | Fonte | Tamanho CSS | Entrelinha |
| --- | --- | --- | --- |
| Capa da apresentação | Playfair Display 700 | 36–56px | 1,12 |
| Seções da apresentação | Playfair Display 700 | 28–40px | 1,18 |
| Títulos de painéis | Playfair Display 700 | 26–32px | 1,20 |
| Introdução | Montserrat 400 | 17px; 16px no celular | 1,65 |
| Texto e campos | Montserrat 400 | 16px | 1,65 |
| Auxiliares e rótulos | Montserrat 400/700 | 14px | 1,50 ou conforme componente |

Tamanhos de títulos usam `clamp` em `base.css`; estilos desktop do Figma
representam o limite superior. Navegação compacta é exceção documentada:
palavra ativa 12px, inativa 14px (13px no celular), logo ativo 18px,
inativo 11px. Não diminuir texto do formulário para acomodar mais colunas.

## Cores

| Variável CSS | Cor | Uso |
| --- | --- | --- |
| `--bg` | `#FDFAF6` | Fundo da ferramenta |
| `--cream` | `#FDFAF3` | Superfície auxiliar |
| `--white` | `#FFFFFF` | Campos e painéis |
| `--black-soft` | `#1A1A1A` | Apresentação |
| `--ink-strong` / `--ink` | `#241F18` / `#3D3428` | Títulos / leitura |
| `--ink-soft` | `#6F665C` | Auxiliares em fundo claro |
| `--text` / `--text-soft` | `#F5EFE6` / `#C7C0B5` | Leitura em fundo escuro |
| `--gold` | `#D4AF37` | Acentos e ação |
| `--gold-dark` | `#B8860B` | Superfície/gradiente de botão existente |
| `--gold-ink` | `#805F13` | Texto dourado em fundo claro |
| `--sand` | `#E9DFC7` | Bordas suaves |

Não usar o dourado do botão como texto pequeno em fundo branco.
Pares conferidos: `--gold-ink`/branco 5,89:1;
`--ink-soft`/branco 5,63:1; `--text`/preto suave 15,23:1.
Isso verifica estes pares, não equivale à certificação de acessibilidade do app.

## Espaço, imagens e interação

- Espaços: 4, 8, 12, 16, 24, 32, 48 e 64px.
- Raios: 8px nos controles, 12px em grupos, 16px nos painéis/fotos.
- Sombras suaves; animações curtas e específicas, respeitando movimento reduzido.
- Imagens da apresentação em 4:3, sem perspectiva. No celular, texto antes
  da imagem. Não criar uma tela inteira de altura para cada bloco curto.
- Apresentação e Gerador usam a rolagem do documento. `modal-open` pertence
  somente a modais reais; fechar login/demo não deve criar outro scroll.
- Destinos de rolagem reservam espaço para a navegação fixa. O controle da
  capa deve continuar acessível, inclusive quando recolhida.
- Manter formulários, rótulos e ações legíveis; áreas de toque das ações
  ajustadas neste lote têm pelo menos 44px. Não simular cliques em cards
  apenas informativos com sombras/animações de botão.

## Referências e limites

O roadmap registra Resn, Star Atlas, Ryazbek e os templates enviados como
inspirações; não são layouts aprovados para copiar. A direção Editorial e o
logo existentes têm precedência. A entrada com mesa vista de cima permanece
ideia para depois de estabilizar os fluxos, com acesso imediato ao Gerador,
alternativa estática e suporte a movimento reduzido. Referências recuperadas
dos registros anteriores, sem nova auditoria dos sites nesta rodada.

Este primeiro lote alcança apresentação e fundamentos de navegação/formulários.
Ainda faltam protótipos de estados do Gerador/resultado, organização dos Projetos
e Perfil, foco do perfil, erros próximos aos campos, textos e hierarquia de ações.
Não marcar essas pendências como resolvidas apenas por compartilhar variáveis.
Próximas etapas em `docs/PLANO_UI_UX_E_PROXIMAS_ETAPAS.md`.
