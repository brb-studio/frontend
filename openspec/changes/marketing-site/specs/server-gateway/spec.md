## ADDED Requirements

### Requirement: Host de marketing
Un host listado en `MARKETING_HOSTS` MUST mostrar la landing de brb-studio y no consultar ninguna barbería. Una IP nunca cuenta como host de marketing, y `/site/*` MUST responder 404 a cualquier petición directa.

#### Scenario: Landing en www
- **WHEN** `MARKETING_HOSTS=www.localhost` y alguien abre `http://www.localhost:3000`
- **THEN** ve la landing de brb-studio y el servidor no consulta ninguna barbería

#### Scenario: Las barberías no cambian
- **WHEN** `MARKETING_HOSTS=www.localhost` y alguien abre `http://localhost:3000` o `http://127.0.0.1:3000`
- **THEN** ve la barbería de `DEFAULT_TENANT_HOST`, y `/site/es` responde 404
