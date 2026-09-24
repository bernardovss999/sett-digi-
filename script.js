/* SETT DIGITAL — comportamento do site (home e /portfolio/).
   1. menu do celular e topo que escurece ao rolar
   2. títulos em linhas (sobem uma de cada vez quando aparecem)
   3. karaokê: o parágrafo vira uma palavra por span
   4. aparições ao rolar (.reveal), em cascata por posição no bloco
   5. números que contam uma vez, quando aparecem
   6. o campo (só no computador): o body assume a cor da seção no meio da tela
   7. seção ativa no menu
   8. rolagem suave no computador (Lenis)
   Se este arquivo não carregar, o CSS mostra tudo parado e completo. */

const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1. menu e topo
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

// 3. O parágrafo do karaokê vira uma palavra por span, para encher na rolagem.
//    O CSS só liga isso onde há suporte; aqui a marcação é inofensiva.
document.querySelectorAll('.karaoke').forEach(alvo => {
  const palavras = alvo.textContent.trim().split(/\s+/);
  alvo.innerHTML = palavras
    .map((p, i) => `<span class="k" style="--i:${i};--n:${palavras.length}">${p}</span>`)
    .join(' ');
});

// 5. Números que contam: correm de zero até o valor quando o bloco aparece.
//    requestAnimationFrame não roda em aba de fundo, então um setTimeout de
//    garantia escreve o valor final: número na tela nunca fica velho.
function contaNumeros(bloco) {
  bloco.querySelectorAll('[data-conta]').forEach(n => {
    const alvo = Number(n.dataset.conta);
    const sufixo = n.dataset.sufixo || '';
    const escreve = v => { n.textContent = Math.round(v).toLocaleString('pt-BR') + sufixo; };
    if (quieto || document.hidden || !Number.isFinite(alvo)) { escreve(alvo); return; }
    const inicio = performance.now();
    const dur = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--t-cena')) || 1.1) * 1000;   // o mesmo tempo da cena
    let quadro = 0;
    const passo = agora => {
      const t = Math.min(1, (agora - inicio) / dur);
      escreve(alvo * (1 - Math.pow(1 - t, 3)));            // sai rápido, assenta devagar
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    setTimeout(() => { cancelAnimationFrame(quadro); escreve(alvo); }, dur + 120);
  });
}

// 4. Aparições: marcam .is-visible uma vez e param de observar. A cascata é
//    por posição entre os irmãos que também aparecem (--i), não pela altura
//    na tela: assim uma lista entra em fila, e um bloco sozinho entra na hora.
const reveals = document.querySelectorAll('.reveal');
reveals.forEach(item => {
  const irmaos = [...item.parentElement.children].filter(el => el.classList.contains('reveal'));
  item.style.setProperty('--i', irmaos.indexOf(item));
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      setTimeout(() => contaNumeros(entry.target), 250);   // o bloco já está visível quando o número arranca
      observer.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px 8% 0px' });   // começa um pouco antes de entrar: rolando rápido, nada chega vazio
  reveals.forEach(item => observer.observe(item));
} else {
  reveals.forEach(item => { item.classList.add('is-visible'); contaNumeros(item); });
}

// 6. O campo, só no computador (≥1024px): a seção que cruza o meio da tela
//    decide a cor do body — e, pelos tokens, de todo o texto na tela. Liga e
//    desliga com a largura (girar o tablet, redimensionar a janela). No
//    celular fica cada seção com o próprio fundo, e o body nunca é marcado.
const telaGrande = window.matchMedia('(min-width: 1024px)');
const campos = [...document.querySelectorAll('main [data-campo]')];
let olhoCampo = null;
const ligaCampos = () => {
  const liga = telaGrande.matches && campos.length > 0 && 'IntersectionObserver' in window;
  document.documentElement.classList.toggle('campos', liga);
  if (liga && !olhoCampo) {
    olhoCampo = new IntersectionObserver(entradas => {
      entradas.forEach(e => { if (e.isIntersecting) document.body.dataset.campo = e.target.dataset.campo; });
    }, { rootMargin: '-50% 0px -49% 0px', threshold: 0 });
    campos.forEach(s => olhoCampo.observe(s));
  } else if (!liga && olhoCampo) {
    olhoCampo.disconnect();
    olhoCampo = null;
    delete document.body.dataset.campo;
  }
};
ligaCampos();
telaGrande.addEventListener('change', ligaCampos);

// 7. Seção ativa no menu do computador.
const linksMenu = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
if (linksMenu.length && 'IntersectionObserver' in window) {
  const olhoMenu = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return;
      linksMenu.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  linksMenu.forEach(a => {
    const alvo = document.querySelector(a.getAttribute('href'));
    if (alvo) olhoMenu.observe(alvo);
  });
}

const comMouse = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

// 8. Rolagem suave só no computador; se a biblioteca não vier, a rolagem normal segue.
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
