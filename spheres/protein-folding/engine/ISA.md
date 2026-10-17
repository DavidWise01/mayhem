# I-13 Suite v0.3 — Instruction Set Architecture

## Instruction record

Every lowered I-13 instruction occupies 24 bytes in little-endian linear memory.

| Offset | Field | Type |
| ---: | --- | --- |
| 0 | `op` | i32 |
| 4 | `a` | i32 |
| 8 | `b` | i32 |
| 12 | reserved | i32 |
| 16 | `imm` | f64 |

## Complete I-13 virtual ISA

| ID | Mnemonic | Operand `a` | Operand `b` | Immediate | Effect |
| ---: | --- | --- | --- | --- | --- |
| 0 | `Const` | — | — | f64 | Push a numeric literal |
| 1 | `Ask` | slot | scope | — | Read a local or global binding |
| 2 | `Attr` | — | — | — | Attribute projection marker |
| 3 | `Ret` | — | — | — | Return the top value from a function |
| 4 | `Answer` | slot | flags | — | Declare or assign a binding |
| 5 | `Drop` | — | — | — | Discard the top value |
| 6 | `Bin` | operator | — | — | Apply arithmetic operation |
| 7 | `Cmp` | operator | — | — | Apply comparison operation |
| 8 | `If` | else PC | — | — | Conditional branch |
| 9 | `Call` | argument count | — | — | Dynamic function call |
| 10 | `Block` | — | — | — | Open structured block |
| 11 | `Else` | end PC | — | — | Alternate branch boundary |
| 12 | `End` | — | — | — | Close structured block |
| 13 | `Func` | global slot | function ID | — | Bind function reference |
| 14 | `Halt` | — | — | — | Terminate the current region |

## Subcodes and flags

- `Bin`: `0 +`, `1 -`, `2 *`, `3 /`
- `Cmp`: `0 <`, `1 >`, `2 <=`, `3 >=`, `4 ==`, `5 !=`
- Scope: `0 local`, `1 global`
- Answer flags: `(scope << 1) | assign`

## Direct WASM emitter opcode surface

The embedded byte emitter registers these 42 WebAssembly instructions:

`unreachable`, `nop`, `block`, `loop`, `if`, `else`, `end`, `br`, `br_if`,
`return`, `call`, `call_indirect`, `drop`, `select`, `local.get`, `local.set`,
`local.tee`, `global.get`, `global.set`, `i32.load`, `i32.store`, `i32.const`,
`i32.eqz`, `i32.eq`, `i32.ne`, `i32.lt_s`, `i32.gt_s`, `i32.le_s`, `i32.ge_s`,
`i32.add`, `i32.sub`, `i32.mul`, `i32.div_s`, `i32.rem_s`, `i32.and`, `i32.or`,
`i32.xor`, `i32.shl`, `i32.shr_s`, `i32.shr_u`, `i32.rotl`, and `i32.rotr`.

## Verified v0.3 native module

- WASM bytes: 8,505
- Sections: 11
- Native exports: 31
- Imports: 0
- SHA-256: `5295b80d8f87007ca898d526c09fc2bfb4d586b53966b984f99845a9d8fa4b7d`
