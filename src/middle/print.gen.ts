// Copyright (c) 2026 Marco Nikander

import * as MIR from "./middle_grammar.ts";
import type { Type } from "../high/types.ts";

export function print(program: MIR.Program): string {
  return `\n${print_program(program)}\n`;
}

function print_program([, ...functions]: MIR.Program): string {
  if (functions.length === 0) return "(program)";
  return `(program\n${
    functions.map((fun) => indent(print_function(fun))).join("\n")
  })`;
}

function print_function(
  [, parameters, result, locals, blocks]: MIR.Function,
): string {
  return [
    "(function",
    indent(print_parameters(parameters)),
    indent(print_result(result)),
    indent(print_locals(locals)),
    indent(print_blocks(blocks)),
  ].join("\n") + ")";
}

function print_parameters([, ...types]: MIR.Parameters): string {
  return print_list("parameters", types.map(print_type));
}

function print_result([, type]: MIR.Result): string {
  return `(result ${print_type(type)})`;
}

function print_locals([, ...types]: MIR.Locals): string {
  return print_list("locals", types.map(print_type));
}

function print_blocks([, ...blocks]: MIR.Blocks): string {
  if (blocks.length === 0) return "(blocks)";
  return `(blocks\n${
    blocks.map((block) => indent(print_block(block))).join("\n")
  })`;
}

function print_block([, ...lines]: MIR.Block): string {
  if (lines.length === 0) return "(block)";
  return `(block\n${lines.map((line) => indent(print_line(line))).join("\n")})`;
}

function print_line(line: MIR.Line): string {
  switch (line[0]) {
    case "phi":
      return print_list("phi", [
        print_let(line[1]),
        print_sources(line[2]),
      ]);
    case "call":
      return print_list("call", [
        print_let(line[1]),
        print_function_id(line[2]),
        print_arguments(line[3]),
      ]);
    case "constant":
      return print_list("constant", [
        print_let(line[1]),
        print_literal(line[2]),
      ]);
    case "copy":
    case "own":
    case "borrow":
    case "load":
      return print_list(line[0], [print_let(line[1]), print_input(line[2])]);
    case "drop":
      return print_list("drop", [print_move(line[1])]);
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
      return print_list(line[0], [
        print_let(line[1]),
        print_input(line[2]),
        print_input(line[3]),
      ]);
    case "negate":
      return print_list("negate", [
        print_let(line[1]),
        print_input(line[2]),
      ]);
    case "return":
      return print_list("return", [print_input(line[1])]);
    case "branch":
      return print_list("branch", [
        print_input(line[1]),
        print_block_id(line[2]),
        print_block_id(line[3]),
      ]);
    case "jump":
      return print_list("jump", [print_block_id(line[1])]);
    default:
      return assert_never(line);
  }
}

function print_arguments([, ...arguments_]: MIR.Arguments): string {
  return print_list("arguments", arguments_.map(print_input));
}

function print_sources([, ...sources]: MIR.Sources): string {
  return print_list("sources", sources.map(print_source));
}

function print_source([, block, register]: MIR.From): string {
  return print_list("from", [print_block_id(block), print_input(register)]);
}

function print_input(input: MIR.Read | MIR.Move | MIR.Literal): string {
  switch (input[0]) {
    case "read":
      return print_read(input);
    case "move":
      return print_move(input);
    case "literal":
      return print_literal(input);
    default:
      return assert_never(input);
  }
}

function print_let([, resource]: MIR.Let): string {
  return `(let ${resource})`;
}

function print_read([, resource]: MIR.Read): string {
  return `(read ${resource})`;
}

function print_move([, resource]: MIR.Move): string {
  return `(move ${resource})`;
}

function print_literal([, value]: MIR.Literal): string {
  return `(literal ${value})`;
}

function print_function_id([, id]: MIR.FunctionId): string {
  return `(function_id ${id})`;
}

function print_block_id([, id]: MIR.BlockId): string {
  return `(block_id ${id})`;
}

function print_type(type: Type): string {
  switch (type[0]) {
    case "Int":
      return "Int";
    case "Owned":
      return `(Owned ${print_type(type[1])})`;
    case "Borrowed":
      return `(Borrowed ${print_type(type[1])})`;
    default:
      return assert_never(type);
  }
}

function print_list(tag: string, values: string[]): string {
  return values.length === 0 ? `(${tag})` : `(${tag} ${values.join(" ")})`;
}

function indent(text: string): string {
  return text.split("\n").map((line) => `  ${line}`).join("\n");
}

function assert_never(value: never): never {
  throw new Error(`Unhandled MIR variant: ${JSON.stringify(value)}`);
}
