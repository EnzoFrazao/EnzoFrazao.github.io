// Lógica pura do trilho de rolagem (testável sem navegador).

function calcularTrilho(centros, y, gap, noFim) {
  const ultimo = centros.length - 1;
  if (noFim) return { indice: ultimo, preenchimento: ultimo * gap };

  let indice = 0;
  for (let k = 0; k <= ultimo; k++) {
    if (centros[k] <= y) indice = k;
  }

  let f = 0;
  if (indice < ultimo) {
    const dif = centros[indice + 1] - centros[indice];
    if (dif > 0) f = Math.min(1, Math.max(0, (y - centros[indice]) / dif));
  }
  return { indice, preenchimento: indice * gap + f * gap };
}

function trilhoVisivel(rolagem, fimDoHero) {
  return rolagem + 120 >= fimDoHero - 140;
}

// Decide se o cartão está "dentro": entra com 12% visível e só sai quando some por completo (evita piscar na borda).
function estadoDoCartao(razao, cruza, atual) {
  if (razao >= 0.12) return true;
  if (!cruza) return false;
  return atual;
}

// Linhas de 1 px que um cartão ocupa na grade em colunas independentes: altura arredondada para cima mais o espaço até o próximo.
function linhasDoCartao(altura, espaco) {
  return Math.ceil(Math.max(0, altura)) + espaco;
}

// Linha inicial e número de linhas de cada cartão em duas colunas (índices pares à esquerda, ímpares à direita);
// a coluna da direita começa `desnivel` px mais baixo. Cada coluna empilha sem vão.
function posicoesDosCartoes(alturas, espaco, desnivel) {
  var fim = [1, 1 + desnivel];
  return alturas.map(function (altura, k) {
    var coluna = k % 2;
    var linhas = linhasDoCartao(altura, espaco);
    var linha = fim[coluna];
    fim[coluna] = linha + linhas;
    return { linha: linha, linhas: linhas };
  });
}

// Página dos projetos depois de andar `passo` páginas a partir de `atual`; nunca sai de 1..total.
function paginaAlvo(atual, passo, total) {
  var ultima = Math.max(1, Math.floor(total) || 1);
  var n = Math.floor(atual) + Math.floor(passo);
  if (!(n >= 1)) return 1;
  return Math.min(n, ultima);
}

if (typeof module !== 'undefined') module.exports = { calcularTrilho, trilhoVisivel, estadoDoCartao, linhasDoCartao, posicoesDosCartoes, paginaAlvo };

// Comportamento no navegador: páginas dos projetos, colunas dos cartões, aparecer suave e trilho de rolagem.
(function () {
  if (typeof document === 'undefined') return;

  var raiz = document.documentElement;
  var GAP = 44;
  var ESPACO_CARTOES = 48;
  var MOVIMENTO_REDUZIDO = '(prefers-reduced-motion: reduce)';

  // Colunas independentes (zigue-zague sem vãos): com duas colunas, cada cartão ocupa tantas linhas de 1 px quanto a sua
  // altura, e a coluna da direita começa 72 px mais baixo. Sem JS ou abaixo de 821 px vale a grade comum do CSS.
  // Cada página dos projetos é uma `.grid`; só a página à vista é medida (um cartão escondido mede 0).
  var grades = [].slice.call(document.querySelectorAll('.grid'));
  var ajustar = function () {};
  try {
    var celulas = [].slice.call(document.querySelectorAll('.grid .cell'));
    if (grades.length && celulas.length) {
      var duasColunas = window.matchMedia('(min-width: 821px)');
      ajustar = function () {
        grades.forEach(function (grade) {
          var usar = duasColunas.matches && !grade.hidden;
          var dela = [].slice.call(grade.querySelectorAll('.cell'));
          grade.classList.toggle('mas', usar);
          var pos = usar ? posicoesDosCartoes(dela.map(function (c) { return c.offsetHeight; }), ESPACO_CARTOES, 72) : [];
          dela.forEach(function (c, k) {
            c.style.gridRowStart = usar ? String(pos[k].linha) : '';
            c.style.gridRowEnd = usar ? 'span ' + pos[k].linhas : '';
          });
        });
      };
      if ('ResizeObserver' in window) {
        var ro = new ResizeObserver(function () { ajustar(); });
        celulas.forEach(function (c) { ro.observe(c); });
      }
      window.addEventListener('resize', ajustar);
      window.addEventListener('load', ajustar);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustar);
    }
  } catch (erro) {
    grades.forEach(function (g) { g.classList.remove('mas'); });
    ajustar = function () {};
  }

  // Páginas dos projetos: botão anterior/próxima. Sem JS, ou se algo falhar aqui, todas as páginas ficam à vista.
  var pager = document.querySelector('.pager');
  var paginaAtual = 1;
  var irParaAncora = null;
  var mostrarPagina = function () {};
  try {
    if (pager && grades.length > 1) {
      var botoes = [].slice.call(pager.querySelectorAll('.pg-b'));
      var contador = pager.querySelector('.pg-n');
      var dois = function (n) { return (n < 10 ? '0' : '') + n; };
      mostrarPagina = function (n, rolar) {
        paginaAtual = paginaAlvo(n, 0, grades.length);
        grades.forEach(function (g, k) { g.hidden = k !== paginaAtual - 1; });
        contador.innerHTML = '<b>' + dois(paginaAtual) + '</b> / ' + dois(grades.length);
        botoes.forEach(function (b) {
          var passo = Number(b.getAttribute('data-passo'));
          b.setAttribute('aria-disabled', paginaAlvo(paginaAtual, passo, grades.length) === paginaAtual ? 'true' : 'false');
        });
        ajustar();
        montarTrilho();
        if (rolar && pager.getBoundingClientRect().top < 0) {
          var titulo = document.querySelector('#projetos .sn');
          window.scrollTo({
            top: titulo.getBoundingClientRect().top + window.pageYOffset - 24,
            behavior: window.matchMedia(MOVIMENTO_REDUZIDO).matches ? 'auto' : 'smooth'
          });
        }
      };
      botoes.forEach(function (b) {
        b.addEventListener('click', function () {
          mostrarPagina(paginaAtual + Number(b.getAttribute('data-passo')), true);
        });
      });
      // Link direto para um cartão de outra página (#p-...): abre a página dele.
      var ancora = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      var daAncora = ancora ? grades.indexOf(ancora.closest('.grid')) : -1;
      pager.hidden = false;
      mostrarPagina(daAncora >= 0 ? daAncora + 1 : 1, false);
      if (daAncora > 0) irParaAncora = ancora;
    }
  } catch (erro) {
    grades.forEach(function (g) { g.hidden = false; });
    if (pager) pager.hidden = true;
    ajustar();
  }

  // Aparecer suave. Sem IntersectionObserver, tudo aparece de uma vez.
  // Se algo aqui falhar, desfaz a classe js: o conteúdo vale mais que a animação.
  try {
    var cartoes = [].slice.call(document.querySelectorAll('.card, .rv'));
    if ('IntersectionObserver' in window) {
      // Sem unobserve: ao sair da tela o cartão volta ao estado inicial e anima de novo na próxima entrada.
      var io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          var dentro = estadoDoCartao(e.intersectionRatio, e.isIntersecting, e.target.classList.contains('in'));
          e.target.classList.toggle('in', dentro);
        });
      }, { threshold: [0, 0.12] });
      cartoes.forEach(function (c) { io.observe(c); });
    } else {
      cartoes.forEach(function (c) { c.classList.add('in'); });
    }
    raiz.classList.add('js-ok');
    ajustar(); // agora a página escolhida está à vista (a regra .js:not(.js-ok) deixa de esconder a segunda)
  } catch (erro) {
    raiz.classList.remove('js');
    return;
  }

  // Trilho: um ponto por [data-sec] à vista (cartões da página atual, Sobre e Contato).
  // Em ordem de posição na página: com as duas colunas independentes, a ordem do HTML não é a de cima para baixo.
  // É refeito a cada troca de página, porque os cartões da outra página não ocupam lugar.
  var hero = document.getElementById('hero');
  if (!hero) return;

  var secoes = [];
  var pontos = [];
  var trilho = null;
  var preenchida = null;
  var ponta = null;

  function centro(el) {
    var r = el.getBoundingClientRect();
    return r.top + window.pageYOffset + r.height / 2;
  }
  function alvoDaRolagem(el) {
    return centro(el) - window.innerHeight * 0.45;
  }

  function montarTrilho() {
    if (!hero) return; // ainda não chegou aqui: a primeira montagem é a do fim do script
    var estavaVisivel = !!(trilho && trilho.classList.contains('show'));
    if (trilho && trilho.parentNode) trilho.parentNode.removeChild(trilho);
    trilho = null;
    secoes = [].slice.call(document.querySelectorAll('[data-sec]')).filter(function (s) {
      return !s.closest('.grid[hidden]');
    });
    if (secoes.length === 0) return;
    secoes.sort(function (a, b) { return centro(a) - centro(b); });

    trilho = document.createElement('nav');
    trilho.className = 'rail' + (estavaVisivel ? ' show' : '');
    trilho.setAttribute('aria-label', 'Índice da página');
    var linha = document.createElement('div');
    linha.className = 'rl';
    linha.style.height = (secoes.length - 1) * GAP + 'px';
    preenchida = document.createElement('div');
    preenchida.className = 'rf';
    ponta = document.createElement('div');
    ponta.className = 'tip';
    trilho.appendChild(linha);
    trilho.appendChild(preenchida);
    trilho.appendChild(ponta);

    pontos = secoes.map(function (s, k) {
      var a = document.createElement('a');
      a.className = 'rn';
      a.href = '#' + s.id;
      a.style.top = k * GAP + 'px';
      a.innerHTML = '<i></i><span class="nm"></span>';
      a.lastChild.textContent = s.getAttribute('data-sec');
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        window.scrollTo({
          top: alvoDaRolagem(s),
          behavior: window.matchMedia(MOVIMENTO_REDUZIDO).matches ? 'auto' : 'smooth'
        });
      });
      trilho.appendChild(a);
      return a;
    });
    document.body.appendChild(trilho);
    atualizar();
  }

  function atualizar() {
    if (!trilho) return;
    var rolagem = window.pageYOffset;
    var y = rolagem + window.innerHeight * 0.45;
    var noFim = rolagem + window.innerHeight >= raiz.scrollHeight - 4;
    var r = calcularTrilho(secoes.map(centro), y, GAP, noFim);

    trilho.classList.toggle('show', trilhoVisivel(rolagem, hero.offsetTop + hero.offsetHeight));
    preenchida.style.height = r.preenchimento + 'px';
    ponta.style.top = r.preenchimento + 'px';
    pontos.forEach(function (p, k) {
      p.classList.toggle('pass', k * GAP <= r.preenchimento + 1);
      p.classList.toggle('cur', k === r.indice);
      if (k === r.indice) p.setAttribute('aria-current', 'true');
      else p.removeAttribute('aria-current');
    });
  }

  var agendado = false;
  function agendar() {
    if (agendado) return;
    agendado = true;
    window.requestAnimationFrame(function () {
      agendado = false;
      atualizar();
    });
  }
  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);
  montarTrilho();
  if (irParaAncora) irParaAncora.scrollIntoView();
})();
