// Copyright (c) 2026 Marco Nikander

import * as HIR from "../high/high_grammar.ts";
import { validate_unique_variables } from "./unique_variables.ts";

export function validate(program: HIR.Program): boolean {
  return validate_unique_variables(program);
}
