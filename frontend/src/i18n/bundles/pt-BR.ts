// The pt-BR interface texts as a chunk of their own, loaded by loadLanguage("pt-BR") (see ../index.ts).
import { type Messages, collectLanguage } from "../resources";

export default collectLanguage("pt-BR", import.meta.glob<Messages>("../locales/pt-BR/*.json", { eager: true, import: "default" }));
