# server-gateway Specification

## Purpose
El servidor de Next es la única puerta entre el navegador y el API: decide la barbería por el host, guarda la sesión, informa la IP real del visitante y valida cada respuesta. Código: `src/shared/api/backend.ts`, `src/app/api/` y las Server Actions.

## Requirements

### Requirement: El navegador nunca llama al API
El navegador SHALL hablar solo con este servidor, a través de Server Components, route handlers en `/api/*` y Server Actions. La URL del API (`BACKEND_URL`) MUST quedarse en el servidor, así que no hay CORS que abrir.

#### Scenario: Componente de cliente que necesita datos
- **WHEN** un componente del navegador consulta disponibilidad
- **THEN** llama a `/api/availability` de este sitio y nunca al API directamente

### Requirement: Sesión en cookie httpOnly
El token de sesión SHALL guardarse en la cookie `ms_session` con `httpOnly`, `sameSite=lax`, ruta `/` y `secure` en producción. El servidor la reenvía al API como `Authorization: Bearer`. Ningún script de la página MUST poder leerla.

#### Scenario: Script en la página
- **WHEN** un script lee `document.cookie`
- **THEN** no aparece `ms_session`

### Requirement: Barbería por host
El servidor SHALL elegir la barbería así:
1. Con `TENANT_HOST`, todas las peticiones van a esa barbería.
2. Si no, se usa el host del visitante.
3. Un host sin barbería (`localhost` o una IP) usa `DEFAULT_TENANT_HOST` si existe.

En producción, `DEFAULT_TENANT_HOST` MUST quedar vacío para que un host desconocido sea 404.

#### Scenario: Desarrollo en localhost
- **WHEN** `DEFAULT_TENANT_HOST=magicstudio.localhost` y alguien abre `http://localhost:3000`
- **THEN** ve la barbería MagicStudio

#### Scenario: Subdominio de otra barbería
- **WHEN** alguien abre `http://elite.localhost:3000`
- **THEN** ve la barbería Elite, aunque exista `DEFAULT_TENANT_HOST`

### Requirement: IP real del visitante
El servidor SHALL tomar la IP del visitante contando `TRUSTED_PROXY_HOPS` entradas (por defecto 1) desde la derecha de `X-Forwarded-For`: ahí está lo que escribieron los proxies propios. Todo lo que está a la izquierda lo escribió el cliente y MUST ignorarse. Solo envía la IP al API junto con `PROXY_SECRET`. Si el valor no parece una IP, no envía nada.

#### Scenario: Cabecera falsificada detrás de un proxy
- **WHEN** llega `X-Forwarded-For: 6.6.6.6, 203.0.113.7` y hay un proxy propio
- **THEN** la IP enviada al API es `203.0.113.7`

### Requirement: Respuestas validadas y fallas controladas
Cada respuesta del API SHALL validarse con Zod antes de usarse. Un error del API conserva su código. Una falla de red o un tiempo agotado (10 segundos) MUST convertirse en 503 `UNAVAILABLE`, nunca en un error sin manejar.

#### Scenario: API apagado
- **WHEN** el API no responde
- **THEN** las pantallas muestran su mensaje de "no disponible" en lugar de romperse

### Requirement: Accesos del panel restringidos
El proxy de lectura del panel (`GET /api/admin/*`) y la acción de escritura (`adminRequest`, solo `POST`, `PATCH` y `DELETE`) SHALL aceptar únicamente rutas de una lista permitida de recursos del staff, como mucho con un id. Cualquier otra ruta MUST responder 404 o ser rechazada sin llegar al API.

#### Scenario: Ruta fuera de la lista
- **WHEN** el navegador pide `/api/admin/billing`
- **THEN** la respuesta es 404 y no se llama al API

### Requirement: Proxy de fotos
`/api/images/[id]` SHALL aceptar solo ids con el formato de 22 caracteres y devolver solo imágenes JPEG, PNG o WebP, con caché de un año. Un id inválido responde 404.

#### Scenario: Id con caracteres raros
- **WHEN** se pide `/api/images/..%2Fadmin`
- **THEN** la respuesta es 404 y no se llama al API
