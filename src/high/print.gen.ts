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
    ...block.joins.map(print_phi),
    ...block.lines.map(print_line),
    print_terminator(block.terminator),
  ].map((line) => `    ${line}`);

  return [`  block ${block.name}:`, ...body].join("\n");
}

function print_phi(phi: HIGH.Phi): string {
  const inputs = phi[2].map(([label, input]) =>
    `[${label} ${print_input(input)}]`
  ).join(" ");
  return `${phi[0]} = ${print_tag(phi[1])} [${inputs}]`;
}

function print_line(line: HIGH.Line): string {
  switch (line[1]) {
    case "Call":
      return `${line[0]} = ${print_tag(line[1])} ${line[2]} ${
        print_input_list(line[3])
      }`;
    case "Constant":
      return `${line[0]} = ${print_tag(line[1])} ${print_primitive(line[2])}`;
    case "Copy":
    case "Own":
      return `${line[0]} = ${print_tag(line[1])} ${print_input(line[2])}`;
    case "Borrow":
    case "Load":
      return `${line[0]} = ${print_tag(line[1])} ${line[2]}`;
    case "Drop":
      return `${line[0]} = ${print_tag(line[1])}`;
    case "Add":
    case "Subtract":
    case "Multiply":
    case "Divide":
    case "Remainder":
    case "Minimum":
    case "Maximum":
    case "Equal":
    case "Unequal":
    case "Less":
    case "LessEqual":
    case "Greater":
    case "GreaterEqual":
      return `${line[0]} = ${print_tag(line[1])} ${print_input(line[2])} ${
        print_input(line[3])
      }`;
    case "Negate":
      return `${line[0]} = ${print_tag(line[1])} ${print_input(line[2])}`;
    default:
      return assert_never(line);
  }
}

function print_terminator(terminator: HIGH.Terminator): string {
  switch (terminator[1]) {
    case "Jump":
      return `${print_tag(terminator[1])} ${terminator[2]}`;
    case "Branch":
      return `${print_tag(terminator[1])} ${print_input(terminator[2])} ${
        terminator[3][0]
      } ${terminator[3][1]}`;
    case "Return":
      return `${print_tag(terminator[1])} ${print_input(terminator[2])}`;
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

function print_tag(tag: string): string {
  return tag.toLowerCase();
}

function assert_never(value: never): never {
  throw new Error(`Unhandled HIR variant: ${JSON.stringify(value)}`);
}
