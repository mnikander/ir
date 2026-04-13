// Copyright (c) 2026 Marco Nikander

import assert from "node:assert";
import * as HIR from "../high/high_grammar.ts";
import * as LIR from "../low/low_grammar.ts";

// TODO: implement lowering pass
export function lower(program: HIR.Program): LIR.Program {
  assert(program.length > 0);

  const dummy: LIR.Program = [
    [null, "Noop", "fun @main []"],
    [null, "Noop", "@main.entry"],
    [0, "Constant", { value: 42 }],
    [null, "Return", 0],
  ];

  return dummy;
}
