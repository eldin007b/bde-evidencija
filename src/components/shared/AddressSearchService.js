// Servis za pretragu adresa (koristi VAO kao u MapView)
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
  const res = await fetch('/vor-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(VAO_BODY)
  });
  const data = await res.json();
  return data?.svcResL?.[0]?.res?.match?.locL || [];
}
