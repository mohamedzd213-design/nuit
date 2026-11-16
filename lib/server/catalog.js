export const SIZES = new Set(['140x190', '160x200', '180x200']);

export const PRODUCTS = {
  minuit: {
    name: 'Minuit',
    prices: { '140x190': 129000, '160x200': 149000, '180x200': 169000 },
    fabrics: ['Bleu nuit', 'Vert sapin', 'Grège']
  },
  nuage: {
    name: 'Nuage',
    prices: { '140x190': 149000, '160x200': 169000, '180x200': 189000 },
    fabrics: ['Ivoire', 'Sable', 'Gris perle']
  },
  eclipse: {
    name: 'Éclipse',
    prices: { '140x190': 169000, '160x200': 189000, '180x200': 209000 },
    fabrics: ['Chêne naturel', 'Chêne fumé', 'Noyer']
  },
  aurore: {
    name: 'Aurore',
    prices: { '140x190': 189000, '160x200': 209000, '180x200': 239000 },
    fabrics: ['Ivoire', 'Taupe', 'Anthracite']
  }
};

export function validateItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) {
    throw new Error('Le panier est vide ou contient trop d’articles.');
  }

  let total = 0;
  const normalized = items.map((item) => {
    const product = PRODUCTS[item?.id];
    if (!product || !SIZES.has(item.size) || !product.prices[item.size]
      || !product.fabrics.includes(item.fabric)
      || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 10) {
      throw new Error('Un article du panier n’est plus valide. Actualisez la page et réessayez.');
    }

    const unitAmount = product.prices[item.size];
    total += unitAmount * item.qty;
    return {
      id: item.id,
      name: product.name,
      size: item.size,
      fabric: item.fabric,
      qty: item.qty,
      unitAmount
    };
  });

  if (total < 1 || total > 5_000_000) throw new Error('Le montant du panier est invalide.');
  return { items: normalized, total };
}
