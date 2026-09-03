// Copyright (c) 2026 Marco Nikander

import { valid } from "../utility.ts";

// this design allows 'living off the top of the stack', because it's easy to
// always get the current frame

export type Stack = {
  data: Data[];
  control: Frame[];
  generation: number[];
};

export type Frame = {
  tag: "Frame";
  return_address: number;
  base_address: number;
  pc: number;
  generation_counter: number;
  note?: string;
};

export type Data = Pointer | Value | Dead;
export type Pointer = { tag: "Pointer"; address: number; generation: number };
export type Value = { tag: "Value"; value: number; annotation?: string };
export type Dead = { tag: "Dead" };

export function top(state: Stack): Frame {
  return valid(state.control[state.control.length - 1]);
}

export function peek(state: Stack): Frame {
  return valid(state.control[state.control.length - 2]);
}

export function assert_value(item: Data): Value {
  if (item.tag === "Value") {
    return item;
  } else {
    throw Error(`Expected a Value, got a '${item.tag}' instead`);
  }
}

export function assert_pointer(item: Data): Pointer {
  if (item.tag === "Pointer") {
    return item;
  } else {
    throw Error(`Expected a Pointer, got a '${item.tag}' instead`);
  }
}

export function assert_not_dead(item: Data): Value | Pointer {
  if (item === undefined || item.tag !== "Dead") {
    return item;
  } else {
    throw Error(`Expected a live data slot, got a '${item.tag}' value instead`);
  }
}

export function initialize_stack(): Stack {
  return {
    data: [
      {
        tag: "Value",
        value: 0,
        annotation: "placeholder for the return value of the main-function",
      },
    ],
    control: [
      {
        tag: "Frame",
        return_address: -1,
        base_address: 0,
        pc: -1,
        generation_counter: 0,
        note: "program return value",
      },
      {
        tag: "Frame",
        return_address: 0,
        base_address: 1,
        pc: 0,
        generation_counter: 0,
        note: "main function",
      },
    ],
    generation: [-1], // will be over-written by main-return
  };
}

export function is_executable(stack: Stack): boolean {
  return stack.control.length > 1;
}
