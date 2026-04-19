// Copyright (c) 2026 Marco Nikander

import * as LIR from "../low/low_grammar.ts";
import type {
  ExpandedBlock,
  ExpandedCall,
  ExpandedFunction,
  ExpandedLine,
  ExpandedProgram,
  ExpandedTerminator,
  NumberedInput,
  NumberedLine,
  NumberedTerminator,
  ReservedFunction,
  ReservedProgram,
} from "./types.gen.ts";

export function expand_consumes(program: ReservedProgram): ExpandedProgram {
  return program.map(expand_consumes_in_function);
}

export function expand_consumes_in_function(
  func: ReservedFunction,
): ExpandedFunction {
  let next_temporary = func.first_temporary;
  const blocks = func.blocks.map((block): ExpandedBlock => {
    const lines: ExpandedLine[] = [];

    for (const line of block.lines) {
      const expanded = expand_line(line, next_temporary);
      lines.push(...expanded.lines);
      next_temporary = expanded.next_temporary;
    }

    const expanded = expand_terminator(block.terminator, next_temporary);
    lines.push(...expanded.lines);
    next_temporary = expanded.next_temporary;

    return {
      name: block.name,
      lines,
      terminator: expanded.terminator,
    };
  });

  return {
    name: func.name,
    params: func.params.map((param) => ({ ...param })),
    blocks,
  };
}

function expand_line(
  line: NumberedLine,
  next_temporary: LIR.Offset,
): { lines: ExpandedLine[]; next_temporary: LIR.Offset } {
  switch (line[1]) {
    case "Constant":
      return {
        lines: [[line[0], "Constant", line[2]]],
        next_temporary,
      };
    case "Assign":
      return {
        lines: with_consumed_drops([[line[0], "Copy", offset_of(line[2])]], [
          line[2],
        ]),
        next_temporary,
      };
    case "Own": {
      const prepared = materialize_consumed_inputs([line[2]], next_temporary);
      const owned_offset = prepared.next_temporary;
      return {
        lines: [
          ...prepared.lines,
          [owned_offset, "Copy", offset_of(prepared.inputs[0])],
          [line[0], "AddressOf", owned_offset],
          drop_instruction(offset_of(prepared.inputs[0])),
        ],
        next_temporary: owned_offset + 1,
      };
    }
    case "Borrow":
      return {
        lines: [[line[0], "AddressOf", line[2]]],
        next_temporary,
      };
    case "Load":
      return {
        lines: [[line[0], "Load", line[2]]],
        next_temporary,
      };
    case "Drop":
      return {
        lines: [drop_instruction(line[0])],
        next_temporary,
      };
    case "Call": {
      const lowered: ExpandedCall = [
        line[0],
        "Call",
        line[2],
        line[3].map(offset_of),
      ];
      return {
        lines: with_consumed_drops([lowered], line[3]),
        next_temporary,
      };
    }
    case "Add":
    case "Subtract":
    case "Multiply":
    case "Divide":
    case "Remainder":
    case "Minimum":
    case "Maximum":
    case "Equal":
    case "Unequal":
    case "Less":
    case "LessEqual":
    case "Greater":
    case "GreaterEqual":
      return {
        lines: with_consumed_drops([[
          line[0],
          line[1],
          offset_of(line[2]),
          offset_of(line[3]),
        ]], [line[2], line[3]]),
        next_temporary,
      };
    case "Negate":
      return {
        lines: with_consumed_drops([[line[0], "Negate", offset_of(line[2])]], [
          line[2],
        ]),
        next_temporary,
      };
  }
}

function expand_terminator(
  terminator: NumberedTerminator,
  next_temporary: LIR.Offset,
): {
  lines: ExpandedLine[];
  terminator: ExpandedTerminator;
  next_temporary: LIR.Offset;
} {
  switch (terminator[1]) {
    case "Jump":
      return {
        lines: [],
        terminator: [null, "Jump", terminator[2]],
        next_temporary,
      };
    case "Branch": {
      const prepared = materialize_consumed_inputs(
        [terminator[2]],
        next_temporary,
      );
      return {
        lines: prepared.lines,
        terminator: [
          null,
          "Branch",
          offset_of(prepared.inputs[0]),
          [terminator[3][0], terminator[3][1]],
        ],
        next_temporary: prepared.next_temporary,
      };
    }
    case "Return": {
      const prepared = materialize_consumed_inputs(
        [terminator[2]],
        next_temporary,
      );
      return {
        lines: prepared.lines,
        terminator: [null, "Return", offset_of(prepared.inputs[0])],
        next_temporary: prepared.next_temporary,
      };
    }
  }
}

function materialize_consumed_inputs(
  inputs: NumberedInput[],
  next_temporary: LIR.Offset,
): {
  inputs: NumberedInput[];
  lines: ExpandedLine[];
  next_temporary: LIR.Offset;
} {
  const lines: ExpandedLine[] = [];
  const materialized = inputs.map((input) => {
    if (!input.consume) {
      return input;
    }

    const temporary = next_temporary;
    next_temporary += 1;
    lines.push([temporary, "Copy", input.offset]);
    lines.push(drop_instruction(input.offset));
    return { offset: temporary, consume: false };
  });

  return {
    inputs: materialized,
    lines,
    next_temporary,
  };
}

function with_consumed_drops(
  lines: ExpandedLine[],
  inputs: NumberedInput[],
): ExpandedLine[] {
  return [
    ...lines,
    ...inputs.filter((input) => input.consume).map((input) =>
      drop_instruction(input.offset)
    ),
  ];
}

function drop_instruction(offset: LIR.Offset): LIR.Drop {
  return [offset, "Drop"];
}

function offset_of(input: NumberedInput): LIR.Offset {
  return input.offset;
}
