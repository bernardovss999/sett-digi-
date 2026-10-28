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
  // "empresa" e "marca" saem do texto ao público; ficam a URL histórica e o nome oficial do produto do Google
  const VOCAB = /(?<![\p{L}\d/-])(empresas?|marcas?)(?![\p{L}\d-])/giu;
  for (const rel of paginas) {
    test(`${rel}: assina como Sett Company`, () => {
      const html = readSite(rel);
      assert.match(html.match(/<title>([\s\S]*?)<\/title>/)[1], /\| Sett Company$/);
      assert.deepEqual(trechos(textoPublico(html), /Sett Digital/g), []);
    });

    test(`${rel}: fala "negócio" em vez de "empresa" ou "marca"`, () => {
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
  for (const caminho of ['/o-que-fazemos/', '/gestao-google-meu-negocio/', '/criacao-de-sites/', '/agentes-de-ia-para-empresas/', '/portfolio/']) {
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
    test(`${rel}: o menu segue a ordem Início, Automatização, Google, Sites, Portfólio, O que fazemos`, () => {
      for (const nav of [/<nav class="desktop-nav"[^>]*>(.*?)<\/nav>/, /<nav id="mobile-nav"[^>]*>(.*?)<\/nav>/]) {
        const itens = [...readSite(rel).match(nav)[1].matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => `${m[1]} ${m[2]}`);
        assert.deepEqual(itens.slice(0, 6), [
          '/ Início', '/agentes-de-ia-para-empresas/ Automatização', '/gestao-google-meu-negocio/ Google',
          '/criacao-de-sites/ Sites', '/portfolio/ Portfólio', '/o-que-fazemos/ O que fazemos',
        ]);
      }
    });
    test(`${rel}: sem rótulos de contexto nas seções e sem rodapé de abertura`, () => {
      const html = readSite(rel);
      assert.deepEqual(html.match(/<div class="section-index"[^>]*>[^<]+<\/div>/g) ?? [], []);
      assert.doesNotMatch(html, /class="(hero-foot|ab-pe|port-foot)[ "]/);
    });
  }
  test('home: o portfólio é o leque de prévias, cada uma abre a vitrine; a vitrine identifica a prévia e fecha', () => {
    const html = readSite('index.html');
    const secao = html.match(/<section id="portfolio"[\s\S]*?\n {4}<\/section>/)[0];
    const cartas = [...secao.matchAll(/<button class="leque-carta" type="button" aria-haspopup="dialog" aria-label="Ver a prévia independente de ([^"]+) em tamanho maior"/g)].map((m) => m[1]);
    assert.deepEqual(cartas, ['Suud', 'Casa Viva Itacoá', 'Barbearia Carvalho', 'Cemevi', 'Pitangui Fernandes']);
    // pedido de 28/10/2026: sem selo na vitrine e na legenda; a seção diz que são prévias independentes
    assert.match(secao, /<p class="section-text[^"]*">Prévias independentes para negócios reais, criadas com informações públicas/);
    assert.doesNotMatch(html, /class="vitrine-selo"|class="leque-tipo"/);
    assert.match(html, /<dialog class="vitrine"[^>]*>[\s\S]*aria-label="Fechar a prévia"/);
    assert.match(html, /href="\/galeria\.css/);
    assert.match(html, /src="\/galeria\.js/);
  });
  test('listas de escolha: a linha inteira é o link, sem botão em pílula', () => {
    for (const rel of paginas) assert.doesNotMatch(readSite(rel), /class="ex-quero"/, rel);
    for (const rel of ['o-que-fazemos/index.html', 'criacao-de-sites/index.html', 'agentes-de-ia-para-empresas/index.html']) {
      assert.match(readSite(rel), /<li[^>]*class="ex ex-link[^"]*"><a class="ex-alvo" href="[^"]+"><div class="ex-nome">/, rel);
    }
  });
  test('rodapé: sem o "S" redondo ao lado da marca', () => {
    for (const rel of listPublishedPages()) assert.doesNotMatch(readSite(rel), /class="brand-mark"/, rel);
  });
  test('home: cada serviço é um link inteiro, só com nome e subtítulo (sem link sublinhado com seta)', () => {
    const lista = readSite('index.html').match(/<div class="service-list">([\s\S]*?)<p class="servicos-pe/)[1];
    const cartoes = [...lista.matchAll(/<a(?: id="[^"]+")? class="service service-card reveal" href="([^"]+)">(.*?)<\/a>/g)];
    assert.deepEqual(cartoes.map((m) => m[1]), ['/criacao-de-sites/', '/gestao-google-meu-negocio/', 'https://wa.me/5521936181695', '/agentes-de-ia-para-empresas/']);
    for (const [, , dentro] of cartoes) assert.match(dentro, /^<h3>[^<]+<\/h3><p>[^<]+<\/p>$/);
    assert.doesNotMatch(lista, /service-link/);
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
    assert.match(readSite('index.html'), /<p class="hero-lead[^>]*><strong>A Sett Company<\/strong> é uma agência digital/);
  });
  test('botões da abertura sem seta', () => {
    const css = readFileSync(join(ROOT, 'styles.css'), 'utf8');
    assert.match(css, /\.hero-actions \.button::after, \.hero-actions \.text-link::after \{ content: none; \}/);
  });
  test('home: sem o selo "novo" na abertura', () => {
    assert.doesNotMatch(readSite('index.html'), /class="hero-novo|class="nav-novo/);
  });
  test('home: o portfólio vem logo depois da abertura, em papel e sem o trilho lateral', () => {
    const html = readSite('index.html');
    const secoes = [...html.matchAll(/<section[^>]*>/g)].map((m) => m[0]);
    assert.match(secoes[1], /id="portfolio" class="galeria section-grid" data-campo="paper"/);
    assert.doesNotMatch(html, /class="proof-trilho"|class="proof section-grid"/);
  });
});
