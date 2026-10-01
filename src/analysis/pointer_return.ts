// Copyright (c) 2026 Marco Nikander

import * as MIR from "../middle/middle_grammar.ts";
import { contains_borrow } from "../middle/types.ts";

// be careful to annotate the result type of functions correctly, since this
// implementation depends entirely on the type information, but without a
// type-checker in the codebase, it is very easy for errors to creep in
export function may_return_pointer(fun: MIR.Function): boolean {
  const result_type: MIR.Type = fun[3][1];
  return contains_borrow(result_type);
}
