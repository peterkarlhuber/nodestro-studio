// The Spanish chapters as one chunk; it loads when the documentation is first needed in Spanish.
export default import.meta.glob<string>("../chapters/es/*.md", { eager: true, query: "?raw", import: "default" });
