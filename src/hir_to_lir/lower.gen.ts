// Copyright (c) 2026 Marco Nikander

import assert from "node:assert";
import * as HIR from "../high/high_grammar.ts";
import * as LIR from "../low/low_grammar.ts";
import {
  emit_linear_lir,
  expand_consumes,
  lower_phi_moves,
  number_slots,
  reserve_temporaries,
  resolve_labels,
  rewrite_named_to_numbered,
  split_phi_edges,
} from "./mod.gen.ts";

export function lower(program: HIR.Program): LIR.Program {
  assert(program.length > 0, "Cannot lower an empty HIR program");

  const split = split_phi_edges(program);
  const without_phi = lower_phi_moves(split);
  const slotted = number_slots(without_phi);
  const numbered = rewrite_named_to_numbered(slotted);
  const reserved = reserve_temporaries(numbered);
  const expanded = expand_consumes(reserved);
  const unresolved = emit_linear_lir(expanded);
  return resolve_labels(unresolved);
}
