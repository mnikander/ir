// Copyright (c) 2026 Marco Nikander

// This "new grammar" is a brainstorm for how the high grammar could look in the future.
// The codebase can be update by gradually refactoring the high grammar to match this grammar.

import { Type } from "./types.ts";
export type { Type } from "./types.ts";

export type Program      = readonly Function[];

export type Function     = [ tag: "function", Param[], Return, Local[], Block[]];
export type Param        = [ tag: "param", Type ];
export type Result       = [ tag: "result", Type ];
export type Local        = [ tag: "local", Type ];
export type Block        = [ tag: "block", Line[] ];

export type Line         = Phi | Call | Memory | Arithmetic | Comparison | Terminator;
export type Memory       = Constant | Copy | Own | Borrow | Load | Drop;
export type Arithmetic   = Add | Subtract | Multiply | Divide | Remainder | Minimum | Maximum | Negative;
export type Comparison   = Equal | Unequal | Less | LessEqual | Greater | GreaterEqual;
export type Terminator   = Branch | Return;

export type Phi          = [ tag: 'phi',           destination: Define, inputs: Source[]];
export type Call         = [ tag: 'call',          destination: Define, function: Label, arguments: Read | Move[] ];
export type Constant     = [ tag: 'constant',      destination: Define, value: Literal ];
export type Copy         = [ tag: 'copy',          destination: Define, value: Read | Move ];
export type Own          = [ tag: 'own',           destination: Define, value: Read | Move ];
export type Borrow       = [ tag: 'borrow',        destination: Define, value: Read | Move ];
export type Load         = [ tag: 'load',          destination: Define, pointer: Read | Move ]; // dereference pointer and load the value
export type Drop         = [ tag: 'drop',          destination: Move ];
export type Add          = [ tag: 'add',           destination: Define, left: Read | Move, right: Read | Move ];
export type Subtract     = [ tag: 'subtract',      destination: Define, left: Read | Move, right: Read | Move ];
export type Multiply     = [ tag: 'multiply',      destination: Define, left: Read | Move, right: Read | Move ];
export type Divide       = [ tag: 'divide',        destination: Define, left: Read | Move, right: Read | Move ];
export type Remainder    = [ tag: 'remainder',     destination: Define, left: Read | Move, right: Read | Move ];
export type Minimum      = [ tag: 'minimum',       destination: Define, left: Read | Move, right: Read | Move ];
export type Maximum      = [ tag: 'maximum',       destination: Define, left: Read | Move, right: Read | Move ];
export type Negative     = [ tag: 'negate',        destination: Define, left: Read | Move ];
export type Equal        = [ tag: 'equal',         destination: Define, left: Read | Move, right: Read | Move ];
export type Unequal      = [ tag: 'unequal',       destination: Define, left: Read | Move, right: Read | Move ];
export type Less         = [ tag: 'less',          destination: Define, left: Read | Move, right: Read | Move ];
export type LessEqual    = [ tag: 'less_equal',    destination: Define, left: Read | Move, right: Read | Move ];
export type Greater      = [ tag: 'greater',       destination: Define, left: Read | Move, right: Read | Move ];
export type GreaterEqual = [ tag: 'greater_equal', destination: Define, left: Read | Move, right: Read | Move ];
export type Return       = [ tag: 'return',                             left: Read | Move ];
export type Branch       = [ tag: 'branch',        index:  Read | Move, blocks: Label[] ];

export type Source       = [ tag: "from",          source_block: Label, source_register: Read | Move ];
export type Define       = [ tag: "define",        resource: number ]; // define a Resource
export type Read         = [ tag: "read",          resource: number ]; // use the value of a Resource
export type Move         = [ tag: "move",          resource: number ]; // destructively move, i.e. consume, the Resource
export type Literal      = [ tag: "literal",       value: number ];
export type Label        = [ tag: "label",         id: number ];

export enum Get {
    Tag       = 0,
    Dest      = 1,
    Left      = 2, // alias to first argument
    Right     = 3, // alias to second argument
}
