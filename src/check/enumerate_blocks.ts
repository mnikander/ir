// Copyright (c) 2026 Marco Nikander

import * as HIGH from "../high/high_grammar.ts";
import { valid } from "../utility.ts";

export function enumerate_all_blocks(
  input_program: HIGH.Program,
): HIGH.Program {
  const program: HIGH.Program = input_program.map((f) => {
    return {
      name: f.name,
      params: f.params,
      blocks: enumerate_blocks(f.blocks),
    };
  });
  return program;
}

function enumerate_blocks(blocks: HIGH.Block[]): HIGH.Block[] {
  const name_to_index: Map<HIGH.Label, number> = new Map(
    blocks.map((b, i) => [b.name, i]),
  );
  const results: HIGH.Block[] = blocks.map((b: HIGH.Block, i: number) => {
    return {
      name: number_to_label(i),
      joins: b.joins,
      lines: b.lines,
      terminator: replace_successors(b.terminator, name_to_index),
    };
  });
  return results;
}

function replace_successors(
  terminator: HIGH.Terminator,
  name_to_index: Map<HIGH.Label, number>,
): HIGH.Terminator {
  if (terminator[HIGH.Get.Tag] === "Return") {
    return terminator;
  } else if (terminator[HIGH.Get.Tag] === "Jump") {
    return [
      terminator[0],
      terminator[1],
      number_to_label(valid(name_to_index.get(terminator[2]))),
    ];
  } else if (terminator[HIGH.Get.Tag] === "Branch") {
    return [
      terminator[0],
      terminator[1],
      terminator[2],
      [
        number_to_label(valid(name_to_index.get(terminator[3][0]))),
        number_to_label(valid(name_to_index.get(terminator[3][1]))),
      ],
    ];
  } else {
    throw Error(`Unhandled terminator type '${terminator[HIGH.Get.Tag]}'`);
  }
}

function number_to_label(index: number): HIGH.Label {
  return `@${index.toString()}`;
}
