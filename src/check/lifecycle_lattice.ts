// Copyright (c) 2026 Marco Nikander

import * as HIGH from "../high/high_grammar.ts";

// TODO: could add 'moved' as it's own state for better diagnostics
export type ULD = [undef: boolean, live: boolean, dead: boolean];
export type OutSet = Map<HIGH.Register, ULD>;

export function join(left: ULD, right: ULD): ULD {
  return [left[0] || right[0], left[1] || right[1], left[2] || right[2]];
}

export function meet(left: ULD, right: ULD): ULD {
  return [left[0] && right[0], left[1] && right[1], left[2] && right[2]];
}

export function define(input: ULD, line: HIGH.Line): ULD {
  if (input[0] && !input[1] && !input[2]) {
    return [false, true, false];
  } else {
    throw Error("invalid define");
  }
}

export function use(input: ULD, line: HIGH.Line): ULD {
  if (!input[0] && input[1] && !input[2]) {
    return input;
  } else {
    throw Error("invalid use");
  }
}

export function drop(input: ULD, line: HIGH.Line): ULD {
  if (!input[0] && input[1] && !input[2]) {
    return [false, false, true];
  } else {
    throw Error("invalid drop");
  }
}

export function move(input: ULD, line: HIGH.Line): ULD {
  if (!input[0] && input[1] && !input[2]) {
    return [false, false, true];
  } else {
    throw Error("invalid move");
  }
}

function uld_to_string(input: ULD): string {
  let result: string = "";
  result += "{";
  result += input[0] ? "undefined, " : "";
  result += input[1] ? "live, " : "";
  result += input[2] ? "dead, " : "";
  result += "}";
  return result;
}
