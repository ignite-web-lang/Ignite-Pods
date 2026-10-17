const $ = s => document.querySelector(s);
const E = s => String(s ?? '').replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const R = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function precoFinal(p, precoOriginal) {
  if (!p.desconto_tipo || !p.desconto_valor) return precoOriginal;
  if (p.desconto_tipo === 'fixo') return Math.max(0, precoOriginal - Number(p.desconto_valor));
  if (p.desconto_tipo === 'porcentagem') return Math.max(0, precoOriginal * (1 - Number(p.desconto_valor) / 100));
  return precoOriginal;
}

const img = (n, u) => u || 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#dfe8e3"/><text x="200" y="150" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#12302b">${E(n)}</text></svg>`
);