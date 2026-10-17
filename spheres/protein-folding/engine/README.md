# I-13 Suite v0.3 — Direct WASM Emitter

Open `i13-suite-v0.3-direct-wasm.html` directly in a modern browser. It is a standalone artifact with no server, compiler, package, or network dependency.

The original v0.3 parser, AST lowerer, fixed-record virtual ISA, Cortex gates, native VM, memory model, function calls, returns, aliases, branching, and recursion remain intact. The former Base64 loader is replaced by a deterministic WebAssembly section emitter.

At startup the page:

1. Emits the native module byte by byte.
2. validates it with `WebAssembly.validate`.
3. calculates SHA-256.
4. compares it to the known v0.3 native-module digest.
5. instantiates the verified bytes.
6. runs the original eight-program regression lab.

Run the independent artifact verifier with:

```sh
node verify-i13-direct.js
```

Regenerate the HTML from the saved v0.3 source with:

```sh
node build-i13-direct.js
```
