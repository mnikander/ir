// Copyright (c) 2026 Marco Nikander

import * as HIGH from "../high/high_grammar.ts";

export function validate_unique_variables(program: HIGH.Program): boolean {
  const list = extract_variables(program);
  const set = new Set(list);
  const variable_count: number = set.size;
  const assignment_count: number = list.length;
  // TODO: modify the code so that it outputs the list of all duplicate variables as an error message
  return variable_count == assignment_count;
}

function extract_variables(program: HIGH.Program): HIGH.Register[] {
  const list: HIGH.Register[] = program.map((fun: HIGH.Function) =>
    extract_function_variables(fun)
  ).reduce(concat);
  return list;

  function extract_function_variables(func: HIGH.Function): HIGH.Register[] {
    const variables_from_body: HIGH.Register[] = func.blocks.map(
      extract_block_variables,
    )
      .reduce(concat);
    const variables_from_parameters: HIGH.Register[] = func.params.map(
      toRegister,
    );
    return variables_from_body.concat(variables_from_parameters);
  }

  function extract_block_variables(block: HIGH.Block): HIGH.Register[] {
    const variables_from_phi: HIGH.Register[] = block.phis.map((i) =>
      i[HIGH.Get.Dest]
    );
    const lines_without_drop: HIGH.Line[] = block.lines.filter((
      line: HIGH.Line,
    ) => line[HIGH.Get.Tag] !== "Drop");
    const variables_from_lines_without_drop: HIGH.Register[] =
      lines_without_drop
        .map((
          i,
        ) => i[HIGH.Get.Dest]);
    return concat(variables_from_phi, variables_from_lines_without_drop);
  }

  function concat(left: HIGH.Register[], right: HIGH.Register[]) {
    return left.concat(right);
  }
}

function _extract_variables_via_loop(program: HIGH.Program): HIGH.Register[] {
  const variables: HIGH.Register[] = [];
  for (let f = 0; f < program.length; ++f) {
    const func: HIGH.Function = program[f];
    for (let p = 0; p < func.params.length; ++p) {
      variables.push(toRegister(func.params[p]));
    }
    for (let b = 0; b < func.blocks.length; ++b) {
      const block: HIGH.Block = func.blocks[b];
      for (let j = 0; j < block.phis.length; ++j) {
        const phi: HIGH.Phi = block.phis[j];
        variables.push(phi[HIGH.Get.Dest]);
      }
      for (let l = 0; l < block.lines.length; ++l) {
        const line: HIGH.Line = block.lines[l];
        if (line[HIGH.Get.Tag] !== "Drop") {
          variables.push(line[HIGH.Get.Dest]);
        }
      }
    }
  }
  return variables;
}

function toRegister(arg: HIGH.Input) {
  return arg.length === 1 ? arg[0] : arg[1];
}
