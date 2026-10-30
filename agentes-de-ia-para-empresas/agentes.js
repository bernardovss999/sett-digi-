/* AGENTES DE IA PARA EMPRESAS — comportamento só desta página.
   Carrega depois de /script.js (menu, aparições, títulos em linhas, números
   que contam, campo, Lenis) e só acrescenta:
   1. ?revisao=1 marca o que ainda depende de confirmação
   2. a semana: as tarefas que se repetem descem para a raia do agente
   3. elementos que cruzam a tela escrevem --p (0 a 1) para o CSS desenhar
   4. a régua de leitura no topo
   Sem este arquivo o CSS mostra tudo parado e completo. */

(() => {
const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const raiz = document.documentElement;
const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// 1. revisão
if (/[?&]revisao/.test(location.search)) raiz.classList.add('revisao');

// 2. a semana
// (com data-arrastavel, quem leva as tarefas para o agente é o visitante: ver /cenas.js)
const semana = document.querySelector('[data-semana]:not([data-arrastavel])');
if (semana) {
  const rever = semana.querySelector('.semana-rever');
  const vais = semana.querySelectorAll('.vai').length;
  const duracao = 950 + (vais - 1) * 150;
  const toca = (atraso = 0) => {
    setTimeout(() => {
      semana.classList.add('feita');
      if (rever) setTimeout(() => { rever.hidden = false; }, quieto ? 0 : duracao);
    }, atraso);
  };
  if (quieto || !('IntersectionObserver' in window)) toca();
  else {
    const olho = new IntersectionObserver(e => {
      if (!e[0].isIntersecting) return;
      olho.disconnect();
      toca(document.readyState === 'complete' ? 500 : 1100);   // na abertura, depois que a frase assenta
    }, { threshold: .45 });
    olho.observe(semana);
  }
  rever?.addEventListener('click', () => {
    rever.hidden = true;
    semana.classList.remove('feita');
    toca(quieto ? 0 : 520);
  });
}

// 3. elementos que cruzam a tela: --p vai de 0 (entrando) a 1 (já no meio da tela)
const vistas = [...document.querySelectorAll('[data-vista]')];
const conduzVistas = () => {
  const vh = window.innerHeight;
  vistas.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    el.style.setProperty('--p', limita((vh * .85 - r.top) / (vh * .3 + r.height)).toFixed(4));
  });
};
if (quieto) vistas.forEach(el => el.style.setProperty('--p', 1));

// 4. régua de leitura
const leitura = document.querySelector('.leitura');
const conduzLeitura = () => {
  if (!leitura) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  leitura.style.setProperty('--lp', max > 0 ? limita(window.scrollY / max).toFixed(4) : 0);
};

// um laço só, no ritmo da tela
let agendado = false;
const atualiza = () => {
  agendado = false;
  if (!quieto) conduzVistas();
  conduzLeitura();
};
const pede = () => { if (!agendado) { agendado = true; requestAnimationFrame(atualiza); } };
window.addEventListener('scroll', pede, { passive: true });
window.addEventListener('resize', pede);
atualiza();
window.addEventListener('load', atualiza);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(pede);

})();
