// Copyright (c) 2026 Marco Nikander

import * as MIR from "../middle/middle_grammar.ts";

export function address_taken(fun: MIR.Function): MIR.ResourceId[] {
  const blocks: MIR.Block[] = fun.slice(4) as MIR.Block[];
  const intermediate_results: MIR.ResourceId[][] = blocks.map(
    address_taken_in_block,
  );
  return intermediate_results.flat(1);
}

function address_taken_in_block(block: MIR.Block): MIR.ResourceId[] {
  const lines: MIR.Line[] = block.slice(1) as MIR.Line[];
  const lets: MIR.Let[] = lines.filter(MIR.is_let);
  const borrowers: MIR.Let[] = lets.filter((l: MIR.Let) => {
    return MIR.is_borrow(l[2]);
  });
  const borrows: MIR.Borrow[] = borrowers.map((b) => b[2] as MIR.Borrow);
  const borrowed_resource_ids: MIR.ResourceId[] = borrows.map((b) => b[1][1]);
  return borrowed_resource_ids;
}
