# Banquetes Digitales · Front

Front de Banquetes Elegancia (Next.js 16 + React 19 + TypeScript + Tailwind 4). Consume la API
descrita en `Banquetes-Digitales-Back/API_CONTRACT.md`.

- **Sitio público** (`/`): landing, solicitud de reservación y seguimiento por folio (Fase 1, pendiente).
- **Backstage** (`/panel`): un solo panel para el personal; el menú y las acciones dependen del
  rol (`ADMIN` o `LOGISTICS`).

## Requisitos

- Node.js 20+ (probado con 24)
- El back corriendo (por defecto en `http://localhost:3000`)

## Ejecutar en local

```bash
cp .env.example .env.local   # BACKEND_URL=http://localhost:3000
npm install
npm run dev                  # http://localhost:3001
```

El back no habilita CORS y la sesión viaja en la cookie HttpOnly `auth_token`, por eso el front
reenvía `/api/*` al back con un rewrite de Next (`next.config.ts`): el navegador siempre habla
con el mismo origen.

### Levantar el back y la base de datos

En `Banquetes-Digitales-Back` (detalles en `database/dev-local/README.md`):

```bash
docker run -d --name banquetes-db -e POSTGRES_USER=banquetes -e POSTGRES_PASSWORD=banquetes_dev \
  -e POSTGRES_DB=banquetes_db -e TZ=America/Merida -p 127.0.0.1:5434:5432 postgres:18
bash database/dev-local/rebuild.sh banquetes_db
npm install && npm run dev
```

`.env` mínimo del back:

```
PORT=3000
PGHOST=localhost
PGPORT=5434
PGUSER=banquetes
PGPASSWORD=banquetes_dev
PGDATABASE=banquetes_db
JWT_SECRET=<cadena aleatoria>
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=no-reply@banquetes.local
SMTP_PASSWORD=dev
RESET_PASSWORD_URL=http://localhost:3001/restablecer-contrasena
```

Para los correos (recuperación de contraseña, credenciales, propuestas) sirve cualquier SMTP de
prueba, por ejemplo Mailpit: `docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit`
(bandeja en http://localhost:8025).

### Usuario inicial

| Empleado | Contraseña | Rol |
| --- | --- | --- |
| `001` | `Admin123!` | ADMIN (pide cambiarla en el primer acceso) |

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en el puerto 3001 |
| `npm run build` / `npm start` | Build de producción y servidor |
| `npm run lint` | ESLint |
| `npm test` | Pruebas (Vitest) |

## Estructura

```
src/
  app/            rutas: (auth) acceso, panel/ backstage
  components/ui/  kit de componentes
  lib/api/        un módulo por área del contrato (+ http.ts)
  lib/            estados, permisos, fechas (hora de Mérida), validaciones
```
