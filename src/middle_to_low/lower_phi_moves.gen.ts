// Copyright (c) 2026 Marco Nikander

import * as MIR from "../middle/middle_grammar.ts";
import type {
  IndexedFunction,
  LoweredPhiProgram,
  SplitProgram,
} from "./types.gen.ts";

export function lower_phi_moves(program: SplitProgram): LoweredPhiProgram {
  return program.map(lower_function);
}

function lower_function(func: IndexedFunction): IndexedFunction {
  let next_resource = func.resource_count;
  const by_id = new Map(func.blocks.map((block) => [block.id, block]));
  const blocks = func.blocks.map((block) => {
    if (block.edge === undefined) {
      return {
        ...block,
        lines: block.lines.filter((line) =>
          !(line[0] === "let" && line[2][0] === "phi")
        ),
      };
    }
    const target = by_id.get(block.edge.target)!;
    const phis = target.lines.filter((line): line is MIR.Let =>
      line[0] === "let" && line[2][0] === "phi"
    );
    const reads: MIR.Let[] = phis.map((phi) => {
      const from = ((phi[2] as MIR.Phi)[1].slice(1) as MIR.From[]).find((
        item,
      ) => item[1][1] === block.edge!.predecessor)!;
      return ["let", next_resource++, ["copy", from[2]]];
    });
    const writes: MIR.Let[] = phis.map((
      phi,
      index,
    ) => ["let", phi[1], ["copy", ["access", reads[index][1]]]]);
    return {
      ...block,
      edge: undefined,
      lines: [...reads, ...writes, ...block.lines],
    };
  });
  return { ...func, resource_count: next_resource, blocks };
}
