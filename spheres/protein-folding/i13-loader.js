/* i13-loader.js · MODEL glue by Grok Bot (not part of Dave's engine).
   Loads Dave's I-13 Suite v0.3 direct-WASM engine VERBATIM from engine/i13-suite-v0.3-direct-wasm.html,
   lifts its IReader / I13WasmVM3 / I13DirectWasm / TESTS out of the page script without changing a byte,
   emits the WASM, checks SHA-256 against 5295b80d…7d, instantiates with 0 imports, runs the 8-program lab. */
(function(G){
'use strict';
const EXPECT='5295b80d8f87007ca898d526c09fc2bfb4d586b53966b984f99845a9d8fa4b7d';
const HTML_SHA='caf444ee30812a0d841e622b4daffad3bef50f19c4d434ec8006fa0486a1cdcb';
async function hexsha(buf){const d=await crypto.subtle.digest('SHA-256',buf);return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function lift(html){const a=html.indexOf('<script>')+8,b=html.indexOf('const WASM_BYTES=');if(a<8||b<0)throw Error('engine script markers missing');
  return Function('"use strict";'+html.slice(a,b)+';return {IReader,I13WasmVM3,I13DirectWasm,SAMPLE,TESTS};')()}
let P=null;
async function boot(htmlText){
  if(P)return P;
  P=(async()=>{
    const t0=(typeof performance!=='undefined'?performance.now():Date.now());
    let html=htmlText;
    if(html==null){const base=(G.I13_BASE||'engine/');const r=await fetch(base+'i13-suite-v0.3-direct-wasm.html');if(!r.ok)throw Error('engine fetch '+r.status);html=await r.text()}
    const htmlSha=await hexsha(new TextEncoder().encode(html));
    const E=lift(html);
    const bytes=E.I13DirectWasm.emit();
    const lineage=await E.I13DirectWasm.verify(bytes);
    if(!lineage.wasm_validate)throw Error('WASM invalid');
    if(lineage.actual_sha256!==EXPECT||!lineage.sha256_match)throw Error('SHA-256 mismatch '+lineage.actual_sha256);
    const {instance,module}=await WebAssembly.instantiate(bytes,{});
    const W=instance.exports;
    const nExports=WebAssembly.Module.exports(module).length,nImports=WebAssembly.Module.imports(module).length;
    let pass=0;const lab=[];
    for(const [name,src,expect] of E.TESTS){const x=await run0(E,W,src);const ok=x.ok&&Object.entries(expect).every(([k,v])=>x.globals[k]===v);if(ok)pass++;lab.push({name,ok})}
    const ms=((typeof performance!=='undefined'?performance.now():Date.now())-t0);
    return {E,W,lineage,htmlSha,htmlShaMatch:htmlSha===HTML_SHA,bytes:bytes.length,nExports,nImports,lab,labPass:pass,labTotal:E.TESTS.length,ms};
  })();
  return P;
}
const MAXOPS=1500;/* AMBER, found by testing: the v0.3 VM keeps its code + globals between byte 16384 and ≈60 KB of linear memory, so one program must stay under ≈1,800 lowered instructions; we cap at 1,500 and chain longer work */
async function run0(E,W,src,stepLimit){const h=await E.IReader.read(src,'pf.i13');const c=E.I13WasmVM3.compile(h.ast);if(c.code.length>MAXOPS)return {ok:false,error:'TOO_BIG',ops:c.code.length,globals:{}};const v=E.I13WasmVM3.validate(W,c);if(!v.ok)return {ok:false,error:'VALIDATE '+v.error,globals:{}};const r=E.I13WasmVM3.execute(W,c,stepLimit||1000000,48);return {ok:r.ok,error:r.error,globals:r.globals,steps:r.steps,calls:r.calls,depth:r.max_call_depth,ops:c.code.length,bytes:c.code.length*24}}
let STATS={runs:0,steps:0,ops:0,chunks:0};
function lit(v){if(!isFinite(v))throw Error('lit '+v);const a=Math.abs(v);let t=String(a);if(/e-/.test(t)){const [m,e]=t.split('e-');const dg=m.replace('.','');let k=+e+(m.includes('.')?m.split('.')[1].length:0);let q=dg.replace(/^0+/,'')||'0';while(k>22){q='('+q+' / 10000000000000000000000)';k-=22}t='('+q+' / 1'+'0'.repeat(k)+')'}else if(/e/.test(t))t=BigInt(Math.round(a)).toString();return v<0?'(0 - '+t+')':t}
async function run(src,stepLimit){const B=await boot();const r=await run0(B.E,B.W,src,stepLimit);if(!r.ok)throw Error('I-13 VM: '+r.error+(r.ops?' ('+r.ops+' ops)':''));STATS.runs++;STATS.steps+=r.steps;STATS.ops+=r.ops;return r}
/* chain: run groups of statements in as many VM programs as needed (each under MAXOPS), carrying named values forward as literals */
async function runChain(prelude,groups,carry){const B=await boot();const car=Object.assign({},carry||{});const out={};let i=0,steps=0,runs=0,ops=0;const tk=x=>B.E.IReader.lex(x).length;const tp=tk(prelude);const tg=groups.map(tk);
 while(i<groups.length){let k=0,sum=tp+Object.keys(car).length*6;while(i+k<groups.length&&(k===0||sum+tg[i+k]<1250)){sum+=tg[i+k];k++}
  for(;;){const src=prelude+Object.keys(car).map(n=>'I '+n+' <- '+lit(car[n])).join('\n')+'\n'+groups.slice(i,i+k).join('\n')+'\n';const r=await run0(B.E,B.W,src);
   if(!r.ok&&r.error==='TOO_BIG'&&k>1){k=Math.ceil(k/2);continue}if(!r.ok)throw Error('I-13 VM: '+r.error);
   for(const [n,v] of Object.entries(r.globals))if(typeof v==='number')out[n]=v;for(const n in car)car[n]=r.globals[n];steps+=r.steps;runs++;ops+=r.ops;break}i+=k}
 STATS.runs+=runs;STATS.steps+=steps;STATS.ops+=ops;STATS.chunks+=runs;return {globals:Object.assign(out,car),steps,runs,ops}}
/* shared I-13 library (MODEL): the VM has + - * / and comparisons, no loops, call depth ≤ 48, so exp/ln/sqrt are written as recursion here */
const LIB=`
def ab(I x) { if x < 0 { -> 0 - x } -> x }
def tay(I x, I k, I t) { if k > 24 { -> t } -> t + tay(x, k + 1, t * x / k) }
def ex(I x) { if x > 0.5 { I h <- ex(x / 2) -> h * h } if x < 0 - 0.5 { I g <- ex(x / 2) -> g * g } -> tay(x, 1, 1) }
def nw(I a, I g, I k) { if k > 30 { -> g } -> nw(a, (g + a / g) / 2, k + 1) }
def sq(I a) { if a <= 0 { -> 0 } if a > 1 { -> nw(a, a, 0) } -> nw(a, 1, 0) }
def ats(I y, I y2, I k, I p) { if k > 45 { -> 0 } -> p / k + ats(y, y2, k + 2, p * y2) }
def lnr(I x) { if x > 2 { -> 0.6931471805599453 + lnr(x / 2) } if x < 1 { -> lnr(x * 2) - 0.6931471805599453 } I y <- (x - 1) / (x + 1) -> 2 * ats(y, y * y, 1, y) }
def pw(I b, I n) { if n < 1 { -> 1 } -> b * pw(b, n - 1) }
`;
G.I13={boot,run,runChain,lit,LIB,STATS,EXPECT,HTML_SHA,MAXOPS};
if(typeof module!=='undefined')module.exports=G.I13;
})(typeof window!=='undefined'?window:globalThis);
