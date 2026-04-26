// Copyright (c) 2026 Marco Nikander

import * as HIGH from "../high/high_grammar.ts";
import { valid } from "../utility.ts";

export type PredecessorMap = Map<HIGH.Label, HIGH.Label[]>;

export function collect_predecessors(
  blocks: readonly HIGH.Block[],
): PredecessorMap {
  const predecessors: PredecessorMap = new Map();

  for (const block of blocks) {
    predecessors.set(block.name, []);
  }

  for (const block of blocks) {
    for (const successor of collect_successors(block.terminator)) {
      const incoming = valid(predecessors.get(successor));

      if (!incoming.includes(block.name)) {
        incoming.push(block.name);
      }
    }
  }

  return predecessors;
}

export function collect_successors(
  terminator: HIGH.Terminator,
): readonly HIGH.Label[] {
  switch (terminator[1]) {
    case "jump":
      return [terminator[3]];
    case "branch":
      return terminator[4];
    case "return":
      return [];
  }
}
