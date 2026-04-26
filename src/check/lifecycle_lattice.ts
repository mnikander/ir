// Copyright (c) 2026 Marco Nikander

import { Register } from "../high/high_grammar.ts";

// TODO: could add 'moved' as it's own state for better diagnostics
export type ULD = [undef: boolean, live: boolean, dead: boolean];
export type InSet = Map<Register, ULD>;

export function make_in_set(registers: Register[]): InSet {
  const tuples: [Register, ULD][] = registers.map(
    (r) => [r, [false, false, false]],
  );
  return new Map<Register, ULD>(tuples);
}

export function join(left: ULD, right: ULD): ULD {
  return [left[0] || right[0], left[1] || right[1], left[2] || right[2]];
}

export function meet(left: ULD, right: ULD): ULD {
  return [left[0] && right[0], left[1] && right[1], left[2] && right[2]];
}

export function define(input: ULD): ULD {
  if (input[0] && !input[1] && !input[2]) {
    return [false, true, false];
  } else {
    throw Error("invalid define");
  }
}

export function use(input: ULD): ULD {
  if (!input[0] && input[1] && !input[2]) {
    return input;
  } else {
    throw Error("invalid use");
  }
}

export function drop(input: ULD): ULD {
  if (!input[0] && input[1] && !input[2]) {
    return [false, false, true];
  } else {
    throw Error("invalid drop");
  }
}

export function move(input: ULD): ULD {
  if (!input[0] && input[1] && !input[2]) {
    return [false, false, true];
  } else {
    throw Error("invalid move");
  }
}

export function uld_to_string(input: ULD): string {
  let result: string = "";
  result += "{";
  result += input[0] ? "undefined, " : "";
  result += input[1] ? "live, " : "";
  result += input[2] ? "dead, " : "";
  result += "}";
  return result;
}
