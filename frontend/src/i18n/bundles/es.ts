// The es interface texts as a chunk of their own, loaded by loadLanguage("es") (see ../index.ts).
import { type Messages, collectLanguage } from "../resources";

export default collectLanguage("es", import.meta.glob<Messages>("../locales/es/*.json", { eager: true, import: "default" }));
