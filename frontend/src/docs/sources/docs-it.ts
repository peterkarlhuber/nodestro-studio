// The Italian chapters as one chunk; it loads when the documentation is first needed in Italian.
export default import.meta.glob<string>("../chapters/it/*.md", { eager: true, query: "?raw", import: "default" });
