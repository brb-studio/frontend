# product-stock-panel Specification

## Purpose
Pantalla de existencias por sucursal en Productos del panel. El API y las reglas viven en `../backend/openspec/specs/products/`. Código: `src/features/admin/products-manager.tsx`.

## Requirements

### Requirement: Existencias por sucursal en el panel
Al editar un producto, el owner, admin o encargado SHALL ver un campo de existencias por cada sucursal donde el producto se vende (la suya, o todas las activas). Un campo vacío deja de contar el producto en esa sucursal. Guardar envía solo los campos cambiados, uno por sucursal, con `PUT /products/:id/stock/:branchId`.

#### Scenario: Cambiar existencias de una sucursal
- **WHEN** el admin cambia de 3 a 5 las existencias de Centro y guarda
- **THEN** solo Centro recibe la nueva cantidad y Norte no cambia

#### Scenario: Dejar de contar en una sucursal
- **WHEN** el admin deja vacío el campo de Norte y guarda
- **THEN** el producto deja de contarse en Norte y la lista muestra "sin contar" para esa sucursal

### Requirement: Existencias fuera del formulario de producto
El formulario de alta y de edición del producto MUST NOT incluir existencias. Un producto nuevo empieza sin contar; sus existencias se fijan después, en la edición.

#### Scenario: Alta de producto
- **WHEN** el admin crea un producto
- **THEN** no se pregunta existencias y el producto aparece como "sin contar" hasta que se editen
