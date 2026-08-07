// node server básico: npm i express node-fetch cheerio lru-cache
const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const LRU = require('lru-cache');

const app = express();
app.use(express.json());
const cache = new LRU({ max: 500, ttl: 1000 * 60 * 5 }); // 5 min

// --- Ruta que scrapea promedios.com.ar (ejemplo básico) ---
async function fetchPromedios(path){
  const url = `https://promiedos.com.ar${path || '/'}`;
  if(cache.has(url)) return cache.get(url);
  const res = await fetch(url, { headers: { 'User-Agent': 'PromediosBot/1.0' } });
  if(!res.ok) throw new Error('Error fetching promedios');
  const html = await res.text();
  const $ = cheerio.load(html);
  // NOTE: ajustar selectores según la estructura real de la web
  const result = {};
  // ejemplo: leer tabla de promedios
  result.title = $('h1').first().text().trim();
  // buscá elementos relevantes y parsealos:
  // result.someStat = $('#some-selector').text().trim();
  cache.set(url, result);
  return result;
}

app.get('/api/promedios', async (req,res)=>{
  try{
    const path = req.query.path || '/';
    const data = await fetchPromedios(path);
    res.json({ ok:true, data });
  }catch(err){
    res.status(500).json({ ok:false, error:err.message });
  }
});

// --- Ruta de chat: aplica system prompt y llama al LLM (ejemplo con OpenAI) ---
app.post('/api/chat', async (req,res)=>{
  const { message } = req.body;
  if(!message) return res.status(400).json({ error:'Falta mensaje' });

  // System prompt en español, especializado:
  const systemPrompt = `
Eres "PromediosBot", un asistente en español especialista en:
- Responder a qué hora es un evento (usar fuentes oficiales cuando sea posible).
- Proveer estadísticas y promedios relacionados con deportes/partidos.
- Conversar sobre fútbol y contexto histórico de equipos/jugadores.
Prioriza datos de promedios.com.ar cuando la información solicitada sea estadística. 
Si necesitas datos concretos, haz una llamada interna a /api/promedios y cita la fuente.
Si la información no está disponible, dilo claramente y ofrece alternativas.
Mantén respuestas breves y con formato claro (horario en formato local, fecha).
  `.trim();

  // Llamada a OpenAI (ejemplo - configura process.env.OPENAI_API_KEY)
  try{
    // Si usas OpenAI: npm i openai  (ejemplo con fetch a la REST API)
    const payload = {
      model: "gpt-4o-mini", // o el modelo que uses
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 800
    };
    const openaiKey = process.env.OPENAI_API_KEY;
    if(!openaiKey) throw new Error('Falta OPENAI_API_KEY');
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify(payload)
    });
    const jr = await r.json();
    const reply = jr?.choices?.[0]?.message?.content || 'Sin respuesta del modelo';
    res.json({ reply });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`Server listening ${port}`));
