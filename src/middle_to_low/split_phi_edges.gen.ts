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
    const predecessors = new Set<number>();
    for (const phi of phis) {
      for (const from of (phi[2] as MIR.Phi)[1].slice(1) as MIR.From[]) {
        predecessors.add(from[1][1]);
      }
    }
    for (const predecessor of predecessors) {
      const edge_id = next_id++;
      const source = blocks.find((block) => block.id === predecessor)!;
      source.lines = source.lines.map((line) =>
        redirect(line, target.id, edge_id)
      );
      blocks.push({
        id: edge_id,
        lines: [["jump", ["block_id", target.id]]],
        edge: { target: target.id, predecessor },
      });
    }
  }
  return { ...func, blocks };
}

function redirect(
  line: MIR.Line,
  target: number,
  replacement: number,
): MIR.Line {
  if (line[0] === "jump" && line[1][1] === target) {
    return ["jump", ["block_id", replacement]];
  }
  if (line[0] === "branch") {
    return ["branch", line[1], [
      "block_id",
      line[2][1] === target ? replacement : line[2][1],
    ], ["block_id", line[3][1] === target ? replacement : line[3][1]]];
  }
  return line;
}
