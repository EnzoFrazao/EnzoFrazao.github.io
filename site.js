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

if (typeof module !== 'undefined') module.exports = { calcularTrilho, trilhoVisivel, estadoDoCartao, linhasDoCartao, posicoesDosCartoes };

// Comportamento no navegador: colunas dos projetos, aparecer suave dos cartões e trilho de rolagem.
(function () {
  if (typeof document === 'undefined') return;

  var raiz = document.documentElement;
  var GAP = 44;
  var ESPACO_CARTOES = 48;
  var MOVIMENTO_REDUZIDO = '(prefers-reduced-motion: reduce)';

  // Colunas independentes (zigue-zague sem vãos): com duas colunas, cada cartão ocupa tantas linhas de 1 px quanto a sua
  // altura, e a coluna da direita começa 72 px mais baixo. Sem JS ou abaixo de 821 px vale a grade comum do CSS.
  try {
    var grade = document.querySelector('.grid');
    var celulas = grade ? [].slice.call(grade.querySelectorAll('.cell')) : [];
    if (grade && celulas.length) {
      var duasColunas = window.matchMedia('(min-width: 821px)');
      var ajustar = function () {
        var ativo = duasColunas.matches;
        grade.classList.toggle('mas', ativo);
        var pos = ativo ? posicoesDosCartoes(celulas.map(function (c) { return c.offsetHeight; }), ESPACO_CARTOES, 72) : [];
        celulas.forEach(function (c, k) {
          c.style.gridRowStart = ativo ? String(pos[k].linha) : '';
          c.style.gridRowEnd = ativo ? 'span ' + pos[k].linhas : '';
        });
      };
      ajustar();
      if ('ResizeObserver' in window) {
        var ro = new ResizeObserver(function () { ajustar(); });
        celulas.forEach(function (c) { ro.observe(c); });
      }
      window.addEventListener('resize', ajustar);
      window.addEventListener('load', ajustar);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustar);
    }
  } catch (erro) {
    if (grade) grade.classList.remove('mas');
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
  } catch (erro) {
    raiz.classList.remove('js');
    return;
  }

  // Trilho: um ponto por [data-sec] (cartões, Sobre e Links).
  // Em ordem de posição na página: com as duas colunas independentes, a ordem do HTML não é a de cima para baixo.
  var secoes = [].slice.call(document.querySelectorAll('[data-sec]'));
  var hero = document.getElementById('hero');
  if (secoes.length === 0 || !hero) return;
  secoes.sort(function (a, b) { return centro(a) - centro(b); });

  var trilho = document.createElement('nav');
  trilho.className = 'rail';
  trilho.setAttribute('aria-label', 'Índice da página');
  var linha = document.createElement('div');
  linha.className = 'rl';
  linha.style.height = (secoes.length - 1) * GAP + 'px';
  var preenchida = document.createElement('div');
  preenchida.className = 'rf';
  var ponta = document.createElement('div');
  ponta.className = 'tip';
  trilho.appendChild(linha);
  trilho.appendChild(preenchida);
  trilho.appendChild(ponta);

  function centro(el) {
    var r = el.getBoundingClientRect();
    return r.top + window.pageYOffset + r.height / 2;
  }
  function alvoDaRolagem(el) {
    return centro(el) - window.innerHeight * 0.45;
  }

  var pontos = secoes.map(function (s, k) {
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

  function atualizar() {
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
  atualizar();
})();
