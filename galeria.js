/* PORTFÓLIO DA HOME — a fila de prévias e a vitrine.
   1. os cartões entram em fila quando a seção chega na tela (uma vez só)
   2. clicar ou tocar abre a vitrine (<dialog>): fecha no X, no Esc ou
      clicando fora; as setas do teclado e os botões trocam de prévia; ao
      fechar, a fila mostra o cartão da última prévia vista
   Sem este arquivo os cartões ficam parados e não abrem nada (o link
   "Explorar portfólio" continua logo abaixo). */

(() => {
const leque = document.querySelector('[data-leque]');
const vitrine = document.querySelector('.vitrine');
if (!leque || !vitrine || typeof vitrine.showModal !== 'function') return;

const raiz = document.documentElement;
const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cartas = [...leque.querySelectorAll('.leque-carta')];
cartas.forEach((c, k) => c.addEventListener('click', () => abre(k)));

// 1. entrada em fila
if ('IntersectionObserver' in window && !quieto) {
  const olho = new IntersectionObserver(entradas => {
    if (entradas.some(e => e.isIntersecting)) { leque.classList.add('entrou'); olho.disconnect(); }
  }, { threshold: .2 });
  olho.observe(leque);
} else leque.classList.add('entrou');

// 3. a vitrine
const v = {
  nome: vitrine.querySelector('#vitrine-nome'),
  tipo: vitrine.querySelector('.vitrine-tipo'),
  desk: vitrine.querySelector('.vitrine-desk'),
  cel: vitrine.querySelector('.vitrine-cel'),
  vivo: vitrine.querySelector('.vitrine-vivo'),
  escolhas: [...vitrine.querySelectorAll('[data-escolhe]')],
  escolha: vitrine.querySelector('.vitrine-escolha'),
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
  v.escolha.dataset.conta = `${atual + 1} de ${cartas.length}`;
};
const abre = i => {
  mostra(i);
  vitrine.showModal();
  raiz.classList.add('vitrine-aberta');
  vitrine.querySelector('.vitrine-fecha').focus();
};
vitrine.addEventListener('close', () => {
  raiz.classList.remove('vitrine-aberta');
  // a fila (quando desliza) para no cartão da última prévia vista
  const li = cartas[atual].parentElement, lista = li.parentElement;
  if (lista.scrollWidth > lista.clientWidth) lista.scrollTo({ left: li.offsetLeft - lista.firstElementChild.offsetLeft, behavior: quieto ? 'auto' : 'smooth' });
});
vitrine.querySelector('.vitrine-fecha').addEventListener('click', () => vitrine.close());
vitrine.addEventListener('click', e => { if (e.target === vitrine) vitrine.close(); });   // clique no fundo, fora da caixa
v.escolhas.forEach(b => b.addEventListener('click', () => mostra(Number(b.dataset.escolhe))));
vitrine.querySelectorAll('[data-passo]').forEach(b => b.addEventListener('click', () => mostra(atual + Number(b.dataset.passo))));
vitrine.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { e.preventDefault(); mostra(atual + 1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); mostra(atual - 1); }
});
})();
