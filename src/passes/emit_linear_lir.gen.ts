// Copyright (c) 2026 Marco Nikander

import * as HIR from "../high/high_grammar.ts";
import {
  type BlockTarget,
  type ExpandedFunction,
  type ExpandedProgram,
  type FunctionTarget,
  type UnresolvedCall,
  type UnresolvedInstruction,
  type UnresolvedProgram,
} from "./types.gen.ts";

export function emit_linear_lir(program: ExpandedProgram): UnresolvedProgram {
  const emitted: UnresolvedInstruction[] = [];
  const function_names = new Set<HIR.Label>();

  for (const func of program) {
    register_function(function_names, func);
    emitted.push([null, "Noop", format_function_note(func)]);

    const block_names = new Set<HIR.Label>();
    for (const block of func.blocks) {
      register_block(block_names, func, block.name);
      emitted.push([null, "Noop", block.name]);

      emitted.push(
        ...block.lines.map((line) =>
          line[1] === "Call"
            ? [
              line[0],
              "Call",
              function_target(line[2]),
              line[3],
              line[2],
            ] satisfies UnresolvedCall
            : line
        ),
      );

      switch (block.terminator[1]) {
        case "Jump":
          emitted.push([
            null,
            "Jump",
            block_target(func.name, block.terminator[2]),
          ]);
          break;
        case "Branch":
          emitted.push([
            null,
            "Branch",
            block.terminator[2],
            [
              block_target(func.name, block.terminator[3][0]),
              block_target(func.name, block.terminator[3][1]),
            ],
          ]);
          break;
        case "Return":
          emitted.push(block.terminator);
          break;
      }
    }
  }

  return emitted;
}

function register_function(
  names: Set<HIR.Label>,
  func: ExpandedFunction,
): void {
  if (names.has(func.name)) {
    throw Error(
      `Function '${func.name}' was emitted more than once during lowering`,
    );
  }

  names.add(func.name);
}

function register_block(
  names: Set<HIR.Label>,
  func: ExpandedFunction,
  block_name: HIR.Label,
): void {
  if (names.has(block_name)) {
    throw Error(
      `Block '${block_name}' in function '${func.name}' was emitted more than once during lowering`,
    );
  }

  names.add(block_name);
}

function format_function_note(func: ExpandedFunction): string {
  const params = func.params.map((param) => param.name).join(", ");
  return `fun ${func.name} [${params}]`;
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
