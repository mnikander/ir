// Copyright (c) 2026 Marco Nikander

import * as LIR from "../low/low_grammar.ts";
import type {
  NumberedFunction,
  NumberedProgram,
  ReservedFunction,
  ReservedProgram,
} from "./types.gen.ts";

export function reserve_temporaries(program: NumberedProgram): ReservedProgram {
  return program.map(reserve_temporaries_in_function);
}

export function reserve_temporaries_in_function(
  func: NumberedFunction,
): ReservedFunction {
  return {
    name: func.name,
    params: func.params.map((param) => ({ ...param })),
    blocks: func.blocks.map((block) => ({
      name: block.name,
      phis: [],
      lines: [...block.lines],
      terminator: block.terminator,
    })),
    first_temporary: first_temporary_offset(func),
  };
}

function first_temporary_offset(func: NumberedFunction): LIR.Offset {
  const param_offsets = func.params.map((param) => param.offset);
  const destination_offsets = func.blocks.flatMap((block) =>
    block.lines.map((line) => line[0])
  );
  const maximum = [...param_offsets, ...destination_offsets].reduce(
    (current, value) => Math.max(current, value),
    -1,
  );

  return maximum + 1;
}
