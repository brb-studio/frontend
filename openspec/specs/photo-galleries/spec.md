# photo-galleries Specification

## Purpose
Cómo el equipo sube y ordena las fotos de cortes, paquetes, barberos y sucursales, y cómo las ve el cliente. El backend valida tamaño y tipo (spec `media`). Código: `src/features/admin/image-field.tsx`, `uploadImage` en `src/features/admin/actions.ts` y `src/app/[lang]/(app)/services/[slug]/page.tsx`.

## Requirements

### Requirement: Compresión en el navegador
Antes de subir, el navegador SHALL volver a codificar cualquier foto que pueda abrir (incluidas las HEIC del iPhone) como JPEG de máximo 1600 px por lado y 900 KB, bajando la calidad si hace falta. Al recodificar se pierden los metadatos EXIF, como la ubicación GPS. Si el archivo no es una foto legible, MUST mostrarse un error sin subir nada.

#### Scenario: Foto de 12 MB del teléfono
- **WHEN** el owner elige una foto de 12 MB y 4000 px
- **THEN** se sube un JPEG de 1600 px y menos de 900 KB

### Requirement: Galería ordenada con portada
Cada formulario SHALL permitir hasta 12 fotos: elegir varias a la vez, quitar cualquiera y convertir una en portada. La primera es siempre la portada. Las fotos MUST subirse una por una, en el orden en que se eligieron, y el formulario envía `images` con ese orden.

#### Scenario: Elegir tres fotos
- **WHEN** el owner elige tres fotos y después marca la tercera como portada
- **THEN** al guardar, `images` empieza por esa foto

#### Scenario: Límite de fotos
- **WHEN** la galería ya tiene 12 fotos
- **THEN** ya no se ofrece agregar más

### Requirement: Galería para el cliente
El detalle de un servicio o paquete SHALL mostrar todas sus fotos como un carrusel que se desliza con el dedo (solo CSS, sin scripts) y, si hay más de una, la cantidad de fotos. La foto de portada aparece en las tarjetas y la del barbero al elegirlo en la reserva.

#### Scenario: Servicio con cuatro fotos
- **WHEN** un cliente abre un servicio con cuatro fotos
- **THEN** ve la portada, el aviso "4 fotos · desliza" y puede deslizar entre ellas
