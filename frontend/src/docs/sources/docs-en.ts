// The English chapters as one chunk; it loads when the documentation is first needed in English.
export default import.meta.glob<string>("../chapters/en/*.md", { eager: true, query: "?raw", import: "default" });
