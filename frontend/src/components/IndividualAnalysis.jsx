
import { useRef, useState } from "react";
import Papa from "papaparse";

const API_URL = "http://127.0.0.1:8000";

const GRUPOS = [
  {
    titulo: "Información de la conexión",
    descripcion: "Características generales del tráfico de red.",
    campos: [
      "dur", "proto", "service", "state", "rate",
      "sttl", "dttl", "is_ftp_login", "is_sm_ips_ports"
    ]
  },
  {
    titulo: "Paquetes y transferencia",
    descripcion: "Cantidad de paquetes, bytes y comportamiento del tráfico.",
    campos: [
      "spkts", "dpkts", "sbytes", "dbytes",
      "sload", "dload", "sloss", "dloss",
      "smean", "dmean", "swin", "dwin"
    ]
  },
  {
    titulo: "Tiempos de comunicación",
    descripcion: "Duraciones, intervalos y tiempos de respuesta.",
    campos: [
      "sinpkt", "dinpkt", "sjit", "djit",
      "stcpb", "dtcpb", "tcprtt", "synack", "ackdat"
    ]
  },
  {
    titulo: "Características adicionales",
    descripcion: "Indicadores técnicos utilizados por el modelo.",
    campos: [
      "trans_depth", "response_body_len",
      "ct_srv_src", "ct_state_ttl", "ct_dst_ltm",
      "ct_src_dport_ltm", "ct_dst_sport_ltm",
      "ct_dst_src_ltm", "ct_ftp_cmd",
      "ct_flw_http_mthd", "ct_src_ltm", "ct_srv_dst"
    ]
  }
];

const CATEGORICAS = ["proto", "service", "state"];
const COLUMNAS = GRUPOS.flatMap((grupo) => grupo.campos);

const AYUDAS = {
  dur: "Duración de la conexión.",
  proto: "Protocolo utilizado, por ejemplo tcp o udp.",
  service: "Servicio de red, por ejemplo http, dns o -.",
  state: "Estado de la conexión, por ejemplo FIN, CON o INT.",
  spkts: "Paquetes enviados desde el origen.",
  dpkts: "Paquetes enviados desde el destino.",
  sbytes: "Bytes enviados desde el origen.",
  dbytes: "Bytes enviados desde el destino.",
  rate: "Tasa de transferencia registrada.",
  sttl: "Tiempo de vida de paquetes del origen.",
  dttl: "Tiempo de vida de paquetes del destino.",
  sload: "Carga de tráfico del origen.",
  dload: "Carga de tráfico del destino.",
  sloss: "Paquetes perdidos en el origen.",
  dloss: "Paquetes perdidos en el destino.",
  sinpkt: "Intervalo entre paquetes del origen.",
  dinpkt: "Intervalo entre paquetes del destino.",
  sjit: "Variación del tiempo entre paquetes del origen.",
  djit: "Variación del tiempo entre paquetes del destino.",
  swin: "Tamaño de ventana TCP del origen.",
  dwin: "Tamaño de ventana TCP del destino.",
  stcpb: "Número de secuencia TCP del origen.",
  dtcpb: "Número de secuencia TCP del destino.",
  tcprtt: "Tiempo de ida y vuelta de la conexión TCP.",
  synack: "Tiempo entre SYN y SYN-ACK.",
  ackdat: "Tiempo entre SYN-ACK y ACK.",
  smean: "Promedio de bytes de paquetes del origen.",
  dmean: "Promedio de bytes de paquetes del destino.",
  trans_depth: "Profundidad de transacciones HTTP.",
  response_body_len: "Longitud del contenido de respuesta HTTP.",
  ct_srv_src: "Conteo de conexiones relacionadas con servicio y origen.",
  ct_state_ttl: "Conteo asociado al estado y tiempo de vida.",
  ct_dst_ltm: "Conteo reciente de conexiones al destino.",
  ct_src_dport_ltm: "Conteo reciente por origen y puerto de destino.",
  ct_dst_sport_ltm: "Conteo reciente por destino y puerto de origen.",
  ct_dst_src_ltm: "Conteo reciente por origen y destino.",
  is_ftp_login: "Indicador de inicio de sesión FTP.",
  ct_ftp_cmd: "Cantidad de comandos FTP.",
  ct_flw_http_mthd: "Conteo de métodos HTTP.",
  ct_src_ltm: "Conteo reciente de conexiones del origen.",
  ct_srv_dst: "Conteo de conexiones por servicio y destino.",
  is_sm_ips_ports: "Indicador de coincidencia entre IP y puerto de origen y destino."
};


const NOMBRES_CAMPOS = {
  dur: "Duración de la conexión",
  proto: "Protocolo",
  service: "Servicio de red",
  state: "Estado de conexión",
  spkts: "Paquetes enviados",
  dpkts: "Paquetes recibidos",
  sbytes: "Bytes enviados",
  dbytes: "Bytes recibidos",
  rate: "Velocidad del tráfico",
  sttl: "Tiempo de vida de origen",
  dttl: "Tiempo de vida de destino",
  sload: "Carga de origen",
  dload: "Carga de destino",
  sloss: "Pérdidas de origen",
  dloss: "Pérdidas de destino",
  sinpkt: "Intervalo de envío",
  dinpkt: "Intervalo de recepción",
  sjit: "Variación de envío",
  djit: "Variación de recepción",
  swin: "Ventana TCP de origen",
  dwin: "Ventana TCP de destino",
  stcpb: "Secuencia TCP de origen",
  dtcpb: "Secuencia TCP de destino",
  tcprtt: "Tiempo de respuesta TCP",
  synack: "Tiempo de establecimiento",
  ackdat: "Tiempo de confirmación",
  smean: "Promedio de bytes enviados",
  dmean: "Promedio de bytes recibidos",
  trans_depth: "Profundidad HTTP",
  response_body_len: "Tamaño de respuesta HTTP",
  ct_srv_src: "Conexiones por servicio y origen",
  ct_state_ttl: "Conexiones por estado y TTL",
  ct_dst_ltm: "Conexiones recientes al destino",
  ct_src_dport_ltm: "Conexiones por puerto de destino",
  ct_dst_sport_ltm: "Conexiones por puerto de origen",
  ct_dst_src_ltm: "Conexiones entre origen y destino",
  is_ftp_login: "Inicio de sesión FTP",
  ct_ftp_cmd: "Comandos FTP",
  ct_flw_http_mthd: "Métodos HTTP",
  ct_src_ltm: "Conexiones recientes del origen",
  ct_srv_dst: "Conexiones por servicio y destino",
  is_sm_ips_ports: "Coincidencia de IP y puerto"
};

const OPCIONES_CAMPOS = {
  proto: ["tcp", "udp", "icmp", "arp"],
  service: ["-", "http", "dns", "ftp", "smtp", "ssh", "ssl"],
  state: ["FIN", "CON", "INT", "REQ", "RST"]
};


function validarRegistro(registro) {
  const faltantes = COLUMNAS.filter(
    (campo) => !(campo in registro)
  );

  if (faltantes.length) {
    throw new Error(
      `Faltan ${faltantes.length} columnas: ${faltantes.join(", ")}.`
    );
  }

  const datos = {};

  for (const campo of COLUMNAS) {
    const valor = registro[campo];

    if (valor === null || valor === undefined ||
        String(valor).trim() === "") {
      throw new Error(`El campo "${campo}" está vacío.`);
    }

    if (CATEGORICAS.includes(campo)) {
      datos[campo] = String(valor).trim();
    } else {
      const numero = Number(valor);

      if (typeof valor === "boolean" ||
          !Number.isFinite(numero)) {
        throw new Error(
          `El campo "${campo}" debe contener un número válido.`
        );
      }

      datos[campo] = numero;
    }
  }

  return datos;
}

export default function IndividualAnalysis({
  onAnalysisComplete,
  onResultReady
}) {
  const [modo, setModo] = useState("formulario");
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState({});
  const [etiquetaReal, setEtiquetaReal] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const inputArchivo = useRef(null);

  const cambiarCampo = (campo, valor) => {
    setValores((anterior) => ({
      ...anterior,
      [campo]: valor
    }));
    setError("");
  };

  const validarPaso = () => {
    const campos = GRUPOS[paso].campos;

    for (const campo of campos) {
      const valor = valores[campo];

      if (valor === undefined || String(valor).trim() === "") {
        setError(`Completa el campo "${campo}" para continuar.`);
        return false;
      }

      if (!CATEGORICAS.includes(campo) &&
          !Number.isFinite(Number(valor))) {
        setError(`El campo "${campo}" debe ser numérico.`);
        return false;
      }
    }

    setError("");
    return true;
  };

  const siguientePaso = () => {
    if (validarPaso()) {
      setPaso((anterior) => anterior + 1);
    }
  };

  const leerCSV = () =>
    new Promise((resolve, reject) => {
      if (!archivo) {
        reject(new Error("Selecciona un archivo CSV."));
        return;
      }

      if (!archivo.name.toLowerCase().endsWith(".csv")) {
        reject(new Error("El archivo debe tener extensión .csv."));
        return;
      }

      Papa.parse(archivo, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        complete: (resultado) => {
          if (resultado.errors.length) {
            reject(new Error("El CSV contiene errores de lectura."));
            return;
          }

          if (resultado.data.length !== 1) {
            reject(new Error(
              "El CSV individual debe contener exactamente una fila."
            ));
            return;
          }

            try {
            const fila = resultado.data[0];

            // Validar únicamente las 42 características del modelo.
            const datos = validarRegistro(fila);

            // La etiqueta real es opcional.
            let realLabel = null;

            if (Object.prototype.hasOwnProperty.call(fila, "label")) {
                const etiqueta = String(fila.label).trim();

                if (etiqueta !== "0" && etiqueta !== "1") {
                throw new Error(
                    'La columna "label" debe contener 0 o 1.'
                );
                }

                realLabel = Number(etiqueta);
            }

            resolve({
                datos,
                realLabel
            });
            } catch (err) {
            reject(err);
            }
        },
        error: () => reject(
          new Error("No fue posible leer el archivo CSV.")
        )
      });
    });

  const ejecutarAnalisis = async () => {
    setError("");
    setProcesando(true);

    try {
        const { datos, realLabel } = modo === "csv"
            ? await leerCSV()
            : {
                datos: validarRegistro(valores),
                realLabel:
                    etiquetaReal === ""
                    ? null
                    : Number(etiquetaReal)
                };

      const respuesta = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
            data: datos,
            real_label: realLabel
        })
        });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        const detalle = resultado.detail;
        throw new Error(
          typeof detalle === "string"
            ? detalle
            : "No fue posible realizar el análisis."
        );
      }

      if (resultado.status !== "success") {
        const detalleValidacion = resultado.validation;
        const mensaje = resultado.mensaje ||
          detalleValidacion?.errores?.join?.(", ") ||
          "El registro no pudo ser procesado.";

        throw new Error(mensaje);
      }

      if (onAnalysisComplete) {
        onAnalysisComplete();
      }

      if (onResultReady) {
        onResultReady(
          resultado,
          modo === "csv" ? archivo.name : "Registro manual",
          "individual"
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <section className="pk-individual">
      <div className="pk-individual-heading">
        <span className="pk-eyebrow">ANÁLISIS INDIVIDUAL</span>
        <h2>Analiza una conexión de red</h2>
        <p>
          Elige cómo quieres proporcionar los datos.
          ProtecKey los validará antes de realizar la predicción.
        </p>
      </div>

      <div className="pk-individual-modes">
        <button
          type="button"
          className={modo === "formulario" ? "activo" : ""}
          onClick={() => {
            setModo("formulario");
            setError("");
          }}
        >
          <strong>Formulario guiado</strong>
          <span>Completa los datos paso a paso</span>
        </button>

        <button
          type="button"
          className={modo === "csv" ? "activo" : ""}
          onClick={() => {
            setModo("csv");
            setError("");
          }}
        >
          <strong>CSV de una fila</strong>
          <span>Importa un registro existente</span>
        </button>
      </div>

      {modo === "formulario" ? (
        <div className="pk-individual-form">
          <div className="pk-individual-progress">
            <span>
              Paso {paso + 1} de {GRUPOS.length}
            </span>
            <div className="pk-individual-progress-track">
              <div
                style={{
                  width: `${((paso + 1) / GRUPOS.length) * 100}%`
                }}
              />
            </div>
          </div>

          <h3>{GRUPOS[paso].titulo}</h3>
          <p>{GRUPOS[paso].descripcion}</p>


            <div className="pk-individual-fields">
            {GRUPOS[paso].campos.map((campo) => (
                <div className="pk-field-card" key={campo}>
                <div className="pk-field-heading">
                    <label htmlFor={`campo-${campo}`}>
                    {NOMBRES_CAMPOS[campo] || campo}
                    </label>

                    <span className="pk-field-help">
                    <button
                        type="button"
                        className="pk-help-button"
                        aria-label={`Ayuda sobre ${NOMBRES_CAMPOS[campo] || campo}`}
                        aria-describedby={`ayuda-${campo}`}
                    >
                        ?
                    </button>

                    <span
                        className="pk-help-tooltip"
                        id={`ayuda-${campo}`}
                        role="tooltip"
                    >
                        {AYUDAS[campo]}
                        <br />
                        <small>Campo técnico: {campo}</small>
                    </span>
                    </span>
                </div>

                {OPCIONES_CAMPOS[campo] ? (
                    <>
                    <input
                        id={`campo-${campo}`}
                        type="text"
                        list={`opciones-${campo}`}
                        placeholder="Selecciona o escribe un valor"
                        value={valores[campo] ?? ""}
                        onChange={(event) =>
                        cambiarCampo(campo, event.target.value)
                        }
                    />

                    <datalist id={`opciones-${campo}`}>
                        {OPCIONES_CAMPOS[campo].map((opcion) => (
                        <option key={opcion} value={opcion} />
                        ))}
                    </datalist>
                    </>
                ) : (
                    <input
                    id={`campo-${campo}`}
                    type="number"
                    step="any"
                    placeholder="Introduce un número"
                    value={valores[campo] ?? ""}
                    onChange={(event) =>
                        cambiarCampo(campo, event.target.value)
                    }
                    />
                )}
                </div>
            ))}
            </div>



            {paso === GRUPOS.length - 1 && (
            <section className="pk-ind-label-section">
                <div className="pk-ind-label-heading">
                <div className="pk-ind-label-icon">✓</div>

                <div>
                    <div className="pk-ind-label-title">
                    <h3>Verificación de la predicción</h3>
                    <span className="pk-ind-label-badge">OPCIONAL</span>
                    </div>
                    <p>
                    ¿Conoces la clasificación real de esta conexión?
                    Selecciónala para comprobar si el modelo acierta.
                    </p>
                </div>
                </div>

                <div className="pk-ind-label-options">
                {[
                    {
                    valor: "",
                    icono: "○",
                    titulo: "No conozco la etiqueta",
                    descripcion: "Realizar únicamente la predicción.",
                    tipo: "unknown"
                    },
                    {
                    valor: "0",
                    icono: "✓",
                    titulo: "Tráfico normal",
                    descripcion: "Etiqueta real: 0",
                    tipo: "normal"
                    },
                    {
                    valor: "1",
                    icono: "!",
                    titulo: "Tráfico malicioso",
                    descripcion: "Etiqueta real: 1",
                    tipo: "malicious"
                    }
                ].map((opcion) => (
                    <label
                    key={opcion.tipo}
                    className={`pk-ind-label-option pk-label-${opcion.tipo} ${
                        etiquetaReal === opcion.valor ? "selected" : ""
                    }`}
                    >
                    <input
                        type="radio"
                        name="etiqueta-real"
                        value={opcion.valor}
                        checked={etiquetaReal === opcion.valor}
                        onChange={() => setEtiquetaReal(opcion.valor)}
                    />

                    <span className="pk-ind-label-option-icon">
                        {opcion.icono}
                    </span>

                    <span className="pk-ind-label-option-content">
                        <strong>{opcion.titulo}</strong>
                        <small>{opcion.descripcion}</small>
                    </span>

                    <span className="pk-ind-label-radio-indicator" />
                    </label>
                ))}
                </div>

                <div className="pk-ind-label-note">
                <span className="pk-ind-label-note-icon">i</span>
                <p>
                    {etiquetaReal === ""
                    ? "Sin una etiqueta real, ProtecKey realizará la predicción sin evaluarla."
                    : "ProtecKey comparará la etiqueta real con la predicción y guardará automáticamente la evaluación en el historial."}
                </p>
                </div>
            </section>
            )}



          <div className="pk-individual-actions">
            <button
              type="button"
              disabled={paso === 0 || procesando}
              onClick={() => {
                setPaso((anterior) => anterior - 1);
                setError("");
              }}
            >
              ← Anterior
            </button>

            {paso < GRUPOS.length - 1 ? (
              <button
                type="button"
                onClick={siguientePaso}
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="button"
                disabled={procesando}
                onClick={ejecutarAnalisis}
              >
                {procesando
                  ? "Analizando..."
                  : "Analizar registro"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="pk-individual-upload">
          <div className="pk-individual-upload-icon">▤</div>
          <h3>Carga un archivo CSV</h3>
          <p>
            Debe contener exactamente una fila de datos
            y las 42 columnas requeridas por el modelo.
          </p>

          <input
            ref={inputArchivo}
            type="file"
            accept=".csv"
            onChange={(event) => {
              setArchivo(event.target.files?.[0] || null);
              setError("");
            }}
          />

          {archivo && (
            <p className="pk-individual-file">
              Archivo seleccionado: {archivo.name}
            </p>
          )}

          <button
            type="button"
            disabled={procesando || !archivo}
            onClick={ejecutarAnalisis}
          >
            {procesando
              ? "Analizando..."
              : "Analizar registro"}
          </button>
        </div>
      )}

      {error && (
        <div className="mensaje-error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
