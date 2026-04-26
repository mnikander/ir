// Copyright (c) 2026 Marco Nikander

import * as HIGH from "../high/high_grammar.ts";
import { valid } from "../utility.ts";
import type { SplitBlock, SplitFunction, SplitProgram } from "./types.gen.ts";

export function lower_phi_moves(program: SplitProgram): HIGH.Program {
  return program.map(lower_phi_moves_in_function);
}

export function lower_phi_moves_in_function(
  func: SplitFunction,
): HIGH.Function {
  const block_by_name = new Map(
    func.blocks.map((block): [HIGH.Label, SplitBlock] => [block.name, block]),
  );
  const fresh_register = create_register_generator(func);

  return {
    name: func.name,
    params: [...func.params],
    blocks: func.blocks.map((block) =>
      lower_block(block, block_by_name, fresh_register)
    ),
  };
}

function lower_block(
  block: SplitBlock,
  block_by_name: Map<HIGH.Label, SplitBlock>,
  fresh_register: (seed: string) => HIGH.Register,
): HIGH.Block {
  if (block.edge === undefined) {
    return {
      name: block.name,
      phis: [],
      lines: [...block.lines],
      terminator: block.terminator,
    };
  }

  const target = valid(block_by_name.get(block.edge.target));
  return {
    name: block.name,
    phis: [],
    lines: lower_phi_nodes(target, block.edge.predecessor, fresh_register),
    terminator: block.terminator,
  };
}

function lower_phi_nodes(
  target: SplitBlock,
  predecessor: HIGH.Label,
  fresh_register: (seed: string) => HIGH.Register,
): HIGH.Line[] {
  const reads = target.phis.map((phi) => {
    const source = find_phi_input(phi, predecessor);
    const temporary = fresh_register(
      `phi.${strip_sigils(target.name)}.from.${strip_sigils(predecessor)}.${
        strip_sigils(phi[0])
      }`,
    );
    return [temporary, "copy", source] satisfies HIGH.Copy;
  });

  const writes = target.phis.map((phi, index) =>
    [phi[0], "copy", [reads[index][0]]] satisfies HIGH.Copy
  );

  return [...reads, ...writes];
}

function find_phi_input(
  phi: HIGH.Phi,
  predecessor: HIGH.Label,
): HIGH.Input {
  const entry = phi[2].find(([label]) => label === predecessor);
  if (entry === undefined) {
    throw Error(
      `Phi node '${
        phi[0]
      }' in block is missing input for predecessor '${predecessor}'`,
    );
  }

  return entry[1];
}

function create_register_generator(
  func: SplitFunction,
): (seed: string) => HIGH.Register {
  const used = new Set<HIGH.Register>(func.params.map(get_input_register));

  for (const block of func.blocks) {
    for (const phi of block.phis) {
      used.add(phi[0]);
    }

    for (const line of block.lines) {
      used.add(line[0]);
    }
  }

  return (seed: string): HIGH.Register => {
    let candidate = `%${seed}` as HIGH.Register;
    let counter = 1;

    while (used.has(candidate)) {
      candidate = `%${seed}.${counter}` as HIGH.Register;
      counter += 1;
    }

    used.add(candidate);
    return candidate;
  };
}

function get_input_register(input: HIGH.Input): HIGH.Register {
  return input[0] === "consume" ? input[1] : input[0];
}

function strip_sigils(name: HIGH.Label | HIGH.Register): string {
  return name.slice(1);
}
