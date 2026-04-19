// Copyright (c) 2026 Marco Nikander

import * as HIGH from "../../high/high_grammar.ts";

export type PhiEdge = {
  target: HIGH.Label;
  predecessor: HIGH.Label;
};

export type SplitProgram = readonly SplitFunction[];

export type SplitFunction = {
  name: HIGH.Label;
  params: HIGH.Input[];
  blocks: SplitBlock[];
};

export type SplitBlock = {
  name: HIGH.Label;
  joins: HIGH.Phi[];
  lines: HIGH.Line[];
  terminator: HIGH.Terminator;
  edge?: PhiEdge;
};
