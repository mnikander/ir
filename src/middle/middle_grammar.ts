// Copyright (c) 2026 Marco Nikander

// A middle intermediate representation (MIR) designed to simplify static analysis.

import { Type } from "../high/types.ts";
export type { Type } from "../high/types.ts";

export type Program      = [ tag: "program", ...Function[] ];
export type Function     = [ tag: "function", Parameters, Result, Locals, Blocks ];

export type Parameters   = [ tag: "parameters", ...Type[]];
export type Result       = [ tag: "result", Type ];
export type Locals       = [ tag: "locals", ...Type[]];
export type Blocks       = [ tag: "blocks", ...Block[]];
export type Block        = [ tag: "block", ...Line[]];
export type Arguments    = [ tag: "arguments", ...(Read | Move | Literal)[]];

export type Line         = Phi | Call | Memory | Arithmetic | Comparison | Terminator;
export type Memory       = Constant | Copy | Own | Borrow | Load | Drop;
export type Arithmetic   = Add | Subtract | Multiply | Divide | Remainder | Minimum | Maximum | Negative;
export type Comparison   = Equal | Unequal | Less | LessEqual | Greater | GreaterEqual;
export type Terminator   = Branch | Return;

export type Phi          = [ tag: 'phi',           destination: Define, inputs: Sources];
export type Call         = [ tag: 'call',          destination: Define, function: Label, arguments: Arguments ];
export type Constant     = [ tag: 'constant',      destination: Define, value: Literal ];
export type Copy         = [ tag: 'copy',          destination: Define, value: Read | Move ];
export type Own          = [ tag: 'own',           destination: Define, value: Read | Move ];
export type Borrow       = [ tag: 'borrow',        destination: Define, value: Read | Move ];
export type Load         = [ tag: 'load',          destination: Define, pointer: Read | Move ]; // dereference pointer and load the value
export type Drop         = [ tag: 'drop',          destination: Move ];
export type Add          = [ tag: 'add',           destination: Define, left: Read | Move | Literal, right: Read | Move | Literal ];
export type Subtract     = [ tag: 'subtract',      destination: Define, left: Read | Move | Literal, right: Read | Move | Literal ];
export type Multiply     = [ tag: 'multiply',      destination: Define, left: Read | Move | Literal, right: Read | Move | Literal ];
export type Divide       = [ tag: 'divide',        destination: Define, left: Read | Move | Literal, right: Read | Move | Literal ];
export type Remainder    = [ tag: 'remainder',     destination: Define, left: Read | Move | Literal, right: Read | Move | Literal ];
export type Minimum      = [ tag: 'minimum',       destination: Define, left: Read | Move | Literal, right: Read | Move | Literal ];
export type Maximum      = [ tag: 'maximum',       destination: Define, left: Read | Move | Literal, right: Read | Move | Literal ];
export type Negative     = [ tag: 'negate',        destination: Define, left: Read | Move | Literal ];
export type Equal        = [ tag: 'equal',         destination: Define, left: Read | Move | Literal, right: Read | Move | Literal ];
export type Unequal      = [ tag: 'unequal',       destination: Define, left: Read | Move | Literal, right: Read | Move | Literal ];
export type Less         = [ tag: 'less',          destination: Define, left: Read | Move | Literal, right: Read | Move | Literal ];
export type LessEqual    = [ tag: 'less_equal',    destination: Define, left: Read | Move | Literal, right: Read | Move | Literal ];
export type Greater      = [ tag: 'greater',       destination: Define, left: Read | Move | Literal, right: Read | Move | Literal ];
export type GreaterEqual = [ tag: 'greater_equal', destination: Define, left: Read | Move | Literal, right: Read | Move | Literal ];
export type Return       = [ tag: 'return',                             left: Read | Move | Literal ];
export type Branch       = [ tag: 'branch',        index:  Read | Move | Literal, blocks: Labels ];

export type Sources      = [ tag: "sources",       ...From[] ];
export type From         = [ tag: "from",          block: Label, resource: Read | Move | Literal ];
export type Define       = [ tag: "define",        resource: number ]; // define a Resource
export type Read         = [ tag: "read",          resource: number ]; // use the value of a Resource
export type Move         = [ tag: "move",          resource: number ]; // destructively move, i.e. consume, the Resource
export type Literal      = [ tag: "literal",       value: number ];
export type Label        = [ tag: "label",         id: number ];
export type Labels       = [ tag: "labels",        ...number[] ];

export enum Get {
    Tag       = 0,
    Dest      = 1,
    Left      = 2, // alias to first argument
    Right     = 3, // alias to second argument
}
