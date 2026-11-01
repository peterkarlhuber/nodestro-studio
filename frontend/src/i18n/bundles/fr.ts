// The fr interface texts as a chunk of their own, loaded by loadLanguage("fr") (see ../index.ts).
import { type Messages, collectLanguage } from "../resources";

export default collectLanguage("fr", import.meta.glob<Messages>("../locales/fr/*.json", { eager: true, import: "default" }));
