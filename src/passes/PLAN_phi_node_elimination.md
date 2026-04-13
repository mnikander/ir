# Phi Node Elimination Plan

This note describes a simple first implementation of phi elimination for the High IR, in the style discussed earlier.

The goal is not to produce an optimal result. The goal is to get a correct, easy-to-understand lowering step that turns High IR with phi nodes into High IR without phi nodes, while preserving explicit control flow.

---

## 1. Where phi elimination belongs in the pipeline

Phi elimination should happen **after borrow checking and other HIR analyses**, but **before lowering to the Low IR**.

That is the right place because phi nodes are still expressed in terms of:

- basic blocks
n- predecessor relationships
- labels
- structured control flow

This makes it easy to reason about which incoming edge supplies which value.

It should not be delayed until the final Low IR, because at that point the program is already much more concrete: frame slots may already be assigned, blocks may already be linearized, and labels may already be replaced by line numbers.

For a simple pipeline, the order can be:

1. validate HIR
2. eliminate phi nodes
3. lower remaining HIR operations toward LIR
4. assign homes / stack slots
5. linearize blocks
6. resolve labels

---

## 2. What a phi node means

A phi node does not behave like an ordinary instruction that executes at runtime.

A phi node says:

- if control arrived from predecessor `P1`, use value `v1`
- if control arrived from predecessor `P2`, use value `v2`
- and so on

So a phi node is really a **control-flow dependent assignment at a join point**.

The purpose of phi elimination is to turn that implicit rule into explicit copies.

---

## 3. Basic lowering idea

The standard idea is:

- do not decide inside the join block
- instead, prepare the correct value on the incoming edge

So instead of this:

- block `B` begins with phi nodes
- `B` chooses the incoming value depending on where control came from

we rewrite it into this:

- every incoming edge to `B` performs the required copies before entering `B`
- `B` no longer needs phi nodes

After that, `B` can use the phi targets as ordinary registers.

---

## 4. Why edge splitting is needed

Copies for phi elimination are attached to specific incoming edges.

That becomes a problem when the predecessor block branches to multiple successors.

If a predecessor `P` goes both to `A` and to `B`, then putting the phi-related copies at the end of `P` is wrong, because those copies would run regardless of which successor is actually taken.

To avoid that, we create an explicit block for the edge.

Instead of:

- `P -> B`

we rewrite to:

- `P -> E -> B`

where `E` is a fresh edge block.

This gives a dedicated place to hold the copies for that one edge.

### Simple implementation choice

For a first implementation, it is reasonable to **always split every incoming edge of every block that has phi nodes**.

That is simpler than trying to detect only critical edges.

It introduces extra blocks, but that cleanup is easy to do later.

---

## 5. Why naive sequential copies are not enough

When a block has multiple phi nodes, the assignments conceptually happen **in parallel**.

For example, one incoming edge might require:

- `x := y`
- `y := x`

These assignments cannot be emitted naively in sequence, because the first copy would overwrite a value needed by the second.

This is the classic swap problem.

In general, a set of phi assignments on one edge behaves like a **parallel copy**:

- all right-hand sides are read from the old state
- all left-hand sides are written to the new state

Since the IR only supports sequential instructions, we need a safe way to simulate parallel assignment.

---

## 6. Simple correct solution: always use temporaries

For a first implementation, the easiest correct strategy is:

1. for each phi assignment on an incoming edge, create a fresh temporary
2. first copy every source into its temporary
3. then copy every temporary into the final phi target

So instead of trying to schedule:

- `x := a`
- `y := b`
- `z := c`

we emit:

- `t1 := a`
- `t2 := b`
- `t3 := c`
- `x := t1`
- `y := t2`
- `z := t3`

This is correct because all source values are read before any target is overwritten.

### Why this is a good first step

This approach:

- is simple
- is easy to reason about
- avoids copy scheduling logic
- avoids cycle detection
- is correct even for swaps and more complicated dependency patterns

It is not optimal, but it is a very good fit for a micro-pass style implementation that prioritizes clarity.

---

## 7. Concrete algorithm

For each function:

### Step 1: compute predecessors

Build the predecessor list for every block by scanning all terminators.

This is needed because each phi node is indexed by predecessor label.

### Step 2: find blocks with phi nodes

For each block `B` whose `joins` list is non-empty:

- collect all predecessors of `B`
- process each incoming edge separately

### Step 3: create a fresh edge block for each predecessor

For every predecessor `P` of `B`:

- create a new block `E`
- redirect the terminator in `P` so that it jumps or branches to `E` instead of directly to `B`
- make `E` end with `Jump B`

### Step 4: lower the phi nodes for that edge into copies

For each phi node in `B`:

- look up the source value associated with predecessor `P`
- create a fresh temporary `t`
- emit `t := source`
- emit `target := t`

The edge block should first contain all temporary assignments and then all final assignments.

### Step 5: remove the phi nodes from `B`

After all incoming edges have been rewritten, the block `B` no longer needs its phi nodes.

Set its `joins` list to empty.

---

## 8. Shape of the transformed program

Before phi elimination:

- join block contains phi nodes
- predecessors jump directly to the join block

After phi elimination:

- join block has no phi nodes
- predecessors jump to dedicated edge blocks
- each edge block contains the copies needed for that predecessor
- each edge block then jumps to the original join block

So the transformation preserves control flow, but makes the data movement explicit.

---

## 9. What this first implementation intentionally does not optimize

A simple first version should **not** try to do the following:

- detect only critical edges
- minimize the number of temporaries
- schedule copies without temporaries
- reuse temporaries
- remove redundant edge blocks immediately

All of these can be added later if desired.

The first implementation should aim for:

- correctness
- explicitness
- easy debugging

---

## 10. Cleanup opportunities later

Unlike copy scheduling, cleanup of extra edge blocks is relatively easy later.

A later cleanup pass can remove trivial bridge blocks such as blocks that:

- contain no meaningful instructions, or
- contain only trivial copies, and
- end in a single unconditional jump

Such a pass can redirect predecessors to the jump target and delete the bridge block.

So it is completely reasonable to over-split edges in the first implementation.

---

## 11. Testing strategy

A good testing strategy combines three levels.

### Structural invariants

After the pass:

- no phi nodes remain
- every branch/jump target exists
- the CFG is still well formed

### Golden tests

Write small hand-made HIR examples and compare the transformed result against an expected HIR, ideally with deterministic fresh-name generation.

### Semantic tests

The strongest test is end-to-end:

- run the original program through the later pipeline
- run the transformed program through the later pipeline
- compare observable behavior, such as final result

This is especially useful once the full lowering pipeline exists.

---

## 12. Recommended first implementation policy

For now, the simplest policy is:

- remove `Move` from HIR temporarily if that simplifies the work
- eliminate phi nodes as the first real lowering pass
- always split each incoming edge to a phi block
- always use temporaries to realize the parallel copy
- do not optimize yet

That gives a very clean and robust starting point.

Later, if needed, you can replace the naive phi elimination pass with a more efficient version that:

- splits only critical edges
- performs parallel-copy scheduling directly
- uses fewer temporaries
- removes more bridge blocks immediately

But those improvements should come after the basic lowering pipeline works.
