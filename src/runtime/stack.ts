// Copyright (c) 2026 Marco Nikander

import { Primitive } from "../low/low_grammar.ts";
import { valid } from "../utility.ts";

// this design allows 'living off the top of the stack', because it's easy to
// always get the current frame

export type Stack = {
  data: Data[];
  control: Frame[];
};

export type Frame = {
  tag: "Frame";
  return_address: number;
  base_address: number;
  pc: number;
  note?: string;
};

export type Data = Pointer | Value;
export type Pointer = { tag: "Pointer"; address: number }; // TODO: add generation-counter for debugging
export type Value = { tag: "Value"; value: Primitive; annotation?: string };

export function top(state: Stack): Frame {
  return valid(state.control[state.control.length - 1]);
}

export function peek(state: Stack): Frame {
  return valid(state.control[state.control.length - 2]);
}

export function to_value(item: Data): Value {
  if (item.tag === "Value") {
    return item;
  } else {
    throw Error(`Expected a Value, got a '${item.tag}' instead`);
  }
}

export function to_pointer(item: Data): Pointer {
  if (item.tag === "Pointer") {
    return item;
  } else {
    throw Error(`Expected a Pointer, got a '${item.tag}' instead`);
  }
}
