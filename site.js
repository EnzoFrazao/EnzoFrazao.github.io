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

if (typeof module !== 'undefined') module.exports = { calcularTrilho, trilhoVisivel };

// Comportamento no navegador: aparecer suave dos cartões e trilho de rolagem.
(function () {
  if (typeof document === 'undefined') return;

  var raiz = document.documentElement;
  var GAP = 44;
  var MOVIMENTO_REDUZIDO = '(prefers-reduced-motion: reduce)';

  // Aparecer suave. Sem IntersectionObserver, tudo aparece de uma vez.
  // Se algo aqui falhar, desfaz a classe js: o conteúdo vale mais que a animação.
  try {
    var cartoes = [].slice.call(document.querySelectorAll('.card'));
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12 });
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
  var secoes = [].slice.call(document.querySelectorAll('[data-sec]'));
  var hero = document.getElementById('hero');
  if (secoes.length === 0 || !hero) return;

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
