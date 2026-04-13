// Copyright (c) 2026 Marco Nikander

import assert from "node:assert";
import * as HIR from "../high/high_grammar.ts";
import * as LIR from "../low/low_grammar.ts";
import { linearize_to_lir, rename_registers } from "./lowering/mod.gen.ts";
import { eliminate_phi_nodes } from "./phi_elimination/mod.gen.ts";

export function lower(program: HIR.Program): LIR.Program {
  assert(program.length > 0, "Cannot lower an empty HIR program");

  const without_phi = eliminate_phi_nodes(program);
  const numbered = rename_registers(without_phi);
  return linearize_to_lir(numbered);
}
