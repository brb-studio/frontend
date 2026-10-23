## MODIFIED Requirements

### Requirement: Barbería por host
(Se agrega el escenario siguiente; el resto del requisito no cambia.)

#### Scenario: Host de marketing
- **WHEN** `MARKETING_HOSTS=www.localhost` y alguien abre `http://www.localhost:3000`
- **THEN** ve la landing de brb-studio y el servidor no consulta ninguna barbería; `http://localhost:3000` y `http://127.0.0.1:3000` siguen mostrando la barbería de `DEFAULT_TENANT_HOST`
