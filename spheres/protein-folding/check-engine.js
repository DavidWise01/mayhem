// check-engine.js · MODEL helper by Grok Bot. Run: node check-engine.js (from spheres/protein-folding/)
// Repeats Dave's verify-i13-direct.js checks that don't need the missing i13-download/i13-suite-v0.3.html source,
// then boots the engine through i13-loader.js and runs the 8-program regression lab plus one HP-energy program.
'use strict';
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const html=fs.readFileSync(__dirname+'/engine/i13-suite-v0.3-direct-wasm.html','utf8');
const m=html.match(/window\.__I13_BUILD_MANIFEST__=(\{[^;]+\});/),sx=html.match(/const SECTIONS=(\[\[.*?\]\]);/);assert(m&&sx);
const man=Function('"use strict";return ('+m[1]+')')(),sec=JSON.parse(sx[1]);
const u=n=>{const o=[];do{let b=n&0x7f;n=Math.floor(n/128);if(n)b|=0x80;o.push(b)}while(n);return o};
const by=[0,0x61,0x73,0x6d,1,0,0,0];for(const [id,h] of sec){const b=Buffer.from(h,'hex');by.push(id,...u(b.length),...b)}const mod=Uint8Array.from(by);
const sha=crypto.createHash('sha256').update(mod).digest('hex');
assert.equal(WebAssembly.validate(mod),true);assert.equal(sha,man.wasm_sha256);assert.equal(sha,'5295b80d8f87007ca898d526c09fc2bfb4d586b53966b984f99845a9d8fa4b7d');
assert.equal(mod.length,8505);assert.equal(sec.length,11);assert.equal(WebAssembly.Module.exports(new WebAssembly.Module(mod)).length,31);assert.equal(WebAssembly.Module.imports(new WebAssembly.Module(mod)).length,0);
assert(!html.includes('WASM_B64'));assert.match(html,/v0\.3 VERIFIED/);
const I=require('./i13-loader.js');global.I13=I;const PF=require('./pf-core.js');
(async()=>{const B=await I.boot(html);assert.equal(B.labPass,8);const e=await PF.engineEnergy('HPHPPHHPHPPHPHHPPHPH',PF.coords('0221312113030313002'.split('').map(Number)));assert.equal(e.E,-9);assert.equal(e.clash,0);
 process.stdout.write(JSON.stringify({status:'PASS',wasm_sha256:sha,wasm_bytes:mod.length,sections:sec.length,native_exports:31,imports:0,html_sha256:crypto.createHash('sha256').update(html).digest('hex'),regression_lab:B.labPass+'/'+B.labTotal,hp_S1_optimum_E:e.E,source_lineage:'not checked (i13-download/i13-suite-v0.3.html not supplied)'},null,2)+'\n')})().catch(e=>{console.error('FAIL',e);process.exit(1)});
