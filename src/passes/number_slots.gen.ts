// Copyright (c) 2026 Marco Nikander

import * as HIR from "../high/high_grammar.ts";
import * as LIR from "../low/low_grammar.ts";
import type {
  NumberedParam,
  SlotAssignment,
  SlottedFunction,
  SlottedProgram,
} from "./types.gen.ts";

export function number_slots(program: HIR.Program): SlottedProgram {
  return program.map(number_slots_in_function);
}

export function number_slots_in_function(func: HIR.Function): SlottedFunction {
  const slots: SlotAssignment[] = [];
  let next_offset = 0;

  for (const param of func.params) {
    const register = get_plain_register(param[1]);
    if (find_slot(slots, register) === undefined) {
      slots.push({ name: register, offset: next_offset });
      next_offset += 1;
    }
  }

  for (const block of func.blocks) {
    for (const line of block.lines) {
      const register = line[0];
      if (find_slot(slots, register) === undefined) {
        slots.push({ name: register, offset: next_offset });
        next_offset += 1;
      }
    }
  }

  const params: NumberedParam[] = func.params.map((param) => {
    const name = get_plain_register(param[1]);
    return {
      name,
      offset: get_slot(
        slots,
        name,
        `parameter '${name}' of function '${func.name}'`,
      ),
    };
  });

  return {
    name: func.name,
    params,
    type: func.type,
    blocks: func.blocks.map(clone_block),
    slots,
  };
}

function clone_block(block: HIR.Block): HIR.Block {
  return {
    name: block.name,
    phis: [...block.phis],
    lines: [...block.lines],
    terminator: clone_terminator(block.terminator),
  };
}

function clone_terminator(terminator: HIR.Terminator): HIR.Terminator {
  switch (terminator[1]) {
    case "jump":
      return [null, "jump", null, terminator[3]];
    case "branch":
      return [null, "branch", null, terminator[3], [
        terminator[4][0],
        terminator[4][1],
      ]];
    case "return":
      return [null, "return", terminator[2], terminator[3]];
  }
}

function get_plain_register(input: HIR.Input): HIR.Register {
  return input[0] === "consume" ? input[1] : input[0];
}

function find_slot(
  slots: readonly SlotAssignment[],
  register: HIR.Register,
): SlotAssignment | undefined {
  return slots.find((slot) => slot.name === register);
}

function get_slot(
  slots: readonly SlotAssignment[],
  register: HIR.Register,
  context: string,
): LIR.Offset {
  const slot = find_slot(slots, register);
  if (slot === undefined) {
    throw Error(
      `No stack slot was assigned to register '${register}' in ${context}`,
    );
  }

  return slot.offset;
}
