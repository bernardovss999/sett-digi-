/* PORTFÓLIO DA HOME — o leque e a vitrine.
   1. apontar uma tela (mouse ou teclado) faz ela subir e troca a legenda
   2. no toque, quando o leque está na tela, ele passa a vez sozinho a cada 3,2s
   3. clicar abre a vitrine (<dialog>): fecha no X, no Esc ou clicando fora;
      as setas do teclado e os botões trocam de prévia; o foco volta para a tela
   Sem este arquivo o leque fica parado e cada tela não abre nada (o link
   "Explorar portfólio" continua logo abaixo). */

(() => {
const leque = document.querySelector('[data-leque]');
const vitrine = document.querySelector('.vitrine');
if (!leque || !vitrine || typeof vitrine.showModal !== 'function') return;

const raiz = document.documentElement;
const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const toque = window.matchMedia('(hover: none)');
const cartas = [...leque.querySelectorAll('.leque-carta')];
const nome = leque.querySelector('.leque-nome');
let ativa = null;

// 1. a tela apontada
const marca = i => {
  ativa = i;
  leque.classList.toggle('com-ativa', i !== null);
  cartas.forEach((c, k) => {
    c.classList.toggle('ativa', k === i);
    // as vizinhas se afastam um pouco, para a tela apontada aparecer inteira
    c.style.setProperty('--desvio', i === null || k === i ? '0px' : (k < i ? '-26px' : '26px'));
  });
  if (nome) nome.textContent = cartas[i ?? 0].dataset.nome;
};
cartas.forEach((c, k) => {
  c.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') marca(k); });
  c.addEventListener('focus', () => marca(k));
  c.addEventListener('click', () => abre(k));
});
leque.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') marca(null); });
leque.addEventListener('focusout', e => { if (!leque.contains(e.relatedTarget)) marca(null); });

// 2. entrada em fila e, no toque, a vez passando sozinha
let ciclo = null;
const roda = liga => {
  clearInterval(ciclo); ciclo = null;
  if (!liga || quieto || !toque.matches) return;
  let k = ativa ?? -1;
  ciclo = setInterval(() => { if (!vitrine.open) marca(k = (k + 1) % cartas.length); }, 3200);
};
if ('IntersectionObserver' in window && !quieto) {
  new IntersectionObserver(entradas => entradas.forEach(e => {
    if (e.isIntersecting && !leque.classList.contains('entrou')) {
      leque.classList.add('entrou', 'entrando');
      setTimeout(() => leque.classList.remove('entrando'), 1700);   // depois da fila, o movimento volta ao ritmo normal
    }
    roda(e.isIntersecting);
  }), { threshold: .3 }).observe(leque);
} else leque.classList.add('entrou');

// 3. a vitrine
const v = {
  nome: vitrine.querySelector('#vitrine-nome'),
  tipo: vitrine.querySelector('.vitrine-tipo'),
  desk: vitrine.querySelector('.vitrine-desk'),
  cel: vitrine.querySelector('.vitrine-cel'),
  vivo: vitrine.querySelector('.vitrine-vivo'),
  escolhas: [...vitrine.querySelectorAll('[data-escolhe]')],
};
let atual = 0;
const mostra = i => {
  atual = (i + cartas.length) % cartas.length;
  const d = cartas[atual].dataset;
  v.nome.textContent = d.nome;
  v.tipo.textContent = d.tipo;
  v.desk.srcset = `${d.deskP} 960w, ${d.desk} 1440w`; v.desk.sizes = 'min(900px, 70vw)'; v.desk.src = d.desk; v.desk.alt = d.deskAlt;
  v.cel.srcset = `${d.celP} 390w, ${d.cel} 780w`; v.cel.sizes = '330px'; v.cel.src = d.cel; v.cel.alt = d.celAlt;
  v.vivo.href = d.vivo;
  vitrine.querySelectorAll('.vitrine-janela, .vitrine-celular').forEach(el => { el.scrollTop = 0; });   // cada prévia começa do topo
  v.escolhas.forEach((b, k) => b.setAttribute('aria-current', String(k === atual)));
};
const abre = i => {
  mostra(i);
  vitrine.showModal();
  raiz.classList.add('vitrine-aberta');
  vitrine.querySelector('.vitrine-fecha').focus();
};
vitrine.addEventListener('close', () => raiz.classList.remove('vitrine-aberta'));
vitrine.querySelector('.vitrine-fecha').addEventListener('click', () => vitrine.close());
vitrine.addEventListener('click', e => { if (e.target === vitrine) vitrine.close(); });   // clique no fundo, fora da caixa
v.escolhas.forEach(b => b.addEventListener('click', () => mostra(Number(b.dataset.escolhe))));
vitrine.querySelectorAll('[data-passo]').forEach(b => b.addEventListener('click', () => mostra(atual + Number(b.dataset.passo))));
vitrine.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { e.preventDefault(); mostra(atual + 1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); mostra(atual - 1); }
});
})();
