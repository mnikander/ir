# HIR to LIR Lowering via Simple Micro-Passes

## Summary
- Keep [src/passes/lower.ts](/home/marco/Documents/ir/src/passes/lower.ts) as a thin pipeline: `eliminate_phi_nodes` -> `rename_registers` -> `linearize_to_lir`.
- Reuse the existing phi-elimination pass as-is. It already matches the requested split-edge strategy and uses temporaries to avoid parallel-phi issues.
- Scope this first milestone to the ops already exercised by [test/lower.test.ts](/home/marco/Documents/ir/test/lower.test.ts): `Constant`, `Copy`, arithmetic/comparison ops, `Call`, `Jump`, `Branch`, and `Return`.
- Treat `Heap`, `Stack`, `Borrow`, `Load`, `Update`, `Drop`, move-tagged inputs, and any leftover `joins` as explicit lowering errors for now.

## Public / Internal Interfaces
- Keep the public API unchanged: `lower(program: HIR.Program): LIR.Program`.
- Add a small lowering submodule under [src/passes/lowering/](/home/marco/Documents/ir/src/passes) that exports the new micro-passes for direct unit testing.
- Add one internal “numbered HIR” shape: same function/block structure and symbolic labels, but all registers become numeric offsets.
- Add one internal unresolved linear form for `Jump`, `Branch`, and `Call`, so target patching happens after emission.

## Implementation Changes
- Pass 1: phi elimination
  - Call the existing phi pass first and do not fold it into later passes.
  - Keep the current always-temporary behavior in v1; do not try to optimize away redundant temps.
- Pass 2: register enumeration
  - Number slots per function, independently.
  - Assign parameter registers first, in declared order, starting at offset `0`.
  - Assign every other register in first-definition order by scanning the phi-eliminated blocks in their existing order, then each line in order.
  - Do not reuse slots by liveness in v1; one SSA register gets one slot.
  - Preserve original function/block labels and original parameter names for debug `Noop` notes.
- Pass 3: linearization and target resolution
  - Preserve function order exactly as given so `@main` stays first.
  - Emit a function-header `Noop` before each function, formatted like `fun @name [%a, %b]`.
  - Emit a block-label `Noop` before each block.
  - Lower supported HIR lines/terminators directly to LIR with numeric offsets.
  - For `Call`, keep caller-side argument offsets in the LIR call instruction; the callee gets its own independent `0..n-1` parameter numbering from pass 2.
  - Record function-header line numbers for call targets and block-label line numbers for jump/branch targets.
  - After emission, patch symbolic targets to `{ line: n }`.
- Essential guardrails
  - Fail fast with descriptive errors on unsupported HIR tags, unsupported inputs, or unresolved targets.
  - Assert that phi elimination removed all `joins` before numbering or linearization.

## Test Plan
- Keep `test/passes/phi.test.ts` as the unit test for pass 1.
- Add focused tests for the new passes:
  - register enumeration gives params `0..n-1` and then deterministic slots for later SSA registers
  - linearization resolves jumps/branches to the block-label `Noop` line
  - call lowering resolves to the callee function-header `Noop` line
- Unskip [test/lower.test.ts](/home/marco/Documents/ir/test/lower.test.ts) and use it as the integration suite for the full pipeline.
- Update the phi-based lowering expectation in `test/lower.test.ts` to match the chosen temp-based phi elimination, including the extra slots and shifted line numbers that follow from those temporaries.

## Assumptions
- First milestone is intentionally limited to the existing lowering-test coverage plus the phi-generated `Copy` instructions required by pass 1.
- Heap lowering is out of scope.
- Simplicity wins over optimization: stable input order, stable slot assignment, no copy coalescing, and no block reordering.
