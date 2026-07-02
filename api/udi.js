// api/udi.js — Proxy a Banxico SIE para el valor diario de la UDI (serie SP68257).
// Corre server-side en Vercel: evita CORS y mantiene el token oculto.
// Requiere la variable de entorno BANXICO_TOKEN (token gratuito de
// https://www.banxico.org.mx/SieAPIRest/service/v1/token).
// Si no hay token o falla, devuelve valor null y el cliente usa su fallback.
module.exports = async (req, res) => {
  const token = process.env.BANXICO_TOKEN;
  if (!token) {
    res.status(200).json({ valor: null, fecha: null, error: 'sin_token' });
    return;
  }
  try {
    const r = await fetch(
      'https://www.banxico.org.mx/SieAPIRest/service/v1/series/SP68257/datos/oportuno',
      { headers: { 'Bmx-Token': token, 'Accept': 'application/json' } }
    );
    const j = await r.json();
    const d = j.bmx.series[0].datos[0];
    const valor = parseFloat(String(d.dato).replace(/,/g, ''));
    // Cache en el edge: 12 h, revalida en segundo plano
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');
    res.status(200).json({ valor: valor, fecha: d.fecha });
  } catch (e) {
    res.status(200).json({ valor: null, fecha: null, error: 'fetch_error' });
  }
};
