/* SETT COMPANY — as cenas do roteiro de 29/10/2026 (media kit de nov/2026).
   Regras de todas: cada cena roda UMA vez e para no último quadro; as que duram
   mais têm botão de pausa; com "reduzir movimento" tudo nasce no último quadro.
   Tudo que simula um agente leva o rótulo "Exemplo ilustrativo."
   0. a cena 2D da abertura da home (o celular com os Reels, o Ponto e os cartões das duas áreas)
   1. o mapa das quatro frentes (home, tela 2, e O que fazemos)
   2. Sites que facilitam o contato: o rascunho vira a prévia e aparece o caminho até o contato
   3. Sistemas e agentes de IA: a mensagem passa de agente em agente até a pessoa responsável
   4. Como trabalhamos: o Ponto anda até o passo aberto
   5. o montador de mensagem do WhatsApp (3 toques)
   Sem este arquivo, cada bloco mostra o estado final, completo e parado. */
(() => {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const aVista = (el, fn, limiar = .45) => {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const olho = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { olho.disconnect(); fn(); } }, { threshold: limiar });
    olho.observe(el);
  };
  const aperta = (botoes, escolhido) => botoes.forEach(b => b.setAttribute('aria-pressed', String(b === escolhido)));

  // ------------------------------------------------------------ 0. a abertura: a cena 2D com os Reels da Sett
  // Um celular desenhado toca os Stories: cada um toca uma vez e, ao acabar, a tela desliza para o próximo; o último
  // para no seu último quadro. As barras do topo enchem com o andamento. Como no Instagram: tocar (ou clicar) na direita
  // da tela passa, na esquerda volta, arrastar para o lado troca e segurar pausa enquanto o dedo (ou o botão) estiver na
  // tela; embaixo, uma linha diz isso ao visitante.
  // Em volta, os quatro cartões das duas áreas: o do Reel da vez acende, a linha dele (do Ponto até o cartão) se
  // desenha, o Ponto pula e se vira para ele e a área do texto acende junto; tocar num cartão leva ao Reel dele.
  // Fora da tela, pausa sozinho. 31/10/2026 (pedido do dono): a abertura começa tocando em todo aparelho, como o vídeo
  // do site, inclusive com "reduzir movimento" (a pausa continua no canto). Para não engasgar, o primeiro Reel começa a
  // baixar na hora e cada Reel já baixa o seguinte; se o aparelho recusar o play (modo de economia), tenta de novo no
  // primeiro toque, rolagem ou tecla do visitante.
  const NOMES_REELS = {
    'ponto-abre': 'O Ponto apresenta a Sett', 'rascunho-vivo': 'O rascunho vira site', alfinete: 'O Ponto monta o perfil no Google',
    semana: 'Uma semana comum com um agente', 'elenco-agenda': 'O agente de Agenda', trilho: 'Um agente decide o caminho',
    domino: 'A tarefa passa de agente em agente', 'elenco-relatorios': 'O agente de Relatórios', 'ponto-fecha': 'Vamos conversar?',
  };
  document.querySelectorAll('[data-reels]').forEach(reels => {
    const trilho = reels.querySelector('.reels-trilho');
    const cartoes = [...reels.querySelectorAll('.reel')];
    const barras = [...reels.querySelectorAll('.reels-barras i')];
    const volta = reels.querySelector('[data-reels-volta]');
    const segue = reels.querySelector('[data-reels-segue]');
    const pausa = reels.querySelector('[data-reels-pausa]');
    const numero = reels.querySelector('[data-reels-n]');
    const nome = reels.querySelector('[data-reels-nome]');
    const ponto = reels.querySelector('.reels-ponto');
    const faiscas = reels.querySelector('.reels-faiscas');
    const fios = reels.querySelector('.reels-fios');
    const cartas = [...reels.querySelectorAll('.reels-cartao')];
    const areas = [...(reels.closest('section')?.querySelectorAll('.areas [data-area]') || [])];
    let k = 0;
    let parado = false;          // o visitante pediu para parar
    let segurando = false;       // o dedo está no Reel (celular): pausa enquanto segura
    let naTela = false;
    let acabou = false;
    let quadro = 0;
    const video = c => {
      let v = c.querySelector('video');
      if (v) return v;
      const id = c.dataset.reel;
      v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
      v.innerHTML = `<source src="/video/cenas/${id}.av1.mp4" type='video/mp4; codecs="av01.0.05M.08"'><source src="/video/cenas/${id}.mp4" type="video/mp4">`;
      v.addEventListener('playing', () => { v.classList.add('pronto'); const n = cartoes[cartoes.indexOf(c) + 1]; if (n) video(n); });
      v.addEventListener('ended', () => { if (k === cartoes.indexOf(c)) proximo(true); });
      c.append(v);
      return v;
    };
    // as barras: cheias as que passaram, a da vez acompanha o vídeo
    const enche = () => {
      cancelAnimationFrame(quadro);
      const v = cartoes[k].querySelector('video');
      const p = acabou ? 1 : v && v.duration ? v.currentTime / v.duration : 0;
      barras.forEach((b, i) => b.style.setProperty('--p', i < k ? 1 : i > k ? 0 : p));
      if (v && !v.paused && !v.ended) quadro = requestAnimationFrame(enche);
    };
    const rotulo = () => {
      const tocando = !parado && !acabou;
      pausa.setAttribute('aria-pressed', String(!tocando));
      pausa.setAttribute('aria-label', acabou ? 'Ver os Stories de novo' : tocando ? 'Pausar os Stories' : 'Tocar os Stories');
      volta.disabled = k === 0;
      segue.disabled = k === cartoes.length - 1;
      numero.textContent = `${k + 1} de ${cartoes.length}`;
      nome.textContent = NOMES_REELS[cartoes[k].dataset.reel] || '';
    };
    // as linhas: do Ponto (parado, sem o giro) até o meio de cada cartão, com uma curva que sai para o lado
    const NS = 'http://www.w3.org/2000/svg';
    const desenha = () => {
      if (!fios || !ponto) return;
      const px = ponto.offsetLeft + ponto.offsetWidth / 2; const py = ponto.offsetTop + ponto.offsetHeight / 2;
      fios.replaceChildren(...cartas.flatMap(c => {
        const cx = c.offsetLeft + c.offsetWidth / 2; const cy = c.offsetTop + c.offsetHeight / 2;
        const d = `M${px} ${py}Q${cx} ${py} ${cx} ${cy}`;
        return ['fio', 'luz'].map(classe => {
          const linha = document.createElementNS(NS, 'path');
          linha.setAttribute('d', d); linha.setAttribute('class', classe); linha.dataset.cartao = c.dataset.cartao;
          if (classe === 'luz') linha.setAttribute('pathLength', '1');
          return linha;
        });
      }));
      acende(false);
    };
    const reinicia = (el, classe) => { if (!el) return; el.classList.remove(classe); void el.getBoundingClientRect(); el.classList.add(classe); };
    let aceso = null;
    const acende = (mudou = true) => {
      const qual = cartoes[k].dataset.cartao || null;
      const carta = cartas.find(c => c.dataset.cartao === qual);
      cartas.forEach(c => c.classList.toggle('aceso', c === carta));
      fios?.querySelectorAll('.luz').forEach(l => l.classList.toggle('acesa', l.dataset.cartao === qual));
      const area = carta?.dataset.area;
      areas.forEach(li => li.classList.toggle('na-vez', li.dataset.area === area));
      if (!mudou || qual === aceso) return;
      aceso = qual;
      // o Ponto se vira para o lado do cartão (esquerda -1, direita 1, de frente 0) e pula
      const lado = !carta ? 0 : carta.offsetLeft + carta.offsetWidth / 2 < reels.clientWidth / 2 ? -1 : 1;
      reels.style.setProperty('--olha', lado);
      const luz = fios?.querySelector(`.luz[data-cartao="${qual}"]`);
      if (luz) { luz.classList.remove('acesa'); void luz.getBoundingClientRect(); luz.classList.add('acesa'); }
      reinicia(ponto, 'pula'); reinicia(faiscas, 'brilha');
      areas.filter(li => li.dataset.area === area).forEach(li => { li.classList.remove('na-vez'); void li.offsetWidth; li.classList.add('na-vez'); });
    };
    const centra = () => {
      const c = cartoes[k];
      trilho.style.setProperty('--x', `${-(c.offsetLeft + c.offsetWidth / 2)}px`);
    };
    const toca = () => {
      cartoes.forEach((c, i) => { const v = c.querySelector('video'); if (v && i !== k && !v.paused) v.pause(); });
      const v = cartoes[k].querySelector('video');
      if (parado || segurando || acabou || !naTela) { if (v && !v.paused) v.pause(); enche(); return; }
      const w = v || video(cartoes[k]);
      if (w.ended) w.currentTime = 0;
      w.play().then(enche).catch(insiste);
    };
    // o aparelho recusou o play sozinho: tenta de novo no primeiro gesto do visitante, em qualquer lugar da página
    let esperando = false;
    const insiste = () => {
      if (esperando) return;
      esperando = true;
      const de = () => { esperando = false; ['pointerdown', 'touchstart', 'scroll', 'keydown'].forEach(t => removeEventListener(t, de, true)); toca(); };
      ['pointerdown', 'touchstart', 'scroll', 'keydown'].forEach(t => addEventListener(t, de, { capture: true, passive: true }));
    };
    const vai = (n, sozinho) => {
      k = Math.max(0, Math.min(cartoes.length - 1, n));
      acabou = false;
      cartoes.forEach((c, i) => { c.classList.toggle('atual', i === k); c.tabIndex = i === k ? 0 : -1; c.setAttribute('aria-current', String(i === k)); });
      const v = cartoes[k].querySelector('video');
      if (v && !sozinho) v.currentTime = 0;
      centra(); rotulo(); acende(); toca();
    };
    const proximo = sozinho => {
      if (k === cartoes.length - 1) { acabou = true; rotulo(); enche(); return; }   // o último para no seu último quadro
      vai(k + 1, sozinho);
    };
    const alterna = () => { if (acabou) { parado = false; vai(0); return; } parado = !parado; rotulo(); toca(); };
    volta.addEventListener('click', () => { reels.classList.add('mexeu'); vai(k - 1); });
    segue.addEventListener('click', () => { reels.classList.add('mexeu'); vai(k + 1); });   // o último para no seu último quadro
    pausa.addEventListener('click', alterna);
    // tocar num cartão leva ao Reel dele (se já está nele, ao próximo Reel do mesmo cartão)
    cartas.forEach(c => c.addEventListener('click', () => {
      reels.classList.add('mexeu');
      const dele = cartoes.map((r, i) => (r.dataset.cartao === c.dataset.cartao ? i : -1)).filter(i => i >= 0);
      const n = dele.find(i => i > k && cartoes[k].dataset.cartao === c.dataset.cartao) ?? dele[0];
      if (n !== k) { parado = false; vai(n); }
    }));
    // na tela do celular, como nos Stories: os dois lados são botões (o clique e o toque chegam neles); aqui ficam o
    // arrasto para o lado (troca) e o segurar (pausa enquanto o dedo ou o botão do mouse estiver na tela). Depois de um
    // arrasto ou de segurar, o clique que vem junto é engolido, para não passar de Story sem querer.
    const celular = reels.querySelector('.reels-celular');
    let ini = null;
    let tSegura = 0;
    let engole = false;
    celular.addEventListener('pointerdown', e => {
      if (e.button || e.target.closest('[data-reels-pausa]')) return;
      reels.classList.add('mexeu');   // o círculo de toque some
      ini = { x: e.clientX, y: e.clientY };
      clearTimeout(tSegura);
      tSegura = setTimeout(() => { segurando = true; reels.classList.add('segurando'); toca(); }, 280);
    });
    const solta = e => {
      clearTimeout(tSegura);
      if (!ini) return;
      const dx = e.clientX - ini.x; const dy = e.clientY - ini.y;
      ini = null;
      if (segurando) { segurando = false; reels.classList.remove('segurando'); toca(); engole = true; return; }
      if (e.type === 'pointercancel') return;
      if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) { engole = true; vai(k + (dx < 0 ? 1 : -1)); }
    };
    celular.addEventListener('pointerup', solta);
    celular.addEventListener('pointercancel', solta);
    celular.addEventListener('pointerleave', e => { if (ini) solta(e); });
    celular.addEventListener('click', e => { if (engole) { engole = false; e.stopPropagation(); e.preventDefault(); } }, true);
    celular.addEventListener('contextmenu', e => { if (segurando) e.preventDefault(); });
    cartoes.forEach(c => c.addEventListener('click', e => { if (e.detail === 0) alterna(); }));   // Enter/Espaço no Reel da vez
    reels.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); vai(k + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); vai(k - 1); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { naTela = es.some(e => e.isIntersecting); toca(); }, { threshold: .35 }).observe(reels);
    } else naTela = true;
    video(cartoes[0]);   // começa a baixar o primeiro Reel antes de a página terminar de montar
    addEventListener('resize', () => { centra(); desenha(); }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(desenha).observe(reels);
    vai(0);
    desenha();
    requestAnimationFrame(() => trilho.classList.add('anda'));
  });

  // ------------------------------------------------------------ 1. o mapa das frentes
  const FRENTES = [
    { nome: 'Marca e conteúdo', texto: 'Identidade visual, posicionamento e conteúdo para uma comunicação consistente.', link: '/marca-e-conteudo/' },
    { nome: 'Sites', texto: 'Design próprio, clareza no celular e caminhos simples para falar com o negócio.', link: '/criacao-de-sites/' },
    { nome: 'Presença digital', texto: 'Perfil da Empresa no Google, redes sociais e conteúdo com acompanhamento contínuo.', link: '/gestao-google-meu-negocio/' },
    { nome: 'Sistemas e agentes de IA', texto: 'Ferramentas sob medida para organizar a rotina e cuidar das tarefas que se repetem.', link: '/agentes-de-ia-para-empresas/' },
  ];
  document.querySelectorAll('[data-mapa]').forEach(mapa => {
    const secao = mapa.closest('section');
    const botoes = [...secao.querySelectorAll('[data-frente]')];
    const cenas = [...mapa.querySelectorAll('[data-cena]')];
    const pausa = mapa.querySelector('[data-pausa]');
    const nome = mapa.querySelector('[data-legenda-nome]');
    const texto = mapa.querySelector('[data-legenda-texto]');
    const link = mapa.querySelector('[data-legenda-link]');
    let atual = 0;
    const cena = () => cenas[atual];
    const pausada = v => pausa.setAttribute('aria-pressed', String(v)) || pausa.setAttribute('aria-label', v ? 'Continuar a cena' : 'Pausar a cena');
    const carrega = v => v.querySelectorAll('source[data-src]').forEach(s => { s.src = s.dataset.src; s.removeAttribute('data-src'); }) || v.load();
    const toca = () => {
      const c = cena();
      pausada(false);
      if (c.tagName === 'VIDEO') {
        if (quieto) { pausa.hidden = true; return; }   // fica no pôster, que é o último quadro
        if (c.querySelector('source[data-src]')) carrega(c);
        pausa.hidden = false;
        c.currentTime = 0;
        c.play().catch(() => { pausa.hidden = true; });
      } else {
        pausa.hidden = quieto;
        c.classList.remove('toca', 'parada'); void c.offsetWidth; if (!quieto) c.classList.add('toca');
      }
    };
    const escolhe = k => {
      cenas.forEach(c => { if (c.tagName === 'VIDEO' && !c.paused) c.pause(); });
      atual = k;
      aperta(botoes, botoes[k]);
      cenas.forEach((c, i) => c.classList.toggle('ativa', i === k));
      const f = FRENTES[k];
      nome.textContent = f.nome; texto.textContent = f.texto; link.href = f.link; link.textContent = 'Ver ' + f.nome;
      toca();
    };
    cenas.forEach(c => {
      if (c.tagName === 'VIDEO') {
        c.addEventListener('ended', () => { pausa.hidden = true; });   // para no último quadro
      } else {
        c.addEventListener('animationend', () => { if (![...c.querySelectorAll('*')].some(e => e.getAnimations().some(a => a.playState === 'running'))) pausa.hidden = true; });
      }
    });
    pausa.addEventListener('click', () => {
      const c = cena();
      const parar = pausa.getAttribute('aria-pressed') !== 'true';
      if (c.tagName === 'VIDEO') { if (parar) c.pause(); else c.play().catch(() => {}); } else c.classList.toggle('parada', parar);
      pausada(parar);
    });
    botoes.forEach((b, k) => b.addEventListener('click', () => escolhe(k)));
    cenas[0].classList.add('ativa');
    pausa.hidden = true;
    aVista(mapa, () => escolhe(atual));
  });

  // ------------------------------------------------------------ 2. Sites que facilitam o contato
  // x e y: onde fica o caminho até o contato (o botão de WhatsApp de cada prévia), em fração da captura
  const CASOS = [
    { nome: 'Suud', tipo: 'Restaurante árabe · Icaraí, Niterói', vivo: 'https://suud.vercel.app/', img: 'suud',
      desk: [.893, .028], cel: [.9, .026], caminho: 'O caminho até o contato: o pedido pelo WhatsApp, no topo da página.' },
    { nome: 'Casa Viva Itacoá', tipo: 'Casa de encontro · Itacoatiara, Niterói', vivo: 'https://casa-viva1-anue.vercel.app/', img: 'casaviva',
      desk: [.966, .314], cel: [.889, .315], caminho: 'O caminho até o contato: o botão de WhatsApp, sempre à vista.' },
    { nome: 'Barbearia Carvalho', tipo: 'Barbearia · Santa Rosa, Niterói', vivo: 'https://cavalhobarbearia.vercel.app/', img: 'carvalho',
      desk: [.722, .213], cel: [.5, .412], caminho: 'O caminho até o contato: o horário marcado segue direto pelo WhatsApp.' },
    { nome: 'Cemevi', tipo: 'Clínica veterinária 24 horas · Icaraí, Niterói', vivo: 'https://cemevi-pi.vercel.app/', img: 'cemevi',
      desk: [.96, .313], cel: [.733, .317], caminho: 'O caminho até o contato: ligar ou chamar no WhatsApp, logo na abertura.' },
    { nome: 'Pitangui Fernandes', tipo: 'Governança residencial · Niterói', vivo: 'https://pitanguifernandes.vercel.app/', img: 'pitangui',
      desk: [.96, .311], cel: [.889, .316], caminho: 'O caminho até o contato: o botão de WhatsApp, em todas as telas.' },
  ];
  document.querySelectorAll('[data-sites]').forEach(palco => {
    const secao = palco.closest('section');
    const botoes = [...secao.querySelectorAll('[data-caso]')];
    const telas = [...secao.querySelectorAll('[data-tela]')];
    const disp = { desk: palco.querySelector('.sc-laptop'), cel: palco.querySelector('.sc-celular') };
    const campo = s => palco.querySelector(`[data-sc-${s}]`);
    let atual = 0;
    let relogios = [];
    const depois = (ms, fn) => relogios.push(setTimeout(fn, quieto ? 0 : ms));
    // rola a captura dentro da moldura até o botão de contato ficar no meio da tela
    const enquadra = () => {
      const c = CASOS[atual];
      ['desk', 'cel'].forEach(t => {
        const d = disp[t];
        const tela = d.querySelector('.sc-tela');
        const rolo = d.querySelector('.sc-rolo');
        const alvo = d.querySelector('.sc-alvo');
        const [x, y] = c[t];
        alvo.style.setProperty('--ax', `${x * 100}%`);
        alvo.style.setProperty('--ay', `${y * 100}%`);
        const alto = rolo.offsetHeight;
        const janela = tela.clientHeight;
        const desce = palco.classList.contains('contato') ? Math.max(0, Math.min(alto - janela, y * alto - janela * .5)) : 0;
        rolo.style.translate = `0 ${-desce}px`;
      });
    };
    const escolhe = k => {
      relogios.forEach(clearTimeout); relogios = [];
      atual = k;
      const c = CASOS[k];
      aperta(botoes, botoes[k]);
      palco.classList.remove('pronto', 'contato');
      enquadra();
      disp.desk.querySelector('.sc-captura').src = `/portfolio/img/${c.img}-inicio-desktop-960.webp${c.img === 'cemevi' ? '?v=1014' : ''}`;
      disp.cel.querySelector('.sc-captura').src = `/portfolio/img/${c.img}-inicio-celular-390.webp${c.img === 'cemevi' ? '?v=1014' : ''}`;
      campo('nome').textContent = c.nome; campo('tipo').textContent = c.tipo; campo('caminho').textContent = c.caminho;
      campo('vivo').href = c.vivo;
      // o rascunho vira o site e, depois, aparece o caminho até o contato
      depois(650, () => palco.classList.add('pronto'));
      depois(1500, () => { palco.classList.add('contato'); enquadra(); });
    };
    telas.forEach(b => b.addEventListener('click', () => { aperta(telas, b); palco.dataset.telaAtiva = b.dataset.tela; enquadra(); }));
    addEventListener('resize', enquadra, { passive: true });
    if (palco.dataset.sites !== 'rolagem') {
      botoes.forEach((b, k) => b.addEventListener('click', () => escolhe(k)));
      aVista(palco, () => escolhe(atual), .35);
      return;
    }
    // Página Sites: o rascunho vira o site CONFORME a pessoa rola até a tela (--q vai de 0 a 1);
    // com a tela inteira à vista, aparece o caminho até o contato. Trocar de caso mantém o ponto da rolagem.
    const progresso = () => {
      const r = secao.getBoundingClientRect();
      const q = quieto ? 1 : Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * .9) - .15) / .7);
      palco.style.setProperty('--q', q.toFixed(3));
      palco.classList.toggle('rolando', q > 0 && q < 1);
      const pronto = q >= 1;
      if (pronto !== palco.classList.contains('contato')) { palco.classList.toggle('pronto', pronto); palco.classList.toggle('contato', pronto); enquadra(); }
    };
    const troca = k => {
      atual = k;
      const c = CASOS[k];
      aperta(botoes, botoes[k]);
      disp.desk.querySelector('.sc-captura').src = `/portfolio/img/${c.img}-inicio-desktop-960.webp${c.img === 'cemevi' ? '?v=1014' : ''}`;
      disp.cel.querySelector('.sc-captura').src = `/portfolio/img/${c.img}-inicio-celular-390.webp${c.img === 'cemevi' ? '?v=1014' : ''}`;
      campo('nome').textContent = c.nome; campo('tipo').textContent = c.tipo; campo('caminho').textContent = c.caminho;
      campo('vivo').href = c.vivo;
      enquadra();
    };
    botoes.forEach((b, k) => b.addEventListener('click', () => troca(k)));
    let pedido = 0;
    addEventListener('scroll', () => { cancelAnimationFrame(pedido); pedido = requestAnimationFrame(progresso); }, { passive: true });
    troca(0);
    progresso();
  });

  // ------------------------------------------------------------ 3. Sistemas e agentes de IA
  const ROTEIROS = {
    restaurante: {
      msg: 'Oi! Vocês abrem no domingo? Queria reservar mesa para quatro.',
      agentes: [['Atendimento', 'Responde com o horário e o cardápio do domingo.'], ['Agenda', 'Separa a mesa para quatro às 13h.'], ['Relatórios', 'Soma a reserva no resumo da semana.']],
      pessoa: 'A gerente confere as reservas do dia e decide os encaixes.',
    },
    barbearia: {
      msg: 'Tem horário para corte e barba no sábado de manhã?',
      agentes: [['Atendimento', 'Pergunta o serviço e o melhor horário.'], ['Agenda', 'Encaixa às 10h e manda o lembrete na véspera.'], ['Relatórios', 'Conta os horários da semana por serviço.']],
      pessoa: 'O barbeiro confirma a agenda do dia antes de abrir.',
    },
    clinica: {
      msg: 'Queria marcar uma consulta para a próxima semana.',
      agentes: [['Atendimento', 'Entende o pedido e separa o que é urgente.'], ['Agenda', 'Sugere os horários livres da próxima semana.'], ['Relatórios', 'Registra o pedido no resumo da recepção.']],
      pessoa: 'A recepção confere e confirma com o paciente.',
    },
  };
  document.querySelectorAll('[data-fluxo]').forEach(cena => {
    const secao = cena.closest('section');
    const botoes = [...secao.querySelectorAll('[data-negocio]')];
    const ver = secao.querySelector('[data-ver]');
    const msg = cena.querySelector('[data-fluxo-msg]');
    const agentes = [...cena.querySelectorAll('.fluxo-agente')];
    const pessoa = cena.querySelector('.fluxo-pessoa');
    const linha = cena.querySelector('.fluxo-linha path');
    const bola = cena.querySelector('.fluxo-bola');
    let quadro = 0;
    let parado = false;
    let rodando = false;
    // os pontos da viagem: a mensagem, os três agentes e a pessoa responsável
    const centro = el => {
      const c = cena.getBoundingClientRect();
      const r = (el.querySelector('img, .fluxo-pessoa-icone') || el).getBoundingClientRect();
      return el === msg ? [r.left - c.left + 22, r.bottom - c.top] : [r.left - c.left + r.width / 2, r.top - c.top + r.height / 2];
    };
    const desenha = () => {
      const pts = [msg, ...agentes, pessoa].map(centro);
      // linha fina de ponta redonda, em degraus, como as do kit
      linha.setAttribute('d', pts.map(([x, y], i) => {
        if (!i) return `M${x} ${y}`;
        const [px, py] = pts[i - 1];
        const meio = (py + y) / 2;
        return `L${px} ${meio} L${x} ${meio} L${x} ${y}`;
      }).join(' '));
      return pts;
    };
    const limpa = () => { agentes.forEach(a => a.classList.remove('ativo', 'feito')); cena.classList.remove('fim', 'passando'); };
    const escreve = chave => {
      const r = ROTEIROS[chave];
      msg.textContent = `“${r.msg}”`;
      agentes.forEach((a, i) => { a.querySelector('[data-agente-nome]').textContent = r.agentes[i][0]; a.querySelector('[data-agente-faz]').textContent = r.agentes[i][1]; });
      cena.querySelector('[data-fluxo-pessoa]').textContent = r.pessoa;
    };
    const rotulo = t => { ver.textContent = t; };
    const termina = () => { rodando = false; cena.classList.remove('passando'); cena.classList.add('fim'); agentes.forEach(a => a.classList.add('feito')); agentes.forEach(a => a.classList.remove('ativo')); rotulo('Ver de novo'); };
    const passa = () => {
      cancelAnimationFrame(quadro);
      limpa();
      desenha();
      if (quieto) { termina(); return; }
      rodando = true; parado = false; rotulo('Pausar');
      cena.classList.add('passando');
      const total = linha.getTotalLength();
      const marcos = [msg, ...agentes, pessoa].map(centro);
      // a que distância da linha está cada parada (agente ou pessoa)
      const paradas = [];
      let acum = 0;
      for (let i = 1; i < marcos.length; i++) {
        const [px, py] = marcos[i - 1]; const [x, y] = marcos[i];
        acum += Math.abs((py + y) / 2 - py) + Math.abs(x - px) + Math.abs(y - (py + y) / 2);
        paradas.push(acum);
      }
      const dur = 4200;
      let gasto = 0;
      let antes = performance.now();
      const anda = agora => {
        if (!parado) gasto += agora - antes;
        antes = agora;
        const t = Math.min(1, gasto / dur);
        const s = t * total;
        const p = linha.getPointAtLength(s);
        bola.style.left = `${p.x}px`; bola.style.top = `${p.y}px`;
        agentes.forEach((a, i) => {
          const chegou = s >= paradas[i] - 2;
          a.classList.toggle('feito', chegou);
          a.classList.toggle('ativo', chegou && (i === agentes.length - 1 ? s < paradas[i] + 30 : s < paradas[i + 1] - 2));
        });
        if (t < 1) quadro = requestAnimationFrame(anda); else termina();
      };
      quadro = requestAnimationFrame(anda);
    };
    botoes.forEach(b => b.addEventListener('click', () => {
      cancelAnimationFrame(quadro); rodando = false;
      aperta(botoes, b); escreve(b.dataset.negocio); limpa(); desenha(); rotulo('Ver passar');
    }));
    ver.addEventListener('click', () => {
      if (rodando) { parado = !parado; rotulo(parado ? 'Continuar' : 'Pausar'); return; }
      passa();
    });
    addEventListener('resize', () => { if (!rodando) desenha(); }, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(desenha);
    desenha();
  });

  // ------------------------------------------------------------ 4. Como trabalhamos
  document.querySelectorAll('[data-passos]').forEach(lista => {
    const ponto = lista.parentElement.querySelector('.passos-ponto');
    const passos = [...lista.querySelectorAll('details')];
    const poe = () => {
      const aberto = passos.find(d => d.open);
      if (!aberto || !ponto) { if (ponto) ponto.style.setProperty('--px', '-999px'); return; }
      const alvo = aberto.querySelector('.passo-num i').getBoundingClientRect();
      const base = ponto.offsetParent.getBoundingClientRect();
      ponto.style.setProperty('--px', `${alvo.left - base.left + alvo.width / 2}px`);
      ponto.style.setProperty('--py', `${alvo.top - base.top + alvo.height / 2}px`);
    };
    // um passo aberto por vez (onde o navegador ainda não entende <details name>)
    passos.forEach(d => d.addEventListener('toggle', () => {
      if (d.open) passos.forEach(o => { if (o !== d && o.open) o.open = false; });
      poe();
    }));
    addEventListener('resize', poe, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(poe);
    poe();
    requestAnimationFrame(() => ponto?.classList.add('anda'));
  });

  // ------------------------------------------------------------ 6. Presença digital: o mês de exemplo
  // Avança semana a semana (perfil no Google, redes, conteúdo, relatório); o visitante marca o que a
  // Sett cuida e o "depois" do perfil se completa junto. O deslizador compara o antes e o depois.
  const SEMANAS = [
    ['Perfil no Google', ['Horários e serviços revisados', 'Fotos novas do lugar', 'Respostas às avaliações']],
    ['Redes sociais', ['Dois posts sobre o que o negócio faz', 'Stories com a novidade da semana', 'Respostas aos comentários']],
    ['Conteúdo', ['Uma publicação no perfil do Google', 'Fotos da equipe e do trabalho', 'Texto do próximo post aprovado']],
    ['Relatório', ['Resumo do que mudou no perfil', 'O que mais chamou atenção nas redes', 'Próximos passos combinados']],
  ];
  document.querySelectorAll('[data-mes]').forEach(caixa => {
    const secao = caixa.closest('section');
    const semanas = [...secao.querySelectorAll('[data-semana-n]')];
    const tema = caixa.querySelector('[data-mes-tema]');
    const itens = [...caixa.querySelectorAll('.mes-lista button')];
    const proxima = secao.querySelector('[data-mes-proxima]');
    const conta = secao.querySelector('[data-mes-conta]');
    const figura = secao.querySelector('[data-antes-depois]');
    const marcas = SEMANAS.map(() => [false, false, false]);
    let n = 0;
    const total = () => marcas.flat().filter(Boolean).length;
    const mostra = k => {
      n = k;
      aperta(semanas, semanas[k]);
      tema.textContent = SEMANAS[k][0];
      itens.forEach((b, i) => { b.textContent = SEMANAS[k][1][i]; b.setAttribute('aria-pressed', String(marcas[k][i])); });
      figura.dataset.semana = String(k + 1);
      proxima.textContent = k === SEMANAS.length - 1 ? 'Ver o mês de novo' : 'Próxima semana';
      const t = total();
      conta.textContent = t ? `A Sett cuida de ${t} de 12 tarefas do mês.` : 'Toque no que a Sett cuida.';
    };
    itens.forEach((b, i) => b.addEventListener('click', () => {
      marcas[n][i] = !marcas[n][i];
      semanas[n].classList.toggle('feita', marcas[n].some(Boolean));
      mostra(n);
    }));
    semanas.forEach((b, k) => b.addEventListener('click', () => mostra(k)));
    proxima.addEventListener('click', () => mostra((n + 1) % SEMANAS.length));
    mostra(0);
  });
  document.querySelectorAll('[data-antes-depois]').forEach(figura => {
    const faixa = figura.querySelector('.ad-faixa');
    const poe = () => figura.style.setProperty('--corte', `${faixa.value}%`);
    faixa.addEventListener('input', poe);
    poe();
  });

  // ------------------------------------------------------------ 7. clipes avulsos (o 70%, as cenas dos agentes)
  // Tocam uma vez quando aparecem (ou quando o visitante escolhe), param no último quadro e têm pausa.
  const preparaClipe = (figura, quando) => {
    const video = figura.querySelector('video');
    const pausa = figura.querySelector('[data-pausa]');
    if (!video) return null;
    const pausada = v => { pausa?.setAttribute('aria-pressed', String(v)); pausa?.setAttribute('aria-label', v ? 'Continuar a cena' : 'Pausar a cena'); };
    const toca = () => {
      if (quieto) return;
      video.querySelectorAll('source[data-src]').forEach(s => { s.src = s.dataset.src; s.removeAttribute('data-src'); });
      if (video.networkState === 0 || !video.currentSrc) video.load();
      video.currentTime = 0;
      video.play().then(() => { if (pausa) pausa.hidden = false; pausada(false); }).catch(() => {});
    };
    video.addEventListener('ended', () => { if (pausa) pausa.hidden = true; });
    pausa?.addEventListener('click', e => {
      e.stopPropagation();
      const parar = !video.paused;
      if (parar) video.pause(); else video.play().catch(() => {});
      pausada(parar);
    });
    if (quando === 'vista') aVista(figura, toca, .6);
    return toca;
  };
  document.querySelectorAll('[data-clipe]').forEach(f => preparaClipe(f, 'vista'));
  document.querySelectorAll('[data-agentes-cenas]').forEach(lista => {
    const cartoes = [...lista.querySelectorAll('.agente-cena')];
    const tocas = cartoes.map(c => preparaClipe(c, 'escolha'));
    cartoes.forEach((c, k) => c.querySelector('[data-toca]')?.addEventListener('click', () => {
      cartoes.forEach((o, i) => { if (i !== k) { const v = o.querySelector('video'); if (v && !v.paused) v.pause(); o.querySelector('[data-pausa]')?.setAttribute('hidden', ''); } });
      tocas[k]?.();
    }));
  });

  // ------------------------------------------------------------ 8. o calendário arrastável (Sistemas e agentes de IA)
  // O visitante arrasta uma tarefa da raia da equipe para a do agente (ou toca nela / Enter).
  // As que se repetem passam; reunião, visita e decidir ficam com a equipe.
  document.querySelectorAll('[data-semana][data-arrastavel]').forEach(semana => {
    const blocos = [...semana.querySelectorAll('.blocos li')];
    const vais = blocos.filter(b => b.classList.contains('vai'));
    const conta = semana.querySelector('[data-semana-conta]');
    const rever = semana.querySelector('.semana-rever');
    const raia = () => semana.querySelector('.raia-eq').offsetHeight;
    const nome = b => b.textContent.trim();
    const atualiza = () => {
      const n = vais.filter(b => b.classList.contains('no-agente')).length;
      conta.textContent = n === vais.length ? 'Pronto: o que se repete passou para o agente. O resto continua com você.'
        : n ? `${n} de ${vais.length} tarefas com o agente. Arraste mais uma.` : 'Exemplo ilustrativo. Arraste uma tarefa da equipe para o agente.';
      if (rever) rever.hidden = n === 0;
    };
    const move = (b, paraAgente) => {
      if (paraAgente && !b.classList.contains('vai')) {
        b.classList.remove('recusa'); void b.offsetWidth; b.classList.add('recusa');
        conta.textContent = `${nome(b)} fica com a equipe: é trabalho de pessoas.`;
        return;
      }
      b.classList.toggle('no-agente', paraAgente);
      b.setAttribute('aria-pressed', String(paraAgente));
      b.setAttribute('aria-label', `${nome(b)}: ${paraAgente ? 'com o agente' : 'com a equipe'}`);
      atualiza();
    };
    blocos.forEach(b => {
      b.tabIndex = 0;
      b.setAttribute('role', 'button');
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', `${nome(b)}: com a equipe`);
      let y0 = null; let dy = 0; let arrastou = false;
      b.addEventListener('pointerdown', e => {
        if (e.button) return;
        y0 = e.clientY; dy = 0; arrastou = false;
        b.setPointerCapture(e.pointerId);
        b.classList.add('pegando'); b.classList.remove('dica');
      });
      b.addEventListener('pointermove', e => {
        if (y0 === null) return;
        dy = e.clientY - y0;
        if (Math.abs(dy) > 4) arrastou = true;
        const base = b.classList.contains('no-agente') ? raia() : 0;
        b.style.translate = `0 ${Math.max(0, Math.min(raia(), base + dy))}px`;
      });
      const solta = () => {
        if (y0 === null) return;
        const estava = b.classList.contains('no-agente');
        const fim = (estava ? raia() : 0) + dy;
        y0 = null;
        b.classList.remove('pegando'); b.style.translate = '';
        move(b, arrastou ? fim > raia() / 2 : !estava);
      };
      b.addEventListener('pointerup', solta);
      b.addEventListener('pointercancel', () => { y0 = null; b.classList.remove('pegando'); b.style.translate = ''; });
      b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); move(b, !b.classList.contains('no-agente')); } });
    });
    rever?.addEventListener('click', () => { blocos.forEach(b => { b.classList.remove('no-agente'); b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', `${nome(b)}: com a equipe`); }); atualiza(); vais[0]?.focus(); });
    // a dica: a primeira tarefa ensaia um pulo até o agente, uma vez
    aVista(semana, () => { if (!quieto) vais[0]?.classList.add('dica'); }, .6);
    atualiza();
  });

  // ------------------------------------------------------------ 9. Marca e conteúdo: virar os posts
  document.querySelectorAll('[data-posts]').forEach(pilha => {
    const secao = pilha.closest('section');
    const posts = [...pilha.querySelectorAll('.post-real')];
    const vira = secao.querySelector('[data-posts-vira]');
    const volta = secao.querySelector('[data-posts-volta]');
    const legenda = secao.querySelector('[data-posts-legenda]');
    let atual = 0;
    const arruma = () => {
      posts.forEach((p, i) => { p.classList.toggle('virado', i < atual); p.style.setProperty('--pos', String(Math.max(0, i - atual))); p.classList.toggle('fundo', i - atual > 2); p.setAttribute('aria-hidden', String(i !== atual)); });
      const [titulo, texto] = (posts[atual].dataset.legenda || '|').split('|');
      legenda.innerHTML = '';
      const b = document.createElement('b'); b.textContent = `${atual + 1} de ${posts.length} · ${titulo}`;
      legenda.append(b, ' ' + texto);
      vira.disabled = atual === posts.length - 1;
      vira.textContent = atual === posts.length - 1 ? 'Último post' : 'Virar o post';
      volta.hidden = atual === 0;
    };
    const proximo = () => { if (atual < posts.length - 1) { atual += 1; arruma(); } };
    vira.addEventListener('click', proximo);
    posts.forEach(p => p.addEventListener('click', proximo));
    volta.addEventListener('click', () => { atual = 0; arruma(); vira.focus(); });
    arruma();
  });

  // ------------------------------------------------------------ 10. o celular que toca uma sequência de motions
  // (Presença digital: "O alfinete" e depois o 70%). Toca quando aparece, uma vez, e para no último quadro.
  document.querySelectorAll('[data-celular-cena]').forEach(fig => {
    const moldura = fig.querySelector('.celular-moldura');
    const quadro = moldura.querySelector('.celular-quadro');
    const pausa = fig.querySelector('[data-pausa]');
    const clipes = fig.dataset.clipes.split(' ');
    let n = 0;
    let v = null;
    const rotulo = parado => { pausa.setAttribute('aria-pressed', String(parado)); pausa.setAttribute('aria-label', parado ? 'Continuar a cena' : 'Pausar a cena'); };
    const carrega = k => {
      v.innerHTML = `<source src="/video/cenas/${clipes[k]}.av1.mp4" type='video/mp4; codecs="av01.0.05M.08"'><source src="/video/cenas/${clipes[k]}.mp4" type="video/mp4">`;
      v.load();
      v.play().then(() => { pausa.hidden = false; rotulo(false); }).catch(() => {});
    };
    const toca = () => {
      if (quieto || v) return;
      v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
      v.addEventListener('playing', () => { v.classList.add('pronto'); const n = cartoes[cartoes.indexOf(c) + 1]; if (n) video(n); });
      v.addEventListener('ended', () => {
        if (n < clipes.length - 1) { n += 1; carrega(n); return; }
        pausa.hidden = true;   // para no último quadro
      });
      quadro.after(v);
      carrega(0);
    };
    pausa.addEventListener('click', () => {
      if (!v) return;
      const parar = !v.paused;
      if (parar) v.pause(); else v.play().catch(() => {});
      rotulo(parar);
    });
    aVista(fig, toca, .5);
  });

  // ------------------------------------------------------------ 5. o montador de mensagem
  document.querySelectorAll('[data-montador]').forEach(montador => {
    const tem = [...montador.querySelectorAll('[data-tem]')];
    const tipo = [...montador.querySelectorAll('[data-tipo]')];
    const envia = montador.querySelector('[data-wa]');
    const previa = montador.querySelector('[data-previa]');
    const FRASE = {
      'ainda vou ter o primeiro site': 'Quero o primeiro site do negócio.',
      'tenho um site antigo': 'Tenho um site antigo e quero renovar.',
      'quero automatizar parte da rotina': 'Quero automatizar parte da rotina.',
    };
    const monta = () => {
      const t = tem.find(b => b.getAttribute('aria-pressed') === 'true');
      const n = tipo.find(b => b.getAttribute('aria-pressed') === 'true');
      const partes = ['Olá, Sett!'];
      if (n) partes.push(`Tenho ${n.dataset.tipo}.`);
      partes.push(t ? FRASE[t.dataset.tem] : 'Quero conversar sobre o meu negócio.');
      if (t || n) partes.push('Podemos conversar?');
      const texto = partes.join(' ');
      previa.textContent = `“${texto}”`;
      envia.href = `https://wa.me/5521936181695?text=${encodeURIComponent(texto)}`;
    };
    [tem, tipo].forEach(grupo => grupo.forEach(b => b.addEventListener('click', () => { aperta(grupo, b); monta(); })));
    monta();
  });
})();
