# ProtecKey

### Prototipo experimental de monitoreo y análisis de tráfico de red

**Proyecto de investigación:** Modelos de aprendizaje por refuerzo para comprender la evasión de sistemas de detección de intrusos.

**ProtecKey** es un prototipo académico de ciberseguridad desarrollado para capturar, analizar y clasificar tráfico de red mediante técnicas de aprendizaje automático.

Integra monitoreo de red en tiempo real, clasificación de tráfico potencialmente malicioso, visualización de alertas, consulta de historiales y controles de acceso.

Su propósito es proporcionar una base experimental para estudiar el comportamiento de los sistemas de detección de intrusos (IDS) y apoyar futuras investigaciones sobre estrategias de evasión mediante aprendizaje por refuerzo.

**Alcance actual:** el prototipo implementa detección mediante aprendizaje supervisado. La integración de agentes de aprendizaje por refuerzo constituye una etapa posterior de investigación.

---

## 1. Descripción del proyecto

La incorporación de inteligencia artificial en diferentes entornos tecnológicos también plantea nuevos desafíos relacionados con la ciberseguridad. Los sistemas que utilizan IA dependen de infraestructuras, servicios y comunicaciones que pueden verse afectados por actividades maliciosas.

**ProtecKey** surge como una propuesta académica para explorar cómo el aprendizaje automático puede contribuir a la identificación de comportamientos sospechosos y apoyar el análisis de seguridad.

Para ello, se desarrolló una aplicación que procesa registros de tráfico de red y utiliza un modelo entrenado para determinar si sus características corresponden a un comportamiento normal o potencialmente malicioso.

El proyecto no pretende sustituir soluciones profesionales de seguridad, sino demostrar la integración de inteligencia artificial, desarrollo de software y análisis de amenazas en un sistema funcional.

## 2. Objetivo

Desarrollar un prototipo experimental de monitoreo y análisis de tráfico de red que permita identificar comportamientos potencialmente maliciosos mediante modelos de aprendizaje automático, visualizar resultados y generar información útil para el estudio de sistemas de detección de intrusos y su posible evasión mediante aprendizaje por refuerzo.

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

### Resultados de evaluación del modelo

Durante el desarrollo se evaluó el modelo LightGBM con el conjunto de prueba UNSW-NB15, utilizando un umbral de clasificación de 0.5.

En una evaluación experimental del modelo entrenado se obtuvieron los siguientes resultados:

| Métrica | Resultado |
|---|---|
| Accuracy | 90.50 % |
| Precision | 87.19 % |
| Recall | 97.01 % |
| F1-score | 91.84 % |

Estos resultados corresponden a la evaluación experimental del modelo entrenado durante el proyecto y no deben interpretarse automáticamente como métricas del archivo de modelo actualmente cargado en producción.

El desempeño puede variar con otros conjuntos de datos y condiciones reales de tráfico.

### Puntuación de tráfico malicioso

Además de la clasificación binaria, ProtecKey muestra una puntuación calculada mediante la salida `predict_proba` del modelo.

Esta puntuación permite observar qué tan fuertemente el modelo favorece la clase de tráfico potencialmente malicioso.

No constituye una probabilidad calibrada de que exista un ataque ni reemplaza la evaluación de un especialista.


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

### Pruebas finales de integración

Se implementó el archivo `tests/test_final_proteckey.py`
para verificar el funcionamiento de los principales componentes
de la aplicación.

Las pruebas realizadas fueron:

| Prueba | Resultado |
|---|---|
| Disponibilidad del API Gateway | Aprobada |
| Consulta del historial individual | Aprobada |
| Consulta del historial por lotes | Aprobada |
| Disponibilidad del frontend | Aprobada |
| Validación de registros incompletos | Aprobada |

**Resultado final: 5 de 5 pruebas superadas.**

Para ejecutar estas verificaciones desde la raíz del proyecto
en Windows, con el entorno virtual configurado:

```powershell
.\.venv\Scripts\python.exe .\tests\test_final_proteckey.py
```

Estas pruebas verifican la disponibilidad de los componentes
principales y el rechazo de una entrada inválida.

No constituyen una prueba exhaustiva de seguridad, rendimiento
o precisión del modelo.


## 12. Limitaciones del proyecto

ProtecKey es un prototipo académico experimental y no reemplaza un IDS profesional.

- El modelo LightGBM fue evaluado utilizando UNSW-NB15. Su rendimiento puede variar con tráfico real.
- La clasificación puede generar falsos positivos y falsos negativos.
- El monitoreo en tiempo real depende de la configuración y los permisos del equipo anfitrión.
- Las alertas representan predicciones del modelo y no una confirmación definitiva de un ataque.
- Los controles de acceso implementados no equivalen a una auditoría de seguridad exhaustiva.
- La instalación actual está orientada a un entorno local de desarrollo y experimentación.
- Todavía no se ha integrado ni evaluado un agente de aprendizaje por refuerzo para estudiar evasión de IDS.

## 13. Posibles mejoras futuras

- Integrar un agente de aprendizaje por refuerzo en un entorno de experimentación controlado.
- Estudiar la respuesta del detector frente a modificaciones del tráfico de prueba.
- Comparar modelos supervisados y estrategias de detección adaptativa.
- Evaluar el rendimiento con conjuntos de datos adicionales.
- Reducir la tasa de falsos positivos.
- Incorporar explicaciones de las predicciones y nuevas métricas de evaluación.
- Fortalecer las pruebas de seguridad, rendimiento y reproducibilidad.

## 14. Estado actual

**Prototipo funcional en entorno local.**

ProtecKey integra una interfaz web, servicios backend, PostgreSQL, modelos de Machine Learning y un monitor local de tráfico de red.

Se han implementado análisis individuales y por lotes, monitoreo de red, alertas, estadísticas, historial de predicciones y mecanismos de autenticación para operadores y evaluadores.

En las pruebas finales de integración se aprobaron **5 de 5 verificaciones**.

El modelo `modelo_proteckey_lightgbm_nuevo.joblib` obtuvo un F1-score de **91,84 %** sobre 82.332 registros de prueba de UNSW-NB15. Estos resultados corresponden a una evaluación experimental y no garantizan el mismo rendimiento en redes reales.

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