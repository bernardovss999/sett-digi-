/* AGENTES DE IA PARA EMPRESAS — comportamento só desta página.
   Carrega depois de /script.js (menu, aparições, títulos em linhas, números
   que contam, campo, Lenis) e só acrescenta:
   1. ?revisao=1 marca o que ainda depende de confirmação
   2. cada exemplo abre o WhatsApp já com o assunto
   3. a semana: as tarefas que se repetem descem para a raia do agente
   4. as quatro frentes: fita presa e conduzida pela rolagem no computador,
      deslizar no celular; as abas levam a cada painel
   5. elementos que cruzam a tela escrevem --p (0 a 1) para o CSS desenhar
   6. a régua de leitura no topo
   7. no celular, a barra do WhatsApp fora da abertura e da chamada final
   Sem este arquivo o CSS mostra tudo parado e completo. */

(() => {
const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const raiz = document.documentElement;
const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const topo = () => parseFloat(getComputedStyle(raiz).getPropertyValue('--topo')) || 80;

// 1. revisão
if (/[?&]revisao/.test(location.search)) raiz.classList.add('revisao');

// 2. WhatsApp com o assunto de cada exemplo
document.querySelectorAll('[data-rotina]').forEach(a => {
  const texto = `Olá! Vi a página de agentes de IA da Sett e quero conversar sobre um agente para ${a.dataset.rotina}.`;
  a.href = 'https://wa.me/5521936181695?text=' + encodeURIComponent(texto);
  a.target = '_blank'; a.rel = 'noopener noreferrer';
});

// 3. a semana
const semana = document.querySelector('[data-semana]');
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

// 4. as quatro frentes
const fr = document.querySelector('[data-frentes]');
const preso = window.matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)');
let conduzFrentes = () => {};
if (fr) {
  const abas = fr.querySelector('.fr-abas');
  const botoes = [...fr.querySelectorAll('[data-aba]')];
  const janela = fr.querySelector('.fr-janela');
  const fita = fr.querySelector('.fr-fita');
  const paineis = [...fr.querySelectorAll('.fr-painel')];
  const n = paineis.length;
  let atual = -1;

  const ativa = i => {
    paineis[i].classList.add('visto');
    if (i === atual) return;
    atual = i;
    botoes.forEach((b, k) => { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
  };
  const passo = () => (paineis[1] ? paineis[1].offsetLeft - paineis[0].offsetLeft : janela.clientWidth);

  // computador: a rolagem da página conduz a fita, sem parar e sem tranco.
  // As medidas saem UMA vez (carga, fontes, redimensionar), nunca a cada quadro:
  // ler o layout durante a rolagem era o que fazia a fita engasgar.
  // O trilho tem o tamanho do caminho da fita (cada pixel rolado anda ~1 pixel
  // na horizontal), e a fita persegue a rolagem com uma suavização curta.
  let med = null, alvo = 0, agora = 0, correndo = false;
  const mede = () => {
    if (!preso.matches) { med = null; return; }
    const passoPx = passo();
    fr.style.setProperty('--percurso', Math.round(passoPx * (n - 1) * .9) + 'px');
    const t = topo();
    const r = fr.getBoundingClientRect();
    med = { inicio: r.top + window.scrollY - t, total: Math.max(1, r.height - (window.innerHeight - t)), passo: passoPx, largura: janela.clientWidth };
  };
  const aplica = x => {
    fita.style.transform = `translate3d(${(-x * med.passo).toFixed(2)}px, 0, 0)`;
    abas.style.setProperty('--fa', x.toFixed(4));
    ativa(Math.round(x));
    // o painel que entra pela borda já chega pronto, nunca vazio
    paineis.forEach((pn, j) => { if (!pn.classList.contains('visto') && (j - x) * med.passo < med.largura * .9) pn.classList.add('visto'); });
  };
  const persegue = () => {
    // com a rolagem suave do site (Lenis) já ligada, a fita só arredonda;
    // sem ela (roda do mouse crua), a fita amortece mais
    const k = raiz.classList.contains('lenis') ? .45 : .2;
    agora += (alvo - agora) * k;
    if (Math.abs(alvo - agora) < .0004) agora = alvo;
    aplica(agora);
    if (agora !== alvo) requestAnimationFrame(persegue); else correndo = false;
  };
  conduzFrentes = () => {
    if (!preso.matches) return;
    if (!med) mede();
    alvo = limita((window.scrollY - med.inicio) / med.total) * (n - 1);
    if (!correndo) { correndo = true; requestAnimationFrame(persegue); }
  };
  const remede = () => { med = null; if (preso.matches) { mede(); conduzFrentes(); } };
  window.addEventListener('resize', remede);
  window.addEventListener('load', remede);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remede);

  // celular: o dedo conduz a fita
  janela.addEventListener('scroll', () => {
    if (preso.matches) return;
    const x = janela.scrollLeft / passo();
    abas.style.setProperty('--fa', limita(x, 0, n - 1).toFixed(3));
    ativa(Math.round(limita(x, 0, n - 1)));
  }, { passive: true });

  const vai = i => {
    if (preso.matches) {
      if (!med) mede();
      window.scrollTo({ top: med.inicio + (i / (n - 1)) * med.total + (i === 0 ? 2 : 0), behavior: 'smooth' });
    } else {
      janela.scrollTo({ left: i * passo(), behavior: quieto ? 'auto' : 'smooth' });
    }
  };
  botoes.forEach((b, i) => b.addEventListener('click', () => vai(i)));
  abas.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = limita(atual + (e.key === 'ArrowRight' ? 1 : -1), 0, n - 1);
    botoes[i].focus(); vai(i);
  });

  // o primeiro painel aparece quando a seção chega
  if ('IntersectionObserver' in window) {
    const olho = new IntersectionObserver(e => { if (e[0].isIntersecting) { ativa(Math.max(atual, 0)); olho.disconnect(); } }, { threshold: .25 });
    olho.observe(janela);
  } else paineis.forEach(p => p.classList.add('visto'));
  if (quieto) paineis.forEach(p => p.classList.add('visto'));

  preso.addEventListener('change', () => { fita.style.transform = ''; fr.style.removeProperty('--percurso'); med = null; alvo = agora = 0; janela.scrollLeft = 0; abas.style.setProperty('--fa', 0); atual = -1; ativa(0); });
}

// 5. elementos que cruzam a tela: --p vai de 0 (entrando) a 1 (já no meio da tela)
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

// 6. régua de leitura
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
  conduzFrentes();
  if (!quieto) conduzVistas();
  conduzLeitura();
};
const pede = () => { if (!agendado) { agendado = true; requestAnimationFrame(atualiza); } };
window.addEventListener('scroll', pede, { passive: true });
window.addEventListener('resize', pede);
atualiza();
window.addEventListener('load', atualiza);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(pede);

// 7. barra do WhatsApp no celular: some na abertura, na chamada final e no rodapé
const barra = document.querySelector('.barra-wa');
if (barra && 'IntersectionObserver' in window) {
  const alvos = [document.querySelector('.ab'), document.querySelector('#contato'), document.querySelector('.site-footer')].filter(Boolean);
  const vendo = new Set();
  const olho = new IntersectionObserver(entradas => {
    entradas.forEach(e => (e.isIntersecting ? vendo.add(e.target) : vendo.delete(e.target)));
    const mostra = vendo.size === 0;
    barra.classList.toggle('mostra', mostra);
    barra.setAttribute('aria-hidden', String(!mostra));
    barra.tabIndex = mostra ? 0 : -1;
  });
  alvos.forEach(a => olho.observe(a));
}
})();
