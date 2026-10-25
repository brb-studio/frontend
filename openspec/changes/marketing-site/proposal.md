## Why
brb-studio no tiene dónde explicarse a los dueños de barberías: cada host es una barbería y el dominio raíz da 404. Hace falta una landing bilingüe, honesta (solo lo que el producto hace hoy) y que no toque el árbol de las barberías.

## What Changes
- Segundo root layout `src/app/(marketing)/site/[lang]/` (inicio, `/privacy`, 404 propio, imagen OG). Nunca llama a `getTenant()` ni al API.
- `src/proxy.ts`: si el host está en `MARKETING_HOSTS` (`src/shared/api/marketing-host.ts`), reescribe `/{lang}/…` a `/site/{lang}/…` (la URL no cambia). En cualquier otro host `/site/*` es 404. Las IP nunca son host de marketing.
- Secciones en `src/widgets/landing/`, textos en `src/shared/i18n/landing-{es,en}.ts`, UI legal compartida en `src/shared/ui/legal.tsx` (la usa también el aviso de la barbería).
- `manifest.ts`, `robots.ts` y `sitemap.ts` según el host: la landing no es instalable, es rastreable y es lo único en el sitemap.
- CTA "Agenda una demo" → WhatsApp con mensaje prellenado (`MARKETING_WHATSAPP`), si no correo (`MARKETING_EMAIL`), si no un aviso de "muy pronto". `MARKETING_SHOWCASE_URL` opcional para "Ver una barbería de ejemplo".
- Aviso de privacidad propio de brb-studio en `/{lang}/privacy` del host de marketing; identidad legal en una sola constante (`MARKETING_LEGAL`) con marcadores "Pendiente".

## Decisions
- **Host explícito, no "host sin barbería":** `localhost` y las IP siguen siendo la barbería por defecto (CI usa `127.0.0.1`). Dev: `www.localhost`; e2e: `localhost`.
- **Página estática:** las variables `MARKETING_*` se leen al compilar; cambiarlas pide redeploy.
- **Capturas reales** del tenant de ejemplo Montecobre Barber Co. en `public/landing/shots/`; si falta una, marco vacío con leyenda, nunca UI dibujada.
- **Sin terceros:** fuentes con `next/font`, imágenes propias, una sola isla de cliente (los relojes por sucursal). CSP sin cambios.
- **Claims que no hacemos:** alta autoservicio, cobro con tarjeta de la suscripción, varios planes, anticipos o pagos en línea (Stripe en modo prueba), "cero comisiones" o comisión de plataforma, WhatsApp/SMS como función, CRM, "detecta faltantes" o utilidad, escaneo con cámara. Precio publicado: MXN 300 al mes por SPEI; "empiezas con 14 días de prueba" porque `scripts/tenant-create.ts` crea las barberías en plan `trial` de 14 días.

## Impact
- Specs: `marketing-site` (nuevo), `server-gateway` (escenario de host de marketing).
- Código: ver `tasks.md`. Backend: slugs reservados (`www`, …) en su propio cambio `reserved-tenant-slugs`.
