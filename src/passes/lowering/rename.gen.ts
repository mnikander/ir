// Copyright (c) 2026 Marco Nikander

import * as HIR from "../../high/high_grammar.ts";
import * as LIR from "../../low/low_grammar.ts";
import {
  NumberedBlock,
  NumberedBranch,
  NumberedCall,
  NumberedAssign,
  NumberedFunction,
  NumberedInput,
  NumberedLine,
  NumberedProgram,
  NumberedReturn,
  NumberedTerminator,
} from "./types.gen.ts";

export function rename_registers(program: HIR.Program): NumberedProgram {
  return program.map(rename_registers_in_function);
}

export function rename_registers_in_function(
  func: HIR.Function,
): NumberedFunction {
  assert_no_phi_nodes(func);

  const slots = collect_slots(func);
  const params = func.params.map((param) => {
    const name = get_plain_register(
      param,
      `parameter of function '${func.name}'`,
    );
    const offset = get_slot(
      slots,
      name,
      `parameter '${name}' of function '${func.name}'`,
    );

    return { name, offset };
  });

  return {
    name: func.name,
    params,
    blocks: func.blocks.map((block) => rename_block(func.name, block, slots)),
  };
}

function assert_no_phi_nodes(func: HIR.Function): void {
  for (const block of func.blocks) {
    if (block.joins.length !== 0) {
      throw Error(
        `Cannot rename registers in function '${func.name}' because block '${block.name}' still contains phi nodes`,
      );
    }
  }
}

function collect_slots(func: HIR.Function): Map<HIR.Register, LIR.Offset> {
  const slots = new Map<HIR.Register, LIR.Offset>();
  let next_offset = 0;

  for (const param of func.params) {
    const register = get_plain_register(
      param,
      `parameter of function '${func.name}'`,
    );
    if (!slots.has(register)) {
      slots.set(register, next_offset);
      next_offset += 1;
    }
  }

  for (const block of func.blocks) {
    for (const line of block.lines) {
      const destination = get_destination_register(func.name, block.name, line);
      if (!slots.has(destination)) {
        slots.set(destination, next_offset);
        next_offset += 1;
      }
    }
  }

  return slots;
}

function rename_block(
  function_name: HIR.Label,
  block: HIR.Block,
  slots: Map<HIR.Register, LIR.Offset>,
): NumberedBlock {
  if (block.joins.length !== 0) {
    throw Error(
      `Cannot linearize block '${block.name}' in function '${function_name}' because phi nodes remain after elimination`,
    );
  }

  return {
    name: block.name,
    joins: [],
    lines: block.lines.map((line) =>
      rename_line(function_name, block.name, line, slots)
    ),
    terminator: rename_terminator(
      function_name,
      block.name,
      block.terminator,
      slots,
    ),
  };
}

function rename_line(
  function_name: HIR.Label,
  block_name: HIR.Label,
  line: HIR.Line,
  slots: Map<HIR.Register, LIR.Offset>,
): NumberedLine {
  const context = `instruction '${
    line[1]
  }' in block '${block_name}' of function '${function_name}'`;

  switch (line[1]) {
    case "Constant":
      return [
        get_destination_slot(function_name, block_name, line, slots),
        "Constant",
        line[2],
      ];
    case "Assign": {
      const renamed: NumberedAssign = [
        get_destination_slot(function_name, block_name, line, slots),
        "Assign",
        rename_input(line[2], slots, context),
      ];
      return renamed;
    }
    case "Call": {
      const renamed: NumberedCall = [
        get_destination_slot(function_name, block_name, line, slots),
        "Call",
        line[2],
        line[3].map((input) => rename_input(input, slots, context)),
      ];
      return renamed;
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
      return [
        get_destination_slot(function_name, block_name, line, slots),
        line[1],
        rename_input(line[2], slots, context),
        rename_input(line[3], slots, context),
      ];
    case "Negate":
      return [
        get_destination_slot(function_name, block_name, line, slots),
        "Negate",
        rename_input(line[2], slots, context),
      ];
    case "Stack":
    case "Heap":
    case "Borrow":
    case "Load":
    case "Update":
    case "Drop":
      throw Error(
        `Lowering does not support HIR instruction '${
          line[1]
        }' in block '${block_name}' of function '${function_name}' yet`,
      );
  }
}

function rename_terminator(
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
    case "Branch": {
      const renamed: NumberedBranch = [
        null,
        "Branch",
        rename_input(terminator[2], slots, context),
        [terminator[3][0], terminator[3][1]],
      ];
      return renamed;
    }
    case "Return": {
      const renamed: NumberedReturn = [
        null,
        "Return",
        rename_input(terminator[2], slots, context),
      ];
      return renamed;
    }
  }
}

function rename_input(
  input: HIR.Input,
  slots: Map<HIR.Register, LIR.Offset>,
  context: string,
): NumberedInput {
  const register = get_plain_register(input, context);
  return [get_slot(slots, register, context)];
}

function get_destination_slot(
  function_name: HIR.Label,
  block_name: HIR.Label,
  line: HIR.Line,
  slots: Map<HIR.Register, LIR.Offset>,
): LIR.Offset {
  const register = get_destination_register(function_name, block_name, line);
  return get_slot(
    slots,
    register,
    `destination register '${register}' in block '${block_name}' of function '${function_name}'`,
  );
}

function get_destination_register(
  function_name: HIR.Label,
  block_name: HIR.Label,
  line: HIR.Line,
): HIR.Register {
  switch (line[1]) {
    case "Constant":
    case "Assign":
    case "Call":
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
    case "Negate":
      return line[0];
    case "Stack":
    case "Heap":
    case "Borrow":
    case "Load":
    case "Update":
    case "Drop":
      throw Error(
        `Lowering does not support HIR instruction '${
          line[1]
        }' in block '${block_name}' of function '${function_name}' yet`,
      );
  }
}

function get_plain_register(
  input: HIR.Input,
  context: string,
): HIR.Register {
  if (input[0] === "consume") {
    throw Error(`Lowering does not support move inputs in ${context}`);
  }

  return input[0];
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
