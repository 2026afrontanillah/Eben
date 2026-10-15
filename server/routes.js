import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from './db.js';
import { hashPassword, verifyPassword, createSessionToken, hashSessionToken } from './auth-utils.js';
import { signQrToken, verifyQrToken, looksLikeToken, generateRandomCode } from './qr.js';
import { renderEntradasPdf } from './pdf.js';

export const apiRouter = Router();

const SESSION_COOKIE_NAME = 'rela_sesion';
const DURACION_SESION_MS = 12 * 60 * 60 * 1000;

const PERMISOS_POR_ROL = {
  ADMIN: ['VENDER', 'VER_TODAS_LAS_VENTAS', 'ANULAR_VENTAS', 'VALIDAR_ENTRADAS', 'VER_RESUMEN', 'CONFIGURAR_ZONAS', 'GESTIONAR_USUARIOS'],
  VENDEDOR: ['VENDER'],
  RELACIONADOR: ['VENDER'],
  CONTROL: ['VALIDAR_ENTRADAS'],
};

export function tienePermiso(rol, permiso) {
  const permisos = PERMISOS_POR_ROL[rol] || [];
  return permisos.includes(permiso);
}

export function obtenerCelularUsuario(usuarioId, email, celularExistente) {
  if (celularExistente && typeof celularExistente === 'string' && celularExistente.trim()) {
    return celularExistente.trim();
  }
  try {
    const venta = db.prepare(`
      SELECT cliente_celular 
      FROM ventas 
      WHERE (cliente_email = ? OR vendedor_id = ?) 
        AND cliente_celular IS NOT NULL 
        AND cliente_celular != '' 
      ORDER BY creada_en DESC 
      LIMIT 1
    `).get(email, usuarioId);
    return venta?.cliente_celular || '';
  } catch {
    return '';
  }
}

// Middleware de autenticación
export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const tokenHash = hashSessionToken(token);
  const now = new Date().toISOString();
  const sesion = db.prepare(`
    SELECT s.id as sesion_id, u.id, u.nombre, u.email, u.rol, u.activo, u.celular
    FROM sesiones s
    JOIN usuarios u ON s.usuario_id = u.id
    WHERE s.token_hash = ? AND s.expira_en > ? AND u.activo = 1
  `).get(tokenHash, now);

  if (!sesion) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }

  req.user = {
    id: sesion.id,
    nombre: sesion.nombre,
    email: sesion.email,
    rol: sesion.rol,
    celular: obtenerCelularUsuario(sesion.id, sesion.email, sesion.celular),
    permisos: PERMISOS_POR_ROL[sesion.rol] || [],
  };
  next();
}

export function requirePermiso(permiso) {
  return (req, res, next) => {
    if (!req.user || !tienePermiso(req.user.rol, permiso)) {
      return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }
    next();
  };
}

// ----------------------------------------------------
// 1. AUTENTICACIÓN
// ----------------------------------------------------
apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Debes proporcionar email y contraseña' });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.toLowerCase().trim());
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const passwordValida = verifyPassword(password, usuario.password_hash);
  if (!passwordValida) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const { token, tokenHash } = createSessionToken();
  const expiraEn = new Date(Date.now() + DURACION_SESION_MS).toISOString();

  db.prepare(`
    INSERT INTO sesiones (id, token_hash, usuario_id, expira_en)
    VALUES (?, ?, ?, ?)
  `).run(crypto.randomUUID(), tokenHash, usuario.id, expiraEn);

  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: DURACION_SESION_MS,
    path: '/',
  });

  return res.json({
    user: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      celular: obtenerCelularUsuario(usuario.id, usuario.email, usuario.celular),
      rol: usuario.rol,
      permisos: PERMISOS_POR_ROL[usuario.rol] || [],
    },
  });
});

apiRouter.get('/auth/google/config', (req, res) => {
  return res.json({
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  });
});

apiRouter.post('/auth/google', async (req, res) => {
  const { credential, accessToken, testEmail, testName } = req.body || {};

  let googleUser = null;

  // 1. Verificación vía AccessToken OAuth2 de Google
  if (accessToken && typeof accessToken === 'string') {
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userInfoRes.ok) {
        const payload = await userInfoRes.json();
        if (payload.email) {
          googleUser = {
            email: payload.email.toLowerCase().trim(),
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture || null,
          };
        }
      }
    } catch (err) {
      console.warn('Error al verificar accessToken con Google:', err);
    }
  }

  // 2. Verificación oficial de Credencial de Google (JWT ID Token)
  if (!googleUser && credential && typeof credential === 'string') {
    try {
      // Intentar verificar con endpoint oficial de Google
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      if (verifyRes.ok) {
        const payload = await verifyRes.json();
        if (payload.email && (payload.email_verified === 'true' || payload.email_verified === true)) {
          googleUser = {
            email: payload.email.toLowerCase().trim(),
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture || null,
          };
        }
      } else {
        // Fallback decodificando payload base64url del JWT
        const parts = credential.split('.');
        if (parts.length === 3) {
          const jsonPayload = Buffer.from(parts[1], 'base64url').toString('utf-8');
          const payload = JSON.parse(jsonPayload);
          if (payload.email) {
            googleUser = {
              email: payload.email.toLowerCase().trim(),
              name: payload.name || payload.email.split('@')[0],
              picture: payload.picture || null,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Error al verificar credential de Google:', err);
    }
  } else if (!googleUser && !process.env.GOOGLE_CLIENT_ID && testEmail && typeof testEmail === 'string' && testEmail.includes('@')) {
    // Modo desarrollo / prueba sin Client ID en .env
    googleUser = {
      email: testEmail.toLowerCase().trim(),
      name: (testName && String(testName).trim()) || testEmail.split('@')[0],
      picture: null,
    };
  }

  if (!googleUser || !googleUser.email) {
    return res.status(400).json({ error: 'No se pudo verificar la cuenta de Google' });
  }

  // Buscar usuario por email
  let usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(googleUser.email);

  if (!usuario) {
    // Si no existe, crear automáticamente como RELACIONADOR
    const nuevoId = crypto.randomUUID();
    const tempPasswordHash = hashPassword(crypto.randomUUID());
    const rolPorDefecto = 'RELACIONADOR';

    db.prepare(`
      INSERT INTO usuarios (id, nombre, email, password_hash, rol, activo)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(nuevoId, googleUser.name, googleUser.email, tempPasswordHash, rolPorDefecto);

    usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(nuevoId);
    console.log(`Nuevo usuario registrado con Google: ${googleUser.email} (${rolPorDefecto})`);
  }

  if (!usuario.activo) {
    return res.status(403).json({ error: 'Tu cuenta ha sido desactivada por un administrador.' });
  }

  const { token, tokenHash } = createSessionToken();
  const expiraEn = new Date(Date.now() + DURACION_SESION_MS).toISOString();

  db.prepare(`
    INSERT INTO sesiones (id, token_hash, usuario_id, expira_en)
    VALUES (?, ?, ?, ?)
  `).run(crypto.randomUUID(), tokenHash, usuario.id, expiraEn);

  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: DURACION_SESION_MS,
    path: '/',
  });

  return res.json({
    user: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      celular: obtenerCelularUsuario(usuario.id, usuario.email, usuario.celular),
      rol: usuario.rol,
      permisos: PERMISOS_POR_ROL[usuario.rol] || [],
    },
  });
});

apiRouter.post('/auth/logout', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (token) {
    const tokenHash = hashSessionToken(token);
    db.prepare('DELETE FROM sesiones WHERE token_hash = ?').run(tokenHash);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  return res.json({ ok: true });
});

apiRouter.get('/auth/me', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    return res.json({ user: null });
  }

  const tokenHash = hashSessionToken(token);
  const now = new Date().toISOString();
  const usuario = db.prepare(`
    SELECT u.id, u.nombre, u.email, u.rol, u.celular
    FROM sesiones s
    JOIN usuarios u ON s.usuario_id = u.id
    WHERE s.token_hash = ? AND s.expira_en > ? AND u.activo = 1
  `).get(tokenHash, now);

  if (!usuario) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return res.json({ user: null });
  }

  return res.json({
    user: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      celular: obtenerCelularUsuario(usuario.id, usuario.email, usuario.celular),
      rol: usuario.rol,
      permisos: PERMISOS_POR_ROL[usuario.rol] || [],
    },
  });
});

// ----------------------------------------------------
// 2. EVENTOS Y ZONAS
// ----------------------------------------------------
apiRouter.get('/eventos/activo', requireAuth, (req, res) => {
  const evento = db.prepare('SELECT * FROM eventos WHERE activo = 1 LIMIT 1').get();
  if (!evento) {
    return res.json({ evento: null });
  }

  const zonas = db.prepare('SELECT * FROM zonas WHERE evento_id = ? ORDER BY orden ASC').all(evento.id);

  return res.json({
    evento: {
      id: evento.id,
      slug: evento.slug,
      nombre: evento.nombre,
      lugar: evento.lugar,
      fecha: evento.fecha,
      planoColumnas: evento.plano_columnas,
      planoFilas: evento.plano_filas,
      zonas: zonas.map((z) => ({
        id: z.id,
        codigo: z.codigo,
        nombre: z.nombre,
        tipo: z.tipo,
        precioCentavos: z.precio_centavos,
        capacidad: z.capacidad,
        disponibles: z.disponibles,
        habilitada: Boolean(z.habilitada),
        areaPlano: z.area_plano,
        color: z.color,
        orden: z.orden,
        mesas: z.mesas,
        sillasPorMesa: z.sillas_por_mesa,
        mesasPorFila: z.mesas_por_fila,
      })),
    },
  });
});

apiRouter.get('/zonas/:zonaId', requireAuth, (req, res) => {
  const zona = db.prepare(`
    SELECT z.*, e.nombre as evento_nombre
    FROM zonas z
    JOIN eventos e ON z.evento_id = e.id
    WHERE z.id = ?
  `).get(req.params.zonaId);

  if (!zona) {
    return res.status(404).json({ error: 'Zona no encontrada' });
  }

  return res.json({
    id: zona.id,
    eventoId: zona.evento_id,
    eventoNombre: zona.evento_nombre,
    codigo: zona.codigo,
    nombre: zona.nombre,
    tipo: zona.tipo,
    precioCentavos: zona.precio_centavos,
    capacidad: zona.capacidad,
    disponibles: zona.disponibles,
    habilitada: Boolean(zona.habilitada),
    areaPlano: zona.area_plano,
    color: zona.color,
    mesas: zona.mesas,
    sillasPorMesa: zona.sillas_por_mesa,
    mesasPorFila: zona.mesas_por_fila,
  });
});

apiRouter.get('/zonas/:zonaId/asientos', requireAuth, (req, res) => {
  const zona = db.prepare('SELECT * FROM zonas WHERE id = ?').get(req.params.zonaId);
  if (!zona) {
    return res.status(404).json({ error: 'Zona no encontrada' });
  }

  const asientos = db.prepare('SELECT mesa, silla, estado FROM asientos WHERE zona_id = ? ORDER BY mesa ASC, silla ASC').all(zona.id);

  // Agrupar por mesa
  const mesasMap = new Map();
  for (const a of asientos) {
    if (!mesasMap.has(a.mesa)) {
      mesasMap.set(a.mesa, { numero: a.mesa, sillas: [] });
    }
    const esVendida = a.estado === 'VENDIDO';
    mesasMap.get(a.mesa).sillas.push({
      numero: a.silla,
      estado: a.estado,
      vendida: esVendida,
      vendido: esVendida,
    });
  }

  const mesas = Array.from(mesasMap.values());

  return res.json({
    zonaId: zona.id,
    zonaNombre: zona.nombre,
    mesasPorFila: zona.mesas_por_fila || 10,
    mesas,
  });
});

// ----------------------------------------------------
// 3. VENTAS
// ----------------------------------------------------
apiRouter.post('/ventas/general', requireAuth, requirePermiso('VENDER'), (req, res) => {
  const { eventoId, zonaId, cantidad, cliente, pago } = req.body || {};

  if (!eventoId || !zonaId || !cantidad || !cliente?.nombre || !cliente?.celular || !pago?.metodo) {
    return res.status(400).json({ error: 'Todos los campos requeridos deben ser completados' });
  }

  const cant = Number(cantidad);
  if (cant < 1 || cant > 10) {
    return res.status(400).json({ error: 'La cantidad debe ser entre 1 y 10 entradas' });
  }

  if (['QR', 'TRANSFERENCIA'].includes(pago.metodo) && !pago.referencia?.trim()) {
    return res.status(400).json({ error: 'El número de comprobante o referencia es obligatorio para QR y Transferencia' });
  }

  db.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const zona = db.prepare('SELECT * FROM zonas WHERE id = ? AND evento_id = ?').get(zonaId, eventoId);
    if (!zona) {
      throw new Error('Zona no encontrada');
    }
    if (!zona.habilitada) {
      throw new Error(`La zona ${zona.nombre} no está habilitada para la venta`);
    }
    if (zona.tipo !== 'GENERAL') {
      throw new Error('Esta zona requiere selección de asientos');
    }
    if (zona.precio_centavos == null) {
      throw new Error(`La zona ${zona.nombre} no tiene precio configurado`);
    }
    if (zona.disponibles < cant) {
      throw new Error(`Solo quedan ${zona.disponibles} entradas disponibles para ${zona.nombre}`);
    }

    // Descontar disponibles de forma atómica
    const resUpdate = db.prepare('UPDATE zonas SET disponibles = disponibles - ? WHERE id = ? AND disponibles >= ?').run(cant, zona.id, cant);
    if (resUpdate.changes === 0) {
      throw new Error('No hay stock suficiente disponible');
    }

    const sufijo = generateRandomCode(6);
    const ventaCodigo = `V-${sufijo}`;
    const ventaId = crypto.randomUUID();
    const precioUnitario = zona.precio_centavos;
    const totalCentavos = precioUnitario * cant;

    // Insertar venta
    db.prepare(`
      INSERT INTO ventas (id, codigo, evento_id, zona_id, vendedor_id, cliente_nombre, cliente_celular, cliente_email, cantidad, precio_unitario_centavos, total_centavos, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMADA')
    `).run(
      ventaId,
      ventaCodigo,
      eventoId,
      zona.id,
      req.user.id,
      cliente.nombre.trim(),
      cliente.celular.trim(),
      cliente.email?.trim() || null,
      cant,
      precioUnitario,
      totalCentavos
    );

    // Insertar pago
    db.prepare(`
      INSERT INTO pagos (id, venta_id, metodo, monto_centavos, referencia, registrado_por_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      ventaId,
      pago.metodo,
      totalCentavos,
      pago.referencia?.trim() || null,
      req.user.id
    );

    // Insertar entradas
    const insertEntrada = db.prepare(`
      INSERT INTO entradas (id, codigo, venta_id, zona_id, estado)
      VALUES (?, ?, ?, ?, 'VALIDA')
    `);

    for (let i = 1; i <= cant; i++) {
      const entradaId = crypto.randomUUID();
      const entradaCodigo = `${zona.codigo}-${sufijo}-${String(i).padStart(3, '0')}`;
      insertEntrada.run(entradaId, entradaCodigo, ventaId, zona.id);
    }

    db.exec('COMMIT;');

    if (cliente.celular && typeof cliente.celular === 'string' && cliente.celular.trim()) {
      try {
        db.prepare('UPDATE usuarios SET celular = ? WHERE id = ?').run(cliente.celular.trim(), req.user.id);
      } catch {}
    }

    return res.json({ ventaId, codigo: ventaCodigo });
  } catch (err) {
    db.exec('ROLLBACK;');
    return res.status(400).json({ error: err.message || 'Error al procesar la venta' });
  }
});

apiRouter.post('/ventas/asientos', requireAuth, requirePermiso('VENDER'), (req, res) => {
  const { eventoId, zonaId, mesa, sillas, cliente, pago } = req.body || {};

  if (!eventoId || !zonaId || !mesa || !Array.isArray(sillas) || sillas.length === 0 || !cliente?.nombre || !cliente?.celular || !pago?.metodo) {
    return res.status(400).json({ error: 'Todos los campos requeridos deben ser completados' });
  }

  if (['QR', 'TRANSFERENCIA'].includes(pago.metodo) && !pago.referencia?.trim()) {
    return res.status(400).json({ error: 'El número de comprobante o referencia es obligatorio para QR y Transferencia' });
  }

  const numMesa = Number(mesa);
  const sillasSeleccionadas = [...new Set(sillas.map(Number))].sort((a, b) => a - b);

  db.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const zona = db.prepare('SELECT * FROM zonas WHERE id = ? AND evento_id = ?').get(zonaId, eventoId);
    if (!zona) {
      throw new Error('Zona no encontrada');
    }
    if (!zona.habilitada) {
      throw new Error(`La zona ${zona.nombre} no está habilitada para la venta`);
    }
    if (zona.tipo !== 'NUMERADA') {
      throw new Error('Esta zona no es de tipo numerada');
    }
    if (zona.precio_centavos == null) {
      throw new Error(`La zona ${zona.nombre} no tiene precio configurado`);
    }

    // Verificar que todas las sillas estén disponibles
    const queryAsiento = db.prepare('SELECT id, estado FROM asientos WHERE zona_id = ? AND mesa = ? AND silla = ?');
    const updateAsiento = db.prepare('UPDATE asientos SET estado = \'VENDIDO\' WHERE id = ? AND estado = \'DISPONIBLE\'');

    const asientosAComprar = [];
    for (const silla of sillasSeleccionadas) {
      const a = queryAsiento.get(zona.id, numMesa, silla);
      if (!a) {
        throw new Error(`El asiento Mesa ${numMesa} Silla ${silla} no existe`);
      }
      if (a.estado !== 'DISPONIBLE') {
        throw new Error(`El asiento Mesa ${numMesa} Silla ${silla} ya fue vendido a otro cliente`);
      }
      asientosAComprar.push({ silla, id: a.id });
    }

    // Marcar como vendidos
    for (const a of asientosAComprar) {
      const resUp = updateAsiento.run(a.id);
      if (resUp.changes === 0) {
        throw new Error(`Conflicto de concurrencia: el asiento Mesa ${numMesa} Silla ${a.silla} acaba de ser reservado`);
      }
    }

    // Descontar disponibles de la zona
    db.prepare('UPDATE zonas SET disponibles = disponibles - ? WHERE id = ?').run(asientosAComprar.length, zona.id);

    const sufijo = generateRandomCode(6);
    const ventaCodigo = `V-${sufijo}`;
    const ventaId = crypto.randomUUID();
    const precioUnitario = zona.precio_centavos;
    const totalCentavos = precioUnitario * asientosAComprar.length;

    // Insertar venta
    db.prepare(`
      INSERT INTO ventas (id, codigo, evento_id, zona_id, vendedor_id, cliente_nombre, cliente_celular, cliente_email, cantidad, precio_unitario_centavos, total_centavos, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMADA')
    `).run(
      ventaId,
      ventaCodigo,
      eventoId,
      zona.id,
      req.user.id,
      cliente.nombre.trim(),
      cliente.celular.trim(),
      cliente.email?.trim() || null,
      asientosAComprar.length,
      precioUnitario,
      totalCentavos
    );

    // Insertar pago
    db.prepare(`
      INSERT INTO pagos (id, venta_id, metodo, monto_centavos, referencia, registrado_por_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      ventaId,
      pago.metodo,
      totalCentavos,
      pago.referencia?.trim() || null,
      req.user.id
    );

    // Insertar entradas vinculadas al asiento
    const insertEntrada = db.prepare(`
      INSERT INTO entradas (id, codigo, venta_id, zona_id, asiento_id, estado)
      VALUES (?, ?, ?, ?, ?, 'VALIDA')
    `);

    for (const a of asientosAComprar) {
      const entradaId = crypto.randomUUID();
      const entradaCodigo = `${zona.codigo}-M${numMesa}-S${a.silla}-${sufijo}`;
      insertEntrada.run(entradaId, entradaCodigo, ventaId, zona.id, a.id);
    }

    db.exec('COMMIT;');

    if (cliente.celular && typeof cliente.celular === 'string' && cliente.celular.trim()) {
      try {
        db.prepare('UPDATE usuarios SET celular = ? WHERE id = ?').run(cliente.celular.trim(), req.user.id);
      } catch {}
    }

    return res.json({ ventaId, codigo: ventaCodigo });
  } catch (err) {
    db.exec('ROLLBACK;');
    return res.status(400).json({ error: err.message || 'Error al procesar la venta de asientos' });
  }
});

apiRouter.get('/ventas', requireAuth, (req, res) => {
  const { q, desde, hasta, limite = 50, offset = 0 } = req.query;

  let whereClauses = [];
  let params = [];

  // Si no es admin, solo ve sus propias ventas
  if (!tienePermiso(req.user.rol, 'VER_TODAS_LAS_VENTAS')) {
    whereClauses.push('v.vendedor_id = ?');
    params.push(req.user.id);
  }

  if (q && typeof q === 'string' && q.trim()) {
    const term = `%${q.trim()}%`;
    whereClauses.push('(v.codigo LIKE ? OR v.cliente_nombre LIKE ? OR v.cliente_celular LIKE ?)');
    params.push(term, term, term);
  }

  if (desde) {
    whereClauses.push('v.creada_en >= ?');
    params.push(desde);
  }
  if (hasta) {
    whereClauses.push('v.creada_en <= ?');
    params.push(hasta);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT v.id, v.codigo, v.cantidad, v.precio_unitario_centavos, v.total_centavos, v.estado, v.creada_en,
           v.cliente_nombre, v.cliente_celular,
           z.nombre as zona_nombre, z.color as zona_color,
           u.nombre as vendedor_nombre,
           (SELECT metodo FROM pagos WHERE venta_id = v.id LIMIT 1) as metodo_pago
    FROM ventas v
    JOIN zonas z ON v.zona_id = z.id
    JOIN usuarios u ON v.vendedor_id = u.id
    ${whereSql}
    ORDER BY v.creada_en DESC
    LIMIT ? OFFSET ?
  `;

  params.push(Number(limite), Number(offset));
  const ventas = db.prepare(sql).all(...params);

  return res.json({ ventas });
});

apiRouter.get('/ventas/:id', requireAuth, (req, res) => {
  const venta = db.prepare(`
    SELECT v.*, z.nombre as zona_nombre, z.codigo as zona_codigo, z.tipo as zona_tipo,
           e.nombre as evento_nombre,
           u.nombre as vendedor_nombre,
           ua.nombre as anulador_nombre
    FROM ventas v
    JOIN zonas z ON v.zona_id = z.id
    JOIN eventos e ON v.evento_id = e.id
    JOIN usuarios u ON v.vendedor_id = u.id
    LEFT JOIN usuarios ua ON v.anulada_por_id = ua.id
    WHERE v.id = ?
  `).get(req.params.id);

  if (!venta) {
    return res.status(404).json({ error: 'Venta no encontrada' });
  }

  // Permisos: Admin o el vendedor que la realizó
  if (!tienePermiso(req.user.rol, 'VER_TODAS_LAS_VENTAS') && venta.vendedor_id !== req.user.id) {
    return res.status(403).json({ error: 'No tienes permiso para ver esta venta' });
  }

  const pagos = db.prepare(`
    SELECT p.*, u.nombre as registrado_por_nombre
    FROM pagos p
    JOIN usuarios u ON p.registrado_por_id = u.id
    WHERE p.venta_id = ?
  `).all(venta.id);

  const entradas = db.prepare(`
    SELECT e.id, e.codigo, e.estado, e.usada_en,
           a.mesa, a.silla,
           uv.nombre as validada_por_nombre
    FROM entradas e
    LEFT JOIN asientos a ON e.asiento_id = a.id
    LEFT JOIN usuarios uv ON e.validada_por_id = uv.id
    WHERE e.venta_id = ?
    ORDER BY a.mesa ASC, a.silla ASC, e.codigo ASC
  `).all(venta.id);

  const entradasConQr = entradas.map((ent) => ({
    id: ent.id,
    codigo: ent.codigo,
    estado: ent.estado,
    usadaEn: ent.usada_en,
    validadaPor: ent.validada_por_nombre,
    ubicacion: ent.mesa && ent.silla ? `Mesa ${ent.mesa} · Silla ${ent.silla}` : null,
    qrToken: signQrToken(ent.id),
  }));

  return res.json({
    venta: {
      id: venta.id,
      codigo: venta.codigo,
      eventoId: venta.evento_id,
      eventoNombre: venta.evento_nombre,
      zonaId: venta.zona_id,
      zonaNombre: venta.zona_nombre,
      zonaCodigo: venta.zona_codigo,
      vendedorId: venta.vendedor_id,
      vendedorNombre: venta.vendedor_nombre,
      cliente: {
        nombre: venta.cliente_nombre,
        celular: venta.cliente_celular,
        email: venta.cliente_email,
      },
      cantidad: venta.cantidad,
      precioUnitarioCentavos: venta.precio_unitario_centavos,
      totalCentavos: venta.total_centavos,
      estado: venta.estado,
      creadaEn: venta.creada_en,
      anuladaEn: venta.anulada_en,
      motivoAnulacion: venta.motivo_anulacion,
      anuladaPor: venta.anulador_nombre,
      pagos: pagos.map((p) => ({
        id: p.id,
        metodo: p.metodo,
        montoCentavos: p.monto_centavos,
        referencia: p.referencia,
        registradoEn: p.registrado_en,
        registradoPor: p.registrado_por_nombre,
      })),
      entradas: entradasConQr,
    },
  });
});

apiRouter.post('/ventas/:id/anular', requireAuth, requirePermiso('ANULAR_VENTAS'), (req, res) => {
  const { motivo } = req.body || {};
  if (!motivo || motivo.trim().length < 5) {
    return res.status(400).json({ error: 'Debes indicar un motivo de anulación de al menos 5 caracteres' });
  }

  db.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const venta = db.prepare('SELECT * FROM ventas WHERE id = ?').get(req.params.id);
    if (!venta) {
      throw new Error('Venta no encontrada');
    }
    if (venta.estado === 'ANULADA') {
      throw new Error('La venta ya fue anulada previamente');
    }

    const entradas = db.prepare('SELECT id, asiento_id, estado FROM entradas WHERE venta_id = ?').all(venta.id);
    const usadas = entradas.filter((e) => e.estado === 'USADA');
    if (usadas.length > 0) {
      throw new Error('No se puede anular la venta porque una o más entradas ya fueron usadas en puerta');
    }

    const ahora = new Date().toISOString();

    // Actualizar venta
    db.prepare(`
      UPDATE ventas
      SET estado = 'ANULADA', anulada_en = ?, anulada_por_id = ?, motivo_anulacion = ?
      WHERE id = ?
    `).run(ahora, req.user.id, motivo.trim(), venta.id);

    // Anular entradas
    db.prepare('UPDATE entradas SET estado = \'ANULADA\' WHERE venta_id = ?').run(venta.id);

    // Liberar asientos si los tenía
    const asientoIds = entradas.map((e) => e.asiento_id).filter(Boolean);
    if (asientoIds.length > 0) {
      const updateAsiento = db.prepare('UPDATE asientos SET estado = \'DISPONIBLE\' WHERE id = ?');
      for (const aId of asientoIds) {
        updateAsiento.run(aId);
      }
    }

    // Devolver cupos a la zona
    db.prepare('UPDATE zonas SET disponibles = disponibles + ? WHERE id = ?').run(venta.cantidad, venta.zona_id);

    db.exec('COMMIT;');
    return res.json({ ok: true });
  } catch (err) {
    db.exec('ROLLBACK;');
    return res.status(400).json({ error: err.message || 'Error al anular la venta' });
  }
});

apiRouter.get('/ventas/:id/pdf', requireAuth, async (req, res) => {
  const { entradaId } = req.query;

  const venta = db.prepare(`
    SELECT v.*, z.nombre as zona_nombre, e.nombre as evento_nombre
    FROM ventas v
    JOIN zonas z ON v.zona_id = z.id
    JOIN eventos e ON v.evento_id = e.id
    WHERE v.id = ?
  `).get(req.params.id);

  if (!venta) {
    return res.status(404).send('Venta no encontrada');
  }

  if (venta.estado === 'ANULADA') {
    return res.status(400).send('No se puede generar PDF de una venta anulada');
  }

  if (!tienePermiso(req.user.rol, 'VER_TODAS_LAS_VENTAS') && venta.vendedor_id !== req.user.id) {
    return res.status(403).send('No tienes permiso para descargar estas entradas');
  }

  const pago = db.prepare('SELECT metodo FROM pagos WHERE venta_id = ? LIMIT 1').get(venta.id);
  const metodoLabels = {
    EFECTIVO: 'Efectivo',
    QR: 'QR',
    TRANSFERENCIA: 'Transferencia',
    TARJETA: 'Tarjeta',
  };

  let queryEntradas = 'SELECT e.id, e.codigo, a.mesa, a.silla FROM entradas e LEFT JOIN asientos a ON e.asiento_id = a.id WHERE e.venta_id = ? AND e.estado != \'ANULADA\'';
  let queryParams = [venta.id];

  if (entradaId) {
    queryEntradas += ' AND e.id = ?';
    queryParams.push(entradaId);
  }

  const entradas = db.prepare(queryEntradas).all(...queryParams);
  if (entradas.length === 0) {
    return res.status(404).send('No se encontraron entradas vigentes para generar el PDF');
  }

  const entradasParaPdf = entradas.map((e) => ({
    codigo: e.codigo,
    qrToken: signQrToken(e.id),
    ubicacion: e.mesa && e.silla ? `Mesa ${e.mesa} · Silla ${e.silla}` : null,
  }));

  try {
    const pdfBytes = await renderEntradasPdf({
      eventoNombre: venta.evento_nombre,
      zonaNombre: venta.zona_nombre,
      clienteNombre: venta.cliente_nombre,
      precioUnitarioCentavos: venta.precio_unitario_centavos,
      metodoPagoEtiqueta: pago ? metodoLabels[pago.metodo] : 'Registrado',
      entradas: entradasParaPdf,
    });

    const filename = entradas.length === 1 ? `entrada-${entradas[0].codigo}.pdf` : `entradas-${venta.codigo}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Error al generar PDF:', err);
    return res.status(500).send('Error al generar el documento PDF');
  }
});

// ----------------------------------------------------
// ----------------------------------------------------
// 4. CONTROL DE ACCESO (Motor de Escaneo y Detección de Repetidos)
// ----------------------------------------------------
apiRouter.get('/control/stats', requireAuth, requirePermiso('VALIDAR_ENTRADAS'), (req, res) => {
  const evento = db.prepare('SELECT id FROM eventos WHERE activo = 1 LIMIT 1').get();
  const eventoId = evento?.id || '';

  const ingresadosRow = db.prepare(`
    SELECT COUNT(e.id) as count
    FROM entradas e
    JOIN zonas z ON e.zona_id = z.id
    WHERE z.evento_id = ? AND e.estado = 'USADA'
  `).get(eventoId);

  const rechazadosRow = db.prepare(`
    SELECT COUNT(id) as count
    FROM accesos_log
    WHERE resultado != 'ADMITIDA'
  `).get();

  const ultimos = db.prepare(`
    SELECT l.*, u.nombre as validada_por_nombre
    FROM accesos_log l
    LEFT JOIN usuarios u ON l.registrado_por_id = u.id
    ORDER BY l.registrado_en DESC
    LIMIT 15
  `).all();

  return res.json({
    totalIngresados: ingresadosRow?.count || 0,
    totalRechazados: rechazadosRow?.count || 0,
    ultimos: ultimos.map((item) => ({
      id: item.id,
      codigo: item.codigo,
      resultado: item.resultado,
      mensaje: item.mensaje,
      clienteNombre: item.cliente_nombre,
      zonaNombre: item.zona_nombre,
      ubicacion: item.ubicacion,
      intentos: item.intentos,
      validadaPor: item.validada_por_nombre,
      registradoEn: item.registrado_en,
    })),
  });
});

apiRouter.post('/control/validar', requireAuth, requirePermiso('VALIDAR_ENTRADAS'), (req, res) => {
  const { lectura } = req.body || {};
  if (!lectura || typeof lectura !== 'string' || !lectura.trim()) {
    return res.status(400).json({ error: 'Lectura vacía' });
  }

  let valor = lectura.trim();

  // Si el QR contiene una URL (ej: https://.../resultado.php?codigo=XYZ o ?data=XYZ o ?token=RELA1...)
  if (/^https?:\/\//i.test(valor)) {
    try {
      const parsedUrl = new URL(valor);
      const param =
        parsedUrl.searchParams.get('token') ||
        parsedUrl.searchParams.get('codigo') ||
        parsedUrl.searchParams.get('ticket') ||
        parsedUrl.searchParams.get('data') ||
        parsedUrl.searchParams.get('id') ||
        parsedUrl.searchParams.get('num');
      if (param) {
        valor = param.trim();
      } else {
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart.length <= 60) {
          valor = decodeURIComponent(lastPart).trim();
        }
      }
    } catch {}
  }

  // Quitar prefijo '#' si el usuario escribió '#VIP-M1...'
  if (valor.startsWith('#')) {
    valor = valor.slice(1).trim();
  }

  const ahora = new Date().toISOString();
  let entrada = null;

  if (looksLikeToken(valor)) {
    const entradaId = verifyQrToken(valor);
    if (!entradaId) {
      // Registro en log
      db.prepare(`
        INSERT INTO accesos_log (id, codigo, resultado, mensaje, intentos, registrado_por_id, registrado_en)
        VALUES (?, ?, 'QR_INVALIDO', 'Firma QR no válida o falsificada', 1, ?, ?)
      `).run(crypto.randomUUID(), valor, req.user.id, ahora);

      return res.json({
        tipo: 'QR_INVALIDO',
        codigo: valor,
        mensaje: 'Código QR no válido o firma falsificada.',
      });
    }

    entrada = db.prepare(`
      SELECT e.*, z.nombre as zona_nombre, a.mesa, a.silla, v.cliente_nombre,
             u.nombre as validada_por_nombre
      FROM entradas e
      JOIN zonas z ON e.zona_id = z.id
      JOIN ventas v ON e.venta_id = v.id
      LEFT JOIN asientos a ON e.asiento_id = a.id
      LEFT JOIN usuarios u ON e.validada_por_id = u.id
      WHERE e.id = ?
    `).get(entradaId);
  } else {
    // Buscar por código exacto o case-insensitive
    const valorNorm = valor.toUpperCase();
    entrada = db.prepare(`
      SELECT e.*, z.nombre as zona_nombre, a.mesa, a.silla, v.cliente_nombre,
             u.nombre as validada_por_nombre
      FROM entradas e
      JOIN zonas z ON e.zona_id = z.id
      JOIN ventas v ON e.venta_id = v.id
      LEFT JOIN asientos a ON e.asiento_id = a.id
      LEFT JOIN usuarios u ON e.validada_por_id = u.id
      WHERE UPPER(e.codigo) = ?
    `).get(valorNorm);
  }

  if (!entrada) {
    db.prepare(`
      INSERT INTO accesos_log (id, codigo, resultado, mensaje, intentos, registrado_por_id, registrado_en)
      VALUES (?, ?, 'NO_ENCONTRADA', 'Entrada no encontrada en el sistema', 1, ?, ?)
    `).run(crypto.randomUUID(), valor, req.user.id, ahora);

    return res.json({
      tipo: 'NO_ENCONTRADA',
      codigo: valor,
      mensaje: 'Entrada no encontrada en el sistema.',
    });
  }

  const ubicacion = entrada.mesa && entrada.silla ? `Mesa ${entrada.mesa} · Silla ${entrada.silla}` : 'Sector General';
  const datosEntrada = {
    id: entrada.id,
    codigo: entrada.codigo,
    zonaNombre: entrada.zona_nombre,
    clienteNombre: entrada.cliente_nombre,
    ubicacion,
    estado: entrada.estado,
    usadaEn: entrada.usada_en,
    validadaPor: entrada.validada_por_nombre,
    primerIngresoEn: entrada.usada_en,
    totalIntentos: Number(entrada.intentos_ingreso || 1),
  };

  // CASO 1: ENTRADA ANULADA
  if (entrada.estado === 'ANULADA') {
    const nuevosIntentos = (entrada.intentos_ingreso || 0) + 1;
    db.prepare('UPDATE entradas SET intentos_ingreso = ?, ultimo_intento_en = ? WHERE id = ?').run(nuevosIntentos, ahora, entrada.id);

    db.prepare(`
      INSERT INTO accesos_log (id, codigo, entrada_id, resultado, mensaje, cliente_nombre, zona_nombre, ubicacion, intentos, registrado_por_id, registrado_en)
      VALUES (?, ?, ?, 'ANULADA', 'Intento con entrada anulada', ?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), entrada.codigo, entrada.id, entrada.cliente_nombre, entrada.zona_nombre, ubicacion, nuevosIntentos, req.user.id, ahora);

    datosEntrada.totalIntentos = nuevosIntentos;
    return res.json({
      tipo: 'ANULADA',
      entrada: datosEntrada,
      mensaje: 'Esta entrada fue anulada por la administración.',
    });
  }

  // CASO 2: ENTRADA YA USADA (DUPLICADO / REPETIDO)
  if (entrada.estado === 'USADA') {
    const nuevosIntentos = (entrada.intentos_ingreso || 1) + 1;
    db.prepare('UPDATE entradas SET intentos_ingreso = ?, ultimo_intento_en = ? WHERE id = ?').run(nuevosIntentos, ahora, entrada.id);

    db.prepare(`
      INSERT INTO accesos_log (id, codigo, entrada_id, resultado, mensaje, cliente_nombre, zona_nombre, ubicacion, intentos, registrado_por_id, registrado_en)
      VALUES (?, ?, ?, 'YA_USADA', 'Intento de reingreso con entrada ya utilizada', ?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), entrada.codigo, entrada.id, entrada.cliente_nombre, entrada.zona_nombre, ubicacion, nuevosIntentos, req.user.id, ahora);

    datosEntrada.totalIntentos = nuevosIntentos;
    datosEntrada.ultimoIntentoEn = ahora;
    return res.json({
      tipo: 'YA_USADA',
      entrada: datosEntrada,
      mensaje: '¡Atención! Esta entrada ya ingresó previamente.',
    });
  }

  // CASO 3: PRIMER INGRESO (VÁLIDA)
  const up = db.prepare(`
    UPDATE entradas
    SET estado = 'USADA', usada_en = ?, validada_por_id = ?, intentos_ingreso = 1, ultimo_intento_en = ?
    WHERE id = ? AND estado = 'VALIDA'
  `).run(ahora, req.user.id, ahora, entrada.id);

  if (up.changes === 0) {
    // Si otro validador la marcó exactamente al mismo milisegundo
    return res.json({
      tipo: 'YA_USADA',
      entrada: {
        ...datosEntrada,
        totalIntentos: 2,
        ultimoIntentoEn: ahora,
      },
      mensaje: 'Esta entrada acaba de ser registrada en otra puerta.',
    });
  }

  // Registro exitoso en log
  db.prepare(`
    INSERT INTO accesos_log (id, codigo, entrada_id, resultado, mensaje, cliente_nombre, zona_nombre, ubicacion, intentos, registrado_por_id, registrado_en)
    VALUES (?, ?, ?, 'ADMITIDA', 'Primer ingreso permitido', ?, ?, ?, 1, ?, ?)
  `).run(crypto.randomUUID(), entrada.codigo, entrada.id, entrada.cliente_nombre, entrada.zona_nombre, ubicacion, req.user.id, ahora);

  datosEntrada.estado = 'USADA';
  datosEntrada.usadaEn = ahora;
  datosEntrada.primerIngresoEn = ahora;
  datosEntrada.totalIntentos = 1;
  datosEntrada.validadaPor = req.user.nombre;

  return res.json({
    tipo: 'ADMITIDA',
    entrada: datosEntrada,
    mensaje: '¡Acceso permitido! Bienvenido al evento.',
  });
});

// Exportar historial de asistencia a CSV
apiRouter.get('/control/exportar-asistencia', requireAuth, requirePermiso('VALIDAR_ENTRADAS'), (req, res) => {
  const registros = db.prepare(`
    SELECT l.id, l.codigo, l.resultado, l.cliente_nombre, l.zona_nombre, l.ubicacion,
           l.intentos, l.registrado_en, u.nombre as operador_nombre
    FROM accesos_log l
    LEFT JOIN usuarios u ON l.registrado_por_id = u.id
    ORDER BY l.registrado_en DESC
  `).all();

  // Encabezados con BOM UTF-8 para que Excel lo abra con acentos
  let csv = '\uFEFF';
  csv += 'ID,Código,Resultado,Cliente,Zona,Ubicación,Intentos,Fecha y Hora,Operador\n';

  for (const r of registros) {
    const fila = [
      r.id,
      `"${(r.codigo || '').replace(/"/g, '""')}"`,
      r.resultado,
      `"${(r.cliente_nombre || '').replace(/"/g, '""')}"`,
      `"${(r.zona_nombre || '').replace(/"/g, '""')}"`,
      `"${(r.ubicacion || '').replace(/"/g, '""')}"`,
      r.intentos,
      r.registrado_en,
      `"${(r.operador_nombre || '').replace(/"/g, '""')}"`,
    ];
    csv += fila.join(',') + '\n';
  }

  const filename = `asistencia-puerta-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csv);
});

// Reiniciar accesos (Solo Administradores)
apiRouter.post('/control/reiniciar', requireAuth, requirePermiso('ANULAR_VENTAS'), (req, res) => {
  db.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    // Restablecer entradas usadas a válidas
    db.prepare(`
      UPDATE entradas
      SET estado = 'VALIDA', usada_en = NULL, validada_por_id = NULL, intentos_ingreso = 0, ultimo_intento_en = NULL
      WHERE estado = 'USADA'
    `).run();

    // Limpiar log de accesos
    db.prepare('DELETE FROM accesos_log').run();

    db.exec('COMMIT;');
    return res.json({ ok: true, message: 'Accesos reiniciados con éxito' });
  } catch (err) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ error: 'Error al reiniciar accesos: ' + err.message });
  }
});

// ----------------------------------------------------
// 5. ADMINISTRACIÓN
// ----------------------------------------------------
apiRouter.get('/admin/resumen', requireAuth, requirePermiso('VER_RESUMEN'), (req, res) => {
  const evento = db.prepare('SELECT id, nombre FROM eventos WHERE activo = 1 LIMIT 1').get();
  if (!evento) {
    return res.json({ resumen: null });
  }

  // Zonas
  const zonas = db.prepare(`
    SELECT z.id as zona_id, z.nombre as zona_nombre, z.capacidad, z.disponibles,
           COALESCE(SUM(v.cantidad), 0) as entradas_vendidas,
           COUNT(v.id) as ventas,
           COALESCE(SUM(v.total_centavos), 0) as recaudado_centavos
    FROM zonas z
    LEFT JOIN ventas v ON z.id = v.zona_id AND v.estado = 'CONFIRMADA'
    WHERE z.evento_id = ?
    GROUP BY z.id
    ORDER BY z.orden ASC
  `).all(evento.id);

  // Métodos de pago
  const metodosPago = db.prepare(`
    SELECT p.metodo, COUNT(p.id) as pagos, SUM(p.monto_centavos) as monto_centavos
    FROM pagos p
    JOIN ventas v ON p.venta_id = v.id
    WHERE v.evento_id = ? AND v.estado = 'CONFIRMADA'
    GROUP BY p.metodo
    ORDER BY p.metodo ASC
  `).all(evento.id);

  // Vendedores
  const vendedores = db.prepare(`
    SELECT u.id as vendedor_id, u.nombre as vendedor_nombre, u.rol,
           COUNT(v.id) as ventas,
           COALESCE(SUM(v.cantidad), 0) as entradas,
           COALESCE(SUM(v.total_centavos), 0) as monto_centavos
    FROM ventas v
    JOIN usuarios u ON v.vendedor_id = u.id
    WHERE v.evento_id = ? AND v.estado = 'CONFIRMADA'
    GROUP BY v.vendedor_id
    ORDER BY monto_centavos DESC
  `).all(evento.id);

  // Ingresados
  const ingresadosRow = db.prepare(`
    SELECT COUNT(e.id) as count
    FROM entradas e
    JOIN zonas z ON e.zona_id = z.id
    WHERE z.evento_id = ? AND e.estado = 'USADA'
  `).get(evento.id);

  const entradasIngresadas = ingresadosRow?.count || 0;
  const recaudacionTotalCentavos = zonas.reduce((acc, z) => acc + Number(z.recaudado_centavos || 0), 0);
  const entradasVendidas = zonas.reduce((acc, z) => acc + Number(z.entradas_vendidas || 0), 0);
  const totalVentas = zonas.reduce((acc, z) => acc + Number(z.ventas || 0), 0);

  return res.json({
    eventoNombre: evento.nombre,
    totales: {
      recaudacionTotalCentavos,
      entradasVendidas,
      entradasIngresadas,
      totalVentas,
    },
    porZona: zonas.map((z) => ({
      zonaId: z.zona_id,
      zonaNombre: z.zona_nombre,
      capacidad: z.capacidad,
      disponibles: z.disponibles,
      entradasVendidas: z.entradas_vendidas,
      ventas: z.ventas,
      recaudadoCentavos: z.recaudado_centavos,
    })),
    porMetodoPago: metodosPago.map((m) => ({
      metodo: m.metodo,
      pagos: m.pagos,
      montoCentavos: m.monto_centavos,
    })),
    porVendedor: vendedores.map((v) => ({
      vendedorId: v.vendedor_id,
      vendedorNombre: v.vendedor_nombre,
      rol: v.rol,
      ventas: v.ventas,
      entradas: v.entradas,
      montoCentavos: v.monto_centavos,
    })),
  });
});

apiRouter.patch('/admin/zonas/:id', requireAuth, requirePermiso('CONFIGURAR_ZONAS'), (req, res) => {
  const { precioCentavos, habilitada } = req.body || {};

  const zona = db.prepare('SELECT * FROM zonas WHERE id = ?').get(req.params.id);
  if (!zona) {
    return res.status(404).json({ error: 'Zona no encontrada' });
  }

  const nuevoPrecio = precioCentavos !== undefined ? (precioCentavos === null ? null : Math.max(0, Number(precioCentavos))) : zona.precio_centavos;
  const nuevaHabilitada = habilitada !== undefined ? (habilitada ? 1 : 0) : zona.habilitada;

  db.prepare(`
    UPDATE zonas
    SET precio_centavos = ?, habilitada = ?
    WHERE id = ?
  `).run(nuevoPrecio, nuevaHabilitada, zona.id);

  return res.json({ ok: true });
});

apiRouter.get('/admin/usuarios', requireAuth, requirePermiso('GESTIONAR_USUARIOS'), (req, res) => {
  const usuarios = db.prepare(`
    SELECT id, nombre, email, rol, activo, creado_en
    FROM usuarios
    ORDER BY nombre ASC
  `).all();

  return res.json({
    usuarios: usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      activo: Boolean(u.activo),
      creadoEn: u.creado_en,
    })),
  });
});

apiRouter.post('/admin/usuarios', requireAuth, requirePermiso('GESTIONAR_USUARIOS'), (req, res) => {
  const { nombre, email, password, rol } = req.body || {};
  if (!nombre?.trim() || !email?.trim() || !password?.trim() || !rol) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const rolesPermitidos = ['ADMIN', 'VENDEDOR', 'RELACIONADOR', 'CONTROL'];
  if (!rolesPermitidos.includes(rol)) {
    return res.status(400).json({ error: 'Rol no válido' });
  }

  const emailNorm = email.toLowerCase().trim();
  const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(emailNorm);
  if (existente) {
    return res.status(400).json({ error: 'Ya existe un usuario con ese correo electrónico' });
  }

  const passwordHash = hashPassword(password);
  const nuevoId = crypto.randomUUID();

  db.prepare(`
    INSERT INTO usuarios (id, nombre, email, password_hash, rol, activo)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(nuevoId, nombre.trim(), emailNorm, passwordHash, rol);

  return res.json({
    usuario: {
      id: nuevoId,
      nombre: nombre.trim(),
      email: emailNorm,
      rol,
      activo: true,
    },
  });
});

apiRouter.post('/admin/usuarios/:id/toggle', requireAuth, requirePermiso('GESTIONAR_USUARIOS'), (req, res) => {
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  if (usuario.id === req.user.id) {
    return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
  }

  const nuevoEstado = usuario.activo ? 0 : 1;
  db.prepare('UPDATE usuarios SET activo = ? WHERE id = ?').run(nuevoEstado, usuario.id);

  if (!nuevoEstado) {
    // Si se desactivó, cerrar todas sus sesiones activas
    db.prepare('DELETE FROM sesiones WHERE usuario_id = ?').run(usuario.id);
  }

  return res.json({ ok: true, activo: Boolean(nuevoEstado) });
});
