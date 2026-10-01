// Copyright (c) 2026 Marco Nikander

import * as MIR from "../middle/middle_grammar.ts";
import type {
  IndexedBlock,
  IndexedFunction,
  IndexedProgram,
  SplitProgram,
} from "./types.gen.ts";

export function split_phi_edges(program: IndexedProgram): SplitProgram {
  return program.map(split_function);
}

function split_function(func: IndexedFunction): IndexedFunction {
  const blocks: IndexedBlock[] = func.blocks.map((block) => ({
    ...block,
    lines: [...block.lines],
  }));
  let next_id = blocks.length;
  for (const target of func.blocks) {
    const phis = target.lines.filter((line): line is MIR.Let =>
      line[0] === "let" && line[2][0] === "phi"
    );
    if (phis.length === 0) continue;
    const predecessors = new Set<MIR.BlockId>();
    for (const phi of phis) {
      for (const from of (phi[2] as MIR.Phi)[1].slice(1) as MIR.From[]) {
        predecessors.add(from[1]);
      }
    }
    for (const predecessor of predecessors) {
      const edge_id = next_id++;
      const source = blocks.find((block) =>
        block.id === MIR.to_index(predecessor)
      )!;
      source.lines = source.lines.map((line) =>
        redirect(line, MIR.block_id(target.id), MIR.block_id(edge_id))
      );
      blocks.push({
        id: edge_id,
        lines: [["jump", MIR.block_id(target.id)]],
        edge: { target: target.id, predecessor: MIR.to_index(predecessor) },
      });
    }
  }
  return { ...func, blocks };
}

function redirect(
  line: MIR.Line,
  target: MIR.BlockId,
  replacement: MIR.BlockId,
): MIR.Line {
  if (line[0] === "jump" && line[1] === target) {
    return ["jump", replacement];
  }
  if (line[0] === "branch") {
    return [
      "branch",
      line[1],
      line[2] === target ? replacement : line[2],
      line[3] === target ? replacement : line[3],
    ];
  }
  return line;
}
