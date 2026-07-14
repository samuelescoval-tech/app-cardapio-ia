# Avaliacao visual local

## Objetivo

Permitir que a proxima revisao do projeto produza evidencia sobre a qualidade das imagens sem enviar notas, dados do evento ou preferencias para o servidor.

## Como avaliar

Em cada referencia visual, escolher uma opcao:

- **Adequada:** combina com o evento e pode continuar como primeira escolha.
- **Generica:** nao esta errada, mas pouco representa o contexto ou o nivel do evento.
- **Inadequada:** contradiz o evento, o prato, o publico ou o estilo esperado.

Quando uma imagem e marcada como inadequada e existe outro candidato na mesma resposta, a galeria troca a imagem automaticamente. `Trocar imagem` continua disponivel para uma mudanca sem nota; `Ocultar` remove apenas o cartao atual.

## Dados armazenados

A chave local `chef_ia_visual_feedback_v1` guarda no maximo 250 registros com somente:

- provider;
- identificador da imagem;
- slot visual;
- avaliacao.

Nao sao armazenados:

- URL da imagem ou fonte;
- tipo, tema ou observacoes do evento;
- nome do usuario;
- autoria ou licenca;
- cardapio, receitas, compras ou PDF.

As preferencias ficam somente no `localStorage` deste navegador e origem. O botao `Limpar preferencias visuais` remove apenas esse conjunto, sem apagar projetos recentes.

## Como a preferencia influencia a selecao

A pontuacao e aplicada apenas quando o mesmo identificador aparece novamente entre os candidatos:

- adequada: prioridade positiva;
- sem avaliacao: ordem normal do provider;
- generica: prioridade reduzida;
- inadequada: ultima opcao.

O sistema nao generaliza uma nota para todas as imagens de um evento, prato, autor ou provider. Essa restricao evita aprender regras amplas com poucos exemplos.

## Validacao tecnica

- 22 arquivos de teste aprovados.
- Chrome headless confirmou duas preferencias, sem URLs no storage.
- Imagem inadequada foi substituida por alternativa ja carregada.
- Mobile `390/390`, zero overflow e controles de 44 px.
- Historico e PDF permanecem sem imagens ou avaliacoes.

Comando:

```bash
npm run test:gallery-ui
```

