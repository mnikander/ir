// Copyright (c) 2026 Marco Nikander

import * as MIR from "../middle/middle_grammar.ts";
import * as LIR from "../low/low_grammar.ts";
import {
  lower_operations,
  lower_phi_moves,
  resolve_targets,
  split_phi_edges,
  validate_and_index,
} from "./mod.gen.ts";

export function lower(program: MIR.Program): LIR.Program {
  const indexed = validate_and_index(program);
  const split = split_phi_edges(indexed);
  const without_phi = lower_phi_moves(split);
  const unresolved = lower_operations(without_phi);
  return resolve_targets(unresolved);
}
