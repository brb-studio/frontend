## 1. Ruteo
- [x] 1.1 `isMarketingHost` + pruebas (IPs nunca, puerto opcional)
- [x] 1.2 `proxy.ts`: rewrite en host de marketing, 404 de `/site/*` fuera de él, pruebas
- [x] 1.3 Root layout `(marketing)/site/[lang]` con fuentes propias, metadata, hreflang, canonical
- [x] 1.4 `manifest.ts`, `robots.ts`, `sitemap.ts` según host

## 2. Contenido
- [x] 2.1 Secciones S1–S9 en `widgets/landing`, copy es/en
- [x] 2.2 Catálogo de capturas con marco de reemplazo
- [x] 2.3 Aviso de privacidad de brb-studio + `shared/ui/legal.tsx` (refactor del aviso de la barbería)
- [x] 2.4 Imagen OG
- [x] 2.5 Prueba de contraste de la paleta

## 3. Pendiente para lanzar
- [ ] 3.1 Número de WhatsApp y correo (`MARKETING_WHATSAPP`, `MARKETING_EMAIL`)
- [ ] 3.2 Identidad legal: razón social, domicilio y contacto ARCO en `MARKETING_LEGAL`; revisión legal del aviso
- [x] 3.3 Capturas reales en `public/landing/shots/`
- [ ] 3.4 Dominio de producción en `MARKETING_HOSTS` / `MARKETING_URL`
- [ ] 3.5 e2e `tests/e2e/marketing.spec.ts` en verde (chromium y webkit)
