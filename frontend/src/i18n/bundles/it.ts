// The it interface texts as a chunk of their own, loaded by loadLanguage("it") (see ../index.ts).
import { type Messages, collectLanguage } from "../resources";

export default collectLanguage("it", import.meta.glob<Messages>("../locales/it/*.json", { eager: true, import: "default" }));
