// Copyright (c) 2026 Marco Nikander

import * as HIR from "../high/high_grammar.ts";

// TODO: cound add 'moved' as it's own state for better diagnostics
export type ULD = [undef: boolean, live: boolean, dead: boolean];
export type OutSet = Map<HIR.Register, ULD>;

export function join(left: ULD, right: ULD): ULD {
  return [left[0] || right[0], left[1] || right[1], left[2] || right[2]];
}

export function meet(left: ULD, right: ULD): ULD {
  return [left[0] && right[0], left[1] && right[1], left[2] && right[2]];
}

export function define(line: HIR.Line, input: ULD): ULD {
  if (input[0] && !input[1] && !input[2]) {
    return [false, true, false];
  } else {
    throw Error(
      `Attempted to define variable ${line[HIR.Get.Dest]} which is ` +
        `${uld_to_string(input)} in line '${line.toString()}'`,
    );
  }
}

export function use(line: HIR.Line, input: ULD): ULD {
  if (!input[0] && input[1] && !input[2]) {
    return input;
  } else {
    throw Error(
      `Attempted to use variable ${line[HIR.Get.Dest]} which is ` +
        `${uld_to_string(input)} in line '${line.toString()}'`,
    );
  }
}

export function drop(line: HIR.Line, input: ULD): ULD {
  if (!input[0] && input[1] && !input[2]) {
    return [false, false, true];
  } else {
    throw Error(
      `Attempted to drop variable ${line[HIR.Get.Dest]} which is ` +
        `${uld_to_string(input)} in line '${line.toString()}'`,
    );
  }
}

export function move(line: HIR.Line, input: ULD): ULD {
  if (!input[0] && input[1] && !input[2]) {
    return [false, false, true];
  } else {
    throw Error(
      `Attempted to move variable ${line[HIR.Get.Dest]} which is ` +
        `${uld_to_string(input)} in line '${line.toString()}'`,
    );
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
