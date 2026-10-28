// Bug: os cartões da home baixavam as telas inteiras de 960x1800 (~605 KiB) embora mostrem só o topo recortado.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

test('cartões do leque usam miniaturas leves (<= 60 KiB cada)', () => {
  const html = readFileSync('index.html', 'utf8');
  const srcs = [...html.matchAll(/<img src="(\/portfolio\/img\/[a-z]+-card-660\.webp)/g)].map(m => m[1]);
  assert.equal(srcs.length, 5);
  for (const s of srcs) assert.ok(statSync('.' + s).size <= 60 * 1024, s);
  assert.doesNotMatch(html, /<img src="\/portfolio\/img\/[a-z]+-inicio-desktop-960/);
});
