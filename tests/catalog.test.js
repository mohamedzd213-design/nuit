import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PRODUCTS, SIZES, validateItems } from '../lib/server/catalog.js';

test('server-side prices stay synchronized with every product size on the site', async () => {
  const source = await readFile(new URL('../data.js', import.meta.url), 'utf8');
  const sitePrices = [...source.matchAll(/prices:\s*\{\s*'140x190':\s*(\d+),\s*'160x200':\s*(\d+),\s*'180x200':\s*(\d+)\s*\}/g)];
  const serverProducts = Object.values(PRODUCTS);

  assert.equal(sitePrices.length, serverProducts.length);
  serverProducts.forEach((product, index) => {
    assert.deepEqual(
      [product.prices['140x190'], product.prices['160x200'], product.prices['180x200']],
      sitePrices[index].slice(1).map(Number).map((price) => price * 100),
      `${product.name} prices differ from data.js`
    );
  });
});

test('every configured product and size can be priced from trusted server data', () => {
  for (const [id, product] of Object.entries(PRODUCTS)) {
    for (const size of SIZES) {
      const { items, total } = validateItems([{
        id,
        size,
        fabric: product.fabrics[0],
        qty: 1
      }]);
      assert.equal(items[0].unitAmount, product.prices[size]);
      assert.equal(total, product.prices[size]);
    }
  }
});

test('client-supplied prices are ignored and invalid variants are rejected', () => {
  const valid = validateItems([{
    id: 'minuit',
    size: '160x200',
    fabric: 'Bleu nuit',
    qty: 2,
    unitAmount: 1
  }]);
  assert.equal(valid.items[0].unitAmount, PRODUCTS.minuit.prices['160x200']);
  assert.equal(valid.total, PRODUCTS.minuit.prices['160x200'] * 2);

  assert.throws(() => validateItems([{
    id: 'minuit', size: '160x200', fabric: 'Unknown', qty: 1
  }]));
  assert.throws(() => validateItems([{
    id: 'minuit', size: '160x200', fabric: 'Bleu nuit', qty: 11
  }]));
});
