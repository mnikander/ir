// Copyright (c) 2026 Marco Nikander

import * as MIR from "../middle/middle_grammar.ts";
import type {
  IndexedBlock,
  IndexedFunction,
  IndexedProgram,
} from "./types.gen.ts";

export function validate_and_index(program: MIR.Program): IndexedProgram {
  if (program[0] !== "program" || program.length < 2) {
    throw Error("Cannot lower an empty MIR program");
  }
  return (program.slice(1) as MIR.Function[]).map((func, id) =>
    validate_function(func, id, program.length - 1)
  );
}

function validate_function(
  func: MIR.Function,
  id: number,
  function_count: number,
): IndexedFunction {
  const parameter_count = func[1].length - 1;
  const resource_count = parameter_count + func[2].length - 1;
  const [, , , , ...source_blocks] = func;
  if (source_blocks.length === 0) {
    throw Error(`Function ${id} has no entry block`);
  }

  const defined = new Set<MIR.ResourceId>();
  for (let resource = 0; resource < parameter_count; resource++) {
    defined.add(MIR.resource_id(resource));
  }
  const blocks: IndexedBlock[] = source_blocks.map((block, id) => ({
    id,
    lines: block.slice(1) as MIR.Line[],
  }));

  for (const block of blocks) {
    for (const line of block.lines) {
      if (line[0] === "let") {
        check_resource(
          line[1],
          resource_count,
          `destination in function ${id}`,
        );
        if (defined.has(line[1])) {
          throw Error(
            `Resource ${line[1]} is defined more than once in function ${id}`,
          );
        }
        defined.add(line[1]);
        validate_operation(
          line[2],
          resource_count,
          blocks.length,
          function_count,
        );
      } else if (line[0] === "drop") {
        check_resource(line[1], resource_count, `drop in function ${id}`);
      } else {
        validate_terminator(line, resource_count, blocks.length);
      }
    }
  }
  validate_phis(blocks);
  return { id, parameter_count, resource_count, blocks };
}

function validate_operation(
  op: MIR.Operation,
  resources: number,
  blocks: number,
  functions: number,
): void {
  if (op[0] === "phi") {
    for (const from of op[1].slice(1) as MIR.From[]) {
      check_block(from[1], blocks);
      validate_operand(from[2], resources);
    }
  } else if (op[0] === "call") {
    check_function(op[1], functions);
    for (const operand of op[2].slice(1) as MIR.Operand[]) {
      validate_operand(operand, resources);
    }
  } else {
    for (const value of op.slice(1)) {
      validate_operand(value as MIR.Operand, resources);
    }
  }
}

function validate_terminator(
  line: MIR.Terminator,
  resources: number,
  blocks: number,
): void {
  if (line[0] === "jump") check_block(line[1], blocks);
  else if (line[0] === "branch") {
    validate_operand(line[1], resources);
    check_block(line[2], blocks);
    check_block(line[3], blocks);
  } else check_resource(line[1], resources, "return");
}

function validate_operand(operand: MIR.Operand, resources: number): void {
  if (operand[0] !== "constant") {
    check_resource(operand[1], resources, "operand");
  }
}

function check_resource(
  resource: MIR.ResourceId,
  count: number,
  context: string,
): void {
  const index = MIR.to_index(resource);
  if (!Number.isInteger(index) || index < 0 || index >= count) {
    throw Error(`Invalid resource ${resource} in ${context}`);
  }
}
function check_block(block: MIR.BlockId, count: number): void {
  const index = MIR.to_index(block);
  if (!Number.isInteger(index) || index < 0 || index >= count) {
    throw Error(`Invalid block id ${block}`);
  }
}
function check_function(function_: MIR.FunctionId, count: number): void {
  const index = MIR.to_index(function_);
  if (!Number.isInteger(index) || index < 0 || index >= count) {
    throw Error(`Invalid function id ${function_}`);
  }
}

function validate_phis(blocks: IndexedBlock[]): void {
  const predecessors = new Map<MIR.BlockId, Set<MIR.BlockId>>(
    blocks.map((block) => [MIR.block_id(block.id), new Set()]),
  );
  for (const block of blocks) {
    const terminator = block.lines.at(-1);
    if (terminator?.[0] === "jump") {
      predecessors.get(terminator[1])!.add(MIR.block_id(block.id));
    }
    if (terminator?.[0] === "branch") {
      predecessors.get(terminator[2])!.add(MIR.block_id(block.id));
      predecessors.get(terminator[3])!.add(MIR.block_id(block.id));
    }
  }
  for (const block of blocks) {
    for (const line of block.lines) {
      if (line[0] !== "let" || line[2][0] !== "phi") continue;
      const actual = (line[2][1].slice(1) as MIR.From[]).map((from) => from[1]);
      const expected = predecessors.get(MIR.block_id(block.id))!;
      if (
        actual.length !== new Set(actual).size ||
        actual.length !== expected.size || actual.some((id) =>
          !expected.has(id)
        )
      ) {
        throw Error(
          `Phi for resource ${
            line[1]
          } in block ${block.id} does not cover every predecessor exactly once`,
        );
      }
    }
  }
}
