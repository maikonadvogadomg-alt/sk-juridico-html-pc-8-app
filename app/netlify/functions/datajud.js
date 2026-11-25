// 📡 Ponte do DataJud (CNJ) — a API pública não deixa ser chamada direto do navegador (CORS); esta função do Netlify chama por você.
// Chave PÚBLICA do CNJ (a mesma para todo mundo, divulgada na página da API Pública). Se o CNJ trocar, defina DATAJUD_KEY no Netlify.
const CHAVE = process.env.DATAJUD_KEY || 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json; charset=utf-8' };
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  try {
    const { alias, consulta } = JSON.parse(event.body || '{}');
    if (!/^[a-z0-9-]{3,12}$/.test(alias || '')) return { statusCode: 400, headers: CORS, body: JSON.stringify({ erro: 'tribunal inválido' }) };
    const r = await fetch('https://api-publica.datajud.cnj.jus.br/api_publica_' + alias + '/_search', { method: 'POST', headers: { Authorization: 'APIKey ' + CHAVE, 'Content-Type': 'application/json' }, body: JSON.stringify(consulta || {}) });
    return { statusCode: r.status, headers: CORS, body: await r.text() };
  } catch (e) { return { statusCode: 502, headers: CORS, body: JSON.stringify({ erro: String(e.message || e) }) }; }
};
