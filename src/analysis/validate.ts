// Copyright (c) 2026 Marco Nikander

import * as HIGH from "../high/high_grammar.ts";
import { validate_unique_variables } from "./unique_variables.ts";

export function validate(program: HIGH.Program): boolean {
  return validate_unique_variables(program);
}
