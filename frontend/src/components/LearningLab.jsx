import { useState } from "react";
import { Link } from "react-router-dom";
const lessons = [
  {
    title: "De la conexión a la señal",
    tag: "01 / OBSERVAR",
    text: "El sensor captura flujos de red: origen, destino, protocolo, duración, paquetes y bytes. Observar una conexión no significa que se haya detectado un ataque.",
    detail:
      "Abre Monitoreo para ver los flujos de tu sesión. El gráfico representa paquetes reportados por intervalo, no ataques.",
    question: "¿Qué demuestra una conexión observada?",
    options: [
      "Que existe tráfico registrado",
      "Que un ataque fue confirmado",
      "Que una IP fue bloqueada",
    ],
    answer: 0,
    feedback:
      "La captura describe tráfico. La clasificación del modelo y la revisión son pasos diferentes.",
  },
  {
    title: "Entender LightGBM",
    tag: "02 / INTERPRETAR",
    text: "LightGBM clasifica las características de cada registro. La clase 0 corresponde a tráfico normal y la clase 1 a tráfico potencialmente malicioso.",
    detail:
      "La puntuación es una estimación del modelo. No equivale a la certeza de que una conexión sea un ataque. Consulta características, evidencias y contexto.",
    question: "¿Una clasificación maliciosa confirma un ataque?",
    options: [
      "Sí, siempre",
      "No, requiere revisión del contexto",
      "Solo si el tráfico es TCP",
    ],
    answer: 1,
    feedback:
      "Revisa evidencias, características y gravedad antes de sacar conclusiones.",
  },
  {
    title: "Evaluar y responder",
    tag: "03 / VERIFICAR",
    text: "Para comprobar una predicción necesitas una etiqueta real. La matriz de confusión compara el resultado del modelo con esa etiqueta.",
    detail:
      "TP: malicioso identificado correctamente. TN: normal identificado correctamente. FP: normal marcado como sospechoso. FN: malicioso clasificado como normal. Las decisiones de protección deben leerse junto con el modo y el bloqueo ejecutado que devuelve el servicio.",
    question: "¿Cómo se llama un registro normal marcado como sospechoso?",
    options: [
      "Falso negativo (FN)",
      "Verdadero positivo (TP)",
      "Falso positivo (FP)",
    ],
    answer: 2,
    feedback:
      "Es un falso positivo. Un falso negativo es el caso contrario: tráfico malicioso clasificado como normal.",
  },
];
export default function LearningLab() {
  const [lesson, setLesson] = useState(0);
  const [answers, setAnswers] = useState({});
  const current = lessons[lesson];
  const completed = lessons.filter((l, i) => answers[i] === l.answer).length;
  return (
    <div className="soc-learning">
      <div className="soc-page-heading">
        <div>
          <span className="pk-eyebrow">ACADEMIA PROTECKEY</span>
          <h1>
            Entiende cada señal<span className="soc-title-dot">.</span>
          </h1>
          <p>
            Observa, interpreta y verifica. Aprende a leer tu centro de
            seguridad.
          </p>
        </div>
        <span className="soc-label">
          {completed} / 3 conceptos comprendidos
        </span>
      </div>
      <div className="soc-learning-layout">
        <nav className="soc-lesson-nav" aria-label="Lecciones">
          {lessons.map((l, i) => (
            <button
              key={l.tag}
              className={lesson === i ? "active" : ""}
              onClick={() => setLesson(i)}
            >
              <span>{answers[i] === l.answer ? "✓ COMPLETADO" : l.tag}</span>
              <strong>{l.title}</strong>
              <small>
                {i === 0
                  ? "Telemetría y captura"
                  : i === 1
                    ? "Clasificación y probabilidades"
                    : "Métricas y protección"}{" "}
                →
              </small>
            </button>
          ))}
          <Link className="soc-text-link" to="/monitoreo">
            Llevarlo a la práctica →
          </Link>
        </nav>
        <section className="soc-panel soc-lesson">
          <span className="pk-eyebrow">{current.tag}</span>
          <h2>{current.title}</h2>
          <p>{current.text}</p>
          <div className="soc-pipeline" aria-label="Proceso de análisis">
            {["Captura", "Características", "LightGBM", "Revisión"].map(
              (label, i) => (
                <div
                  key={label}
                  className={
                    i === (lesson === 0 ? 0 : lesson === 1 ? 2 : 3)
                      ? "active"
                      : ""
                  }
                >
                  <span>0{i + 1}</span>
                  <strong>{label}</strong>
                </div>
              ),
            )}
          </div>
          <p>{current.detail}</p>
          <div className="soc-quiz">
            <span className="pk-eyebrow">COMPRUEBA TU CRITERIO</span>
            <h3>{current.question}</h3>
            {current.options.map((option, i) => (
              <button
                key={option}
                aria-pressed={answers[lesson] === i}
                className={answers[lesson] === i ? "selected" : ""}
                onClick={() => setAnswers((a) => ({ ...a, [lesson]: i }))}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {option}
              </button>
            ))}
            {answers[lesson] !== undefined && (
              <div role="status" className="soc-feedback">
                <strong>
                  {answers[lesson] === current.answer
                    ? "Correcto."
                    : "Revisa el concepto e inténtalo de nuevo."}
                </strong>{" "}
                {current.feedback}
              </div>
            )}
          </div>
          <div className="soc-lesson-footer">
            <button
              disabled={lesson === 0}
              onClick={() => setLesson((l) => l - 1)}
            >
              ← Anterior
            </button>
            {lesson < 2 ? (
              <button
                className="soc-primary"
                onClick={() => setLesson((l) => l + 1)}
              >
                Siguiente concepto →
              </button>
            ) : (
              <Link className="soc-primary" to="/historial">
                Explorar detecciones →
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
