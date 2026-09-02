// Copyright (c) 2026 Marco Nikander

import * as LIR from "../low/low_grammar.ts";
import type { UnresolvedInstruction, UnresolvedProgram } from "./types.gen.ts";

export function resolve_targets(program: UnresolvedProgram): LIR.Program {
  const functions = new Map<number, number>();
  const blocks = new Map<string, number>();
  let current_function: number | undefined;
  program.forEach((instruction, line) => {
    if (instruction[1] !== "noop" || instruction[2] === undefined) return;
    let match = /^fun (\d+) \[/.exec(instruction[2]);
    if (match) {
      current_function = Number(match[1]);
      if (functions.has(current_function)) {
        throw Error(`Duplicate function ${current_function}`);
      }
      functions.set(current_function, line);
      return;
    }
    match = /^block (\d+)$/.exec(instruction[2]);
    if (match && current_function !== undefined) {
      blocks.set(`${current_function}:${Number(match[1])}`, line);
    }
  });
  return program.map((instruction) => resolve(instruction, functions, blocks));
}

function resolve(
  instruction: UnresolvedInstruction,
  functions: Map<number, number>,
  blocks: Map<string, number>,
): LIR.Instruction {
  if (instruction[1] === "jump") {
    return [null, "jump", {
      line: get(
        blocks,
        `${instruction[2].function_id}:${instruction[2].block_id}`,
        "block",
      ),
    }];
  }
  if (instruction[1] === "branch") {
    return [null, "branch", instruction[2], [
      {
        line: get(
          blocks,
          `${instruction[3][0].function_id}:${instruction[3][0].block_id}`,
          "block",
        ),
      },
      {
        line: get(
          blocks,
          `${instruction[3][1].function_id}:${instruction[3][1].block_id}`,
          "block",
        ),
      },
    ]];
  }
  if (instruction[1] === "call") {
    return [
      instruction[0],
      "call",
      { line: get(functions, instruction[2].function_id, "function") },
      instruction[3],
      instruction[4],
    ];
  }
  return instruction;
}

function get<K>(map: Map<K, number>, key: K, kind: string): number {
  const value = map.get(key);
  if (value === undefined) {
    throw Error(`Failed to resolve ${kind} target ${String(key)}`);
  }
  return value;
}
