// The Brazilian Portuguese chapters as one chunk; it loads when the documentation is first needed in Brazilian Portuguese.
export default import.meta.glob<string>("../chapters/pt-BR/*.md", { eager: true, query: "?raw", import: "default" });
