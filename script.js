/* SETT DIGITAL — comportamento do site (home e /portfolio/).
   0. ao recarregar, volta ao topo
   1. menu do celular e topo que escurece ao rolar
   2. títulos em linhas (sobem uma de cada vez quando aparecem)
   4. aparições ao rolar (.reveal), em cascata por posição no bloco
   5. números que contam uma vez, quando aparecem
   6. o campo (só no computador): o body assume a cor da seção no meio da tela
   7. seção ativa no menu
   8. rolagem suave no computador (Lenis)
   Se este arquivo não carregar, o CSS mostra tudo parado e completo. */

const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 0. Toda abertura começa na PRIMEIRA seção, no celular e no computador:
//    recarregar, voltar no navegador, retomar a aba e endereço com #âncora
//    vindo de fora (WhatsApp, busca). O navegador não devolve a rolagem antiga
//    (scrollRestoration manual) e, até a primeira mexida da pessoa, o topo
//    segura enquanto fontes e imagens mudam as alturas (no celular a rolagem
//    de tela em tela podia "pular" para a seção seguinte).
//    Exceção: um link INTERNO para um ponto do site (ex.: /portfolio/#caso-suud)
//    leva até ele; se o ponto está num trilho que anda para o lado, o trilho
//    também anda até ele.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const navegacao = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
const alvoInterno = (() => {
  if (!location.hash || !navegacao || navegacao.type !== 'navigate') return null;
  if (!document.referrer || new URL(document.referrer).origin !== location.origin) return null;
  try { return document.querySelector(decodeURIComponent(location.hash)); } catch { return null; }
})();
let mexeu = false;
['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(tipo => window.addEventListener(tipo, () => { mexeu = true; }, { once: true, passive: true, capture: true }));
const vaiAoTopo = () => { if (!mexeu) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); };
const vaiAoAlvo = () => {
  if (mexeu || !alvoInterno) return;
  const secao = alvoInterno.closest('main > section') || alvoInterno;
  const trilho = alvoInterno.closest('.caso-trilho, .politica');
  const cartao = trilho ? [...trilho.children].find(c => c.contains(alvoInterno)) : null;
  if (cartao) trilho.scrollLeft = cartao.offsetLeft - trilho.firstElementChild.offsetLeft;
  const topo = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
  window.scrollTo({ top: secao.getBoundingClientRect().top + window.scrollY - topo, left: 0, behavior: 'instant' });
};
const posiciona = () => (alvoInterno ? vaiAoAlvo() : vaiAoTopo());
if (location.hash && !alvoInterno) history.replaceState(null, '', location.pathname + location.search);
posiciona();
document.addEventListener('DOMContentLoaded', posiciona);
window.addEventListener('load', () => { posiciona(); requestAnimationFrame(posiciona); setTimeout(posiciona, 350); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(posiciona);
window.addEventListener('pageshow', evento => { if (evento.persisted) { mexeu = false; vaiAoTopo(); } });   // volta pelo cache do navegador

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
  const liga = false && telaGrande.matches && campos.length > 0 && 'IntersectionObserver' in window;   // desligado: cada seção mantém o próprio fundo (divisão clara entre seções)
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


// 9. Trilhos do celular: onde uma lista anda para o lado (telas.css), um ponto
//    por cartão logo abaixo, e o ponto do cartão à vista fica em destaque.
//    Os pontos só ilustram (o dedo desliza a lista); leitores de tela já leem a lista.
document.querySelectorAll('.service-list, .process-track, .caminho, .termo, .caso-trilho, .politica').forEach(trilho => {
  const itens = [...trilho.children];
  if (itens.length < 2) return;
  const pontos = document.createElement('div');
  pontos.className = 'trilho-pontos';
  pontos.setAttribute('aria-hidden', 'true');
  pontos.innerHTML = itens.map(() => '<i></i>').join('');
  trilho.after(pontos);
  const marca = () => {
    const meio = trilho.scrollLeft + trilho.clientWidth * .35;
    let atual = 0;
    itens.forEach((item, k) => { if (item.offsetLeft - trilho.firstElementChild.offsetLeft <= meio) atual = k; });
    if (trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 2) atual = itens.length - 1;
    [...pontos.children].forEach((p, k) => p.classList.toggle('atual', k === atual));
  };
  trilho.addEventListener('scroll', marca, { passive: true });
  marca();
});

// 10. Setas de um trilho (prévias do portfólio, política): andam um cartão
//     para cada lado e se apagam na ponta. Cartão à vista ganha .a-vista
//     (o site rola de leve dentro das molduras, uma vez).
document.querySelectorAll('[data-trilho-de]').forEach(setas => {
  const trilho = document.getElementById(setas.dataset.trilhoDe);
  if (!trilho) return;
  const botoes = [...setas.querySelectorAll('[data-passo]')];
  const passo = () => (trilho.firstElementChild?.getBoundingClientRect().width || trilho.clientWidth) + parseFloat(getComputedStyle(trilho).columnGap || 0);
  const pontas = () => {
    botoes.forEach(b => {
      const vai = Number(b.dataset.passo);
      b.disabled = vai < 0 ? trilho.scrollLeft <= 2 : trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 2;
    });
  };
  botoes.forEach(b => b.addEventListener('click', () => trilho.scrollBy({ left: Number(b.dataset.passo) * passo(), behavior: quieto ? 'auto' : 'smooth' })));
  trilho.addEventListener('scroll', pontas, { passive: true });
  pontas();
});
if ('IntersectionObserver' in window) {
  document.querySelectorAll('.caso-trilho').forEach(trilho => {
    const olho = new IntersectionObserver(entradas => entradas.forEach(e => { if (e.isIntersecting) e.target.classList.add('a-vista'); }), { root: trilho, threshold: .6 });
    [...trilho.children].forEach(caso => olho.observe(caso));
  });
}

// 11. O palco dos agentes (O que fazemos), animado como no vídeo dos agentes:
//     escolher um agente põe ele em foco com o GESTO dele (Atendimento e
//     Estoque pulam girando, Agenda dá dois pulos, Pedidos balança, Prospecção
//     treme, Relatórios salta), depois ele pisca e sorri. Ao abrir, se a pessoa
//     ainda não mexeu, o palco dá UMA volta pelos seis e para no primeiro.
//     Tudo termina e para; com "reduzir movimento" só troca, sem gesto nem volta.
//     Setas do teclado andam entre os seis. Sem este trecho fica o primeiro agente.
document.querySelectorAll('[data-elenco]').forEach(elenco => {
  const ator = elenco.querySelector('.elenco-ator');
  const legenda = elenco.querySelector('.elenco-legenda');
  const botoes = [...elenco.querySelectorAll('.elenco-escolha button')];
  const palco = elenco.querySelector('.elenco-palco');
  // os agentes em 2D (três expressões cada: aberto, pisca, sorri)
  const img = (k, estado) => `/img/agentes-2d/${botoes[k].dataset.ator}-${estado}.svg`;
  let atual = 0;
  let relogios = [];
  let apontado = false;
  const limpa = () => { relogios.forEach(clearTimeout); relogios = []; };
  const depois = (ms, fn) => relogios.push(setTimeout(fn, ms));
  // pisca e sorri: as três versões do mesmo agente (olhos abertos, fechados, sorrindo)
  const expressao = k => {
    depois(720, () => { ator.src = img(k, 'pisca'); });
    depois(840, () => { ator.src = img(k, 'aberto'); });
    depois(1000, () => { ator.src = img(k, 'sorri'); });
    depois(1900, () => { if (!apontado) ator.src = img(k, 'aberto'); });
  };
  const escolhe = (k, foco) => {
    limpa();
    atual = k;
    const b = botoes[k];
    botoes.forEach((o, i) => o.setAttribute('aria-pressed', String(i === k)));
    ator.src = img(k, 'aberto');
    legenda.querySelector('b').textContent = b.dataset.nome;
    legenda.querySelector('span').textContent = b.dataset.legenda;
    ator.className = 'elenco-ator';
    if (!quieto) { void ator.offsetWidth; ator.classList.add('gesto-' + (b.dataset.gesto || 'pula')); expressao(k); }
    if (foco) b.focus();
  };
  // a volta inicial: uma vez, só com o palco à vista e só até a pessoa mexer nele
  let volta = null;
  const paraVolta = () => { clearInterval(volta); volta = null; };
  ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(t => elenco.addEventListener(t, paraVolta, { passive: true }));
  if (!quieto && 'IntersectionObserver' in window) {
    const olho = new IntersectionObserver(entradas => {
      if (!entradas.some(e => e.isIntersecting)) return;
      olho.disconnect();
      let k = 0;
      expressao(0);
      setTimeout(() => {
        if (!elenco.matches(':hover') && document.activeElement?.closest?.('[data-elenco]') !== elenco) {
          volta = setInterval(() => { k += 1; if (k > botoes.length) { paraVolta(); return; } escolhe(k % botoes.length); }, 1900);
        }
      }, 1600);
    }, { threshold: .5 });
    olho.observe(elenco);
  }
  botoes.forEach((b, k) => {
    b.addEventListener('click', () => { paraVolta(); escolhe(k); });
    b.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); paraVolta(); escolhe((atual + (e.key === 'ArrowRight' ? 1 : -1) + botoes.length) % botoes.length, true); }
    });
    // as outras expressões chegam antes de alguém escolher
    ['sorri', 'pisca'].forEach(estado => { const pre = new Image(); pre.src = img(k, estado); });
  });
  palco.addEventListener('pointerenter', () => { apontado = true; ator.src = img(atual, 'sorri'); });
  palco.addEventListener('pointerleave', () => { apontado = false; ator.src = img(atual, 'aberto'); });
});
