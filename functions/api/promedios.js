export async function onRequest(context) {
  const { request, env, params } = context;
  try {
    const url = new URL(request.url);
    const path = url.searchParams.get('path') || '/';
    const target = `https://promiedos.com.ar${path}`;

    // Try cache (Cloudflare Pages Functions support caches.default)
    const cacheKey = new Request(`${target}`);
    const cache = caches.default;
    if (cache) {
      const cached = await cache.match(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const res = await fetch(target, { headers: { 'User-Agent': 'PromediosBot/1.0' } });
    if (!res.ok) return new Response(JSON.stringify({ ok: false, error: 'Error fetching promedios' }), { status: 502, headers: { 'Content-Type': 'application/json' } });

    const html = await res.text();

    // Parse HTML using HTMLRewriter to extract useful fields (example: <h1>)
    let title = '';
    const rewriter = new HTMLRewriter()
      .on('h1', {
        element(el) {
          try { title = el.text; } catch (e) { /* ignore */ }
        }
      });

    // HTMLRewriter operates on a Response
    const transformed = rewriter.transform(new Response(html, { headers: { 'Content-Type': 'text/html' } }));
    await transformed.arrayBuffer(); // force parsing

    const payload = { ok: true, data: { title } };
    const jsonRes = new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });

    // Cache the JSON response for 5 minutes
    if (cache) await cache.put(cacheKey, jsonRes.clone());

    return jsonRes;
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
