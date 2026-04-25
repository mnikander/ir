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
    joins: [],
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
    case "Constant":
      return [destination, "Constant", line[2]];
    case "Copy":
      return [destination, "Copy", rewrite_input(line[2], slots, context)];
    case "Own":
      return [destination, "Own", rewrite_input(line[2], slots, context)];
    case "Call":
      return [
        destination,
        "Call",
        line[2],
        line[3].map((input) => rewrite_input(input, slots, context)),
      ];
    case "Borrow":
      return [destination, "Borrow", get_slot(slots, line[2], context)];
    case "Load":
      return [destination, "Load", get_slot(slots, line[2], context)];
    case "Drop":
      return [destination, "Drop"];
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
      return [
        destination,
        line[1],
        rewrite_input(line[2], slots, context),
        rewrite_input(line[3], slots, context),
      ];
    case "Negate":
      return [destination, "Negate", rewrite_input(line[2], slots, context)];
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
    case "Jump":
      return [null, "Jump", terminator[2]];
    case "Branch":
      return [
        null,
        "Branch",
        rewrite_input(terminator[2], slots, context),
        [terminator[3][0], terminator[3][1]],
      ];
    case "Return":
      return [null, "Return", rewrite_input(terminator[2], slots, context)];
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
