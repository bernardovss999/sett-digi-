/* SETT DIGITAL — comportamento do site (home e /portfolio/).
   1. menu do celular e topo que escurece ao rolar
   2. títulos em linhas (sobem uma de cada vez quando aparecem)
   3. aparições ao rolar (.reveal)
   4. botões principais que seguem o cursor de leve (só mouse)
   5. rolagem suave no computador (Lenis)
   Se este arquivo não carregar, o CSS mostra tudo parado e completo. */

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const siteHeader = document.querySelector('.site-header');
const syncHeader = () => siteHeader?.classList.toggle('is-scrolled', window.scrollY > 24);
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });
if (menuButton && mobileNav) {
  const rotulo = menuButton.querySelector('.sr-only');
  const menu = aberto => {
    menuButton.setAttribute('aria-expanded', String(aberto));
    mobileNav.classList.toggle('is-open', aberto);
    if (rotulo) rotulo.textContent = aberto ? 'Fechar menu' : 'Abrir menu';
  };
  menuButton.addEventListener('click', () => menu(menuButton.getAttribute('aria-expanded') !== 'true'));
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => menu(false)));
  // fecha ao tocar fora do menu ou apertar Esc
  document.addEventListener('click', evento => {
    if (mobileNav.classList.contains('is-open') && !mobileNav.contains(evento.target) && !menuButton.contains(evento.target)) menu(false);
  });
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && mobileNav.classList.contains('is-open')) { menu(false); menuButton.focus(); }
  });
}

// 2. Cada <br> do título vira uma linha que entra com um pequeno atraso.
document.querySelectorAll('.section-title, .cta-title, .proof-panel h2').forEach(titulo => {
  const partes = titulo.innerHTML.split(/<br\s*\/?>/i);
  titulo.innerHTML = partes.map((parte, i) => `<span class="linha" style="--i:${i}">${parte.trim()}</span>`).join('');
  titulo.classList.add('em-linhas');
});

// 3. Aparições: marcam .is-visible uma vez e param de observar.
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = `${Math.min(entry.target.getBoundingClientRect().top / 700, .25)}s`;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  reveals.forEach(item => observer.observe(item));
} else {
  reveals.forEach(item => item.classList.add('is-visible'));
}

const comMouse = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

// 4. Botões de chamada puxados de leve na direção do cursor.
if (comMouse.matches) {
  document.querySelectorAll('.hero .button, .port-hero .button, .final-cta .button, .proof-panel .button').forEach(botao => {
    botao.addEventListener('pointermove', evento => {
      const caixa = botao.getBoundingClientRect();
      const x = (evento.clientX - caixa.left - caixa.width / 2) * .2;
      const y = (evento.clientY - caixa.top - caixa.height / 2) * .3;
      botao.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    });
    botao.addEventListener('pointerleave', () => { botao.style.translate = ''; });
  });
}

// 5. Rolagem suave só no computador; se a biblioteca não vier, a rolagem normal segue.
if (comMouse.matches) {
  const lenisScript = document.createElement('script');
  lenisScript.src = 'https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js';
  lenisScript.onload = () => {
    if (typeof window.Lenis !== 'function') return;
    const lenis = new window.Lenis({ lerp: .1, anchors: { offset: -96 } });
    const quadro = tempo => { lenis.raf(tempo); requestAnimationFrame(quadro); };
    requestAnimationFrame(quadro);
  };
  document.head.appendChild(lenisScript);
}
