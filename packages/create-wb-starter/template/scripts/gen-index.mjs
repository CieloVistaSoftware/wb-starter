import{readdirSync,readFileSync,statSync,writeFileSync,existsSync}from"fs";
import{join}from"path";

const REGISTRIES=["wb-lazy.js","wb.js","schema-builder.js","site-engine.js","wb-bootstrap.js","wb-views.js","behaviorMeta.js","index-backup.js","index.js"];
const SKIP_X=new Set(["x-behavior","x-error","x-start","x-end","x-width","x-height","x-shadow","x-direction","x-wrap","x-shrink","x-sizing","x-dark","x-light","x-content","x-item","x-divider","x-legacy","x-input","x-wrapper","x-hydrated","x-ignore","x-eager","x-schema","x-auto","x-stack"]);
const SKIP_X_SUB=new Set(["x-card-scroll-container","x-card-styles","x-code-block","x-code-wrapper","x-code-theme","x-pre-wrapper","x-custom-class","x-delay","x-hide-delay","x-position","x-autosize-init","x-datepicker-init","x-diff-init","x-timepicker-init","x-blend-mode","x-as-card","x-basis","x-id","x-meta","x-title","x-status","x-details","x-label","x-empty","x-grid","x-item--danger","x-enhancements"]);
const SKIP_WB=new Set(["wb-ready","wb-viewmodels","wb-models","wb-bootstrap","wb-starter","wb-framework","wb-lazy","wb-view","wb-views","wb-for","wb-if","wb-unless"]);
const SKIP_WB_EXTRA=new Set(["wb-fade-in","wb-fade-out","wb-slide-in","wb-zoom-in","wb-events-styles","wb-firework-styles","wb-fix-card-styles","wb-particle-styles","wb-ripple-styles","wb-stagelight-styles","wb-sticky-styles","wb-snow-styles","wb-sparkle-styles","wb-rainbow-styles","wb-confetti-styles","wb-editing-styles","wb-showcase-styles","wb-progressbar-css","wb-progress-css","wb-footer-css","wb-header-css","wb-audio-eq-css","wb-floating-label","wb-grayscale-dark","wb-input-glass","wb-fix-card","wb-fix-card-scroll-container","wb-resize-overlay","wb-resizing","wb-scroll-lock","wb-color-error","wb-success","wb-spin","wb-behaviors-showcase","wb-behavior","wb-feedback","wb-glow","wb-reveal","wb-parallax","wb-list-style","wb-dl-style","wb-confirm-trigger","wb-notify-trigger","wb-toast-trigger","wb-prompt-trigger","wb-lightbox-trigger","wb-offcanvas-trigger","wb-popover-trigger","wb-dialog-trigger","wb-sheet-trigger","wb-drawer-trigger"]);
function isNoise(w){if(w.includes("--"))return true;if(SKIP_WB.has(w))return true;if(/-(container|fall|gradient|particle|animation|shimmer|scroll-container|copy-btn|module|display|list|count|close|clear|db|active-track|frame|glass|lock|overlay|indeterminate|stripes|bar|float|swing|dot|styled)$/.test(w))return true;if(w.endsWith("-"))return true;return false;}
const behaviors={};const components={};
function norm(fp){return fp.split("\\").join("/");}
function isReg(fp){return REGISTRIES.some(r=>fp.endsWith(r));}
function scan(dir){
  if(!existsSync(dir))return;
  for(const f of readdirSync(dir)){
    const fp=join(dir,f);
    if(statSync(fp).isDirectory()){if(f==="builder-app")continue;scan(fp);continue;}
    if(!f.endsWith(".js"))continue;
    const reg=isReg(fp),rel=norm(fp);
    let t;try{t=readFileSync(fp,"utf8");}catch{continue;}
    for(const x of new Set(t.match(/x-[a-z][-a-z0-9]*/g)||[])){
      if(SKIP_X.has(x)||SKIP_X_SUB.has(x)||/^x-w-/.test(x))continue;
      if(!behaviors[x])behaviors[x]={primary:null,candidates:[]};
      if(!reg)behaviors[x].candidates.push(rel);
    }
    if(!reg){for(const w of new Set(t.match(/wb-[a-z][-a-z0-9]*/g)||[])){
      if(isNoise(w))continue;if(!components[w])components[w]=rel;
    }}
  }
}
scan("src/wb-viewmodels");scan("src/core");
// Resolve primaries: prefer filename match
for(const[name,b]of Object.entries(behaviors)){
  const short=name.replace("x-","");
  const match=b.candidates.find(f=>{const fn=f.split("/").pop().replace(".js","");return fn===short;});
  b.primary=match||b.candidates[0]||null;
}
const cssMap={};if(existsSync("src/styles/behaviors")){for(const f of readdirSync("src/styles/behaviors")){if(f.endsWith(".css"))cssMap[f.replace(".css","")]="src/styles/behaviors/"+f;}}
const schemaMap={};if(existsSync("src/wb-models")){for(const f of readdirSync("src/wb-models")){if(f.endsWith(".schema.json"))schemaMap[f.replace(".schema.json","")]="src/wb-models/"+f;}}
// Build behavior set names for matching
const behaviorNames=new Set(Object.keys(behaviors).map(k=>k.replace("x-","")));

// BEHAVIORS: x-attr is the API, wb- is the CSS output
const bOut={};
for(const k of Object.keys(behaviors).sort()){
  if(!behaviors[k].primary)continue;
  const short=k.replace("x-","");
  const e={js:behaviors[k].primary};
  if(cssMap[short])e.css=cssMap[short];
  if(schemaMap[short])e.schema=schemaMap[short];
  // note the wb- class it generates
  const wbName="wb-"+short;
  if(components[wbName])e.cssClass=wbName;
  bOut[k]=e;
}
// STANDALONE COMPONENTS: wb- elements with no x- behavior driver
const cOut={};
const allKeys=Object.keys(components).sort().filter(k=>!SKIP_WB_EXTRA.has(k));
// Filter out any wb- that is driven by an x- behavior
const standalone=allKeys.filter(k=>!behaviorNames.has(k.replace("wb-","")));
const parentKeys=new Set(standalone.filter(k=>k.split("-").length===2));
for(const k of standalone){
  const parts=k.split("-");const parent=parts[0]+"-"+parts[1];
  if(parts.length>2&&parentKeys.has(parent)){
    if(!cOut[parent])cOut[parent]={js:components[parent]||components[k]};
    if(!cOut[parent].variants)cOut[parent].variants=[];
    cOut[parent].variants.push(k);
  }else{
    if(!cOut[k])cOut[k]={js:components[k]};
  }
}
for(const k of Object.keys(cOut)){
  if(cOut[k].variants&&cOut[k].variants.length===0)delete cOut[k].variants;
  const s=k.replace("wb-","");
  if(cssMap[s])cOut[k].css=cssMap[s];
  if(schemaMap[s])cOut[k].schema=schemaMap[s];
}
const idx={generated:new Date().toISOString(),note:"behaviors: x-attr API + wb- CSS output (same file). components: standalone wb- elements with no x- behavior driver.",behaviors:bOut,components:cOut};
writeFileSync("data/behavior-component-index.json",JSON.stringify(idx,null,2));
const bWithCss=Object.values(bOut).filter(v=>v.cssClass).length;
process.stdout.write("Behaviors: "+Object.keys(bOut).length+" ("+bWithCss+" with wb- class)  Standalone components: "+Object.keys(cOut).length+"\n");
