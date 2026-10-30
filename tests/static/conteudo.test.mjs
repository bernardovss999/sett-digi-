// Regras de texto do site: linguagem positiva, sem porte de negócio, números do Google com fonte
// e nenhum número do levantamento interno. Vale para o texto visível e para o JSON-LD.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, listPublishedPages, readSite, stripComments } from '../support/site.mjs';

// sett-agenda.html é a política de dados exigida pelo Google (Uso Limitado): o texto legal
// precisa das negativas ("não vendemos", "não compartilhamos"), então fica fora desta regra.
const EXCECOES = new Set(['sett-agenda.html']);
const paginas = listPublishedPages().filter((rel) => !EXCECOES.has(rel));

const NEGATIVAS = /(?<![\p{L}\d])(não|nunca|jamais|sem|nada|nenhum|nenhuma|nem|ninguém|perdi|perdeu|perde|problema|problemas|falta|ruim|desconfie)(?![\p{L}\d])/giu;

function textoPublico(html) {
  return stripComments(html)
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

function trechos(texto, regex) {
  return [...texto.matchAll(regex)].map((m) => texto.slice(Math.max(0, m.index - 40), m.index + m[0].length + 20).trim());
}

describe('linguagem do site', () => {
  for (const rel of paginas) {
    test(`${rel}: sem palavras negativas no texto e no JSON-LD`, () => {
      assert.deepEqual(trechos(textoPublico(readSite(rel)), NEGATIVAS), []);
    });

    test(`${rel}: fala "negócio", sem porte (pequena/grande empresa)`, () => {
      const porte = /(?<![\p{L}])(pequen[oa]s?|grandes?)\s+(empresas?|negócios?)|(empresas?|negócios?)\s+(pequen[oa]s?|grandes?)(?![\p{L}])/giu;
      assert.deepEqual(trechos(textoPublico(readSite(rel)), porte), []);
    });
  }

  test('llms.txt: sem palavras negativas', () => {
    const txt = readFileSync(join(ROOT, 'llms.txt'), 'utf8');
    assert.deepEqual(trechos(txt, NEGATIVAS), []);
  });
});

describe('números citados', () => {
  for (const rel of listPublishedPages()) {
    test(`${rel}: nenhum número do levantamento interno dos 551 comércios`, () => {
      const texto = textoPublico(readSite(rel));
      assert.deepEqual(trechos(texto, /551\s+comércios|nota média[^.]{0,40}4,8|54\s?%/giu), []);
    });
  }

  // Mudança de regra (prompt de redação de 27/10/2026): o 7× sai até existir fonte primária
  // pública; o 70% fica, sempre com link visível para a ajuda do Google.
  for (const rel of paginas) {
    test(`${rel}: o número 7× fica fora enquanto a fonte primária está pendente`, () => {
      assert.deepEqual(trechos(textoPublico(readSite(rel)), /7\s?[×x]\s|data-conta="7"/giu), []);
    });
  }

  test('gestão no Google: o 70% aparece com link visível para a ajuda do Google', () => {
    const html = readSite('gestao-google-meu-negocio/index.html');
    assert.match(textoPublico(html), /70% mais probabilidade de visitar/);
    assert.match(html, /<a [^>]*href="https:\/\/support\.google\.com\/business\/answer\/10515606[^"]*"[^>]*>Consultar a fonte do Google<\/a>/);
  });
});

describe('identidade', () => {
  // "empresa" sai do texto ao público; ficam a URL histórica e o nome oficial do produto do Google.
  // Mudou de propósito em 30/10/2026 (roteiro de 29/10/2026, decisão do dono): "marca" passa a valer, porque o media
  // kit chama uma das quatro frentes de "Marca e conteúdo" e diz "Criamos marcas". A exceção é só para "marca".
  const VOCAB = /(?<![\p{L}\d/-])(empresas?)(?![\p{L}\d-])/giu;
  for (const rel of paginas) {
    test(`${rel}: assina como Sett Company`, () => {
      const html = readSite(rel);
      assert.match(html.match(/<title>([\s\S]*?)<\/title>/)[1], /\| Sett Company$/);
      assert.deepEqual(trechos(textoPublico(html), /Sett Digital/g), []);
    });

    test(`${rel}: fala "negócio" em vez de "empresa"`, () => {
      // exceção: o nome oficial do produto do Google
      const texto = textoPublico(readSite(rel)).replace(/Perfil da Empresa no Google/g, '');
      assert.deepEqual(trechos(texto, VOCAB), []);
    });
  }

  test('portfólio: toda prévia é identificada como independente', () => {
    const html = readSite('portfolio/index.html');
    // cada caso começa no elemento com id="caso-…" e vai até o próximo caso (ou o fim da galeria)
    const ids = [...html.matchAll(/id="(caso-[a-z]+)"/g)];
    assert.equal(ids.length, 5);
    ids.forEach((m, k) => {
      const fim = k + 1 < ids.length ? ids[k + 1].index : html.indexOf('</section>', m.index);
      assert.match(html.slice(m.index, fim), /Prévia independente/, `${m[1]} sem identificação`);
    });
  });
});

describe('páginas de serviço', () => {
  const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  for (const caminho of ['/o-que-fazemos/', '/marca-e-conteudo/', '/gestao-google-meu-negocio/', '/criacao-de-sites/', '/agentes-de-ia-para-empresas/', '/portfolio/']) {
    test(`${caminho}: está no sitemap e recebe link da home`, () => {
      assert.ok(sitemap.includes(`<loc>https://www.sett.company${caminho}</loc>`), 'ausente do sitemap');
      assert.ok(readSite('index.html').includes(`href="${caminho}"`), 'home sem link para a página');
    });
  }
});

describe('pedidos de 28/10/2026', () => {
  for (const rel of listPublishedPages()) {
    test(`${rel}: botão de WhatsApp fixo, com rótulo e link real`, () => {
      assert.match(readSite(rel), /<a class="wa-flutuante" href="https:\/\/wa\.me\/5521936181695"[^>]*aria-label="Falar com a Sett no WhatsApp"/);
    });
  }
  for (const rel of paginas) {
    test(`${rel}: sem numeração de seção ("02 / …") nem "01" no rodapé da abertura`, () => {
      const html = readSite(rel);
      assert.deepEqual(html.match(/<div class="section-index">\d+ \//g) ?? [], []);
      assert.doesNotMatch(html, /class="(hero-foot|ab-pe)[^"]*"[^>]*><span>01<\/span>/);
    });
    // Mudou de propósito em 30/10/2026 (roteiro de 29/10/2026): o menu segue as frentes do media kit. Entra Marca e
    // conteúdo, Google vira Presença digital e Automatização vira Sistemas e agentes de IA; as URLs antigas ficam.
    test(`${rel}: o menu segue a ordem do kit: Início, Marca e conteúdo, Sites, Presença digital, Sistemas e agentes de IA, Portfólio, O que fazemos`, () => {
      for (const nav of [/<nav class="desktop-nav"[^>]*>(.*?)<\/nav>/, /<nav id="mobile-nav"[^>]*>(.*?)<\/nav>/]) {
        const itens = [...readSite(rel).match(nav)[1].matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => `${m[1]} ${m[2]}`);
        assert.deepEqual(itens.slice(0, 7), [
          '/ Início', '/marca-e-conteudo/ Marca e conteúdo', '/criacao-de-sites/ Sites', '/gestao-google-meu-negocio/ Presença digital',
          '/agentes-de-ia-para-empresas/ Sistemas e agentes de IA', '/portfolio/ Portfólio', '/o-que-fazemos/ O que fazemos',
        ]);
      }
    });
    test(`${rel}: sem rótulos de contexto nas seções e sem rodapé de abertura`, () => {
      const html = readSite(rel);
      assert.deepEqual(html.match(/<div class="section-index"[^>]*>[^<]+<\/div>/g) ?? [], []);
      assert.doesNotMatch(html, /class="(hero-foot|ab-pe|port-foot)[ "]/);
    });
  }
  // Mudou de propósito em 30/10/2026 (roteiro de 29/10/2026, tela 3): o leque e a vitrine viraram a cena do kit, com o
  // laptop e o celular mostrando as prévias em uso. As cinco prévias continuam, na mesma ordem, e identificadas.
  test('home: "Sites que facilitam o contato" mostra as cinco prévias independentes em uso, com laptop, celular e alternador', () => {
    const html = readSite('index.html');
    const secao = html.match(/<section id="portfolio"[\s\S]*?\n {4}<\/section>/)[0];
    const casos = [...secao.matchAll(/<button type="button" aria-pressed="(?:true|false)" data-caso="\d">([^<]+)<\/button>/g)].map((m) => m[1]);
    assert.deepEqual(casos, ['Suud', 'Casa Viva Itacoá', 'Barbearia Carvalho', 'Cemevi', 'Pitangui Fernandes']);
    assert.match(secao, /<h2 id="portfolio-title" class="section-title reveal">Sites que facilitam<br>o <span>contato\.<\/span><\/h2>/);
    assert.match(secao, /<p class="section-text[^"]*">Prévias independentes para negócios reais, criadas com informações públicas/);
    assert.match(secao, /<span class="sc-selo">Prévia independente<\/span>/);
    assert.match(secao, /class="sc-laptop"[\s\S]*class="sc-celular"/);
    assert.match(secao, /data-tela="desk">Computador<\/button><button [^>]*data-tela="cel">Celular<\/button>/);
    assert.match(secao, /<a class="button button-ink" href="\/portfolio\/">Explorar portfólio<\/a>/);
    // clipes e capturas do próprio domínio: a CSP bloqueia iframe, então nenhuma prévia entra ao vivo
    assert.doesNotMatch(html, /<iframe|<dialog class="vitrine"|galeria\.(css|js)/);
  });
  // Mudou de propósito em 30/10/2026 (roteiro de 29/10/2026): as listas de cartões de texto dessas páginas viraram cenas
  // (o mapa das frentes em O que fazemos, o rascunho que vira site em Sites e uma cena por agente em Sistemas e
  // agentes de IA). Continua valendo: nada de botão em pílula dentro de lista.
  test('listas de escolha: sem botão em pílula; as listas de texto viraram as cenas do roteiro', () => {
    for (const rel of paginas) assert.doesNotMatch(readSite(rel), /class="ex-quero"/, rel);
    assert.match(readSite('o-que-fazemos/index.html'), /<figure class="mapa-cena" data-mapa>/);
    assert.match(readSite('criacao-de-sites/index.html'), /data-sites="rolagem"/);
    assert.equal([...readSite('agentes-de-ia-para-empresas/index.html').matchAll(/<li class="agente-cena reveal">/g)].length, 6);
  });
  test('rodapé: sem o "S" redondo ao lado da marca', () => {
    for (const rel of listPublishedPages()) assert.doesNotMatch(readSite(rel), /class="brand-mark"/, rel);
  });
  // Mudou de propósito em 30/10/2026 (roteiro de 29/10/2026, tela 2): os quatro cartões de texto viraram o mapa das
  // quatro frentes do kit; cada frente toca a sua cena e leva à sua página.
  test('home: o mapa tem as quatro frentes do kit, na ordem, e cada uma leva à sua página', () => {
    const secao = readSite('index.html').match(/<section id="servicos"[\s\S]*?\n {4}<\/section>/)[0];
    const frentes = [...secao.matchAll(/data-frente="\d"><i class="frente-no" aria-hidden="true"><\/i><b>([^<]+)<\/b><\/button>/g)].map((m) => m[1]);
    assert.deepEqual(frentes, ['Marca e conteúdo', 'Sites', 'Presença digital', 'Sistemas e agentes de IA']);
    assert.match(secao, /Criamos marcas, sites, conteúdo e soluções digitais para negócios\. Sistemas e agentes de IA sob medida\./);
    const js = readFileSync(join(ROOT, 'cenas.js'), 'utf8');
    const links = [...js.matchAll(/nome: '([^']+)', texto: '[^']+', link: '([^']+)'/g)].map((m) => `${m[1]} ${m[2]}`);
    assert.deepEqual(links, ['Marca e conteúdo /marca-e-conteudo/', 'Sites /criacao-de-sites/', 'Presença digital /gestao-google-meu-negocio/', 'Sistemas e agentes de IA /agentes-de-ia-para-empresas/']);
  });
  // mudou de propósito em 28/10/2026: primeiro saiu a pílula, depois o traço; só a cor marca a página atual
  test('menu: sem pílula, contorno, traço ou sublinhado no item atual', () => {
    for (const rel of paginas) assert.doesNotMatch(readSite(rel), /nav-luz/, rel);
    const css = readFileSync(join(ROOT, 'styles.css'), 'utf8');
    assert.doesNotMatch(css, /nav-luz/);
    const atual = [...css.matchAll(/[^{}]*\.desktop-nav a\[aria-current="page"\][^{}]*\{([^}]*)\}/g)].map((m) => m[1]).join(' ');
    assert.doesNotMatch(atual, /text-decoration|box-shadow: inset|background: rgba/);
  });
  test('aberturas sem microtítulo acima do título; a home diz que o site é da Sett Company', () => {
    for (const rel of paginas) assert.doesNotMatch(readSite(rel), /<p class="eyebrow/, rel);
    // 30/10/2026 (decisão do dono): a abertura usa o posicionamento do criativo novo, "estúdio independente"
    assert.match(readSite('index.html'), /<p class="hero-lead[^>]*><strong>A Sett Company<\/strong> é um estúdio independente/);
  });
  test('botões da abertura sem seta', () => {
    const css = readFileSync(join(ROOT, 'styles.css'), 'utf8');
    assert.match(css, /\.hero-actions \.button::after, \.hero-actions \.text-link::after \{ content: none; \}/);
  });
  test('home: sem o selo "novo" na abertura', () => {
    assert.doesNotMatch(readSite('index.html'), /class="hero-novo|class="nav-novo/);
  });
  // Mudou de propósito em 30/10/2026 (roteiro de 29/10/2026): a home segue a ordem do media kit, com seis telas.
  // No mesmo dia, pedido do dono: nenhuma seção em verde nem no menta "estourado"; as telas alternam azul profundo e claro.
  test('home: as seis telas na ordem do kit, alternando azul profundo e claro, sem o trilho lateral', () => {
    const html = readSite('index.html');
    const secoes = [...html.matchAll(/<section(?: id="([^"]+)")? class="([^"]+)" data-campo="([^"]+)"/g)].map((m) => `${m[1] || m[2].split(' ')[0]} ${m[3]}`);
    assert.deepEqual(secoes, ['hero ink', 'servicos paper', 'portfolio ink', 'automacao paper', 'como-trabalhamos ink', 'contato paper']);
    assert.doesNotMatch(html, /class="proof-trilho"|class="proof section-grid"/);
  });
});

// Roteiro de mudanças do site (29/10/2026), aprovado pelo dono em 30/10/2026: identidade do media kit de novembro,
// cenas que mostram em vez de descrever e as regras que valem para todas elas.
describe('roteiro de 29/10/2026', () => {
  const todas = listPublishedPages();
  test('cores do kit nos tokens e nenhuma cor antiga nas folhas publicadas', () => {
    const css = readFileSync(join(ROOT, 'styles.css'), 'utf8');
    for (const [nome, cor] of [['ink', '#1a2c35'], ['paper', '#fbfaf7'], ['cyan', '#72f5eb'], ['deep', '#219880']]) assert.match(css, new RegExp(`--${nome}: ${cor};`), nome);
    // 30/10/2026: o esboco.css saiu do site (nenhuma página o carregava); a lista segue com todas as folhas publicadas
    for (const f of ['styles.css', 'kit.css', 'telas.css', 'servicos.css', 'portfolio/portfolio.css', 'agentes-de-ia-para-empresas/agentes.css']) {
      assert.doesNotMatch(readFileSync(join(ROOT, f), 'utf8'), /#0b0d0e|#f0f2ed|#6ef4e7|#162d38|rgba\(11, ?13, ?14|rgba\(240, ?242, ?237|rgba\(110, ?244, ?231/i, f);
    }
  });
  for (const rel of todas) {
    test(`${rel}: o logo tem o Ponto como ponto final, no topo e no rodapé, e a folha do kit vem antes de telas.css`, () => {
      const html = readSite(rel);
      assert.equal([...html.matchAll(/<a class="brand" href="\/" aria-label="Sett Company, início"><span class="brand-nome">Sett<\/span><img class="brand-ponto" src="\/img\/ponto\.svg"[^>]*alt=""><\/a>/g)].length, 2);
      assert.ok(html.indexOf('/kit.css') > 0 && html.indexOf('/kit.css') < html.indexOf('/telas.css'), 'kit.css fora do lugar');
      assert.match(html, /<div class="trilha-transicao" aria-hidden="true">/, 'falta a linha que liga as páginas');
    });
    test(`${rel}: toda cena gravada é do próprio domínio, muda e sem laço (toca uma vez e para no último quadro)`, () => {
      for (const [video] of readSite(rel).matchAll(/<video[\s\S]*?<\/video>/g)) {
        assert.match(video, /\smuted\s/);
        assert.match(video, /\splaysinline\s/);
        assert.doesNotMatch(video, /\s(loop|autoplay)[\s>]/, 'cena em laço ou tocando sozinha');
        assert.match(video, /poster="\/video\/cenas\/[a-z0-9-]+-fim\.webp"/, 'sem o último quadro como pôster');
        for (const [, src] of video.matchAll(/data-src="([^"]+)"/g)) assert.match(src, /^\/video\/cenas\//, src);
      }
    });
  }
  test('nenhuma seção tem fundo verde ou menta (pedido do dono, 30/10/2026)', () => {
    for (const rel of todas) assert.doesNotMatch(readSite(rel), /<section [^>]*data-campo="(deep|cyan)"/, rel);
  });
  test('tudo que simula um agente leva "Exemplo ilustrativo."', () => {
    const home = readSite('index.html').match(/<section id="automacao"[\s\S]*?\n {4}<\/section>/)[0];
    assert.match(home, /<p class="fluxo-selo">Exemplo ilustrativo\.<\/p>/);
    assert.match(readSite('agentes-de-ia-para-empresas/index.html'), /Exemplo ilustrativo\. Arraste uma tarefa/);
    assert.match(readSite('agentes-de-ia-para-empresas/index.html'), /<p class="nota-servico reveal">Exemplo ilustrativo\./);
    assert.match(readSite('gestao-google-meu-negocio/index.html'), /<p class="mes-selo">Exemplo ilustrativo\.<\/p>/);
  });
  test('Como trabalhamos: os três passos do kit, com o que a Sett faz, o que você envia e as garantias', () => {
    const secao = readSite('index.html').match(/<section id="como-trabalhamos"[\s\S]*?\n {4}<\/section>/)[0];
    assert.deepEqual([...secao.matchAll(/<span class="passo-nome">([^<]+)<\/span>/g)].map((m) => m[1]), ['Observar', 'Arrumar', 'Manter']);
    assert.equal([...secao.matchAll(/<h3>A Sett faz<\/h3>/g)].length, 3);
    assert.equal([...secao.matchAll(/<h3>Você envia<\/h3>/g)].length, 3);
    assert.match(secao, /Registra o domínio do site no seu nome\./);
    assert.match(secao, /O perfil no Google continua com você, como dono\./);
    assert.match(secao, /Atende negócios do Rio de Janeiro e de Niterói\./);
  });
  test('contato: a frase do kit, o montador em 3 toques que abre o WhatsApp e os contatos do slide 11', () => {
    const secao = readSite('index.html').match(/<section id="contato"[\s\S]*?\n {4}<\/section>/)[0];
    assert.match(secao, /Vamos conversar<br><em>sobre o seu negócio\.<\/em>/);
    assert.equal([...secao.matchAll(/data-tem="/g)].length, 3);
    assert.ok([...secao.matchAll(/data-tipo="/g)].length >= 3);
    assert.match(secao, /<a class="button button-light" href="https:\/\/wa\.me\/5521936181695"[^>]*data-wa>/);
    for (const c of ['sett.company', '@settcpny', '(21) 93618-1695', 'Rio de Janeiro e Niterói']) assert.ok(secao.includes(c), c);
    assert.doesNotMatch(secao, /<form/, 'o contato é só o link wa.me, sem formulário');
  });
  test('nomes novos nos títulos e nos dados estruturados; as URLs antigas continuam', () => {
    const agentes = readSite('agentes-de-ia-para-empresas/index.html');
    assert.match(agentes.match(/<title>([^<]+)<\/title>/)[1], /^Sistemas e agentes de IA/);
    assert.match(agentes, /"name": "Sistemas e agentes de IA"/);
    assert.doesNotMatch(textoPublico(agentes), /Automação com IA/);
    const presenca = readSite('gestao-google-meu-negocio/index.html');
    assert.match(presenca.match(/<title>([^<]+)<\/title>/)[1], /^Presença digital/);
    assert.match(presenca, /"name": "Presença digital"/);
    assert.match(readSite('marca-e-conteudo/index.html'), /"name": "Marca e conteúdo"/);
  });
});
