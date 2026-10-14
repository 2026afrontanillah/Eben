import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './db.js';
import { apiRouter } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Cargar variables de entorno desde .env
const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envPath);
    } catch {}
  }
  // Fallback manual de lectura de .env
  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch {}
}

// 1. Inicializar base de datos SQLite
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// 2. Archivos estáticos de marca y sonidos
app.use('/brand', express.static(path.join(ROOT_DIR, 'public', 'brand')));
app.use('/sounds', express.static(path.join(ROOT_DIR, 'public', 'sounds')));

// 3. API REST
app.use('/api', apiRouter);

// 3.1 Callback OAuth para el Pop-up de Facebook
app.get('/auth/facebook/callback', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Conectando con Facebook...</title>
  <style>
    body {
      background: #050506;
      color: #f4f4f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #1877F2;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <p>Conectando con Facebook...</p>
  <script>
    (function() {
      try {
        var hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
        var hashParams = new URLSearchParams(hash);
        var searchParams = new URLSearchParams(window.location.search);

        var accessToken = hashParams.get('access_token');
        var code = searchParams.get('code');
        var error = hashParams.get('error_description') || searchParams.get('error') || searchParams.get('error_message') || searchParams.get('error_description');

        if (window.opener) {
          window.opener.postMessage({
            type: 'FB_AUTH_RESULT',
            accessToken: accessToken || null,
            code: code || null,
            error: error || null
          }, window.location.origin);
          setTimeout(function() { window.close(); }, 350);
        } else {
          window.location.href = '/';
        }
      } catch (e) {
        console.error('Error enviando datos:', e);
      }
    })();
  </script>
</body>
</html>`);
});

// 4. Integración Frontend (Vite en dev, static en prod)
async function setupFrontend() {
  const distPath = path.join(ROOT_DIR, 'dist');

  if (IS_PROD || fs.existsSync(distPath)) {
    // Modo producción o build existente
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      if (req.path.startsWith('/api') || req.path.startsWith('/brand')) {
        return res.status(404).json({ error: 'No encontrado' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Modo desarrollo: Vite en middleware mode
    const { createServer } = await import('vite');
    const vite = await createServer({
      root: ROOT_DIR,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log('\n======================================================');
    console.log('   !eben Producciones · Entradas (Node.js + SQLite)');
    console.log(`   Servidor listo en: http://localhost:${PORT}`);
    console.log('   Sin Dockers · Base de datos local: data/database.sqlite');
    console.log('======================================================\n');
  });
}

setupFrontend().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
