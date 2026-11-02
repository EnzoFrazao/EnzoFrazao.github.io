# Portfólio de Enzo Frazão Vencio

**Site:** <https://enzofrazao.github.io>

Página única com meus projetos de automação e agentes de IA, quem sou e onde me encontrar. HTML, CSS e um JavaScript
pequeno, sem framework, sem build e sem dependências.

## O que tem na página

| Seção | Conteúdo |
|---|---|
| Início | Quem sou, em uma frase, e o caminho para os projetos |
| Projetos | Seis cartões, cada um com o que o projeto faz, o que eu fiz, a stack e, quando há número, como ele foi medido |
| Sobre | Foto, o que construo e as tecnologias, por área |
| Contato | E-mail, LinkedIn, GitHub e o currículo em PDF |

Projetos com código público têm link direto:

| Projeto | O que é | Código |
|---|---|---|
| Analista de pedidos com IA | Agente que responde perguntas sobre pedidos, em português, com painel no ar e vídeo | [analista-pedidos-ia](https://github.com/EnzoFrazao/analista-pedidos-ia) |
| Triagem de e-mails com LLM | Workflow n8n que classifica e roteia e-mails de atendimento | [triagem-emails-n8n-ia](https://github.com/EnzoFrazao/triagem-emails-n8n-ia) |
| GUARÁ · KaizenDO Vale | Protótipo de localização de equipes num pátio ferroviário | [KaizenDo](https://github.com/EnzoFrazao/KaizenDo) |

Agiliza Transparência, Ouvidoria do MP/MA e SafeWork têm código fechado e aparecem só como cartão.

## Como a página foi pensada

- **Número sempre com contexto.** Onde há resultado medido, o mesmo cartão diz como foi medido e o que o número vale. As
  ilustrações dos cartões são ilustrações, e a página marca isso.
- **Estática e leve.** Sem framework, sem analytics, sem recurso externo: a fonte (Space Grotesk) é servida daqui, e o
  site inteiro fica abaixo de 1 MB.
- **O conteúdo vem primeiro.** Sem JavaScript, ou com `prefers-reduced-motion`, tudo aparece e nada se move.
- **Movimento com função.** Cartões e seções entram suavemente sempre que aparecem na tela, não só na primeira vez. Os
  projetos ficam em duas colunas em zigue-zague, empilhadas sem vãos (o JS calcula a posição; sem ele vale uma grade
  comum), e um trilho lateral mostra onde você está na página.
- **Acessível.** Contraste de texto de no mínimo 4,5:1, foco visível em tudo que se clica, ordem do teclado igual à de
  leitura e link para pular ao conteúdo.
- **Cor por projeto.** Cada cartão usa as cores do próprio projeto, tiradas do CSS dele.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `index.html` | Marcação, textos e as ilustrações SVG de cada cartão |
| `style.css` | Cores, layout, animações e regras para impressão e movimento reduzido |
| `site.js` | Revelar ao rolar, colunas dos projetos e trilho de rolagem; as contas são funções puras, testadas em Node |
| `fonts/` | Space Grotesk e a licença da fonte |
| `Enzo-Frazao-Curriculo.pdf` | Currículo (1 página), baixado pelo botão em Contato |

## Ver no seu computador

Abra `index.html` no navegador. Se preferir um servidor local:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Como é conferida

A cada versão, scripts que ficam fora deste repositório conferem regras de conteúdo (nenhum telefone, números só dos
projetos medidos, contraste, nenhum recurso externo, peso total) e, num Chrome sem interface, o layout de 320 a 1280 px,
a página sem JavaScript, o movimento reduzido, o teclado e a animação ao descer, subir e descer de novo.

## Feita com apoio de IA

O código e os textos foram feitos com apoio de IA (Claude Code), e os números e as frases de cada cartão são conferidos
por script antes de cada versão.

## Licença

MIT (veja `LICENSE`). A fonte Space Grotesk tem licença própria, a SIL OFL 1.1 (veja `fonts/OFL.txt`).

## Contato

[LinkedIn](https://www.linkedin.com/in/enzofrazaovencio/) · [GitHub](https://github.com/EnzoFrazao) · enzofrazaoengsoft@gmail.com
