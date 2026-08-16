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

export type Phi          = [ tag: 'phi',           destination: Slot, inputs: Source[]];
export type Call         = [ tag: 'call',          destination: Slot, function: FunctionId, arguments: Slot[] ];
export type Constant     = [ tag: 'constant',      destination: Slot, value: Literal ];
export type Copy         = [ tag: 'copy',          destination: Slot, value: Slot ];
export type Own          = [ tag: 'own',           destination: Slot, value: Slot ];
export type Borrow       = [ tag: 'borrow',        destination: Slot, value: Slot ];
export type Load         = [ tag: 'load',          destination: Slot, pointer: Slot ];
export type Drop         = [ tag: 'drop',          destination: Slot ];
export type Add          = [ tag: 'add',           destination: Slot, left: Slot, right: Slot ];
export type Subtract     = [ tag: 'subtract',      destination: Slot, left: Slot, right: Slot ];
export type Multiply     = [ tag: 'multiply',      destination: Slot, left: Slot, right: Slot ];
export type Divide       = [ tag: 'divide',        destination: Slot, left: Slot, right: Slot ];
export type Remainder    = [ tag: 'remainder',     destination: Slot, left: Slot, right: Slot ];
export type Minimum      = [ tag: 'minimum',       destination: Slot, left: Slot, right: Slot ];
export type Maximum      = [ tag: 'maximum',       destination: Slot, left: Slot, right: Slot ];
export type Negative     = [ tag: 'negate',        destination: Slot, left: Slot ];
export type Equal        = [ tag: 'equal',         destination: Slot, left: Slot, right: Slot ];
export type Unequal      = [ tag: 'unequal',       destination: Slot, left: Slot, right: Slot ];
export type Less         = [ tag: 'less',          destination: Slot, left: Slot, right: Slot ];
export type LessEqual    = [ tag: 'less_equal',    destination: Slot, left: Slot, right: Slot ];
export type Greater      = [ tag: 'greater',       destination: Slot, left: Slot, right: Slot ];
export type GreaterEqual = [ tag: 'greater_equal', destination: Slot, left: Slot, right: Slot ];
export type Branch       = [ tag: 'branch',        index:  Slot,      blocks: BlockId[] ];
export type Return       = [ tag: 'return',        target: Slot ];

export type Source       = [ tag: "from",          source_block: BlockId, source_register: Slot ];
export type Slot         = [ tag: "access", slot: number ] | [ tag: "consume", slot: number ];
export type Literal      = [ tag: "literal", value: number ];
export type FunctionId   = [ tag: "function_id", number ];
export type BlockId      = [ tag: "block_id", number ];

export enum Get {
    Tag       = 0,
    Dest      = 1,
    Left      = 2, // alias to first argument
    Right     = 3, // alias to second argument
}
