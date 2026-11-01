// The French chapters as one chunk; it loads when the documentation is first needed in French.
export default import.meta.glob<string>("../chapters/fr/*.md", { eager: true, query: "?raw", import: "default" });
