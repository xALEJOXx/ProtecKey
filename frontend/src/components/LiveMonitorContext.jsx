
import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

const LiveMonitorContext = createContext(null);

const WS_URL = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/live`;
const MAX_FLUJOS = 200;

export function LiveMonitorProvider({ children }) {
  const [estado, setEstado] = useState("Conectando");
  const [flujos, setFlujos] = useState([]);
  const [totalRecibidos, setTotalRecibidos] = useState(0);

  useEffect(() => {
    let socket = null;
    let temporizador = null;
    let activo = true;

    function conectar() {
      if (!activo) return;

      setEstado("Conectando");

      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        if (activo) {
          setEstado("Conectado");
        }
      };

      socket.onmessage = (evento) => {
        try {
          const mensaje = JSON.parse(evento.data);

          if (
            mensaje.tipo !== "flujo_red" ||
            !mensaje.datos
          ) {
            return;
          }

          const nuevo = {
            ...mensaje.datos,
            fecha_hora: mensaje.fecha_hora,
            id: crypto.randomUUID()
          };

          setFlujos((anteriores) =>
            [nuevo, ...anteriores].slice(0, MAX_FLUJOS)
          );

          setTotalRecibidos((total) => total + 1);

        } catch (error) {
          console.error(
            "Error procesando flujo:",
            error
          );
        }
      };

      socket.onerror = () => {
        if (activo) {
          setEstado("Error de conexión");
        }
      };

      socket.onclose = () => {
        if (!activo) return;

        setEstado("Desconectado");

        temporizador = setTimeout(conectar, 3000);
      };
    }

    conectar();

    return () => {
      activo = false;
      clearTimeout(temporizador);

      if (socket) {
        socket.close();
      }
    };
  }, []);

  function limpiarVista() {
    setFlujos([]);
    setTotalRecibidos(0);
  }

  return (
    <LiveMonitorContext.Provider
      value={{
        estado,
        flujos,
        totalRecibidos,
        limpiarVista
      }}
    >
      {children}
    </LiveMonitorContext.Provider>
  );
}

export function useLiveMonitor() {
  const contexto = useContext(LiveMonitorContext);

  if (!contexto) {
    throw new Error(
      "useLiveMonitor debe utilizarse dentro de LiveMonitorProvider"
    );
  }

  return contexto;
}
