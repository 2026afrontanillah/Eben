# !eben Producciones · Entradas (Node.js + SQLite)

Sistema interno de venta de entradas para el equipo de **!eben Producciones** (relacionadores y vendedores), migrado a un formato **básico y ligero de Node.js** sin Dockers ni configuraciones complejas.

> **Zero Docker · Base de datos SQLite local**: Todo arranca directamente con Node.js en Windows, Mac o Linux sin tener que instalar PostgreSQL ni contenedores Docker.

## Qué hace

- **Mapa del evento** con disponibilidad en vivo por zona (se actualiza automáticamente cada 10 s).
- **Venta por cantidad** (General, Gradería) y **venta por silla** en mesas numeradas (VIP grande de 140 mesas y VIP pequeño de 70).
- **Sin doble venta**: transacciones atómicas con SQLite (modo WAL) que garantizan que dos vendedores no puedan tomar la misma silla o sobrepasar el cupo disponible.
- **Registro del pago** en cada venta: método (Efectivo, QR, Transferencia, Tarjeta), monto y número de comprobante.
- **Entradas con QR firmado** (HMAC-SHA256) en pantalla y descarga en **PDF generado en el servidor** con el logotipo de !eben.
- **Control de acceso en puerta**: escaneo con cámara del celular (BarcodeDetector API) o ingreso manual de código. Rechaza entradas usadas, anuladas o con QR falsificado.
- **Anulación de ventas** (administradores): libera automáticamente los asientos y el stock e invalida los QR.
- **Administración completa**: gestión de usuarios y roles, edición de precios y habilitación de zonas, y resumen consolidado con KPIs y tablas.

## Stack simple

- **Backend**: Node.js con **Express.js** y **SQLite** nativo (`data/database.sqlite`).
- **Frontend**: **React** con **Vite** y estilos en **Tailwind CSS**.
- **Generación de Entradas**: **pdf-lib** y **qrcode**.
- **Seguridad**: contraseñas encriptadas con scrypt (OWASP), sesiones firmadas con SHA-256 en cookies `httpOnly`, y códigos QR autenticados con HMAC.

---

## Puesta en marcha rápida (1 solo paso)

No necesitas instalar Docker ni ninguna base de datos externa. Solo necesitas Node.js (≥ 20):

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Iniciar la aplicación
npm run dev
```

Abre tu navegador en:
👉 **`http://localhost:3000`**

### Credenciales de Administrador inicial

- **Email**: `admin@rela.bo`
- **Contraseña**: `cambia-esta-contrasena`

*(El sistema crea la base de datos `data/database.sqlite`, el evento Kjarkas 55 años con sus 2.100 sillas VIP y el usuario administrador automáticamente en el primer arranque)*.

---

## Scripts disponibles

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Inicia el servidor Node.js en modo desarrollo con recarga rápida en `http://localhost:3000` |
| `npm run build` | Compila el frontend React para producción en la carpeta `dist/` |
| `npm start` | Inicia el servidor Node.js sirviendo la versión de producción |

---

## Roles y Permisos

| Permiso | Administrador | Vendedor | Relacionador | Control de acceso |
| --- | :---: | :---: | :---: | :---: |
| Vender y ver sus propias ventas | ✓ | ✓ | ✓ | |
| Ver todas las ventas | ✓ | | | |
| Anular ventas | ✓ | | | |
| Validar entradas en puerta | ✓ | | | ✓ |
| Resumen, zonas y usuarios | ✓ | | | |

---

## Estructura del proyecto

```text
├── data/
│   └── database.sqlite      # Base de datos SQLite local (creada automáticamente)
├── server/
│   ├── index.js             # Servidor Express principal
│   ├── db.js                # Inicialización de tablas y datos semilla en SQLite
│   ├── routes.js            # Rutas de la API REST (/api/*)
│   ├── auth-utils.js        # Hashing de contraseñas scrypt y sesiones
│   ├── qr.js                # Firma y verificación HMAC de tokens QR
│   └── pdf.js               # Generador de entradas en PDF con logotipo
├── src/
│   ├── client/              # Vistas y componentes del frontend React
│   │   ├── views/           # EventosView, ZonaPlanoView, VentasView, Control, Admin...
│   │   ├── components/      # Header, Footer, modales
│   │   ├── api.ts           # Cliente fetch para la API
│   │   └── AuthContext.tsx  # Manejador de sesión y permisos
│   ├── features/            # Componentes SVG del plano (Mesas, Sillas, Escenario, QR)
│   └── shared/              # Utilidades de formato, colores de marca y UI
├── public/
│   └── brand/               # Logotipos y fondos de !eben Producciones
├── package.json
└── vite.config.ts
```
