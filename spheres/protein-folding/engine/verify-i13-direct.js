'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');

function u(n) {
  const out = [];
  do {
    let byte = n & 0x7f;
    n = Math.floor(n / 128);
    if (n) byte |= 0x80;
    out.push(byte);
  } while (n);
  return out;
}

const html = fs.readFileSync('i13-suite-v0.3-direct-wasm.html', 'utf8');
const source = fs.readFileSync('i13-download/i13-suite-v0.3.html');
const manifestMatch = html.match(/window\.__I13_BUILD_MANIFEST__=(\{[^;]+\});/);
const sectionsMatch = html.match(/const SECTIONS=(\[\[.*?\]\]);/);
assert(manifestMatch, 'embedded build manifest missing');
assert(sectionsMatch, 'direct section source missing');
assert(!html.includes('WASM_B64'), 'legacy Base64 payload remains');
assert(!html.includes('atob('), 'legacy Base64 decoder remains');

const manifest = Function(`"use strict";return (${manifestMatch[1]})`)();
const sections = JSON.parse(sectionsMatch[1]);
const bytes = [0, 0x61, 0x73, 0x6d, 1, 0, 0, 0];
for (const [id, hex] of sections) {
  const body = Buffer.from(hex, 'hex');
  bytes.push(id, ...u(body.length), ...body);
}
const moduleBytes = Uint8Array.from(bytes);
const wasmSha256 = crypto.createHash('sha256').update(moduleBytes).digest('hex');
const sourceSha256 = crypto.createHash('sha256').update(source).digest('hex');

assert.equal(WebAssembly.validate(moduleBytes), true, 'emitted WASM invalid');
assert.equal(wasmSha256, manifest.wasm_sha256, 'v0.3 WASM lineage mismatch');
assert.equal(sourceSha256, manifest.source_sha256, 'v0.3 HTML lineage mismatch');
assert.equal(moduleBytes.length, 8505);
assert.equal(sections.length, 11);
assert.equal((html.match(/<tr style="border-top:1px solid var\(--line\)">/g) || []).length, 15);
assert.equal(WebAssembly.Module.exports(new WebAssembly.Module(moduleBytes)).length, 31);
assert.match(html, /v0\.3 VERIFIED/);

process.stdout.write(JSON.stringify({
  status: 'PASS',
  source_lineage: 'i13-suite-v0.3.html',
  source_sha256: sourceSha256,
  wasm_sha256: wasmSha256,
  wasm_valid: true,
  wasm_bytes: moduleBytes.length,
  wasm_sections: sections.length,
  native_exports: 31,
  i13_isa: 15,
  wasm_emitter_isa: manifest.wasm_emitter_isa_count,
  base64_runtime_dependency: false,
}, null, 2) + '\n');
