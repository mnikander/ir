// Copyright (c) 2026 Marco Nikander

import { Data } from "./low_grammar.ts";
import { valid } from "../old_src/utility.ts";

// this design allows 'living off the top of the stack', because it's easy to
// always get the current frame

export type Stack = {
  data: Data[];
  frames: Frame[];
};

export type Frame = {
  tag: "Frame";
  return_address: number;
  base_address: number;
  pc: number;
};

export function top(state: Stack): Frame {
  return valid(state.frames[state.frames.length - 1]);
}

export function peek(state: Stack): Frame {
  return valid(state.frames[state.frames.length - 2]);
}
