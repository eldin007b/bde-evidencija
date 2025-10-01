// Servis za pretragu adresa (koristi VAO kao u MapView)
import ENV from '../../config/env';

export async function searchAddresses(query) {
  const VAO_BODY = {
    id: 'ibwmnqg8g2kj8iwg',
    ver: '1.59',
    lang: 'deu',
    auth: { type: 'AID', aid: 'wf7mcf9bv3nv8g5f' },
    client: {
      id: 'VAO',
      type: 'WEB',
      name: 'webapp',
      l: 'vs_anachb',
      v: 10010,
      pos: { x: 14289510, y: 46624050, acc: 16.185 }
    },
    formatted: false,
    ext: 'VAO.22',
    svcReqL: [
      {
        meth: 'LocMatch',
        req: {
          input: {
            field: 'S',
            loc: {
              type: 'ALL',
              dist: 1000,
              name: query
            },
            maxLoc: 7
          }
        },
        id: '1|43|'
      }
    ]
  };
  try {
    const res = await fetch(`${ENV.API_BASE_URL}/vor-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VAO_BODY)
    });
    if (res.ok) {
      const data = await res.json();
      return data?.svcResL?.[0]?.res?.match?.locL || [];
    }
  } catch (err) {
    console.warn('VAO proxy failed, falling back to Nominatim', err);
  }

  // Fallback: use Nominatim search API (less rich but works from static hosts)
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8&accept-language=de`;
    const r = await fetch(nomUrl, { headers: { 'User-Agent': 'bde-evidencija/1.0 (+https://eldin007b.github.io/bde-evidencija)' } });
    if (!r.ok) return [];
    const json = await r.json();
    // Convert nominatim results to expected VAO-like minimal shape
    return json.map(item => ({
      name: item.display_name,
      nameFormatted: { text: item.display_name },
      crd: { x: Math.round(item.lon * 1e6), y: Math.round(item.lat * 1e6) }
    }));
  } catch (err) {
    console.warn('Nominatim fallback failed', err);
    return [];
  }
}
