Deploy to Cloudflare Pages (Workers) - Quick instructions

This project was adapted to run its API endpoints as Cloudflare Pages Functions so you can deploy the frontend (static files) and the backend (serverless functions) with Cloudflare Pages / Workers.

Files added for Pages Functions:
- functions/api/chat.js   -> POST /api/chat  (calls OpenAI; requires OPENAI_API_KEY set in Pages environment)
- functions/api/promedios.js -> GET /api/promedios?path=/some/page  (scrapes promiedos.com.ar title; uses HTMLRewriter and caches responses)

How to deploy on Cloudflare Pages
1) Create a Pages project in the Cloudflare dashboard and connect this GitHub repo.
2) In the Pages settings, set the Build command to: (none needed for static) or your build if you use a framework.
   - If your site is plain static files in the root, set the Build output directory to "."
3) Add Environment Variables in Pages > Settings > Environment variables:
   - OPENAI_API_KEY = your_openai_api_key
4) Make sure the "Functions" feature is enabled (Pages supports "Functions" out of the box for routes under /functions or this repo's `functions` directory).
5) Deploy. Your functions will be available under /api/chat and /api/promedios.

Local testing
- Use wrangler (recommended) to test functions locally:
  - npm i -g @cloudflare/wrangler
  - wrangler pages dev ./ --binding OPENAI_API_KEY:your_key
  - This will run a local server with functions available at /api/*

Notes & recommendations
- Respect robots.txt and the target site's TOS before scraping promedios.com.ar. If they provide an API, prefer it.
- The simple scraping here extracts only the first <h1>. Extend parsing via HTMLRewriter handlers to capture the exact data you need.
- Rate limit /api/chat (e.g. via Cloudflare rate-limiting or internal checks) so users can't abuse your OpenAI quota.

If you want, puedo:
- Crear una rama nueva y abrir un PR con solo los cambios orientados a Pages/Workers.
- Mejorar el parsing de promedios.com.ar para campos concretos (indícame qué datos necesitas).
- Añadir autenticación básica o límites al endpoint /api/chat.
