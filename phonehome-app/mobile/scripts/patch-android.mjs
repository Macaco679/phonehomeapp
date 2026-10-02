// Ajustes no projeto Android gerado: versão e permissões.
import { readFileSync, writeFileSync } from "node:fs";
const gradle = "android/app/build.gradle";
let g = readFileSync(gradle, "utf8");
const code = process.env.VERSION_CODE || "1";
const name = process.env.VERSION_NAME || "1.0.0";
g = g.replace(/versionCode \d+/, `versionCode ${code}`).replace(/versionName "[^"]*"/, `versionName "${name}"`);
writeFileSync(gradle, g);
console.log(`android versionCode=${code} versionName=${name}`);
