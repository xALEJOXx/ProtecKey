
# ProtecKey

## Sistema de detección de tráfico de red potencialmente malicioso

ProtecKey es un prototipo de ciberseguridad que utiliza aprendizaje automático para analizar registros de tráfico de red y clasificarlos como normales o potencialmente maliciosos.

El sistema ofrece una interfaz web sencilla que permite realizar análisis individuales y por lotes, consultar resultados, evaluar predicciones cuando se conoce la clasificación real y conservar un historial de los análisis realizados.

## Objetivo

Desarrollar una herramienta de apoyo para el análisis de tráfico de red mediante un modelo de aprendizaje automático, facilitando la identificación de comportamientos potencialmente maliciosos y la interpretación de los resultados.

## Tecnologías utilizadas

| Tecnología | Función |
|---|---|
| React y Vite | Interfaz web |
| Python y FastAPI | API Gateway y microservicios |
| LightGBM | Clasificación del tráfico de red |
| Pandas y scikit-learn | Procesamiento y predicción |
| PostgreSQL | Almacenamiento de resultados |
| Docker y Docker Compose | Contenerización y ejecución del sistema |

## Arquitectura

ProtecKey utiliza una arquitectura basada en microservicios:

- **Frontend:** permite interactuar con el sistema desde el navegador.
- **API Gateway:** recibe las solicitudes del frontend y coordina los servicios.
- **Data Service:** valida los datos y gestiona los análisis individuales.
- **Detection Service:** utiliza el modelo LightGBM para realizar predicciones.
- **Evaluation Service:** proporciona métricas para evaluar resultados.
- **PostgreSQL:** almacena los análisis individuales y por lotes.

## Funcionalidades principales

### Análisis individual

Permite analizar un registro de tráfico de red mediante un formulario guiado o un archivo CSV.

El modelo utiliza 42 características para clasificar el registro como:

- Normal (0).
- Potencialmente malicioso (1).

Cuando se proporciona la etiqueta real, el sistema también permite identificar el resultado de evaluación como TP, TN, FP o FN.

### Análisis por lotes

Permite procesar múltiples registros de tráfico mediante archivos CSV.

El sistema presenta:

- Cantidad total de registros analizados.
- Número de registros normales.
- Número de registros potencialmente maliciosos.
- Porcentaje de registros potencialmente maliciosos.
- Métricas de evaluación cuando existen etiquetas reales.

### Historial de análisis

Los resultados se almacenan en PostgreSQL y pueden consultarse posteriormente.

Se dispone de historiales para análisis individuales y análisis por lotes.

### Panel de inicio

Presenta un resumen de los análisis individuales registrados, incluyendo cantidades y distribución de clasificaciones.

## Modelo de aprendizaje automático

ProtecKey utiliza un modelo LightGBM entrenado a partir del conjunto de datos UNSW-NB15.

El modelo se encuentra en:

`models/modelo_proteckey_lightgbm.joblib`

Las predicciones representan una clasificación automatizada y no constituyen una confirmación definitiva de que se haya producido un ataque.

## Requisitos para ejecutar el proyecto

Para utilizar ProtecKey mediante contenedores se necesita:

- Docker Desktop con el motor de Docker en funcionamiento.
- Docker Compose.
- Puertos 5173 y 8000 disponibles.
- Puerto 5433 disponible si se utiliza la configuración de PostgreSQL incluida.

No es necesario instalar manualmente Python, Node.js ni PostgreSQL para ejecutar la versión contenerizada.

## Ejecución mediante Docker

### 1. Obtener el proyecto

Descargar o clonar el repositorio y abrir una terminal en la carpeta principal de ProtecKey.

### 2. Configurar las variables de entorno

Crear un archivo `.env` en la raíz del proyecto.

Configurar una contraseña segura para PostgreSQL:

```dotenv
POSTGRES_PASSWORD=CAMBIAR_POR_UNA_CONTRASENA_SEGURA
```

No publicar contraseñas reales ni incluir el archivo `.env` en el repositorio.

### 3. Construir las imágenes

```bash
docker compose build
```

### 4. Iniciar los contenedores

```bash
docker compose up -d
```

### 5. Verificar los servicios

```bash
docker compose ps
```

### 6. Acceder a ProtecKey

Frontend:

http://localhost:5173

Documentación de API Gateway:

http://localhost:8000/docs

## Comandos útiles de Docker

Ver los registros de ejecución:

```bash
docker compose logs --tail=50
```

Reiniciar los servicios:

```bash
docker compose restart
```

Detener los contenedores:

```bash
docker compose down
```

Iniciar nuevamente:

```bash
docker compose up -d
```

Reconstruir después de modificar el código:

```bash
docker compose up -d --build
```

## Persistencia de datos

PostgreSQL utiliza un volumen de Docker para conservar los resultados.

Los análisis permanecen almacenados aunque los contenedores se detengan o se vuelvan a crear, siempre que se conserve el volumen.

**Advertencia:** el comando `docker compose down -v` elimina los volúmenes asociados y puede borrar el historial almacenado en PostgreSQL.

## Estructura principal

```text
ProtecKey/
├── frontend/
├── services/
│   ├── api_gateway/
│   ├── data_service/
│   ├── detection_service/
│   ├── evaluation_service/
│   └── database/
│       └── init/
│           └── init.sql
├── models/
├── data/
├── notebooks/
├── docs/
├── tests/
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Limitaciones

ProtecKey es un prototipo académico y no sustituye un sistema profesional de detección de intrusiones.

El desempeño del modelo depende de los datos utilizados, de sus características y de las condiciones en las que se aplique.

La clasificación potencialmente maliciosa debe interpretarse como una señal de apoyo para el análisis de seguridad, no como evidencia concluyente de un ataque.

## Estado del proyecto

El prototipo ha sido ejecutado y probado mediante Docker Compose, verificando:

- Inicio de los seis contenedores.
- Funcionamiento del modelo LightGBM.
- Análisis individual.
- Análisis por lotes.
- Consulta de historiales.
- Persistencia de registros en PostgreSQL después de reiniciar los contenedores.

## Contexto académico

Proyecto desarrollado con fines académicos en el área de Ingeniería de Sistemas, con aplicación de aprendizaje automático, ciberseguridad, desarrollo web y arquitectura de microservicios.
