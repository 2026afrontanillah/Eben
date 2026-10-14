# Guía de Despliegue en Render y Railway (Sin Docker)

Este proyecto está preparado para desplegarse en plataformas de Node.js en la nube como **Render** o **Railway** en menos de 3 minutos, manteniendo la base de datos **SQLite local** sin requerir Docker ni bases de datos externas.

---

## Opción 1: Despliegue en Render (Recomendado y Gratuito)

Render ofrece un plan gratuito para aplicaciones web con soporte nativo de Node.js.

### Pasos:

1. **Sube tu proyecto a GitHub**:
   - Crea un repositorio en [github.com](https://github.com) (público o privado).
   - Sube los archivos del proyecto a tu repositorio.

2. **Crea una cuenta en Render**:
   - Entra a [render.com](https://render.com) e inicia sesión con tu cuenta de GitHub.

3. **Crea un nuevo Web Service**:
   - Haz clic en **"New +"** y selecciona **"Web Service"**.
   - Conecta tu repositorio de GitHub `rela-entradas`.

4. **Configura los datos del servicio**:
   - **Name**: `rela-entradas` (o el nombre que prefieras).
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan Type**: `Free`

5. **Variables de Entorno (Environment Variables)**:
   - Haz clic en **"Add Environment Variable"** y añade:
     - `NODE_ENV` = `production`
     - `QR_ENTRADAS_SECRET` = `x8K2vM9pL4wQ7zR1tY6uI3oP5aS0dF8gH2jK4lZ7xV9bN1mC3vB5n` (o una clave secreta aleatoria de al menos 32 caracteres).
     - `SEED_ADMIN_EMAIL` = `admin@rela.bo` (opcional, por defecto es este).
     - `SEED_ADMIN_PASSWORD` = `tu-contrasena-segura` (la contraseña que usarás para entrar).

6. **Desplegar**:
   - Haz clic en **"Deploy Web Service"**.
   - Render instalará las dependencias, compilará el frontend y levantará el servidor Node.js.
   - En 1-2 minutos te entregará una URL con HTTPS gratuito (ejemplo: `https://rela-entradas.onrender.com`).

*(Opcional en Render)*: Si deseas que la base de datos persista incluso si reinstalas el servicio, en la pestaña **Disks** puedes agregar un disco de 1 GB montado en `/opt/render/project/src/data`.

---

## Opción 2: Despliegue en Railway

Railway es otra excelente opción que detecta automáticamente proyectos Node.js:

1. Entra a [railway.com](https://railway.com) e inicia sesión con GitHub.
2. Haz clic en **"New Project"** -> **"Deploy from GitHub repo"**.
3. Selecciona tu repositorio.
4. En **Variables**, agrega:
   - `NODE_ENV` = `production`
   - `QR_ENTRADAS_SECRET` = `x8K2vM9pL4wQ7zR1tY6uI3oP5aS0dF8gH2jK4lZ7xV9bN1mC3vB5n`
   - `SEED_ADMIN_EMAIL` = `admin@rela.bo`
   - `SEED_ADMIN_PASSWORD` = `tu-contrasena-segura`
5. En **Settings** -> **Networking**, haz clic en **"Generate Domain"** para obtener tu URL pública.
6. ¡Listo! Tu sistema estará online inmediatamente.
