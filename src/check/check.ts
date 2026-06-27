// Copyright (c) 2026 Marco Nikander

import * as HIGH from "../high/high_grammar.ts";
import { InSet, make_in_set } from "./lifecycle_lattice.ts";

export function check(program: HIGH.Program): boolean {
  const results: boolean[] = program.map((f) => check_function(f));
  const all_good = results.reduce((a, b) => a && b);
  return all_good;
}

function check_function(fun: HIGH.Function): boolean {
  // TODO: use the neverthrow package or some other Result type here
  // TODO: extend this function to handle functions with multiple blocks via dataflow analysis
  if (fun.blocks.length !== 1) return false; // "Only supports functions with a single block"
  if (fun.blocks[0].name === "@entry") return false; // "Function must have entry block");
  if (
    fun.blocks[0].phis.length === 0
  ) return false; // "Entry block cannot have phi-nodes",

  // I need mappings Register->Type
  // for Pointers I need Register->Register[] (i.e. Pointer->Pointees[])

  // TODO: resolve and check phi nodes, `ok_phis`

  const registers: HIGH.Register[] = extract_variables_from_block(
    fun.blocks[0],
  );
  const in_set: InSet = make_in_set(registers);
  const ok_lines: boolean = check_block_lines(fun.blocks[0], in_set);

  // TODO: resolve and check terminator, `ok_terminator`

  return ok_lines;
}

function check_block_lines(block: HIGH.Block, in_set: InSet): boolean {
  // if I want to implement _just_ the function for a linear block,
  // then the IN-SET already includes resolved Phi-nodes

  // I want to update the in_set for all registers which occur in the lines (dest and args)
  // lines.map with

  return false; // TODO implement
}

function extract_variables_from_block(block: HIGH.Block): HIGH.Register[] {
  const phi_vars: HIGH.Register[] = block.phis.map((phi) => phi[HIGH.Get.Dest]);
  const non_drop: HIGH.Line[] = block.lines.filter((line) =>
    line[HIGH.Get.Tag] !== "drop"
  );
  const line_vars: HIGH.Register[] = non_drop.map((line) =>
    line[HIGH.Get.Dest]
  );
  return [...phi_vars, ...line_vars];
}
