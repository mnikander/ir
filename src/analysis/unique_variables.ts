// Copyright (c) 2026 Marco Nikander

import * as HIR from "../high/high_grammar.ts";

export function validate_unique_variables(program: HIR.Program): boolean {
  const list = extract_variables(program);
  const set = new Set(list);
  const variable_count: number = set.size;
  const assignment_count: number = list.length;
  // TODO: modify the code so that it outputs the list of all duplicate variables as an error message
  return variable_count == assignment_count;
}

function extract_variables(program: HIR.Program): HIR.Register[] {
  const list: HIR.Register[] = program.map((fun: HIR.Function) =>
    extract_function_variables(fun)
  ).reduce(concat);
  return list;

  function extract_function_variables(func: HIR.Function): HIR.Register[] {
    const variables_from_body: HIR.Register[] = func.blocks.map(
      extract_block_variables,
    )
      .reduce(concat);
    const variables_from_parameters: HIR.Register[] = func.params.map(
      toRegister,
    );
    return variables_from_body.concat(variables_from_parameters);
  }

  function extract_block_variables(block: HIR.Block): HIR.Register[] {
    const variables_from_phi: HIR.Register[] = block.joins.map((i) =>
      i[HIR.Get.Dest]
    );
    const lines_without_drop: HIR.Line[] = block.lines.filter((
      line: HIR.Line,
    ) => line[HIR.Get.Tag] !== "Drop");
    const variables_from_lines_without_drop: HIR.Register[] = lines_without_drop
      .map((
        i,
      ) => i[HIR.Get.Dest]);
    return concat(variables_from_phi, variables_from_lines_without_drop);
  }

  function concat(left: HIR.Register[], right: HIR.Register[]) {
    return left.concat(right);
  }
}

function extract_variables_via_loop(program: HIR.Program): HIR.Register[] {
  const variables: HIR.Register[] = [];
  for (let f = 0; f < program.length; ++f) {
    const func: HIR.Function = program[f];
    for (let p = 0; p < func.params.length; ++p) {
      variables.push(toRegister(func.params[p]));
    }
    for (let b = 0; b < func.blocks.length; ++b) {
      const block: HIR.Block = func.blocks[b];
      for (let j = 0; j < block.joins.length; ++j) {
        const phi: HIR.Phi = block.joins[j];
        variables.push(phi[HIR.Get.Dest]);
      }
      for (let l = 0; l < block.lines.length; ++l) {
        const line: HIR.Line = block.lines[l];
        if (line[HIR.Get.Tag] !== "Drop") {
          variables.push(line[HIR.Get.Dest]);
        }
      }
    }
  }
  return variables;
}

function toRegister(arg: HIR.Input) {
  return arg.length === 1 ? arg[0] : arg[1];
}
