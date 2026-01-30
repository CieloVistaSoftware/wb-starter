import fs from "fs";
import path from "path";

const DIR="src/wb-models";
const OUT="src/types/behaviors.d.ts";

function sanitize(name){
  return name.replace(/[-.]/g,"_").replace(/^_/,"");
}

const files=fs.readdirSync(DIR).filter(f=>f.endsWith(".schema.json"));
const out=["// Auto-generated from schema files","// Run: node scripts/gen-types.mjs",""];

for(const f of files){
  const s=JSON.parse(fs.readFileSync(path.join(DIR,f),"utf8"));
  const raw=s.name||f.replace(".schema.json","");
  const n=sanitize(raw);
  const p=n[0].toUpperCase()+n.slice(1);
  out.push("export interface "+p+"Options {");
  if(s.properties){
    for(const[k,v]of Object.entries(s.properties)){
      const t=v.type==="string"?"string":v.type==="number"?"number":v.type==="boolean"?"boolean":"any";
      out.push("  "+k+"?: "+t+";");
    }
  }
  out.push("}","");
}

if(!fs.existsSync("src/types"))fs.mkdirSync("src/types",{recursive:true});
fs.writeFileSync(OUT,out.join("\n"));
console.log("Generated",OUT,"with",files.length,"interfaces");