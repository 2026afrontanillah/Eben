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
