// Copyright (c) 2026 Marco Nikander

import * as HIR from "../../high/high_grammar.ts";
import * as LIR from "../../low/low_grammar.ts";
import type {
  BlockTarget,
  FunctionTarget,
  UnresolvedInstruction,
  UnresolvedProgram,
} from "./types.gen.ts";

export function resolve_labels(program: UnresolvedProgram): LIR.Program {
  const function_lines = collect_function_lines(program);
  const block_lines = collect_block_lines(program);

  return program.map((instruction) =>
    resolve_instruction(instruction, function_lines, block_lines)
  );
}

function collect_function_lines(
  program: UnresolvedProgram,
): Map<HIR.Label, number> {
  const function_lines = new Map<HIR.Label, number>();

  program.forEach((instruction, line_number) => {
    if (instruction[1] !== "Noop" || instruction[2] === undefined) {
      return;
    }

    const match = /^fun (@[^\s]+) \[/.exec(instruction[2]);
    if (match === null) {
      return;
    }

    const function_name = match[1] as HIR.Label;
    if (function_lines.has(function_name)) {
      throw Error(
        `Function '${function_name}' was emitted more than once during lowering`,
      );
    }

    function_lines.set(function_name, line_number);
  });

  return function_lines;
}

function collect_block_lines(
  program: UnresolvedProgram,
): Map<string, number> {
  const block_lines = new Map<string, number>();
  let current_function: HIR.Label | null = null;

  program.forEach((instruction, line_number) => {
    if (instruction[1] !== "Noop" || instruction[2] === undefined) {
      return;
    }

    const function_match = /^fun (@[^\s]+) \[/.exec(instruction[2]);
    if (function_match !== null) {
      current_function = function_match[1] as HIR.Label;
      return;
    }

    if (instruction[2].startsWith("@")) {
      if (current_function === null) {
        throw Error(
          `Found block note '${
            instruction[2]
          }' before any function note during lowering`,
        );
      }

      const key = block_key(current_function, instruction[2] as HIR.Label);
      if (block_lines.has(key)) {
        throw Error(
          `Block '${
            instruction[2]
          }' in function '${current_function}' was emitted more than once during lowering`,
        );
      }

      block_lines.set(key, line_number);
    }
  });

  return block_lines;
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
