'use strict';

/* ============================================================
   wasm.js — emits WebAssembly binary directly. No toolchain.
   ============================================================ */

const MAGIC = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

const SEC = Object.freeze({
  TYPE: 1, IMPORT: 2, FUNC: 3, TABLE: 4, MEM: 5, GLOBAL: 6,
  EXPORT: 7, START: 8, ELEM: 9, CODE: 10, DATA: 11,
});

const T = Object.freeze({
  i32: 0x7f, i64: 0x7e, f32: 0x7d, f64: 0x7c,
  func: 0x60, empty: 0x40,
});

const OP = Object.freeze({
  unreachable: 0x00, nop: 0x01, block: 0x02, loop: 0x03, if: 0x04,
  else: 0x05, end: 0x0b, br: 0x0c, br_if: 0x0d, return: 0x0f,
  call: 0x10, call_indirect: 0x11, drop: 0x1a, select: 0x1b,
  local_get: 0x20, local_set: 0x21, local_tee: 0x22,
  global_get: 0x23, global_set: 0x24,
  i32_load: 0x28, i32_store: 0x36, i32_const: 0x41,
  i32_eqz: 0x45, i32_eq: 0x46, i32_ne: 0x47, i32_lt_s: 0x48,
  i32_gt_s: 0x4a, i32_le_s: 0x4c, i32_ge_s: 0x4e,
  i32_add: 0x6a, i32_sub: 0x6b, i32_mul: 0x6c, i32_div_s: 0x6d,
  i32_rem_s: 0x6f, i32_and: 0x71, i32_or: 0x72, i32_xor: 0x73,
  i32_shl: 0x74, i32_shr_s: 0x75, i32_shr_u: 0x76,
  i32_rotl: 0x77, i32_rotr: 0x78,
});

const VALUE_TYPES = new Set([T.i32, T.i64, T.f32, T.f64]);

function assertUint32(n, label = 'value') {
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) {
    throw new RangeError(`${label} must be an unsigned 32-bit integer`);
  }
}

function assertInt32(n, label = 'value') {
  if (!Number.isInteger(n) || n < -0x80000000 || n > 0x7fffffff) {
    throw new RangeError(`${label} must be a signed 32-bit integer`);
  }
}

function u(n) {
  assertUint32(n);
  const out = [];
  do {
    let byte = n & 0x7f;
    n = Math.floor(n / 128);
    if (n) byte |= 0x80;
    out.push(byte);
  } while (n);
  return out;
}

function s(n) {
  assertInt32(n);
  const out = [];
  let more = true;
  while (more) {
    let byte = n & 0x7f;
    n >>= 7;
    if ((n === 0 && !(byte & 0x40)) || (n === -1 && (byte & 0x40))) {
      more = false;
    } else {
      byte |= 0x80;
    }
    out.push(byte);
  }
  return out;
}

const str = text => {
  if (typeof text !== 'string') throw new TypeError('text must be a string');
  const bytes = [...Buffer.from(text, 'utf8')];
  return [...u(bytes.length), ...bytes];
};

const vec = entries => {
  if (!Array.isArray(entries)) throw new TypeError('vector must be an array');
  return [...u(entries.length), ...entries.flat()];
};

const section = (id, body) => {
  assertUint32(id, 'section id');
  if (!Array.isArray(body)) throw new TypeError('section body must be an array');
  return [id, ...u(body.length), ...body];
};

class Wasm {
  constructor() {
    this.types = [];
    this.funcs = [];
    this.exports = [];
    this.mem = null;
  }

  type(params = [], results = []) {
    for (const valueType of [...params, ...results]) {
      if (!VALUE_TYPES.has(valueType)) throw new TypeError('invalid WebAssembly value type');
    }
    if (results.length > 1) {
      throw new RangeError('this emitter targets MVP WebAssembly: at most one result');
    }
    const encoded = [T.func, ...vec(params.map(x => [x])), ...vec(results.map(x => [x]))];
    const key = encoded.join(',');
    let index = this.types.findIndex(type => type.join(',') === key);
    if (index < 0) {
      index = this.types.length;
      this.types.push(encoded);
    }
    return index;
  }

  func(name, params = [], results = [], locals = [], body = []) {
    if (name != null && typeof name !== 'string') throw new TypeError('function name must be a string');
    if (!Array.isArray(locals) || !Array.isArray(body)) throw new TypeError('locals and body must be arrays');
    for (const local of locals) {
      if (!Array.isArray(local) || local.length !== 2) throw new TypeError('local must be [count, type]');
      assertUint32(local[0], 'local count');
      if (!VALUE_TYPES.has(local[1])) throw new TypeError('invalid local value type');
    }
    const typeIndex = this.type(params, results);
    const index = this.funcs.length;
    this.funcs.push({ typeIndex, locals, body: [...body] });
    if (name) this.export(name, 0x00, index);
    return index;
  }

  export(name, kind, index) {
    if (this.exports.some(item => item.name === name)) throw new Error(`duplicate export: ${name}`);
    assertUint32(index, 'export index');
    this.exports.push({ name, kind, index });
    return this;
  }

  memory(pages, max) {
    if (this.mem) throw new Error('only one memory is supported');
    assertUint32(pages, 'initial pages');
    if (max != null) {
      assertUint32(max, 'maximum pages');
      if (max < pages) throw new RangeError('maximum pages cannot be less than initial pages');
    }
    this.mem = { pages, max };
    this.export('memory', 0x02, 0);
    return this;
  }

  emit() {
    const out = [...MAGIC, ...VERSION];
    if (this.types.length) out.push(...section(SEC.TYPE, vec(this.types)));
    if (this.funcs.length) {
      out.push(...section(SEC.FUNC, vec(this.funcs.map(fn => u(fn.typeIndex)))));
    }
    if (this.mem) {
      const limits = this.mem.max == null
        ? [0x00, ...u(this.mem.pages)]
        : [0x01, ...u(this.mem.pages), ...u(this.mem.max)];
      out.push(...section(SEC.MEM, vec([limits])));
    }
    if (this.exports.length) {
      out.push(...section(SEC.EXPORT, vec(this.exports.map(item => [
        ...str(item.name), item.kind, ...u(item.index),
      ]))));
    }
    if (this.funcs.length) {
      out.push(...section(SEC.CODE, vec(this.funcs.map(fn => {
        const localDecls = vec(fn.locals.map(([count, type]) => [...u(count), type]));
        const code = [...localDecls, ...fn.body, OP.end];
        return [...u(code.length), ...code];
      }))));
    }
    return new Uint8Array(out);
  }
}

module.exports = { Wasm, OP, T, u, s, str, vec, section, SEC };
