export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const body = await request.json();
    const message = body.message;
    if (!message) return new Response(JSON.stringify({ error: 'Falta mensaje' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const systemPrompt = `Eres "PromediosBot", un asistente en español especialista en:\n- Responder a qué hora es un evento (usar fuentes oficiales cuando sea posible).\n- Proveer estadísticas y promedios relacionados con deportes/partidos.\n- Conversar sobre fútbol y contexto histórico de equipos/jugadores.\nPrioriza datos de promedios.com.ar cuando la información solicitada sea estadística.\nSi necesitas datos concretos, indica al usuario y ofrece consultar /api/promedios.\nSi la información no está disponible, dilo claramente y ofrece alternativas.\nMantén respuestas breves y con formato claro (horario en formato local, fecha).`;

    // Build OpenAI Chat Completions request
    const openaiKey = env.OPENAI_API_KEY;
    if (!openaiKey) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY no configurada en el entorno' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 800,
      temperature: 0.2
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      return new Response(JSON.stringify({ error: 'Error from OpenAI', detail: text }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const jr = await r.json();
    const reply = jr?.choices?.[0]?.message?.content || jr?.choices?.[0]?.text || 'Sin respuesta del modelo';

    return new Response(JSON.stringify({ reply }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
