import { useState } from "react";
import Papa from "papaparse";

const API_URL = "http://127.0.0.1:8000";

// Características que necesita el modelo LightGBM.
// No incluyen id, attack_cat ni label.
const COLUMNAS_REQUERIDAS = [
  "dur",
  "proto",
  "service",
  "state",
  "spkts",
  "dpkts",
  "sbytes",
  "dbytes",
  "rate",
  "sttl",
  "dttl",
  "sload",
  "dload",
  "sloss",
  "dloss",
  "sinpkt",
  "dinpkt",
  "sjit",
  "djit",
  "swin",
  "stcpb",
  "dtcpb",
  "dwin",
  "tcprtt",
  "synack",
  "ackdat",
  "smean",
  "dmean",
  "trans_depth",
  "response_body_len",
  "ct_srv_src",
  "ct_state_ttl",
  "ct_dst_ltm",
  "ct_src_dport_ltm",
  "ct_dst_sport_ltm",
  "ct_dst_src_ltm",
  "is_ftp_login",
  "ct_ftp_cmd",
  "ct_flw_http_mthd",
  "ct_src_ltm",
  "ct_srv_dst",
  "is_sm_ips_ports"
];

// Columnas categóricas del modelo UNSW-NB15.
const COLUMNAS_CATEGORICAS = [
  "proto",
  "service",
  "state"
];

// Las demás características deben ser numéricas.
const COLUMNAS_NUMERICAS = COLUMNAS_REQUERIDAS.filter(
  (columna) => !COLUMNAS_CATEGORICAS.includes(columna)
);

function AnalysisForm({ onAnalysisComplete, onResultReady }) {
  const [archivo, setArchivo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  const seleccionarArchivo = (event) => {
    const file = event.target.files[0];

    setArchivo(file);
    setResultado(null);
    setError("");
  };

  const analizarArchivo = () => {
    if (!archivo) {
      setError("Selecciona un archivo CSV.");
      return;
    }

    setProcesando(true);
    setError("");
    setResultado(null);

    Papa.parse(archivo, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,

      complete: async (resultadoCSV) => {
        try {
          if (resultadoCSV.errors.length > 0) {
            throw new Error(
              "El archivo CSV contiene errores de lectura."
            );
          }

          if (resultadoCSV.data.length === 0) {
            throw new Error(
              "El archivo CSV no contiene registros."
            );
          }

          // ==========================================
          // VALIDAR COLUMNAS OBLIGATORIAS
          // ==========================================

          const columnasCSV = resultadoCSV.meta.fields || [];

          const columnasFaltantes = COLUMNAS_REQUERIDAS.filter(
            (columna) => !columnasCSV.includes(columna)
          );

          if (columnasFaltantes.length > 0) {
            throw new Error(
              `El archivo CSV está incompleto. ` +
              `Faltan las siguientes columnas obligatorias: ` +
              columnasFaltantes.join(", ") +
              "."
            );
          }

                    // ==========================================
          // VALIDAR VALORES NUMÉRICOS
          // ==========================================

          for (let i = 0; i < resultadoCSV.data.length; i++) {
            const registro = resultadoCSV.data[i];

            for (const columna of COLUMNAS_NUMERICAS) {
              const valor = registro[columna];

              const esInvalido =
                valor === null ||
                valor === undefined ||
                typeof valor === "boolean" ||
                (typeof valor === "string" && valor.trim() === "") ||
                !Number.isFinite(Number(valor));

              if (esInvalido) {
                throw new Error(
                  `El registro ${i + 1} contiene un valor inválido ` +
                  `en la columna "${columna}". ` +
                  `Se esperaba un número válido. ` +
                  `Valor recibido: ${String(valor)}.`
                );
              }
            }
          }
          
          // Comprobamos si el CSV contiene labels reales.
          const tieneLabels = resultadoCSV.data.every(
            (registro) =>
              registro.label !== undefined &&
              registro.label !== null
          );

          // Guardamos los labels SOLO para evaluación.
          const labels = tieneLabels
            ? resultadoCSV.data.map(
                (registro) => Number(registro.label)
              )
            : null;

          // ==========================================
          // VALIDAR ETIQUETAS REALES
          // ==========================================

          if (columnasCSV.includes("label")) {

            for (let i = 0; i < resultadoCSV.data.length; i++) {

              const valor = resultadoCSV.data[i].label;

              if (valor !== 0 && valor !== 1) {
                throw new Error(
                  `El registro ${i + 1} contiene una etiqueta ` +
                  `inválida en la columna "label". ` +
                  `Solo se permiten los valores 0 y 1. ` +
                  `Valor recibido: ${String(valor)}.`
                );
              }
            }
          }

          // Preparar las características del modelo.
          const registros = resultadoCSV.data.map(
            (registro) => {
              const datos = { ...registro };

              // Estas columnas NO entran al modelo.
              delete datos.id;
              delete datos.attack_cat;
              delete datos.label;

              return datos;
            }
          );

          // Enviar todo al API Gateway.
          const respuesta = await fetch(
            `${API_URL}/api/analyze-batch`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
                body: JSON.stringify({
                    data: registros,
                    labels: labels,
                    nombre_archivo: archivo.name
                })
            }
          );

          const datosRespuesta =
            await respuesta.json();

        if (!respuesta.ok) {
          const detalle = datosRespuesta.detail;

          let mensaje = "No fue posible realizar el análisis.";

          if (typeof detalle === "string") {
            mensaje = detalle;
          } else if (Array.isArray(detalle)) {
            mensaje = detalle
              .map((error) => {
                const ubicacion = error.loc?.join(" → ") || "Dato";
                return `${ubicacion}: ${error.msg}`;
              })
              .join(". ");
          }

          throw new Error(mensaje);
        }

          if (
            datosRespuesta.status !== "success"
          ) {
            throw new Error(
              datosRespuesta.mensaje ||
              "Los datos no pudieron ser procesados."
            );
          }

          setResultado(datosRespuesta);

          if (onAnalysisComplete) {
            onAnalysisComplete();
          }

          if (onResultReady) {
            onResultReady(datosRespuesta, archivo.name);
          }

        } catch (error) {
          setError(error.message);

        } finally {
          setProcesando(false);
        }
      },

      error: () => {
        setError(
          "No fue posible leer el archivo CSV."
        );

        setProcesando(false);
      }
    });
  };

  return (
    <section className="panel analysis-panel">

      <div className="panel-titulo">
        <div>
          <h2>Nuevo análisis</h2>

          <p>
            Carga un archivo CSV compatible con
            UNSW-NB15 para analizar sus registros
            con LightGBM.
          </p>
        </div>
      </div>

      <div className="upload-area">

        <strong>Archivo CSV</strong>

        <p>
          Puedes cargar uno o múltiples registros.
          Si el archivo contiene la columna label,
          ProtecKey también calculará las métricas
          de evaluación.
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={seleccionarArchivo}
        />

        {archivo && (
          <p className="archivo-seleccionado">
            Seleccionado: {archivo.name}
          </p>
        )}

        <button
          onClick={analizarArchivo}
          disabled={procesando}
        >
          {procesando
            ? "Analizando..."
            : "Analizar con ProtecKey"}
        </button>

      </div>

      {error && (
        <div className="mensaje-error">
          {error}
        </div>
      )}

      {resultado && (
        <ResultadosAnalisis
          resultado={resultado}
        />
      )}

    </section>
  );
}


function ResultadosAnalisis({ resultado }) {

  const deteccion = resultado.detection;
  const evaluacion = resultado.evaluation;

  return (
    <div className="resultado-lote">

      <h3>Resultado del análisis</h3>

      <div className="resumen-lote">

        <div className="tarjeta-resultado">
          <span>Registros</span>
          <strong>
            {deteccion.total}
          </strong>
        </div>

        <div className="tarjeta-resultado">
          <span>Normales</span>
          <strong>
            {deteccion.normal}
          </strong>
        </div>

        <div className="tarjeta-resultado">
          <span>
            Potencialmente maliciosos
          </span>

          <strong>
            {deteccion.potentially_malicious}
          </strong>
        </div>

        <div className="tarjeta-resultado">
          <span>
            Porcentaje detectado
          </span>

          <strong>
            {deteccion.malicious_percentage}%
          </strong>
        </div>

      </div>

      {evaluacion && (
        <div className="evaluacion">

          <h3>
            Evaluación del modelo
          </h3>

          <p className="nota-evaluacion">
            Disponible porque el archivo contiene
            etiquetas reales.
          </p>

          <h4>Matriz de confusión</h4>

          <div className="matriz">

            <div>
              <span>TN</span>
              <strong>
                {
                  evaluacion
                    .confusion_matrix.TN
                }
              </strong>
            </div>

            <div>
              <span>FP</span>
              <strong>
                {
                  evaluacion
                    .confusion_matrix.FP
                }
              </strong>
            </div>

            <div>
              <span>FN</span>
              <strong>
                {
                  evaluacion
                    .confusion_matrix.FN
                }
              </strong>
            </div>

            <div>
              <span>TP</span>
              <strong>
                {
                  evaluacion
                    .confusion_matrix.TP
                }
              </strong>
            </div>

          </div>

          <h4>Métricas</h4>

          <div className="metricas">

            {Object.entries(
              evaluacion.metrics
            ).map(([nombre, valor]) => (

              <div
                className="metrica"
                key={nombre}
              >

                <span>
                  {nombre.toUpperCase()}
                </span>

                <strong>
                  {(
                    Number(valor) * 100
                  ).toFixed(2)}%
                </strong>

              </div>

            ))}

          </div>

        </div>
      )}

    </div>
  );
}

export default AnalysisForm;