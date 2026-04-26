// Copyright (c) 2026 Marco Nikander

import * as HIGH from "./high_grammar.ts";
import type { Type } from "./types.ts";

export function print(program: HIGH.Program): string {
  return "\n" + program.map(print_function).join("\n\n") + "\n";
}

function print_function(fun: HIGH.Function): string {
  const params = print_param_list(fun.params);
  const blocks = fun.blocks.map(print_block).join("\n\n");
  return [
    `function ${fun.name} ${params} -> ${print_type(fun.return_type)}`,
    "",
    blocks,
  ]
    .join("\n");
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
  const inputs = phi[3].map(([label, input]) =>
    `[${label}, ${print_input(input)}]`
  ).join(", ");
  return `${phi[0]} = ${phi[1]} ${print_type(phi[2])} [${inputs}]`;
}

function print_line(line: HIGH.Line): string {
  switch (line[1]) {
    case "call":
      return `${line[0]} = ${line[1]} ${print_type(line[2])} ${line[3]} ${
        print_input_list(line[4])
      }`;
    case "constant":
      return `${line[0]} = ${line[1]} ${print_type(line[2])} ${
        print_primitive(line[3])
      }`;
    case "copy":
    case "own":
      return `${line[0]} = ${line[1]} ${print_type(line[2])} ${
        print_input(line[3])
      }`;
    case "borrow":
    case "load":
      return `${line[0]} = ${line[1]} ${print_type(line[2])} ${line[3]}`;
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
      return `${line[0]} = ${line[1]} ${print_type(line[2])} ${
        print_input(line[3])
      } ${print_input(line[4])}`;
    case "negate":
      return `${line[0]} = ${line[1]} ${print_type(line[2])} ${
        print_input(line[3])
      }`;
    default:
      return assert_never(line);
  }
}

function print_terminator(terminator: HIGH.Terminator): string {
  switch (terminator[1]) {
    case "jump":
      return `${terminator[1]} ${terminator[3]}`;
    case "branch":
      return `${terminator[1]} ${print_input(terminator[3])} ${
        terminator[4][0]
      } ${terminator[4][1]}`;
    case "return":
      return `${terminator[1]} ${print_type(terminator[2])} ${
        print_input(terminator[3])
      }`;
    default:
      return assert_never(terminator);
  }
}

function print_input(input: HIGH.Input): string {
  return input[0] === "consume" ? `(consume ${input[1]})` : input[0];
}

function print_input_list(inputs: readonly HIGH.Input[]): string {
  return `[${inputs.map(print_input).join(", ")}]`;
}

function print_param_list(params: readonly [Type, HIGH.Input][]): string {
  return `[${params.map(print_param).join(", ")}]`;
}

function print_param([type, input]: readonly [Type, HIGH.Input]): string {
  return `${print_type(type)} ${print_input(input)}`;
}

function print_type(type: Type): string {
  switch (type[0]) {
    case "Int":
      return "Int";
    case "Owned":
      return `(Owned ${print_type(type[1])})`;
    case "Borrowed":
      return `(Borrowed ${print_type(type[1])})`;
  }
}

function print_primitive(primitive: HIGH.Primitive): string {
  return String(primitive.value);
}

function assert_never(value: never): never {
  throw new Error(`Unhandled HIR variant: ${JSON.stringify(value)}`);
}
