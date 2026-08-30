// Copyright (c) 2026 Marco Nikander

import * as HIR from "../high/high_grammar.ts";
import * as LIR from "../low/low_grammar.ts";
import type {
  NumberedBlock,
  NumberedFunction,
  NumberedInput,
  NumberedLine,
  NumberedProgram,
  NumberedTerminator,
  SlottedFunction,
  SlottedProgram,
} from "./types.gen.ts";

export function rewrite_named_to_numbered(
  program: SlottedProgram,
): NumberedProgram {
  return program.map(rewrite_named_to_numbered_in_function);
}

export function rewrite_named_to_numbered_in_function(
  func: SlottedFunction,
): NumberedFunction {
  const slots = new Map(func.slots.map((slot) => [slot.name, slot.offset]));

  return {
    name: func.name,
    params: func.params.map((param) => ({ ...param })),
    blocks: func.blocks.map((block) => rewrite_block(func.name, block, slots)),
  };
}

function rewrite_block(
  function_name: HIR.Label,
  block: HIR.Block,
  slots: Map<HIR.Register, LIR.Offset>,
): NumberedBlock {
  return {
    name: block.name,
    phis: [],
    lines: block.lines.map((line) =>
      rewrite_line(function_name, block.name, line, slots)
    ),
    terminator: rewrite_terminator(
      function_name,
      block.name,
      block.terminator,
      slots,
    ),
  };
}

function rewrite_line(
  function_name: HIR.Label,
  block_name: HIR.Label,
  line: HIR.Line,
  slots: Map<HIR.Register, LIR.Offset>,
): NumberedLine {
  const destination = get_destination_slot(
    function_name,
    block_name,
    line,
    slots,
  );
  const context = `instruction '${
    line[1]
  }' in block '${block_name}' of function '${function_name}'`;

  switch (line[1]) {
    case "constant":
      return [destination, "constant", line[3]];
    case "copy":
      return [destination, "copy", rewrite_input(line[3], slots, context)];
    case "own":
      return [destination, "own", rewrite_input(line[3], slots, context)];
    case "call":
      return [
        destination,
        "call",
        line[3],
        line[4].map((input) => rewrite_input(input, slots, context)),
      ];
    case "borrow":
      return [destination, "borrow", get_slot(slots, line[3], context)];
    case "load":
      return [destination, "load", get_slot(slots, line[3], context)];
    case "drop":
      return [destination, "drop"];
    case "add":
    case "subtract":
    case "multiply":
    case "divide":
    case "remainder":
    case "minimum":
    case "maximum":
    case "equal":
    case "unequal":
    case "less":
    case "less_equal":
    case "greater":
    case "greater_equal":
      return [
        destination,
        line[1],
        rewrite_input(line[3], slots, context),
        rewrite_input(line[4], slots, context),
      ];
    case "negate":
      return [destination, "negate", rewrite_input(line[3], slots, context)];
  }
}

function rewrite_terminator(
  function_name: HIR.Label,
  block_name: HIR.Label,
  terminator: HIR.Terminator,
  slots: Map<HIR.Register, LIR.Offset>,
): NumberedTerminator {
  const context = `terminator '${
    terminator[1]
  }' in block '${block_name}' of function '${function_name}'`;

  switch (terminator[1]) {
    case "jump":
      return [null, "jump", terminator[3]];
    case "branch":
      return [
        null,
        "branch",
        rewrite_input(terminator[3], slots, context),
        [terminator[4][0], terminator[4][1]],
      ];
    case "return":
      return [null, "return", rewrite_input(terminator[3], slots, context)];
  }
}

function rewrite_input(
  input: HIR.Input,
  slots: Map<HIR.Register, LIR.Offset>,
  context: string,
): NumberedInput {
  if (input[0] === "consume") {
    return {
      offset: get_slot(slots, input[1], context),
      consume: true,
    };
  }

  return {
    offset: get_slot(slots, input[0], context),
    consume: false,
  };
}

function get_destination_slot(
  function_name: HIR.Label,
  block_name: HIR.Label,
  line: HIR.Line,
  slots: Map<HIR.Register, LIR.Offset>,
): LIR.Offset {
  const register = line[0];
  return get_slot(
    slots,
    register,
    `destination register '${register}' in block '${block_name}' of function '${function_name}'`,
  );
}

function get_slot(
  slots: Map<HIR.Register, LIR.Offset>,
  register: HIR.Register,
  context: string,
): LIR.Offset {
  const slot = slots.get(register);
  if (slot === undefined) {
    throw Error(
      `No stack slot was assigned to register '${register}' in ${context}`,
    );
  }

  return slot;
}
