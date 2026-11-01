// The German chapters as one chunk; it loads when the documentation is first needed in German.
export default import.meta.glob<string>("../chapters/de/*.md", { eager: true, query: "?raw", import: "default" });
