/* ESBOÇO FINAL (ramo esboco/fundo-motion) — a abertura da home vira um palco:
   1. FEED: atrás da abertura, um feed de Reels (só motions feitos em 9:16):
      um vídeo central nítido, os de cima e de baixo desfocados, e ele avança
      um por vez, como quem desliza o dedo no Instagram. Ao lado, colunas
      desfocadas descendo mais rápido.
   2. A TURMA: os seis agentes do vídeo e o ponto da Sett na frente andam
      SEMPRE juntos, em fila espaçada, explorando a abertura: chão, botões,
      texto e as linhas do título ("Seu negócio presente."). Pegue um e jogue
      longe: ele cai, quica até parar e volta para a sua vaga na fila.
   3. O LÍDER: o ponto da Sett dá tarefas ("Relatórios, faz o relatório da
      semana!") e o agente responde ("Tô fazendo…" → "Pronto!"). Quando você
      desce, ele acompanha o site inteiro no canto da tela, perguntando
      coisas; quando você volta, ele pula de volta para a frente da fila.
   Com "reduzir movimento" a turma fica parada no chão e o feed não anda. */
(() => {
  const hero = document.querySelector('main > section.hero');
  if (!hero) return;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const celular = () => innerWidth < 800;
  document.documentElement.classList.add('com-turma');

  // ================================================================ 1. o feed
  // Atrás da abertura inteira, colunas de Reels subindo sem parar, como um
  // feed rolando: as desfocadas no fundo e UMA nítida (o "Para você"), que é
  // só mais uma coluna do mesmo fundo, sem desfoque. Vídeos de 4 s, pequenos
  // cada um baixado só quando está chegando na tela; os nítidos em 720×1280 (AV1, com H.264 para quem não toca AV1).
  const fundoFeed = document.createElement('div');
  fundoFeed.className = 'feed-fundo';
  fundoFeed.setAttribute('aria-hidden', 'true');
  // os nítidos em AV1 (mesma qualidade, bem menos peso) onde o navegador toca AV1; senão, H.264
  const tocaAv1 = (() => { const v = document.createElement('video'); return !!(v.canPlayType && v.canPlayType('video/mp4; codecs="av01.0.05M.08"')); })();
  const video = src => `<video data-src="/video/feed/${src}${src.startsWith('n') && tocaAv1 ? '.av1' : ''}.mp4" muted loop playsinline preload="none"></video>`;
  // computador: cinco colunas e a nítida na 4ª, à direita do texto
  const colunas = celular() ? 3 : 5;
  const nitida = celular() ? 1 : 3;
  // a lista dos trechos (cada motion cortado em vários): mistura os motions para não repetir em sequência
  const monta = lista => {
    const ns = lista.map(x => x.n);
    const embaralha = (l, k) => l.map((v, i) => [((i * 7 + k * 13) % l.length), v]).sort((m, n) => m[0] - n[0]).map(x => x[1]);
    fundoFeed.innerHTML = Array.from({ length: colunas }, (_, c) => {
      const lista2 = c === nitida ? embaralha(ns, 1).map(n => 'n' + n) : embaralha(ns, c + 2).filter((_, i) => i % (colunas - 1) === (c > nitida ? c - 1 : c)).map(n => 'd-' + n);
      const tiles = lista2.map(video).join('');
      return `<div class="feed-col c${c}${c === nitida ? ' nitida' : ''}"><div class="feed-trilho">${tiles}${tiles}</div></div>`;   // duas vezes: passa sem emenda
    }).join('') + '<div class="feed-veu"></div>';
  };
  hero.prepend(fundoFeed);
  // cada vídeo só baixa quando está chegando na tela (a coluna sobe; quem sai, pausa)
  let abertaVisivel = false;
  const perto = new Map();
  const ajusta = v => {
    if (abertaVisivel && perto.get(v)) { if (!v.src) v.src = v.dataset.src; if (!quieto) v.play().catch(() => {}); }
    else v.pause();
  };
  const liga = () => {
    if (!('IntersectionObserver' in window)) { fundoFeed.querySelectorAll('video').forEach(v => { v.src = v.dataset.src; v.play().catch(() => {}); }); return; }
    const olhoVideo = new IntersectionObserver(es => es.forEach(e => { perto.set(e.target, e.isIntersecting); ajusta(e.target); }), { rootMargin: '60px 0px' });
    fundoFeed.querySelectorAll('video').forEach(v => olhoVideo.observe(v));
    new IntersectionObserver(e => { abertaVisivel = e[0].isIntersecting; fundoFeed.querySelectorAll('video').forEach(ajusta); }).observe(hero);
  };
  // a velocidade sai do tamanho da coluna: na nítida, um vídeo novo a cada ~4 s
  // (o tempo de cada trecho); nas desfocadas, um pouco mais rápido
  const ritmo = () => fundoFeed.querySelectorAll('.feed-col').forEach(c => {
    const t = c.querySelector('.feed-trilho'), passo = t.firstElementChild.getBoundingClientRect().height + 14;
    const porSeg = passo / (c.classList.contains('nitida') ? 4 : 2.6);
    t.style.setProperty('--dur', (t.scrollHeight / 2 / porSeg).toFixed(1) + 's');
  });
  fetch('/video/feed/lista.json').then(r => r.json()).then(l => { monta(l); requestAnimationFrame(ritmo); liga(); }).catch(() => {});
  addEventListener('resize', () => requestAnimationFrame(ritmo));

  // ================================================================ 2. a turma e o líder
  const OLHAR = n => `/img/mascote/olhar/${n}.webp`;
  const AG = (k, e) => `/img/agentes/${k}-${e}.webp`;
  const WA = 'https://wa.me/5521936181695?text=';
  // [chave, nome, o que faz, a tarefa que o líder pede, o que ele responde enquanto faz, e quando termina]
  const AGENTES = [
    ['atendimento', 'Atendimento', 'responde seus clientes no WhatsApp', 'responde a dona Marta!', 'Respondendo…', 'Respondido! ✓'],
    ['agenda', 'Agenda', 'confirma e remarca horários', 'confirma o horário das 15h!', 'Confirmando…', 'Confirmado! ✓'],
    ['pedidos', 'Pedidos', 'anota o pedido e avisa a equipe', 'anota o pedido da mesa 4!', 'Anotando…', 'Equipe avisada! ✓'],
    ['estoque', 'Estoque', 'avisa o que vai faltar, antes de faltar', 'confere o estoque!', 'Gerindo o estoque…', 'Tudo em dia! ✓'],
    ['prospeccao', 'Prospecção', 'encontra quem pode virar seu cliente', 'acha clientes novos!', 'Procurando…', '3 contatos novos! ✓'],
    ['relatorios', 'Relatórios', 'entrega o resumo da semana, pronto', 'faz o relatório da semana!', 'Tô fazendo…', 'Pronto! ✓'],
  ];
  const PERGUNTAS = {
    hero: [['Oi! Quer ver o seu negócio aparecendo melhor na internet?', 'Quero ver'], ['Quer uma equipe de agentes dessas no seu negócio?', 'Quero uma']],
    portfolio: [['Gostou de algum? Imagina o seu negócio assim.', 'Quero um site assim'], ['Quer uma prévia do seu site?', 'Quero uma prévia']],
    servicos: [['Qual desses o seu negócio precisa primeiro?', 'Quero conversar'], ['Seu Google está com horário e fotos certos?', 'Quero revisar']],
    automacao: [['Que tarefa se repete todo dia na sua rotina?', 'Contar a minha'], ['E se a agenda se organizasse sozinha?', 'Quero ver como']],
    faq: [['Ficou alguma dúvida? Pergunta pra gente.', 'Perguntar'], ['Prefere conversar com uma pessoa?', 'Falar com a Sett']],
    contato: [['Vamos começar? É só me chamar.', 'Falar com a Sett'], ['Comece por uma tarefa. Qual é a sua?', 'Contar a minha']],
  };
  [...['frente', 'esquerda', 'direita', 'cima', 'baixo', 'pisca', 'sorri'].map(OLHAR), ...AGENTES.flatMap(([k]) => ['aberto', 'sorri', 'pisca'].map(e => AG(k, e)))].forEach(src => { const i = new Image(); i.src = src; });

  const palco = document.createElement('div');
  palco.className = 'turma';
  const fala = document.createElement('div');
  fala.className = 'turma-fala';
  fala.setAttribute('role', 'status');
  fala.setAttribute('aria-live', 'polite');
  document.body.append(palco, fala);

  const turma = [];
  const cria = (lider, a) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'boneco' + (lider ? ' lider' : '');
    el.setAttribute('aria-label', lider ? 'Mascote da Sett: perguntar' : `Agente de ${a[1]}: apresentar`);
    el.innerHTML = '<img alt="" draggable="false"><i class="sinal" aria-hidden="true"></i>';
    palco.append(el);
    const b = { el, img: el.querySelector('img'), sinal: el.querySelector('.sinal'), lider, k: a?.[0], nome: a?.[1] || 'Sett', legenda: a?.[2], tarefa: a?.[3], fazendo: a?.[4], feito: a?.[5],
      modo: 'abertura', x: 0, y: 0, vx: 0, vy: 0, chao: false, plat: null, rumo: null, espera: 0, pega: false, voando: false, giro: 0, giroAlvo: 0, anda: 0, cara: '' };
    b.rosto = e => {
      if (b.cara === e) return;
      b.cara = e;
      b.img.src = lider ? OLHAR(e === 'aberto' ? 'frente' : e) : AG(b.k, ['sorri', 'pisca'].includes(e) ? e : 'aberto');
    };
    b.rosto('aberto');
    turma.push(b);
    return b;
  };
  const lider = cria(true, null);
  window.__turma = turma;   // (esboço) para medir nos testes
  AGENTES.forEach(a => cria(false, a));
  const agentes = turma.filter(b => !b.lider);
  const tam = b => (b.lider ? (celular() ? 40 : 56) : (celular() ? 30 : 42));
  const VAO = () => (celular() ? 10 : 16);   // o espaço entre um e outro na fila

  // ---- falas: o líder num balão grande; os agentes em balõezinhos curtos
  const sinal = (b, s, ms = 1100) => { b.sinal.textContent = s; b.el.classList.toggle('fala-longa', s.length > 2); b.el.classList.add('com-sinal'); clearTimeout(b.tSinal); b.tSinal = setTimeout(() => b.el.classList.remove('com-sinal'), ms); };
  let fechaFala;
  const diz = (texto, botao, ms = 3800) => {
    fala.innerHTML = `<span>${texto}</span>${botao ? `<a href="${WA + encodeURIComponent('Olá! Vim pelo site da Sett. ' + texto)}" target="_blank" rel="noopener noreferrer">${botao}</a>` : ''}`;
    fala.classList.add('aberta');
    lider.rosto('sorri');
    clearTimeout(fechaFala);
    fechaFala = setTimeout(() => { if (!fala.matches(':hover')) { fala.classList.remove('aberta'); lider.rosto('aberto'); } }, ms);
  };
  const secaoDaVez = () => {
    const meio = innerHeight * .45;
    return [...document.querySelectorAll('main > section')].find(s => { const r = s.getBoundingClientRect(); return r.top <= meio && r.bottom > meio; });
  };
  const vezes = {};
  const pergunta = () => {
    const s = secaoDaVez();
    const k = s?.classList.contains('hero') ? 'hero' : s?.id;
    const lista = PERGUNTAS[k] || PERGUNTAS.contato;
    const [t, bt] = lista[(vezes[k] = ((vezes[k] ?? -1) + 1)) % lista.length];
    diz(t, bt, 4600);
  };
  // o líder passa uma tarefa; o agente responde enquanto faz e quando termina
  let ultimaTarefa = -1;
  const daTarefa = () => {
    let i = Math.floor(Math.random() * agentes.length);
    if (i === ultimaTarefa) i = (i + 1) % agentes.length;
    ultimaTarefa = i;
    const b = agentes[i];
    diz(`${b.nome}, ${b.tarefa}`, null, 2600);
    setTimeout(() => { sinal(b, b.fazendo, 1900); b.rosto('sorri'); if (b.chao && !quieto) { b.vy = -260; b.chao = false; b.plat = null; } }, 900);
    setTimeout(() => { sinal(b, b.feito, 1800); b.rosto('sorri'); }, 2900);
    setTimeout(() => b.rosto('aberto'), 4800);
  };

  // ---- o mapa da abertura: o chão e as plataformas (linhas do título, a 1ª
  // linha do texto, os botões), em coordenadas da abertura; só se pousa de cima
  const caixa = el => { const r = document.createRange(); r.selectNodeContents(el); return [...r.getClientRects()].filter(q => q.width > 8); };
  let H = hero.getBoundingClientRect();
  let plats = [];
  // o topo das letras de uma linha: a caixa do texto vai do topo ao pé da
  // fonte; a base fica na proporção ascendente/(ascendente+descendente) e o
  // topo das maiúsculas fica a "altura da maiúscula" acima da base
  const regua = document.createElement('canvas').getContext('2d');
  const topoDasLetras = (el, q) => {
    const c = getComputedStyle(el);
    regua.font = `${c.fontWeight} ${c.fontSize} ${c.fontFamily}`;
    const m = regua.measureText('Hgé');
    const asc = m.fontBoundingBoxAscent || parseFloat(c.fontSize) * .9, desc = m.fontBoundingBoxDescent || parseFloat(c.fontSize) * .25;
    const cap = regua.measureText('H').actualBoundingBoxAscent || parseFloat(c.fontSize) * .7;
    const base = q.top + q.height * asc / (asc + desc);
    return base - cap;
  };
  const mapeia = () => {
    H = hero.getBoundingClientRect();
    plats = [{ id: 'chao', x1: 0, x2: H.width, y: H.height - 4 }];
    // o título e o texto ficam livres: a turma só sobe nos botões
    hero.querySelectorAll('.hero-actions > a').forEach((a, i) => { const q = a.getBoundingClientRect(); if (q.width) plats.push({ id: `botao-${i}`, x1: q.left - H.left + 4, x2: q.right - H.left - 4, y: q.top - H.top + 1 }); });
  };
  const plat = id => plats.find(p => p.id === id);
  const teto = () => (document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0) - H.top;

  // ---- o roteiro do guia (o líder segue ele; a fila segue o líder)
  // o comprimento da fila inteira (do centro do primeiro ao do último), com o espaço entre eles
  const comprimento = () => turma.reduce((s, b, i) => s + (i ? (tam(turma[i - 1]) + tam(b)) / 2 + VAO() : 0), 0) + (tam(turma[0]) + tam(turma[turma.length - 1])) / 2;
  const cabe = p => p.x2 - p.x1 >= comprimento() + 16;
  const roteiro = () => {
    // anda no chão para a esquerda, escala o botão principal (quem não cabe
    // espera embaixo, em fila, como uma lagarta), desce e atravessa para a direita
    const botao = plat('botao-0');
    const r = [['chao', -1]];
    if (botao) r.push([botao.id, 1]);
    r.push(['chao', 1]);
    return r;
  };
  const ordemAg = turma.filter(b => !b.lider);
  let ordemDir = -1;
  const guia = { pid: 'chao', x: 0, dir: -1, passo: 0, espera: 1.5, muda: 0, rota: [] };
  let chamado = null;

  mapeia();
  guia.x = H.width * .6;
  turma.forEach((b, i) => { b.x = guia.x - i * 50 - 20; b.y = -60 - i * 55; });

  // ---- pegar, arrastar e arremessar
  let arrasto = null;
  const naTela = b => (b.modo === 'abertura' ? { x: H.left + b.x, y: H.top + b.y } : { x: b.x, y: b.y });
  turma.forEach(b => {
    b.el.addEventListener('pointerdown', e => {
      e.preventDefault();
      b.el.setPointerCapture(e.pointerId);
      const p = naTela(b);
      arrasto = { b, dx: e.clientX - p.x, dy: e.clientY - p.y, pts: [[e.clientX, e.clientY, performance.now()]], moveu: false };
      b.pega = true; b.chao = false; b.plat = null; b.rumo = null; b.vx = b.vy = 0;
      b.el.classList.add('pego');
      b.rosto(b.lider ? 'cima' : 'sorri');
    });
    b.el.addEventListener('pointermove', e => {
      if (!arrasto || arrasto.b !== b) return;
      const [x0, y0] = arrasto.pts[0];
      if (!arrasto.moveu && Math.hypot(e.clientX - x0, e.clientY - y0) > 6) {
        arrasto.moveu = true;
        if (b.lider) diz('Uou! Me põe no chão!');
        else { sinal(b, 'Opa!', 900); if (Math.random() < .5) diz(['Ei! Devolve o ' + b.nome + '!', b.nome + ', segura firme!', 'Cuidado com o ' + b.nome + '!'][Math.floor(Math.random() * 3)]); }
      }
      const x = e.clientX - arrasto.dx, y = e.clientY - arrasto.dy;
      if (b.modo === 'abertura') { b.x = x - H.left; b.y = y - H.top; } else { b.x = x; b.y = y; }
      arrasto.pts.push([e.clientX, e.clientY, performance.now()]);
      if (arrasto.pts.length > 5) arrasto.pts.shift();
    });
    const solta = () => {
      if (!arrasto || arrasto.b !== b) return;
      const a = arrasto.pts[0], z = arrasto.pts[arrasto.pts.length - 1], dt = Math.max(16, z[2] - a[2]) / 1000;
      b.pega = false;
      b.el.classList.remove('pego');
      if (arrasto.moveu) {
        b.vx = Math.max(-2800, Math.min(2800, (z[0] - a[0]) / dt));
        b.vy = Math.max(-2800, Math.min(2800, (z[1] - a[1]) / dt));
        b.voando = true;
      }   // um toque rápido (sem arrastar) não faz nada: eles seguem por conta própria
      b.rosto('aberto');
      arrasto = null;
    };
    b.el.addEventListener('pointerup', solta);
    b.el.addEventListener('pointercancel', solta);
  });

  // ---- física: queda com gravidade, quiques que vão diminuindo até assentar
  const G = 2400;
  const pulinho = b => { if (!b.chao) return; b.vy = -(celular() ? 420 : 520); b.chao = false; b.plat = null; b.rumo = null; };
  const saltaPara = (b, p, gx) => {
    const t = tam(b), gy = p.y - t;
    const topo = Math.min(b.y, gy) - (b.passaPorCima ? (celular() ? 80 : 120) : (celular() ? 40 : 60));
    b.passaPorCima = false;
    const vy = -Math.sqrt(2 * G * Math.max(8, b.y - topo));
    const tSobe = -vy / G, tDesce = Math.sqrt(2 * Math.max(4, gy - topo) / G);
    b.vy = vy; b.vx = (gx - b.x) / (tSobe + tDesce);
    b.chao = false; b.plat = null; b.rumo = p.id; b.salto = true;
    b.giroAlvo = Math.abs(gx - b.x) > 160 ? (gx > b.x ? 360 : -360) : 0;
    b.giro = 0;
  };
  // ao tocar uma plataforma: quica (cada vez mais baixo) ou assenta
  const bate = (b, p, t) => {
    b.y = p.y - t;
    const quique = b.voando ? .58 : .32;
    b.el.classList.remove('pousa'); void b.el.offsetWidth; b.el.classList.add('pousa');
    if (Math.abs(b.vy) > (b.voando ? 140 : 260)) {
      b.vy = -Math.abs(b.vy) * quique;
      b.vx *= b.voando ? .78 : .2;
      b.rumo = p.id === 'chao' || b.rumo === p.id ? p.id : b.rumo;
      if (b.voando && !b.tonto) { b.tonto = true; sinal(b, 'Uí!', 600); }
      return;
    }
    b.vy = 0; b.chao = true; b.plat = p.id; b.rumo = null; b.giroAlvo = 0; b.salto = false;
    b.rolando = b.voando ? b.vx : 0;   // depois do arremesso, ainda escorrega um pouco
    b.vx = 0; b.giro = 0;
    if (b.voando) {
      b.voando = false; b.tonto = false;
      b.espera = 1.2;
      setTimeout(() => sinal(b, '?', 800), 200);
      setTimeout(() => sinal(b, 'Voltando!', 1100), 1000);
      if (!b.lider && Math.random() < .6) setTimeout(() => diz(`Volta pra turma, ${b.nome}!`, null, 2200), 500);
    }
  };
  const cai = (b, t, piso, dt, emTela) => {
    const yAntes = b.y + t;
    b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.giroAlvo) b.giro = b.giroAlvo * Math.min(1, Math.abs(b.giro / b.giroAlvo) + dt * 1.5);
    else if (b.voando) b.giro += b.vx * .35 * dt;
    const largura = emTela ? innerWidth : H.width;
    if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx) * .5; }
    if (b.x > largura - t) { b.x = largura - t; b.vx = -Math.abs(b.vx) * .5; }
    const ceu = emTela ? 0 : teto();
    if (b.y < ceu && b.vy < 0) { b.y = ceu; b.vy = -b.vy * .3; }
    if (!emTela && b.y + t > H.height - 4) { bate(b, plat('chao'), t); return; }
    if (b.vy > 0) {
      if (emTela) { if (b.y + t >= piso) bate(b, { id: "piso", y: piso }, t); return; }
      const cx = b.x + t / 2, base = b.y + t;
      const p = plats.filter(q => cx >= q.x1 && cx <= q.x2 && yAntes <= q.y + 1 && base >= q.y && (!b.rumo || q.id === b.rumo || q.id === 'chao')).sort((m, n) => m.y - n.y)[0];
      if (p) bate(b, p, t);
    }
  };

  // ---- o quadro
  let textos = [];
  let textosEm = 0;
  let ultimo = performance.now();
  let liderNaAbertura = true;
  const quadro = agora => {
    const dt = Math.min(.033, (agora - ultimo) / 1000);
    ultimo = agora;
    mapeia();
    const abertaNaTela = H.bottom > innerHeight * .45 && H.top < innerHeight * .5;

    // o líder troca de modo: na frente da fila, ou com você pelo resto do site
    // (29/10/2026) o líder fica SÓ na abertura, com a turma: não acompanha o resto do site
    if (false && abertaNaTela !== liderNaAbertura && !lider.pega) {
      liderNaAbertura = abertaNaTela;
      const p = naTela(lider);
      lider.modo = abertaNaTela ? 'abertura' : 'tela';
      if (abertaNaTela) { lider.x = p.x - H.left; lider.y = Math.min(p.y, H.height - tam(lider) - 4); lider.voando = false; }
      else { lider.x = Math.min(Math.max(8, p.x), innerWidth * .3); lider.y = Math.max(-60, p.y); }
      lider.chao = false; lider.plat = null; lider.rumo = null; lider.vx = abertaNaTela ? 0 : -60; lider.vy = quieto ? 0 : -520;
    }

    // o guia: atravessa cada plataforma INTEIRA numa direção só. Quando a fila
    // inteira chegou ao fim, ele passa para a próxima plataforma do roteiro.
    if (!guia.rota.length) guia.rota = roteiro();
    if (chamado) { guia.pid = chamado.pid; guia.dir = chamado.x > guia.x ? 1 : -1; guia.x = chamado.x; guia.muda = agora; chamado = null; }
    const filaAqui = turma.filter(b => b.modo === 'abertura' && !b.voando && !b.pega);
    const todosChegaram = filaAqui.every(b => b.chao && b.plat === (b.alvoPid || guia.pid) && Math.abs(b.x - (b.vaga ?? b.x)) < 6);
    const minha = plat(guia.pid) || plat('chao');
    if (!quieto) {
      const fim = guia.dir > 0 ? minha.x2 : minha.x1;
      if (Math.abs(fim - guia.x) > 2) guia.x += guia.dir * Math.min(Math.abs(fim - guia.x), (celular() ? 55 : 88) * dt);
      else if (todosChegaram || agora - guia.muda > 9000) {
        guia.espera -= dt;
        if (guia.espera <= 0) {
          guia.passo = (guia.passo + 1) % guia.rota.length;
          if (guia.passo === 0) guia.rota = roteiro();
          const [pid, dirRota] = guia.rota[guia.passo];
          const prox = plat(pid) || plat('chao');
          // na próxima plataforma, continua do lado em que está (só vira no chão, no fim do roteiro)
          guia.dir = dirRota;
          guia.pid = prox.id;
          guia.x = Math.max(prox.x1, Math.min(prox.x2, guia.x));
          guia.muda = agora;
          guia.espera = .7;
        }
      }
    }

    // a fila: o líder SEMPRE na frente; atrás dele os agentes na ordem em que
    // estão (ninguém atravessa ninguém), sempre com o mesmo espaço. A fila
    // inteira desliza para caber na plataforma.
    const fila = turma.filter(b => b.modo === 'abertura');
    // a ordem dos agentes é fixa; quando a turma vira, ela se inverte (o último vira o primeiro, ninguém atravessa ninguém)
    if (guia.dir !== ordemDir) { ordemAg.reverse(); ordemDir = guia.dir; }
    const ag = ordemAg.filter(b => b.modo === 'abertura');
    const ordem = fila.includes(lider) ? [lider, ...ag] : ag;
    const totalFila = ordem.reduce((s, b, i) => s + (i ? (tam(ordem[i - 1]) + tam(b)) / 2 + VAO() : 0), 0);
    const t0 = ordem.length ? tam(ordem[0]) : 0, tN = ordem.length ? tam(ordem[ordem.length - 1]) : 0;
    // a frente fica dentro da plataforma; se a fila inteira não cabe nela, quem
    // sobra espera no chão, logo atrás, na mesma fila
    const cabeToda = minha.x2 - minha.x1 >= totalFila + t0 / 2 + tN / 2;
    const frente = cabeToda
      ? (guia.dir > 0 ? Math.max(minha.x1 + totalFila + tN / 2, Math.min(minha.x2 - t0 / 2, guia.x)) : Math.min(minha.x2 - totalFila - tN / 2, Math.max(minha.x1 + t0 / 2, guia.x)))
      : (guia.dir > 0 ? Math.min(minha.x2 - t0 / 2, Math.max(minha.x1 + t0 / 2, guia.x)) : Math.max(minha.x1 + t0 / 2, Math.min(minha.x2 - t0 / 2, guia.x)));
    // a turma virou para o outro lado e o líder ficou atrás: ele PULA por cima de todos para a frente
    if (fila.includes(lider) && lider.chao && !lider.pega && lider.plat === minha.id && ag.length && ag[0].plat === lider.plat && !quieto) {
      const lc = lider.x + tam(lider) / 2, frenteAg = ag[0].x + tam(ag[0]) / 2;
      if (guia.dir * (frenteAg - lc) > 4) { lider.passaPorCima = true; saltaPara(lider, minha, frente - tam(lider) / 2); lider.giroAlvo = guia.dir * 360; }
    }
    let atras = 0;
    ordem.forEach((b, i) => {
      const t = tam(b);
      if (i > 0) atras += (tam(ordem[i - 1]) + t) / 2 + VAO();
      if (b.pega) return;
      let cx = frente - guia.dir * atras;
      let alvo = minha;
      if (cx - t / 2 < minha.x1 - 1 || cx + t / 2 > minha.x2 + 1) alvo = plat('chao');   // não coube: espera embaixo
      cx = Math.max(t / 2, Math.min(H.width - t / 2, cx));
      const gx = cx - t / 2;
      b.vaga = gx; b.alvoPid = alvo.id;
      if (b.chao) {
        const aqui = plat(b.plat);
        if (!aqui || b.x + t / 2 < aqui.x1 - 3 || b.x + t / 2 > aqui.x2 + 3) { b.chao = false; b.plat = null; return; }
        b.y = aqui.y - t;
        if (b.rolando) { b.x += b.rolando * dt; b.rolando *= Math.pow(.02, dt); if (Math.abs(b.rolando) < 12) b.rolando = 0; b.x = Math.max(0, Math.min(H.width - t, b.x)); return; }
        b.espera -= dt;
        if (quieto) return;
        // em outra plataforma: pula para a sua vaga, um depois do outro (o líder primeiro)
        if (b.plat !== alvo.id) { if (b.espera <= 0 && agora - guia.muda > i * 180) saltaPara(b, alvo, gx); }
        else {
          const d = gx - b.x;
          // longe da vaga (voltou de um arremesso): pula por cima dos outros em vez de atravessar
          if (Math.abs(d) > (celular() ? 70 : 100) && b.espera <= 0 && !b.lider) { saltaPara(b, alvo, gx); return; }
          const vel = (Math.abs(d) > 120 ? 2.2 : 1) * (celular() ? 62 : 100);
          // anda sempre de frente para onde a turma vai (só recua uns passinhos para acertar a vaga)
          if (Math.abs(d) > .5) { b.x += Math.sign(d) * Math.min(Math.abs(d), vel * dt); b.anda = Math.sign(d); } else b.anda = 0;
        }
      } else cai(b, t, 0, dt, false);
    });

    // ninguém em cima de ninguém: no mesmo chão, a fila é "empacotada" — varre
    // da esquerda para a direita empurrando quem encosta, e depois de volta,
    // sem sair da plataforma (assim nem a parede deixa um em cima do outro)
    const porPlat = {};
    fila.filter(b => b.chao && !b.pega).forEach(b => (porPlat[b.plat] ||= []).push(b));
    Object.entries(porPlat).forEach(([pid, lista]) => {
      const pl = plat(pid);
      if (!pl || lista.length < 2) return;
      lista.sort((m, n) => (m.x + tam(m) / 2) - (n.x + tam(n) / 2));
      const esqMin = pl.x1 - tam(lista[0]) * .3;
      lista[0].x = Math.max(esqMin, lista[0].x);
      for (let i = 1; i < lista.length; i++) { const A = lista[i - 1], B = lista[i], min = (tam(A) + tam(B)) / 2 + 4; if ((B.x + tam(B) / 2) - (A.x + tam(A) / 2) < min) B.x = A.x + tam(A) / 2 + min - tam(B) / 2; }
      const ult = lista[lista.length - 1];
      ult.x = Math.min(pl.x2 - tam(ult) * .7, ult.x);
      for (let i = lista.length - 2; i >= 0; i--) { const A = lista[i], B = lista[i + 1], min = (tam(A) + tam(B)) / 2 + 4; if ((B.x + tam(B) / 2) - (A.x + tam(A) / 2) < min) A.x = B.x + tam(B) / 2 - min - tam(A) / 2; }
    });

    // o líder pelo resto do site: no canto de baixo à esquerda
    if (lider.modo === 'tela' && !lider.pega) {
      const t = tam(lider), piso = innerHeight - t - (celular() ? 12 : 16);
      if (!lider.chao) cai(lider, t, piso, dt, true);
      else {
        lider.y = piso;
        if (lider.rolando) { lider.x += lider.rolando * dt; lider.rolando *= Math.pow(.02, dt); if (Math.abs(lider.rolando) < 12) lider.rolando = 0; }
        const casa = celular() ? 14 : 22;
        if (!lider.rolando && Math.abs(lider.x - casa) > 2 && !quieto) { lider.anda = Math.sign(casa - lider.x); lider.x += lider.anda * Math.min(Math.abs(casa - lider.x), 80 * dt); } else lider.anda = 0;
      }
    }

    // desenha
    turma.forEach(b => {
      const t = tam(b), p = naTela(b);
      // andando: micro pulinhos. A fase anda com a DISTÂNCIA percorrida (parado, não
      // pula); cada passo é um arco curto, com uma leve amassada quando toca o chão
      const andou = b.xAntes == null ? 0 : Math.abs(p.x - b.xAntes);
      b.xAntes = p.x;
      if (b.chao && !b.pega && andou > .15) b.fase = (b.fase || 0) + andou / (t * .42) * Math.PI;
      else if (b.fase) b.fase = Math.round(b.fase / Math.PI) * Math.PI;   // parou: assenta no chão
      const arco = b.chao ? Math.abs(Math.sin(b.fase || 0)) : 0;
      const passo = arco * t * .2;
      const amassa = b.chao && andou > .15 ? 1 - Math.pow(1 - arco, 6) : 1;   // perto do chão (arco ~ 0) amassa
      const inclina = b.chao && andou > .15 ? b.anda * 6 : 0;
      b.img.style.scale = amassa < 1 ? `${1 + (1 - amassa) * .1} ${1 - (1 - amassa) * .1}` : '';
      b.el.style.width = t + 'px';
      b.el.style.transform = `translate(${p.x}px, ${p.y - passo}px) rotate(${b.giro + inclina}deg)`;
    });
    if (!lider.pega && !fala.classList.contains('aberta') && lider.cara !== 'pisca') lider.rosto(!lider.chao ? 'cima' : lider.anda > 0 || (lider.modo === 'abertura' && guia.dir > 0 && lider.anda) ? 'direita' : lider.anda < 0 ? 'esquerda' : 'aberto');

    // nenhum balão por cima de texto: o que passaria sobre título, parágrafo ou
    // botão fica escondido (volta a aparecer quando o lugar fica livre)
    if (agora - (textosEm || 0) > 400) { textosEm = agora; textos = [...document.querySelectorAll('main h1, main h2, main h3, main p, main a, main button, main li, main summary')].filter(e => e.getClientRects().length && !e.closest('.turma, .feed-fundo')).flatMap(e => { const r = document.createRange(); r.selectNodeContents(e); const q = [...r.getClientRects()]; return q.length ? q : [e.getBoundingClientRect()]; }).filter(q => q.bottom > 0 && q.top < innerHeight && q.width > 2); }
    const cobre = q => textos.some(t => q.left < t.right && t.left < q.right && q.top < t.bottom && t.top < q.bottom);
    turma.forEach(b => { if (b.el.classList.contains('com-sinal')) b.el.classList.toggle('tapado', cobre(b.sinal.getBoundingClientRect())); });
    // o balão do líder: acima dele (ou abaixo, perto do cabeçalho)
    if (fala.classList.contains('aberta')) {
      const p = naTela(lider), t = tam(lider), fw = fala.offsetWidth, fh = fala.offsetHeight;
      const fx = Math.min(innerWidth - fw - 12, Math.max(12, p.x + t / 2 - fw / 2));
      const topoTela = document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0;
      const fy = Math.max(topoTela + 6, p.y - fh - 14);   // sempre em cima
      fala.style.transform = `translate(${fx}px, ${fy}px)`;
      fala.classList.toggle('tapada', cobre({ left: fx, right: fx + fw, top: fy, bottom: fy + fh }));
    }
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);

  // ---- o líder conversa: na abertura, tarefas para a turma (e de vez em quando
  // uma pergunta para você); no resto do site, perguntas
  let vez = 0;
  const conversa = () => {
    const abertaVisivel = hero.getBoundingClientRect().bottom > innerHeight * .35;   // fora da abertura, ninguém fala
    if (!document.hidden && !fala.classList.contains('aberta') && !arrasto && abertaVisivel) {
      if (vez % 3 === 2) pergunta(); else daTarefa();
      vez += 1;
    }
    setTimeout(conversa, 5000);
  };
  setTimeout(() => diz('Oi! Eu sou o Sett. Essa é a minha equipe de agentes!', null, 3400), 1800);
  setTimeout(conversa, 6200);

  // ---- olhos e piscadas
  window.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || arrasto) return;
    agentes.forEach(b => {
      const p = naTela(b), t = tam(b);
      if (b.chao && Math.hypot(e.clientX - (p.x + t / 2), e.clientY - (p.y + t / 2)) < 80) { b.rosto('sorri'); clearTimeout(b.tRosto); b.tRosto = setTimeout(() => b.rosto('aberto'), 900); }
    });
  }, { passive: true });
  if (!quieto) {
    const pisca = () => {
      const b = turma[Math.floor(Math.random() * turma.length)];
      if (b.chao && !b.pega && b.cara === 'aberto') { b.rosto('pisca'); setTimeout(() => { if (b.cara === 'pisca') b.rosto('aberto'); }, 140); }
      setTimeout(pisca, 500 + Math.random() * 700);
    };
    setTimeout(pisca, 1500);
  }
})();
