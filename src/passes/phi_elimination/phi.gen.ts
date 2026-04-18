// Copyright (c) 2026 Marco Nikander

import * as HIGH from "../../high/high_grammar.ts";
import { valid } from "../../utility.ts";
import { collect_predecessors } from "./predecessors.gen.ts";

export function eliminate_phi_nodes(program: HIGH.Program): HIGH.Program {
  return program.map(eliminate_phi_nodes_in_function);
}

export function eliminate_phi_nodes_in_function(
  func: HIGH.Function,
): HIGH.Function {
  const blocks = func.blocks.map(clone_block);
  const block_by_name = new Map(
    blocks.map((block): [HIGH.Label, HIGH.Block] => [block.name, block]),
  );
  const predecessors = collect_predecessors(func.blocks);
  const fresh_label = create_label_generator(func);
  const fresh_register = create_register_generator(func);
  const rewritten: HIGH.Block[] = [];

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

    for (const predecessor of incoming) {
      const edge_block = create_edge_block(
        block,
        predecessor,
        fresh_label,
        fresh_register,
      );

      redirect_predecessor(
        block_by_name,
        predecessor,
        block.name,
        edge_block.name,
      );
      rewritten.push(edge_block);
    }

    block.joins = [];
    rewritten.push(block);
  }

  return {
    ...func,
    blocks: rewritten,
  };
}

function clone_block(block: HIGH.Block): HIGH.Block {
  return {
    ...block,
    joins: [...block.joins],
    lines: [...block.lines],
    terminator: clone_terminator(block.terminator),
  };
}

function clone_terminator(terminator: HIGH.Terminator): HIGH.Terminator {
  switch (terminator[1]) {
    case "Jump": {
      const clone: HIGH.Jump = [null, "Jump", terminator[2]];
      return clone;
    }
    case "Branch": {
      const clone: HIGH.Branch = [
        null,
        "Branch",
        terminator[2],
        [terminator[3][0], terminator[3][1]],
      ];
      return clone;
    }
    case "Return": {
      const clone: HIGH.Return = [null, "Return", terminator[2]];
      return clone;
    }
  }
}

function redirect_predecessor(
  block_by_name: Map<HIGH.Label, HIGH.Block>,
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
    case "Jump": {
      const next: HIGH.Label = terminator[2] === target
        ? replacement
        : terminator[2];
      const clone: HIGH.Jump = [null, "Jump", next];
      return clone;
    }
    case "Branch": {
      const left: HIGH.Label = terminator[3][0] === target
        ? replacement
        : terminator[3][0];
      const right: HIGH.Label = terminator[3][1] === target
        ? replacement
        : terminator[3][1];
      const clone: HIGH.Branch = [null, "Branch", terminator[2], [left, right]];
      return clone;
    }
    case "Return": {
      return terminator;
    }
  }
}

function create_edge_block(
  block: HIGH.Block,
  predecessor: HIGH.Label,
  fresh_label: (seed: string) => HIGH.Label,
  fresh_register: (seed: string) => HIGH.Register,
): HIGH.Block {
  const name = fresh_label(
    `phi.${strip_sigils(block.name)}.from.${strip_sigils(predecessor)}`,
  );

  return {
    name,
    joins: [],
    lines: lower_phi_nodes(block, predecessor, fresh_register),
    terminator: [null, "Jump", block.name],
  };
}

function lower_phi_nodes(
  block: HIGH.Block,
  predecessor: HIGH.Label,
  fresh_register: (seed: string) => HIGH.Register,
): HIGH.Line[] {
  const reads: HIGH.Line[] = [];
  const writes: HIGH.Line[] = [];

  for (const phi of block.joins) {
    const source = find_phi_input(phi, predecessor);
    const temporary = fresh_register(
      `phi.${strip_sigils(block.name)}.from.${strip_sigils(predecessor)}.${
        strip_sigils(phi[0])
      }`,
    );

    reads.push([temporary, "Assign", source]);
    writes.push([phi[0], "Assign", [temporary]]);
  }

  return [...reads, ...writes];
}

function find_phi_input(
  phi: HIGH.Phi,
  predecessor: HIGH.Label,
): HIGH.Input {
  for (const [label, input] of phi[2]) {
    if (label === predecessor) {
      return input;
    }
  }

  throw Error(
    `Phi node '${
      phi[0]
    }' in block is missing input for predecessor '${predecessor}'`,
  );
}

function create_label_generator(
  func: HIGH.Function,
): (seed: string) => HIGH.Label {
  return create_name_generator(
    new Set(func.blocks.map((block) => block.name)),
    "@",
  );
}

function create_register_generator(
  func: HIGH.Function,
): (seed: string) => HIGH.Register {
  const used = new Set<HIGH.Register>();

  for (const param of func.params) {
    used.add(get_input_register(param));
  }

  for (const block of func.blocks) {
    for (const phi of block.joins) {
      used.add(phi[0]);
    }

    for (const line of block.lines) {
      if (line[0] !== null) {
        used.add(line[0]);
      }
    }
  }

  return create_name_generator(used, "%");
}

function create_name_generator<Name extends string>(
  used: Set<Name>,
  prefix: "@" | "%",
): (seed: string) => Name {
  return (seed: string): Name => {
    let candidate = `${prefix}${seed}` as Name;
    let counter = 1;

    while (used.has(candidate)) {
      candidate = `${prefix}${seed}.${counter}` as Name;
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
