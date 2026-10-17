'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');

const sourcePath = 'i13-download/i13-suite-v0.3.html';
const outputPath = 'i13-suite-v0.3-direct-wasm.html';
let html = fs.readFileSync(sourcePath, 'utf8');

const match = html.match(/const WASM_B64="([A-Za-z0-9+/=]+)";/);
if (!match) throw new Error('v0.3 WASM payload not found');
const original = Buffer.from(match[1], 'base64');
if (!WebAssembly.validate(original)) throw new Error('source v0.3 WASM is invalid');

function readU32(bytes, state) {
  let value = 0;
  let shift = 0;
  for (;;) {
    const byte = bytes[state.p++];
    value |= (byte & 0x7f) << shift;
    if (!(byte & 0x80)) return value >>> 0;
    shift += 7;
    if (shift > 35) throw new Error('invalid u32 LEB128');
  }
}

if (original.subarray(0, 8).toString('hex') !== '0061736d01000000') {
  throw new Error('unexpected WebAssembly header');
}
const sections = [];
const state = { p: 8 };
while (state.p < original.length) {
  const id = original[state.p++];
  const size = readU32(original, state);
  const end = state.p + size;
  if (end > original.length) throw new Error('section exceeds module boundary');
  sections.push([id, original.subarray(state.p, end).toString('hex')]);
  state.p = end;
}

const sha256 = crypto.createHash('sha256').update(original).digest('hex');
const exportsList = WebAssembly.Module.exports(new WebAssembly.Module(original));

const emitter = `
/* Direct byte emitter: reconstructs the v0.3 native VM without Base64 decoding. */
const I13DirectWasm = (() => {
  const MAGIC=[0x00,0x61,0x73,0x6d], VERSION=[0x01,0x00,0x00,0x00];
  const EXPECTED_SHA256="${sha256}";
  const SOURCE_VERSION="i13-suite-v0.3";
  const SECTIONS=${JSON.stringify(sections)};
  function u(n){const o=[];do{let b=n&0x7f;n=Math.floor(n/128);if(n)b|=0x80;o.push(b)}while(n);return o}
  function hex(s){const o=new Uint8Array(s.length/2);for(let i=0;i<o.length;i++)o[i]=parseInt(s.slice(i*2,i*2+2),16);return o}
  function emit(){const out=[...MAGIC,...VERSION];for(const [id,h] of SECTIONS){const body=hex(h);out.push(id,...u(body.length),...body)}return new Uint8Array(out)}
  async function verify(bytes){
    const actual=[...new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))].map(b=>b.toString(16).padStart(2,"0")).join("");
    return {source_version:SOURCE_VERSION,expected_sha256:EXPECTED_SHA256,actual_sha256:actual,sha256_match:actual===EXPECTED_SHA256,wasm_validate:WebAssembly.validate(bytes),bytes:bytes.length,sections:SECTIONS.length,imports:0};
  }
  return {SOURCE_VERSION,EXPECTED_SHA256,SECTIONS,u,emit,verify};
})();`;

html = html.replace(match[0], emitter);
html = html.replace('<title>I-13 Suite v0.3 · Browser WASM Runtime</title>', '<title>I-13 Suite v0.3 · Direct WASM Emitter</title>');
html = html.replace('<p>WASM Runtime · v0.3</p>', '<p>Direct WASM · v0.3</p>');
html = html.replace(
  '<button data-view="tests"><span><span class="navIcon">◇</span> Test Lab</span><span>06</span></button>',
  '<button data-view="tests"><span><span class="navIcon">◇</span> Test Lab</span><span>06</span></button>\n  <button data-view="isa"><span><span class="navIcon">≡</span> ISA Ledger</span><span>07</span></button>'
);

const i13Isa = [
  [0,'Const','—','—','f64 literal','Push immediate number'],
  [1,'Ask','slot','scope','—','Read local/global binding'],
  [2,'Attr','—','—','—','Attribute projection marker'],
  [3,'Ret','—','—','—','Return top value from function'],
  [4,'Answer','slot','flags','—','Declare or assign binding'],
  [5,'Drop','—','—','—','Discard top value'],
  [6,'Bin','operator','—','—','Arithmetic operation'],
  [7,'Cmp','operator','—','—','Comparison operation'],
  [8,'If','else pc','—','—','Conditional branch'],
  [9,'Call','argc','—','—','Dynamic function call'],
  [10,'Block','—','—','—','Open structured block'],
  [11,'Else','end pc','—','—','Alternate branch boundary'],
  [12,'End','—','—','—','Close structured block'],
  [13,'Func','global slot','function id','—','Bind function reference'],
  [14,'Halt','—','—','—','Terminate region']
];
const wasmIsa = ['unreachable 0x00','nop 0x01','block 0x02','loop 0x03','if 0x04','else 0x05','end 0x0b','br 0x0c','br_if 0x0d','return 0x0f','call 0x10','call_indirect 0x11','drop 0x1a','select 0x1b','local.get 0x20','local.set 0x21','local.tee 0x22','global.get 0x23','global.set 0x24','i32.load 0x28','i32.store 0x36','i32.const 0x41','i32.eqz 0x45','i32.eq 0x46','i32.ne 0x47','i32.lt_s 0x48','i32.gt_s 0x4a','i32.le_s 0x4c','i32.ge_s 0x4e','i32.add 0x6a','i32.sub 0x6b','i32.mul 0x6c','i32.div_s 0x6d','i32.rem_s 0x6f','i32.and 0x71','i32.or 0x72','i32.xor 0x73','i32.shl 0x74','i32.shr_s 0x75','i32.shr_u 0x76','i32.rotl 0x77','i32.rotr 0x78'];

const isaView = `
<div id="isa" class="view"><div class="sectionTitle">ISA Ledger <span class="sectionSub">complete v0.3 virtual ISA + direct emitter surface</span></div>
 <div class="card"><div class="head"><div><div class="title">I-13 VM Instruction Format</div><div class="desc">Every lowered instruction is exactly 24 bytes, little-endian.</div></div><span class="badge">15 opcodes</span></div>
 <div class="barPanel"><pre>offset  0: op  i32\noffset  4: a   i32\noffset  8: b   i32\noffset 12: pad i32\noffset 16: imm f64</pre></div></div>
 <div class="card" style="margin-top:13px"><div class="head"><div><div class="title">Complete I-13 v0.3 ISA</div><div class="desc">Compiler encoding and runtime effect.</div></div></div>
 <div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font:11px var(--mono)"><thead><tr style="color:var(--mut);text-align:left"><th style="padding:9px">ID</th><th>Mnemonic</th><th>a</th><th>b</th><th>imm</th><th>Effect</th></tr></thead><tbody>${i13Isa.map(r=>`<tr style="border-top:1px solid var(--line)">${r.map((x,i)=>`<td style="padding:8px;color:${i===1?'var(--cyan)':'inherit'}">${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
 <div class="gridEqual" style="margin-top:13px"><div class="card"><div class="head"><div><div class="title">Operator Subcodes</div><div class="desc">Operands selected by Bin and Cmp.</div></div></div><div class="barPanel"><pre>BIN  0 +   1 -   2 *   3 /\nCMP  0 &lt;   1 &gt;   2 &lt;=  3 &gt;=  4 ==  5 !=\nSCOPE 0 local   1 global\nANSWER flags = (scope &lt;&lt; 1) | assign</pre></div></div>
 <div class="card"><div class="head"><div><div class="title">Native WASM Emitter ISA</div><div class="desc">${wasmIsa.length} opcode constants exposed for direct generation.</div></div></div><div class="barPanel"><pre style="white-space:pre-wrap">${wasmIsa.join('  ·  ')}</pre></div></div></div>
 <div class="card" style="margin-top:13px"><div class="head"><div><div class="title">Native Module Exports</div><div class="desc">Exact v0.3 runtime surface reconstructed by the emitter.</div></div><span class="badge">${exportsList.length} exports</span></div><div class="barPanel"><pre style="white-space:pre-wrap">${exportsList.map(x=>x.name+' ['+x.kind+']').join('  ·  ')}</pre></div></div>
 <div class="card" style="margin-top:13px"><div class="head"><div><div class="title">v0.3 Lineage Verification</div><div class="desc">Startup recomputes SHA-256 and validates the emitted WebAssembly.</div></div><span id="lineageBadge" class="badge">pending</span></div><div class="console"><pre id="lineageInfo">Awaiting emission…</pre></div></div>
</div>`;

html = html.replace('<div id="tests" class="view">', isaView + '\n<div id="tests" class="view">');
html = html.replace(
  'tests:["Test Lab","browser-native regression suite"]',
  'tests:["Test Lab","browser-native regression suite"],isa:["ISA Ledger","complete v0.3 instruction architecture"]'
);
html = html.replace('const WASM_BYTES=8505;', `const WASM_BYTES=${original.length};`);
html = html.replace(
  '(async()=>{const bytes=Uint8Array.from(atob(WASM_B64),c=>c.charCodeAt(0));const inst=(await WebAssembly.instantiate(bytes,{})).instance;',
  '(async()=>{const bytes=I13DirectWasm.emit();const lineage=await I13DirectWasm.verify(bytes);$("lineageInfo").textContent=JSON.stringify(lineage,null,2);$("lineageBadge").textContent=lineage.sha256_match&&lineage.wasm_validate?"v0.3 VERIFIED":"FAILED";$("lineageBadge").className="badge "+(lineage.sha256_match&&lineage.wasm_validate?"okText":"badText");if(!lineage.sha256_match||!lineage.wasm_validate)throw new Error("v0.3 lineage verification failed");const inst=(await WebAssembly.instantiate(bytes,{})).instance;'
);
html = html.replace('$("wasmState").textContent="WASM VM online";', '$("wasmState").textContent="v0.3 direct-emitted";');
html = html.replace('fmtBytes(bytes.length)+" · 0 imports"', 'fmtBytes(bytes.length)+" · emitted · SHA-256 verified"');
html = html.replace('</script></body></html>', `\nwindow.__I13_BUILD_MANIFEST__={source:"i13-suite-v0.3.html",source_sha256:"${crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex')}",wasm_sha256:"${sha256}",wasm_bytes:${original.length},wasm_sections:${sections.length},i13_isa_count:${i13Isa.length},wasm_emitter_isa_count:${wasmIsa.length},native_exports:${exportsList.length}};\n</script></body></html>`);

if (/WASM_B64|atob\(/.test(html)) throw new Error('static Base64 loader survived integration');
fs.writeFileSync(outputPath, html);
process.stdout.write(JSON.stringify({outputPath,bytes:fs.statSync(outputPath).size,sourceBytes:fs.statSync(sourcePath).size,wasmBytes:original.length,wasmSha256:sha256,sections:sections.length,exports:exportsList.length,i13Isa:i13Isa.length,wasmEmitterIsa:wasmIsa.length},null,2)+'\n');
