// Copyright (c) 2026 Marco Nikander

import * as HIGH from "./high_grammar.ts";

export function print(program: HIGH.Program): string {
  return "\n" + program.map(print_function).join("\n\n") + "\n";
}

function print_function(fun: HIGH.Function): string {
  const params = print_input_list(fun.params);
  const blocks = fun.blocks.map(print_block).join("\n\n");
  return [`function ${fun.name} ${params}:`, "", blocks].join("\n");
}

function print_block(block: HIGH.Block): string {
  const body = [
    ...block.phis.map(print_phi),
    ...block.lines.map(print_line),
    print_terminator(block.terminator),
  ].map((line) => `    ${line}`);

  return [`  block ${block.name}:`, ...body].join("\n");
}

function print_phi(phi: HIGH.Phi): string {
  const inputs = phi[2].map(([label, input]) =>
    `[${label} ${print_input(input)}]`
  ).join(" ");
  return `${phi[0]} = ${phi[1]} [${inputs}]`;
}

function print_line(line: HIGH.Line): string {
  switch (line[1]) {
    case "call":
      return `${line[0]} = ${line[1]} ${line[2]} ${print_input_list(line[3])}`;
    case "constant":
      return `${line[0]} = ${line[1]} ${print_primitive(line[2])}`;
    case "copy":
    case "own":
      return `${line[0]} = ${line[1]} ${print_input(line[2])}`;
    case "borrow":
    case "load":
      return `${line[0]} = ${line[1]} ${line[2]}`;
    case "drop":
      return `${line[0]} = ${line[1]}`;
    case "add":
    case "subtract":
    case "multiply":
    case "divide":
    case "remainder":
    case "minimum":
    case "maximum":
    case "equal":
    case "unequal":
    case "less":
    case "less_equal":
    case "greater":
    case "greater_equal":
      return `${line[0]} = ${line[1]} ${print_input(line[2])} ${
        print_input(line[3])
      }`;
    case "negate":
      return `${line[0]} = ${line[1]} ${print_input(line[2])}`;
    default:
      return assert_never(line);
  }
}

function print_terminator(terminator: HIGH.Terminator): string {
  switch (terminator[1]) {
    case "jump":
      return `${terminator[1]} ${terminator[2]}`;
    case "branch":
      return `${terminator[1]} ${print_input(terminator[2])} ${
        terminator[3][0]
      } ${terminator[3][1]}`;
    case "return":
      return `${terminator[1]} ${print_input(terminator[2])}`;
    default:
      return assert_never(terminator);
  }
}

function print_input(input: HIGH.Input): string {
  return input[0] === "consume" ? `(consume ${input[1]})` : input[0];
}

function print_input_list(inputs: readonly HIGH.Input[]): string {
  return `[${inputs.map(print_input).join(" ")}]`;
}

function print_primitive(primitive: HIGH.Primitive): string {
  return String(primitive.value);
}

function assert_never(value: never): never {
  throw new Error(`Unhandled HIR variant: ${JSON.stringify(value)}`);
}
