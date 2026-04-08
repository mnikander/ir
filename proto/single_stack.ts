// Copyright (c) 2026 Marco Nikander

import { Pointer, Value } from "./low_grammar.ts";

// This design keeps program state and data on one single stack.
// The big disadvantage is that we have to hold the program state somewhere
// external to the stack, so that we are able to interpret what we are
// seeing on the stack. That external state needs to be held somewhere
// and needs to be kept synchronized.

export type State = { frame: Frame; stack: (Frame | Pointer | Value)[] };

export type Frame = {
  tag: "Frame";
  return_pointer: number;
  base_pointer: number;
  pc: number;
};

export function assert_frame(
  item: Frame | Pointer | Value | undefined | null,
): Frame {
  if (item === undefined) {
    throw Error(`Expected a Frame, got 'undefined'`);
  } else if (item === null) {
    throw Error(`Expected a Frame, got 'null'`);
  } else if (item.tag !== "Frame") {
    throw Error(`Expected a Frame, got '${item.tag}'`);
  } else {
    return item;
  }
}
