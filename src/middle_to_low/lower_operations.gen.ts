// Copyright (c) 2026 Marco Nikander

import * as MIR from "../middle/middle_grammar.ts";
import * as LIR from "../low/low_grammar.ts";
import type {
  LoweredPhiProgram,
  UnresolvedInstruction,
  UnresolvedProgram,
} from "./types.gen.ts";

export function lower_operations(
  program: LoweredPhiProgram,
): UnresolvedProgram {
  const output: UnresolvedInstruction[] = [];
  for (const func of program) {
    let next_temporary = func.resource_count;
    output.push([null, "noop", `fun ${func.id} [${func.parameter_count}]`]);
    for (const block of func.blocks) {
      output.push([null, "noop", `block ${block.id}`]);
      for (const line of block.lines) {
        const lowered = lower_line(line, func.id, next_temporary);
        output.push(...lowered.instructions);
        next_temporary = lowered.next_temporary;
      }
    }
  }
  return output;
}

type Result = { instructions: UnresolvedInstruction[]; next_temporary: number };

function lower_line(line: MIR.Line, function_id: number, next: number): Result {
  if (line[0] === "drop") {
    return { instructions: [[line[1], "drop"]], next_temporary: next };
  }
  if (line[0] === "jump") {
    return {
      instructions: [[null, "jump", { function_id, block_id: line[1][1] }]],
      next_temporary: next,
    };
  }
  if (line[0] === "branch") {
    const prepared = prepare_operands([line[1]], next, true);
    return {
      instructions: [...prepared.before, ...prepared.after, [
        null,
        "branch",
        prepared.offsets[0],
        [
          { function_id, block_id: line[2][1] },
          { function_id, block_id: line[3][1] },
        ],
      ]],
      next_temporary: prepared.next,
    };
  }
  if (line[0] === "return") {
    const prepared = prepare_operands([line[1]], next, true);
    return {
      instructions: [...prepared.before, ...prepared.after, [
        null,
        "return",
        prepared.offsets[0],
      ]],
      next_temporary: prepared.next,
    };
  }
  return lower_let(line, function_id, next);
}

function lower_let(line: MIR.Let, function_id: number, next: number): Result {
  const destination = line[1];
  const op = line[2];
  if (op[0] === "phi") throw Error("Phi operation reached operation lowering");
  if (op[0] === "own") throw Error("MIR 'own' lowering is not implemented");
  if (op[0] === "call") {
    const prepared = prepare_operands(op[2].slice(1) as MIR.Operand[], next);
    return {
      instructions: [...prepared.before, [
        destination,
        "call",
        { function_id: op[1][1] },
        prepared.offsets,
        `fun ${op[1][1]}`,
      ], ...prepared.after],
      next_temporary: prepared.next,
    };
  }
  const operands = op.slice(1) as MIR.Operand[];
  const prepared = prepare_operands(operands, next);
  let instruction: UnresolvedInstruction;
  switch (op[0]) {
    case "copy":
      instruction = [destination, "copy", prepared.offsets[0]];
      break;
    case "borrow":
      instruction = [destination, "address_of", prepared.offsets[0]];
      break;
    case "dereference":
      instruction = [destination, "load", prepared.offsets[0]];
      break;
    case "negate":
      instruction = [destination, "negate", prepared.offsets[0]];
      break;
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
      instruction = [
        destination,
        op[0],
        prepared.offsets[0],
        prepared.offsets[1],
      ] as Exclude<LIR.Instruction, LIR.Jump | LIR.Branch | LIR.Call>;
      break;
  }
  return {
    instructions: [...prepared.before, instruction!, ...prepared.after],
    next_temporary: prepared.next,
  };
}

function prepare_operands(
  operands: MIR.Operand[],
  next: number,
  preserve_consumed = false,
): {
  before: UnresolvedInstruction[];
  offsets: number[];
  after: UnresolvedInstruction[];
  next: number;
} {
  const before: UnresolvedInstruction[] = [];
  const after: UnresolvedInstruction[] = [];
  const offsets = operands.map((operand) => {
    if (operand[0] === "literal") {
      const temporary = next++;
      before.push([temporary, "constant", { value: operand[1] }]);
      return temporary;
    }
    if (operand[0] === "consume" && preserve_consumed) {
      const temporary = next++;
      before.push([temporary, "copy", operand[1]]);
      after.push([operand[1], "drop"]);
      return temporary;
    }
    if (operand[0] === "consume") after.push([operand[1], "drop"]);
    return operand[1];
  });
  return { before, offsets, after, next };
}
