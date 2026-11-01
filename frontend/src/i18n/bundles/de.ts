// The de interface texts as a chunk of their own, loaded by loadLanguage("de") (see ../index.ts).
import { type Messages, collectLanguage } from "../resources";

export default collectLanguage("de", import.meta.glob<Messages>("../locales/de/*.json", { eager: true, import: "default" }));
