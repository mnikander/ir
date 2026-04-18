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

    for (const block of func.blocks) {
      register_block_line(block_lines, func, block, emitted.length);
      emitted.push([null, "Noop", block.name]);

      for (const line of block.lines) {
        emitted.push(lower_line(line));
      }

      emitted.push(lower_terminator(func.name, block.terminator));
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

function lower_line(line: NumberedLine): UnresolvedInstruction {
  switch (line[1]) {
    case "Constant":
      return [line[0], "Constant", line[2]];
    case "Assign":
      return [line[0], "Copy", offset_of(line[2])];
    case "Call": {
      const lowered: UnresolvedCall = [
        line[0],
        "Call",
        function_target(line[2]),
        line[3].map(offset_of),
        line[2],
      ];
      return lowered;
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
      return [line[0], line[1], offset_of(line[2]), offset_of(line[3])];
    case "Negate":
      return [line[0], "Negate", offset_of(line[2])];
  }
}

function lower_terminator(
  function_name: HIR.Label,
  terminator: NumberedTerminator,
): UnresolvedInstruction {
  switch (terminator[1]) {
    case "Jump": {
      const lowered: UnresolvedJump = [
        null,
        "Jump",
        block_target(function_name, terminator[2]),
      ];
      return lowered;
    }
    case "Branch": {
      const lowered: UnresolvedBranch = [
        null,
        "Branch",
        offset_of(terminator[2]),
        [
          block_target(function_name, terminator[3][0]),
          block_target(function_name, terminator[3][1]),
        ],
      ];
      return lowered;
    }
    case "Return":
      return [null, "Return", offset_of(terminator[2])];
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
  return input[0];
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
