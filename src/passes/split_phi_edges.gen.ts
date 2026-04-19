// Copyright (c) 2026 Marco Nikander

import * as HIGH from "../high/high_grammar.ts";
import { valid } from "../utility.ts";
import { collect_predecessors } from "./predecessors.gen.ts";
import type { SplitBlock, SplitFunction, SplitProgram } from "./types.gen.ts";

export function split_phi_edges(program: HIGH.Program): SplitProgram {
  return program.map(split_phi_edges_in_function);
}

export function split_phi_edges_in_function(
  func: HIGH.Function,
): SplitFunction {
  const blocks = func.blocks.map(clone_block);
  const block_by_name = new Map(
    blocks.map((block): [HIGH.Label, SplitBlock] => [block.name, block]),
  );
  const predecessors = collect_predecessors(func.blocks);
  const fresh_label = create_label_generator(func);
  const rewritten: SplitBlock[] = [];

  for (const block of blocks) {
    if (block.joins.length === 0) {
      rewritten.push(block);
      continue;
    }

    const incoming = valid(predecessors.get(block.name));
    if (incoming.length === 0) {
      throw Error(
        `Cannot lower phi nodes in block '${block.name}' without predecessors`,
      );
    }

    const edge_blocks = incoming.map((predecessor) =>
      create_edge_block(block.name, predecessor, fresh_label)
    );

    for (const edge_block of edge_blocks) {
      redirect_predecessor(
        block_by_name,
        edge_block.edge!.predecessor,
        block.name,
        edge_block.name,
      );
    }

    rewritten.push(...edge_blocks, block);
  }

  return {
    name: func.name,
    params: [...func.params],
    blocks: rewritten,
  };
}

function clone_block(block: HIGH.Block): SplitBlock {
  return {
    name: block.name,
    joins: [...block.joins],
    lines: [...block.lines],
    terminator: clone_terminator(block.terminator),
  };
}

function clone_terminator(terminator: HIGH.Terminator): HIGH.Terminator {
  switch (terminator[1]) {
    case "Jump":
      return [null, "Jump", terminator[2]];
    case "Branch":
      return [null, "Branch", terminator[2], [
        terminator[3][0],
        terminator[3][1],
      ]];
    case "Return":
      return [null, "Return", terminator[2]];
  }
}

function redirect_predecessor(
  block_by_name: Map<HIGH.Label, SplitBlock>,
  predecessor: HIGH.Label,
  target: HIGH.Label,
  replacement: HIGH.Label,
): void {
  const block = valid(block_by_name.get(predecessor));
  block.terminator = redirect_terminator_target(
    block.terminator,
    target,
    replacement,
  );
}

function redirect_terminator_target(
  terminator: HIGH.Terminator,
  target: HIGH.Label,
  replacement: HIGH.Label,
): HIGH.Terminator {
  switch (terminator[1]) {
    case "Jump":
      return [
        null,
        "Jump",
        terminator[2] === target ? replacement : terminator[2],
      ];
    case "Branch":
      return [
        null,
        "Branch",
        terminator[2],
        [
          terminator[3][0] === target ? replacement : terminator[3][0],
          terminator[3][1] === target ? replacement : terminator[3][1],
        ],
      ];
    case "Return":
      return terminator;
  }
}

function create_edge_block(
  target: HIGH.Label,
  predecessor: HIGH.Label,
  fresh_label: (seed: string) => HIGH.Label,
): SplitBlock {
  return {
    name: fresh_label(
      `phi.${strip_sigils(target)}.from.${strip_sigils(predecessor)}`,
    ),
    joins: [],
    lines: [],
    terminator: [null, "Jump", target],
    edge: { target, predecessor },
  };
}

function create_label_generator(
  func: HIGH.Function,
): (seed: string) => HIGH.Label {
  const used = new Set(func.blocks.map((block) => block.name));

  return (seed: string): HIGH.Label => {
    let candidate = `@${seed}` as HIGH.Label;
    let counter = 1;

    while (used.has(candidate)) {
      candidate = `@${seed}.${counter}` as HIGH.Label;
      counter += 1;
    }

    used.add(candidate);
    return candidate;
  };
}

function strip_sigils(name: HIGH.Label | HIGH.Register): string {
  return name.slice(1);
}
