# ProtecKey

### Sistema inteligente de detección de amenazas y comportamientos maliciosos

**ProtecKey** es un prototipo académico de ciberseguridad orientado al análisis de posibles amenazas que pueden comprometer la seguridad de entornos donde operan sistemas de inteligencia artificial.

El proyecto integra técnicas de **Machine Learning**, una arquitectura de microservicios y una aplicación web para identificar patrones sospechosos en registros de tráfico de red.

Su implementación actual utiliza un modelo de clasificación entrenado con datos de tráfico normal y malicioso, permitiendo realizar análisis individuales y por lotes, consultar resultados, evaluar predicciones y almacenar un historial de los análisis realizados.

El sistema busca facilitar la comprensión de posibles amenazas mediante una interfaz clara, accesible y sencilla de utilizar.

---

## 1. Descripción del proyecto

La incorporación de inteligencia artificial en diferentes entornos tecnológicos también plantea nuevos desafíos relacionados con la ciberseguridad. Los sistemas que utilizan IA dependen de infraestructuras, servicios y comunicaciones que pueden verse afectados por actividades maliciosas.

**ProtecKey** surge como una propuesta académica para explorar cómo el aprendizaje automático puede contribuir a la identificación de comportamientos sospechosos y apoyar el análisis de seguridad.

Para ello, se desarrolló una aplicación que procesa registros de tráfico de red y utiliza un modelo entrenado para determinar si sus características corresponden a un comportamiento normal o potencialmente malicioso.

El proyecto no pretende sustituir soluciones profesionales de seguridad, sino demostrar la integración de inteligencia artificial, desarrollo de software y análisis de amenazas en un sistema funcional.

## 2. Objetivo

Desarrollar un prototipo de apoyo a la detección de posibles amenazas en entornos tecnológicos asociados con sistemas de inteligencia artificial, mediante un modelo de Machine Learning capaz de clasificar patrones de tráfico de red y facilitar la visualización, evaluación y almacenamiento de resultados.

## 3. Funcionalidades implementadas

### Análisis individual

Permite analizar un registro mediante dos alternativas:

- **Formulario guiado:** ingreso de las características necesarias para realizar la predicción.
- **Archivo CSV:** carga de un registro con las variables requeridas por el modelo.

El sistema utiliza 42 características de entrada y genera una clasificación:

| Resultado | Interpretación |
|---|---|
| **0 — Normal** | El registro presenta características asociadas con tráfico normal. |
| **1 — Potencialmente malicioso** | El registro presenta patrones relacionados con tráfico sospechoso o malicioso. |

Cuando se conoce la clasificación real del registro, también es posible evaluar la predicción mediante los resultados TP, TN, FP o FN.

### Análisis por lotes

Permite cargar archivos CSV que contienen múltiples registros para analizarlos en una misma operación.

Al finalizar, el sistema presenta:

- Cantidad total de registros procesados.
- Número de registros clasificados como normales.
- Número de registros clasificados como potencialmente maliciosos.
- Porcentaje de registros potencialmente maliciosos.
- Métricas de evaluación, cuando el archivo contiene etiquetas reales válidas.

### Historial de resultados

ProtecKey almacena los análisis realizados en una base de datos PostgreSQL.

Se implementaron historiales independientes para:

- Análisis individuales.
- Análisis por lotes.

Esto permite consultar posteriormente los resultados y conservar información de los análisis efectuados.

### Panel de inicio

La aplicación incluye un panel que presenta información resumida de los análisis individuales registrados, como la cantidad de resultados normales y potencialmente maliciosos.

### Sección de aprendizaje

Se incorporó una sección informativa para facilitar la comprensión de conceptos relacionados con el análisis de amenazas y la ciberseguridad.

---

## 4. Tecnologías utilizadas

| Tecnología | Aplicación en ProtecKey |
|---|---|
| **React** | Desarrollo de la interfaz web. |
| **Vite** | Entorno de desarrollo y construcción del frontend. |
| **Python** | Lenguaje utilizado para los servicios backend. |
| **FastAPI** | Implementación de las API y microservicios. |
| **LightGBM** | Modelo de clasificación mediante Machine Learning. |
| **Pandas** | Procesamiento de datos. |
| **scikit-learn** | Herramientas de aprendizaje automático y evaluación. |
| **PostgreSQL** | Almacenamiento persistente de resultados. |
| **Docker** | Creación y ejecución de contenedores. |
| **Docker Compose** | Orquestación de los servicios del sistema. |
| **Git y GitHub** | Control de versiones y alojamiento del código fuente. |

## 5. Arquitectura del sistema

ProtecKey fue desarrollado utilizando una **arquitectura basada en microservicios**, separando las responsabilidades del sistema en componentes independientes.

### Componentes principales

**Frontend**

Aplicación desarrollada con React que permite interactuar con ProtecKey desde el navegador, ingresar datos, ejecutar análisis y consultar resultados.

**API Gateway**

Punto principal de entrada para las solicitudes del frontend. Se encarga de comunicarse con los servicios backend correspondientes.

**Data Service**

Gestiona la validación de los datos recibidos y coordina el procesamiento de los registros que serán analizados.

**Detection Service**

Carga el modelo LightGBM entrenado y genera las predicciones de clasificación.

**Evaluation Service**

Calcula e interpreta los resultados de evaluación cuando se dispone de etiquetas reales.

**PostgreSQL**

Almacena los registros de los análisis individuales y por lotes, permitiendo conservar el historial.

### Comunicación entre componentes

```text
                  USUARIO
                     |
                     v
              FRONTEND (React)
                     |
                     v
               API GATEWAY
                     |
          +----------+-----------+
          |                      |
          v                      v
     DATA SERVICE         EVALUATION SERVICE
          |
          v
   DETECTION SERVICE
          |
          v
    MODELO LIGHTGBM

       POSTGRESQL
  Almacenamiento de resultados
  gestionado desde el backend
```

Los servicios se comunican mediante solicitudes HTTP y se ejecutan en contenedores Docker dentro de la red configurada por Docker Compose.

---

## 6. Modelo de Machine Learning

### Modelo implementado

ProtecKey utiliza un modelo de clasificación basado en **LightGBM**, una técnica de aprendizaje automático que emplea árboles de decisión potenciados por gradiente.

El modelo fue entrenado utilizando información del conjunto de datos **UNSW-NB15**, empleado en investigaciones sobre detección de intrusiones y análisis de tráfico de red.

### Datos utilizados

El conjunto UNSW-NB15 contiene registros de tráfico de red con características que permiten estudiar diferencias entre comunicaciones normales y actividades maliciosas.

El archivo de datos incluido en el repositorio se encuentra en:

`data/UNSW_NB15_testing-set.csv`

### Características de entrada

El modelo implementado utiliza **42 características** para generar sus predicciones.

Antes de realizar el análisis, los datos deben cumplir las condiciones esperadas por el modelo, incluyendo las variables requeridas y sus formatos correspondientes.

### Archivo del modelo

El modelo utilizado por el servicio de detección se encuentra en:

`models/modelo_proteckey_lightgbm.joblib`

El repositorio también incluye:

`models/modelo_proteckey.joblib`

El servicio de detección utiliza el archivo LightGBM indicado anteriormente.

### Interpretación de resultados

Las predicciones se representan mediante dos clases:

- **Normal (0):** comportamiento asociado a tráfico normal.
- **Potencialmente malicioso (1):** comportamiento asociado a patrones sospechosos o maliciosos.

Estas predicciones constituyen un apoyo al análisis y no representan una confirmación definitiva de que haya ocurrido un ataque.

### Alcance del modelo

Aunque ProtecKey se enmarca en el estudio de la seguridad de sistemas de inteligencia artificial, el modelo actual está especializado en la clasificación de registros de tráfico de red.

Por tanto, el prototipo **no detecta directamente ataques específicos contra modelos de IA**, como *prompt injection*, *data poisoning* o ataques adversariales.

Su contribución actual consiste en demostrar cómo el aprendizaje automático puede apoyar la identificación de posibles amenazas de red en infraestructuras tecnológicas, incluidas aquellas donde operan sistemas de IA.

---

## 7. Instalación y ejecución

ProtecKey puede ejecutarse localmente mediante Docker Compose, sin necesidad de instalar manualmente Python, Node.js o PostgreSQL.

### Requisitos previos

- Git.
- Docker Desktop.
- Docker Compose.
- Navegador web.
- Puertos 5173, 8000 y 5433 disponibles.

### Paso 1. Clonar el repositorio

Abre una terminal y ejecuta:

```bash
git clone https://github.com/xALEJOXx/ProtecKey.git
```

Ingresa a la carpeta:

```bash
cd ProtecKey
```

Si el repositorio es privado, necesitarás tener acceso autorizado para clonarlo.

### Paso 2. Configurar las variables de entorno

En la raíz del proyecto encontrarás el archivo:

`.env.example`

Crea una copia llamada `.env`.

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

En Linux o macOS:

```bash
cp .env.example .env
```

Edita el archivo `.env` y establece una contraseña segura para PostgreSQL:

```dotenv
POSTGRES_PASSWORD=CAMBIAR_POR_UNA_CONTRASENA_SEGURA
```

**Importante:** no publiques contraseñas reales ni compartas el contenido de tu archivo `.env`.

La configuración de Docker Compose utiliza esta contraseña para inicializar la base de datos.

### Paso 3. Construir los contenedores

Con Docker Desktop en funcionamiento, ejecuta:

```bash
docker compose build
```

Este comando construye las imágenes necesarias para los componentes de ProtecKey.

### Paso 4. Iniciar la aplicación

Ejecuta:

```bash
docker compose up -d
```

Docker Compose iniciará los seis servicios configurados:

1. PostgreSQL.
2. Detection Service.
3. Data Service.
4. Evaluation Service.
5. API Gateway.
6. Frontend.

### Paso 5. Verificar el funcionamiento

Ejecuta:

```bash
docker compose ps
```

Comprueba que los contenedores estén en ejecución y que PostgreSQL indique un estado saludable.

### Paso 6. Acceder a ProtecKey

Una vez iniciados los servicios, abre las siguientes direcciones:

**Aplicación web**

http://localhost:5173

**Documentación interactiva del API Gateway**

http://localhost:8000/docs

La aplicación está configurada para ejecutarse localmente. No constituye un despliegue público de producción.

---

## 8. Uso de la aplicación

### Realizar un análisis individual

1. Ingresa a ProtecKey desde el navegador.
2. Selecciona la opción para comenzar un análisis.
3. Introduce las características solicitadas mediante el formulario o carga un CSV individual.
4. Ejecuta el análisis.
5. Consulta la clasificación generada.
6. Revisa la evaluación cuando hayas proporcionado una etiqueta real válida.

### Realizar un análisis por lotes

1. Ingresa a la sección correspondiente al análisis por lotes.
2. Selecciona un archivo CSV con los registros.
3. Ejecuta el procesamiento.
4. Consulta las cantidades y porcentajes obtenidos.
5. Revisa las métricas de evaluación cuando estén disponibles.

### Consultar el historial

Utiliza las secciones de historial para visualizar los análisis individuales y por lotes almacenados previamente.

Los resultados se conservan en PostgreSQL mientras se mantenga el volumen de datos asociado.

---

## 9. Comandos útiles de Docker

**Consultar el estado de los contenedores:**

```bash
docker compose ps
```

**Consultar registros de ejecución:**

```bash
docker compose logs --tail=50
```

**Reiniciar los servicios:**

```bash
docker compose restart
```

**Detener y eliminar los contenedores sin borrar el volumen de datos:**

```bash
docker compose down
```

**Iniciar nuevamente:**

```bash
docker compose up -d
```

**Reconstruir después de modificar el código:**

```bash
docker compose up -d --build
```

### Persistencia de la información

PostgreSQL utiliza un volumen de Docker para almacenar los resultados.

Por esta razón, el historial permanece disponible después de detener y volver a iniciar los contenedores, siempre que el volumen se conserve.

**Advertencia:** ejecutar `docker compose down -v` elimina los volúmenes asociados al proyecto y puede provocar la pérdida del historial almacenado.

---

## 10. Estructura del repositorio

```text
ProtecKey/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── vite.config.js
│
├── services/
│   ├── api_gateway/
│   ├── data_service/
│   ├── detection_service/
│   ├── evaluation_service/
│   └── database/
│       ├── init/
│       │   └── init.sql
│       ├── connection.py
│       ├── analysis_repository.py
│       └── batch_repository.py
│
├── models/
│   ├── modelo_proteckey.joblib
│   └── modelo_proteckey_lightgbm.joblib
│
├── data/
│   └── UNSW_NB15_testing-set.csv
│
├── tests/
│
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── requirements.txt
└── README.md
```

### Organización

- `frontend/`: interfaz de usuario desarrollada con React.
- `services/`: microservicios y componentes backend.
- `models/`: modelos de Machine Learning almacenados.
- `data/`: conjunto de datos incluido en el proyecto.
- `tests/`: scripts, archivos de prueba y verificaciones del sistema.
- `Dockerfile.backend`: construcción de la imagen utilizada por los servicios backend.
- `Dockerfile.frontend`: construcción de la imagen del frontend.
- `docker-compose.yml`: configuración de los contenedores y sus conexiones.
- `requirements.txt`: dependencias de Python.
- `.env.example`: plantilla de configuración de variables de entorno.

---

## 11. Pruebas y validación

Durante el desarrollo se realizaron verificaciones funcionales de los principales componentes de ProtecKey.

Entre las comprobaciones efectuadas se encuentran:

| Componente | Verificación realizada |
|---|---|
| Docker Compose | Construcción e inicio de los seis contenedores. |
| PostgreSQL | Inicio de la base de datos y comprobación de conectividad. |
| API Gateway | Respuesta del servicio mediante solicitudes HTTP. |
| Detection Service | Carga y utilización del modelo LightGBM. |
| Análisis individual | Ejecución de predicciones y almacenamiento de resultados. |
| Análisis por lotes | Procesamiento de archivos CSV y presentación de estadísticas. |
| Historial | Consulta de registros almacenados. |
| Persistencia | Conservación del historial después de detener y reiniciar contenedores. |
| Frontend | Construcción del proyecto y funcionamiento de la interfaz. |

El repositorio incluye scripts de prueba en la carpeta `tests/`.

Estas verificaciones demuestran el funcionamiento del prototipo en el entorno local utilizado durante el desarrollo. No representan una certificación de seguridad ni una validación exhaustiva para entornos de producción.

---

## 12. Limitaciones del proyecto

ProtecKey es un **prototipo académico**, por lo que presenta algunas limitaciones importantes:

- El modelo fue entrenado con datos de UNSW-NB15 y su desempeño depende de la similitud entre esos datos y los registros analizados.
- Las predicciones pueden presentar falsos positivos y falsos negativos.
- No realiza monitoreo continuo de tráfico de red en tiempo real.
- No ejecuta acciones automáticas de bloqueo o mitigación de ataques.
- No detecta directamente vulnerabilidades internas de modelos de inteligencia artificial.
- No reemplaza herramientas profesionales de monitoreo, detección de intrusiones o respuesta ante incidentes.
- La configuración actual está orientada al desarrollo y ejecución local mediante Docker.

Los resultados deben interpretarse como información de apoyo para el análisis de posibles amenazas.

## 13. Posibles mejoras futuras

Como continuación del proyecto, podrían implementarse las siguientes funcionalidades:

- Integración con fuentes de tráfico de red en tiempo real.
- Detección de nuevas categorías de ataques.
- Incorporación de conjuntos de datos especializados en ataques contra sistemas de IA.
- Visualización avanzada de estadísticas y tendencias.
- Generación de alertas automáticas.
- Incorporación de mecanismos de explicación de predicciones.
- Autenticación y control de acceso.
- Despliegue en infraestructura de producción.

Estas funcionalidades representan posibles líneas de desarrollo y **no forman parte de las capacidades implementadas actualmente**.

---

## 14. Estado actual

**Prototipo funcional en entorno local.**

ProtecKey cuenta con una interfaz web, microservicios backend, un modelo de clasificación LightGBM y una base de datos PostgreSQL integrados mediante Docker Compose.

Se ha comprobado el funcionamiento de los análisis individuales y por lotes, la consulta de historiales y la persistencia de resultados.

El código fuente y los archivos necesarios para su ejecución local se encuentran organizados en este repositorio.

---

## 15. Contexto académico

ProtecKey fue desarrollado con fines académicos en el área de **Ingeniería de Sistemas**, integrando conocimientos de:

- Ciberseguridad.
- Inteligencia artificial y Machine Learning.
- Desarrollo de aplicaciones web.
- Arquitectura de software y microservicios.
- Bases de datos.
- Pruebas y validación de software.
- Contenerización con Docker.

El proyecto busca demostrar cómo la integración de estas tecnologías permite construir herramientas que contribuyan al análisis de comportamientos potencialmente maliciosos, dentro del estudio de la seguridad de entornos tecnológicos relacionados con la inteligencia artificial.

---

**ProtecKey — Detección inteligente de posibles amenazas mediante Machine Learning.**