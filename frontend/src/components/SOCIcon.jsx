const paths = {
  "/": "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  "/analizar": "M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5",
  "/monitoreo": "M2 12h4l3-8 6 16 3-8h4",
  "/resultados": "M5 21V11 M12 21V3 M19 21V7",
  "/historial": "M3 11a9 9 0 1 1 2 7 M3 4v7h7 M12 7v5l3 2",
  "/aprende": "M2 8l10-5 10 5-10 5z M6 10v7c4 3 8 3 12 0v-7 M22 8v8",
  shield: "M12 2l8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V5z M8 12l3 3 5-6",
};
export default function SOCIcon({ name }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name] || paths.shield} />
    </svg>
  );
}
