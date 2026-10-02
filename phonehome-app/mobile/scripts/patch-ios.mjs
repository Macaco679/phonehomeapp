// Ajustes no projeto iOS gerado: declaração de criptografia (evita perguntas na revisão).
import { readFileSync, writeFileSync } from "node:fs";
const p = "ios/App/App/Info.plist";
let s = readFileSync(p, "utf8");
const add = (key, xml) => { if (!s.includes(`<key>${key}</key>`)) s = s.replace("</dict>\n</plist>", `\t<key>${key}</key>\n\t${xml}\n</dict>\n</plist>`); };
add("ITSAppUsesNonExemptEncryption", "<false/>");
writeFileSync(p, s);
console.log("Info.plist ok");
