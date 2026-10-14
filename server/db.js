import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { hashPassword } from './auth-utils.js';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'database.sqlite');
export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sesiones (
      id TEXT PRIMARY KEY,
      token_hash TEXT UNIQUE NOT NULL,
      usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      expira_en TEXT NOT NULL,
      creada_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS eventos (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      lugar TEXT,
      fecha TEXT,
      activo INTEGER NOT NULL DEFAULT 1,
      plano_columnas TEXT NOT NULL,
      plano_filas TEXT NOT NULL,
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS zonas (
      id TEXT PRIMARY KEY,
      evento_id TEXT NOT NULL REFERENCES eventos(id),
      codigo TEXT NOT NULL,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL,
      precio_centavos INTEGER,
      capacidad INTEGER NOT NULL,
      disponibles INTEGER NOT NULL,
      habilitada INTEGER NOT NULL DEFAULT 1,
      area_plano TEXT NOT NULL,
      color TEXT NOT NULL,
      orden INTEGER NOT NULL,
      mesas INTEGER,
      sillas_por_mesa INTEGER,
      mesas_por_fila INTEGER,
      UNIQUE(evento_id, codigo)
    );

    CREATE TABLE IF NOT EXISTS asientos (
      id TEXT PRIMARY KEY,
      zona_id TEXT NOT NULL REFERENCES zonas(id),
      mesa INTEGER NOT NULL,
      silla INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'DISPONIBLE',
      UNIQUE(zona_id, mesa, silla)
    );

    CREATE INDEX IF NOT EXISTS idx_asientos_zona_estado ON asientos(zona_id, estado);

    CREATE TABLE IF NOT EXISTS ventas (
      id TEXT PRIMARY KEY,
      codigo TEXT UNIQUE NOT NULL,
      evento_id TEXT NOT NULL REFERENCES eventos(id),
      zona_id TEXT NOT NULL REFERENCES zonas(id),
      vendedor_id TEXT NOT NULL REFERENCES usuarios(id),
      cliente_nombre TEXT NOT NULL,
      cliente_celular TEXT NOT NULL,
      cliente_email TEXT,
      cantidad INTEGER NOT NULL,
      precio_unitario_centavos INTEGER NOT NULL,
      total_centavos INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'CONFIRMADA',
      creada_en TEXT NOT NULL DEFAULT (datetime('now')),
      anulada_en TEXT,
      anulada_por_id TEXT REFERENCES usuarios(id),
      motivo_anulacion TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_ventas_evento ON ventas(evento_id, creada_en);
    CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas(vendedor_id, creada_en);

    CREATE TABLE IF NOT EXISTS pagos (
      id TEXT PRIMARY KEY,
      venta_id TEXT NOT NULL REFERENCES ventas(id),
      metodo TEXT NOT NULL,
      monto_centavos INTEGER NOT NULL,
      referencia TEXT,
      registrado_por_id TEXT NOT NULL REFERENCES usuarios(id),
      registrado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_pagos_venta ON pagos(venta_id);

    CREATE TABLE IF NOT EXISTS entradas (
      id TEXT PRIMARY KEY,
      codigo TEXT UNIQUE NOT NULL,
      venta_id TEXT NOT NULL REFERENCES ventas(id),
      zona_id TEXT NOT NULL REFERENCES zonas(id),
      asiento_id TEXT REFERENCES asientos(id),
      estado TEXT NOT NULL DEFAULT 'VALIDA',
      usada_en TEXT,
      validada_por_id TEXT REFERENCES usuarios(id),
      intentos_ingreso INTEGER NOT NULL DEFAULT 0,
      ultimo_intento_en TEXT,
      creada_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_entradas_venta ON entradas(venta_id);
    CREATE INDEX IF NOT EXISTS idx_entradas_codigo ON entradas(codigo);

    CREATE TABLE IF NOT EXISTS accesos_log (
      id TEXT PRIMARY KEY,
      codigo TEXT NOT NULL,
      entrada_id TEXT,
      resultado TEXT NOT NULL,
      mensaje TEXT,
      cliente_nombre TEXT,
      zona_nombre TEXT,
      ubicacion TEXT,
      intentos INTEGER NOT NULL DEFAULT 1,
      registrado_por_id TEXT REFERENCES usuarios(id),
      registrado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_accesos_log_fecha ON accesos_log(registrado_en DESC);
  `);

  // Migraciones seguras para bases de datos existentes
  try {
    db.exec('ALTER TABLE entradas ADD COLUMN intentos_ingreso INTEGER NOT NULL DEFAULT 0;');
  } catch {}
  try {
    db.exec('ALTER TABLE entradas ADD COLUMN ultimo_intento_en TEXT;');
  } catch {}

  seedIfEmpty();
}

function seedIfEmpty() {
  const eventoExistente = db.prepare('SELECT id FROM eventos WHERE slug = ?').get('kjarkas-55');
  if (!eventoExistente) {
    console.log('Sembrando datos iniciales en SQLite...');
    const eventoId = crypto.randomUUID();

    db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO eventos (id, slug, nombre, activo, plano_columnas, plano_filas)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        eventoId,
        'kjarkas-55',
        'Kjarkas 55 años',
        1,
        '1fr 2.4fr 1fr',
        'clamp(90px, 14vw, 110px) clamp(135px, 20vw, 160px) 72px'
      );

      const zonasSemilla = [
        {
          codigo: 'VIP',
          nombre: 'VIP grande',
          tipo: 'NUMERADA',
          precioCentavos: 10000,
          capacidad: 1400,
          habilitada: 1,
          areaPlano: '1 / 1 / 3 / 2',
          color: '#15803D',
          orden: 1,
          mesas: 140,
          sillasPorMesa: 10,
          mesasPorFila: 20,
        },
        {
          codigo: 'GEN',
          nombre: 'General',
          tipo: 'GENERAL',
          precioCentavos: null,
          capacidad: 100,
          habilitada: 1,
          areaPlano: '1 / 2 / 3 / 3',
          color: '#6D28D9',
          orden: 2,
          mesas: null,
          sillasPorMesa: null,
          mesasPorFila: null,
        },
        {
          codigo: 'VIPS',
          nombre: 'VIP pequeño',
          tipo: 'NUMERADA',
          precioCentavos: 10000,
          capacidad: 700,
          habilitada: 1,
          areaPlano: '1 / 3 / 2 / 4',
          color: '#EA580C',
          orden: 3,
          mesas: 70,
          sillasPorMesa: 10,
          mesasPorFila: 10,
        },
        {
          codigo: 'CAM',
          nombre: 'Camarote',
          tipo: 'GENERAL',
          precioCentavos: null,
          capacidad: 0,
          habilitada: 0,
          areaPlano: '2 / 3 / 3 / 4',
          color: '#BE123C',
          orden: 4,
          mesas: null,
          sillasPorMesa: null,
          mesasPorFila: null,
        },
        {
          codigo: 'GRA',
          nombre: 'Gradería',
          tipo: 'GENERAL',
          precioCentavos: null,
          capacidad: 100,
          habilitada: 1,
          areaPlano: '3 / 1 / 4 / 4',
          color: '#0E7490',
          orden: 5,
          mesas: null,
          sillasPorMesa: null,
          mesasPorFila: null,
        },
      ];

      const insertZona = db.prepare(`
        INSERT INTO zonas (id, evento_id, codigo, nombre, tipo, precio_centavos, capacidad, disponibles, habilitada, area_plano, color, orden, mesas, sillas_por_mesa, mesas_por_fila)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertAsiento = db.prepare(`
        INSERT INTO asientos (id, zona_id, mesa, silla, estado)
        VALUES (?, ?, ?, ?, 'DISPONIBLE')
      `);

      for (const z of zonasSemilla) {
        const zonaId = crypto.randomUUID();
        insertZona.run(
          zonaId,
          eventoId,
          z.codigo,
          z.nombre,
          z.tipo,
          z.precioCentavos,
          z.capacidad,
          z.capacidad,
          z.habilitada,
          z.areaPlano,
          z.color,
          z.orden,
          z.mesas,
          z.sillasPorMesa,
          z.mesasPorFila
        );

        if (z.mesas && z.sillasPorMesa) {
          for (let m = 1; m <= z.mesas; m++) {
            for (let s = 1; s <= z.sillasPorMesa; s++) {
              insertAsiento.run(crypto.randomUUID(), zonaId, m, s);
            }
          }
        }
      }

      db.exec('COMMIT;');
      console.log('Evento y zonas sembrados con éxito.');
    } catch (err) {
      db.exec('ROLLBACK;');
      console.error('Error al sembrar evento:', err);
    }
  }

  // Admin user
  const emailAdmin = (process.env.SEED_ADMIN_EMAIL || 'admin@rela.bo').toLowerCase();
  const adminExistente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(emailAdmin);
  if (!adminExistente) {
    const password = process.env.SEED_ADMIN_PASSWORD || '123';
    const passwordHash = hashPassword(password);
    db.prepare(`
      INSERT INTO usuarios (id, nombre, email, password_hash, rol, activo)
      VALUES (?, ?, ?, ?, 'ADMIN', 1)
    `).run(
      crypto.randomUUID(),
      process.env.SEED_ADMIN_NOMBRE || 'Administrador',
      emailAdmin,
      passwordHash
    );
    console.log(`Usuario administrador creado: ${emailAdmin}`);
  }

  // Control user (Personal de puerta)
  const emailControl = (process.env.SEED_CONTROL_EMAIL || 'control@rela.bo').toLowerCase();
  const controlExistente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(emailControl);
  if (!controlExistente) {
    const password = process.env.SEED_CONTROL_PASSWORD || '123';
    const passwordHash = hashPassword(password);
    db.prepare(`
      INSERT INTO usuarios (id, nombre, email, password_hash, rol, activo)
      VALUES (?, ?, ?, ?, 'CONTROL', 1)
    `).run(
      crypto.randomUUID(),
      process.env.SEED_CONTROL_NOMBRE || 'Control de Acceso (Puerta)',
      emailControl,
      passwordHash
    );
    console.log(`Usuario control de acceso creado: ${emailControl}`);
  }

  // Relacionador user
  const emailRela = (process.env.SEED_RELA_EMAIL || 'rela@rela.bo').toLowerCase();
  const relaExistente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(emailRela);
  if (!relaExistente) {
    const password = process.env.SEED_RELA_PASSWORD || '123';
    const passwordHash = hashPassword(password);
    db.prepare(`
      INSERT INTO usuarios (id, nombre, email, password_hash, rol, activo)
      VALUES (?, ?, ?, ?, 'RELACIONADOR', 1)
    `).run(
      crypto.randomUUID(),
      process.env.SEED_RELA_NOMBRE || 'Relacionador 1',
      emailRela,
      passwordHash
    );
    console.log(`Usuario relacionador creado: ${emailRela}`);
  }
}
