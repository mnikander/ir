// Copyright (c) 2026 Marco Nikander

import * as HIR from "../../high/high_grammar.ts";
import * as LIR from "../../low/low_grammar.ts";
import {
  BlockTarget,
  FunctionTarget,
  NumberedBlock,
  NumberedFunction,
  NumberedInput,
  NumberedLine,
  NumberedProgram,
  NumberedTerminator,
  UnresolvedBranch,
  UnresolvedCall,
  UnresolvedInstruction,
  UnresolvedJump,
} from "./types.gen.ts";

export function linearize_to_lir(program: NumberedProgram): LIR.Program {
  const emitted: UnresolvedInstruction[] = [];
  const function_lines = new Map<HIR.Label, number>();
  const block_lines = new Map<string, number>();

  for (const func of program) {
    register_function_line(function_lines, func, emitted.length);
    emitted.push([null, "Noop", format_function_note(func)]);
    let next_temporary = first_temporary_offset(func);

    for (const block of func.blocks) {
      register_block_line(block_lines, func, block, emitted.length);
      emitted.push([null, "Noop", block.name]);

      for (const line of block.lines) {
        emitted.push(...lower_line(line));
      }

      const lowered = lower_terminator(func.name, block.terminator, next_temporary);
      emitted.push(...lowered.instructions);
      next_temporary = lowered.next_temporary;
    }
  }

  return emitted.map((instruction) =>
    resolve_instruction(instruction, function_lines, block_lines)
  );
}

function register_function_line(
  function_lines: Map<HIR.Label, number>,
  func: NumberedFunction,
  line_number: number,
): void {
  if (function_lines.has(func.name)) {
    throw Error(
      `Function '${func.name}' was emitted more than once during lowering`,
    );
  }

  function_lines.set(func.name, line_number);
}

function register_block_line(
  block_lines: Map<string, number>,
  func: NumberedFunction,
  block: NumberedBlock,
  line_number: number,
): void {
  if (block.joins.length !== 0) {
    throw Error(
      `Cannot linearize block '${block.name}' in function '${func.name}' because phi nodes remain after elimination`,
    );
  }

  const key = block_key(func.name, block.name);
  if (block_lines.has(key)) {
    throw Error(
      `Block '${block.name}' in function '${func.name}' was emitted more than once during lowering`,
    );
  }

  block_lines.set(key, line_number);
}

function format_function_note(func: NumberedFunction): string {
  const params = func.params.map((param) => param.name).join(", ");
  return `fun ${func.name} [${params}]`;
}

function lower_line(line: NumberedLine): UnresolvedInstruction[] {
  switch (line[1]) {
    case "Constant":
      return [[line[0], "Constant", line[2]]];
    case "Assign":
      return with_consumed_drops([
        line[0],
        "Copy",
        offset_of(line[2]),
      ], [line[2]]);
    case "Call": {
      const lowered: UnresolvedCall = [
        line[0],
        "Call",
        function_target(line[2]),
        line[3].map(offset_of),
        line[2],
      ];
      return with_consumed_drops(lowered, line[3]);
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
      return with_consumed_drops([
        line[0],
        line[1],
        offset_of(line[2]),
        offset_of(line[3]),
      ], [line[2], line[3]]);
    case "Negate":
      return with_consumed_drops([
        line[0],
        "Negate",
        offset_of(line[2]),
      ], [line[2]]);
  }
}

function lower_terminator(
  function_name: HIR.Label,
  terminator: NumberedTerminator,
  next_temporary: LIR.Offset,
): { instructions: UnresolvedInstruction[]; next_temporary: LIR.Offset } {
  switch (terminator[1]) {
    case "Jump": {
      const lowered: UnresolvedJump = [
        null,
        "Jump",
        block_target(function_name, terminator[2]),
      ];
      return { instructions: [lowered], next_temporary };
    }
    case "Branch": {
      const prepared = materialize_consumed_inputs([terminator[2]], next_temporary);
      const lowered: UnresolvedBranch = [
        null,
        "Branch",
        offset_of(prepared.inputs[0]),
        [
          block_target(function_name, terminator[3][0]),
          block_target(function_name, terminator[3][1]),
        ],
      ];
      return {
        instructions: [...prepared.instructions, lowered],
        next_temporary: prepared.next_temporary,
      };
    }
    case "Return": {
      const prepared = materialize_consumed_inputs([terminator[2]], next_temporary);
      return {
        instructions: [
          ...prepared.instructions,
          [null, "Return", offset_of(prepared.inputs[0])],
        ],
        next_temporary: prepared.next_temporary,
      };
    }
  }
}

function resolve_instruction(
  instruction: UnresolvedInstruction,
  function_lines: Map<HIR.Label, number>,
  block_lines: Map<string, number>,
): LIR.Instruction {
  switch (instruction[1]) {
    case "Jump":
      return [null, "Jump", {
        line: get_block_line(block_lines, instruction[2]),
      }];
    case "Branch":
      return [
        null,
        "Branch",
        instruction[2],
        [
          { line: get_block_line(block_lines, instruction[3][0]) },
          { line: get_block_line(block_lines, instruction[3][1]) },
        ],
      ];
    case "Call":
      return [
        instruction[0],
        "Call",
        { line: get_function_line(function_lines, instruction[2]) },
        instruction[3],
        instruction[4],
      ];
    default:
      return instruction;
  }
}

function offset_of(input: NumberedInput): LIR.Offset {
  return input.offset;
}

function consumed_offsets(inputs: NumberedInput[]): LIR.Offset[] {
  return inputs.filter((input) => input.consume).map((input) => input.offset);
}

function with_consumed_drops(
  instruction: UnresolvedInstruction,
  inputs: NumberedInput[],
): UnresolvedInstruction[] {
  return [instruction, ...consumed_offsets(inputs).map(drop_instruction)];
}

function materialize_consumed_inputs(
  inputs: NumberedInput[],
  next_temporary: LIR.Offset,
): {
  inputs: NumberedInput[];
  instructions: UnresolvedInstruction[];
  next_temporary: LIR.Offset;
} {
  const instructions: UnresolvedInstruction[] = [];
  const materialized = inputs.map((input) => {
    if (!input.consume) {
      return input;
    }

    const temporary = next_temporary++;
    instructions.push([temporary, "Copy", input.offset]);
    instructions.push(drop_instruction(input.offset));
    return { offset: temporary, consume: false };
  });

  return {
    inputs: materialized,
    instructions,
    next_temporary,
  };
}

function drop_instruction(offset: LIR.Offset): LIR.Drop {
  return [offset, "Drop"];
}

function first_temporary_offset(func: NumberedFunction): LIR.Offset {
  let maximum = -1;

  for (const param of func.params) {
    maximum = Math.max(maximum, param.offset);
  }

  for (const block of func.blocks) {
    for (const line of block.lines) {
      maximum = Math.max(maximum, line[0]);
    }
  }

  return maximum + 1;
}

function block_target(
  function_name: HIR.Label,
  block_name: HIR.Label,
): BlockTarget {
  return {
    kind: "block",
    function_name,
    block_name,
  };
}

function function_target(function_name: HIR.Label): FunctionTarget {
  return {
    kind: "function",
    function_name,
  };
}

function get_block_line(
  block_lines: Map<string, number>,
  target: BlockTarget,
): number {
  const line = block_lines.get(
    block_key(target.function_name, target.block_name),
  );
  if (line === undefined) {
    throw Error(
      `Failed to resolve block target '${target.block_name}' in function '${target.function_name}' during lowering`,
    );
  }

  return line;
}

function get_function_line(
  function_lines: Map<HIR.Label, number>,
  target: FunctionTarget,
): number {
  const line = function_lines.get(target.function_name);
  if (line === undefined) {
    throw Error(
      `Failed to resolve call target '${target.function_name}' during lowering`,
    );
  }

  return line;
}

function block_key(function_name: HIR.Label, block_name: HIR.Label): string {
  return `${function_name}::${block_name}`;
}
