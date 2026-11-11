# ProtecKey · Frontend SOC

## Alcance y arquitectura revisada

Base: rama main del repositorio xALEJOXx/ProtecKey. El trabajo se realiza en
redesign/frontend-soc. No se han creado commits ni realizado push.

Frontend React 19 / React Router 7 / Vite 8, CSS propio y PapaParse para CSV.
No se añaden dependencias. Se mantienen BrowserRouter, las seis rutas y
LiveMonitorProvider como propietario de la conexión WebSocket /ws/live,
con reconexión y límite de 200 flujos. Los formularios de análisis individual
y por lotes, la página de resultados y los detalles existentes se conservan.

Fuentes revisadas:
- /health: disponibilidad del Gateway; se verifica JSON para evitar un falso
  estado activo cuando Vite devuelve el HTML de la aplicación.
- /api/history: análisis individuales.
- /api/batch-history: lotes y evaluación.
- /api/live/history: conexiones paginadas.
- /api/ml/stats: métricas acumuladas.
- /api/ml/history: predicciones paginadas y alertas.
- /api/ml/predictions/:id: características, evidencias y decisiones.
- /api/analyze y las solicitudes originales de AnalysisForm: sin cambios.
- MonitorControls, monitor-proxy.js y monitor-security.js: sin cambios.

No se modifican servicios Python, Docker, datos, modelos, autenticación,
endpoints ni WhatsApp. Tampoco package.json ni package-lock.json.

## Propuesta implementada

Grafito, cian y azul con contraste claro; rojo y naranja para amenazas.
Paneles bento, iluminación suave y transiciones breves inspiradas en
Aceternity. Implementación propia en CSS/React compatible con las dependencias
actuales; no se instala Aceternity, Tailwind ni Motion. Foco visible y
preferencia de movimiento reducido.

Inicio: estadísticas globales, Network Pulse, distribución de las últimas
100 predicciones (excluye TEST), actividad reciente con inspección y
protocolos de la sesión. Sin datos de demostración. Los errores conservan
los datos previos cuando existen, identificándolos como desactualizados.

Monitoreo: métricas de sesión, control desplegable del sensor, gráfico y tabla
junto a estadísticas y alertas. No se correlacionan artificialmente flujos con
predicciones: conservan sus fuentes, tiempos y significados originales.

Historial: cuatro fuentes en pestañas. Conexiones y detecciones tienen búsqueda,
fecha local, vista de tabla o cronología, filtros de clasificación para ML,
restablecimiento e inspección. Los filtros operan únicamente sobre la página
cargada (se indica en pantalla). Se conserva la paginación del servicio.
El historial individual conserva sus filtros y detalles, amplía la búsqueda
y corrige el HTML inválido de la tabla. Lotes conserva sus métricas y detalles.

Aprende: tres lecciones con flujo visual, preguntas, retroalimentación,
reintentos y progreso de la sesión. No genera ni envía tráfico ni modifica
registros reales. El progreso se reinicia al salir de la pantalla.

## Verificación

- npm ci: completado.
- npm run build: completado con Vite 8.3.5.
- node --test tests/history-utils.test.mjs: 5 pruebas aprobadas.
- ESLint de todos los archivos JS/JSX nuevos y modificados: aprobado.
- git diff --check: aprobado.
- Navegador: navegación por las seis rutas, selección de los dos modos de
  análisis, las cuatro fuentes del historial, búsqueda/restablecimiento,
  cambio de vista, filtro TCP, limpiar vista, desplegable de captura y
  respuestas correctas/incorrectas de Aprende.

Los tests unitarios usan fixtures aislados, nunca servidos por la aplicación.
Las pantallas y capturas no contienen telemetría ficticia.

Limitaciones: aquí no se ejecutan el backend, PostgreSQL ni el sensor Windows.
Las capturas muestran la ausencia real de esos servicios. No se verifican
captura real, login con credenciales de producción, predicciones, persistencia,
alertas WhatsApp ni detalles con registros reales. Deben comprobarse en el
entorno habitual antes de integrar. El diseño incluye breakpoints móviles;
la inspección visual de esta entrega se realiza en escritorio.

El proxy original exige /run/secrets/monitor_control_token y monitor_operator
incluso al compilar. En esta máquina aislada se provisionaron valores efímeros,
sin credenciales de producción, únicamente para cargar la configuración Vite.
No forman parte de los archivos ni modifican la autenticación. Utiliza tus
secretos y el flujo de arranque habituales en tu entorno.

## Aplicar el parche en Windows (PowerShell)

Desde la carpeta de tu repositorio, tras extraer el paquete fuera del repositorio:

```powershell
git status --short --branch
git switch -c redesign/frontend-soc
git apply --check "C:\ruta\ProtecKey_frontend_soc.patch"
git apply "C:\ruta\ProtecKey_frontend_soc.patch"
cd frontend
npm ci
npm run build
node --test tests/history-utils.test.mjs
```

Si ya existe la rama, usa git switch redesign/frontend-soc. Si git apply --check
falla, no fuerces el parche: hay diferencias con la base y deben revisarse.
No uses git reset ni reemplaces archivos con cambios pendientes. El paquete
incluye también los archivos modificados en frontend/ para inspección.
No se realiza ningún commit o push al aplicar el parche.
