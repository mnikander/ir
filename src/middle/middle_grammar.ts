// Copyright (c) 2026 Marco Nikander

// A middle intermediate representation (MIR) designed for easy analysis.

import { Type } from "../high/types.ts";
export type { Type } from "../high/types.ts";

export type Program      = [ tag: "program", ...Function[] ];
export type Function     = [ tag: "function", Parameters, Result, Locals, Blocks ];

export type Parameters   = [ tag: "parameters", ...Type[]];
export type Result       = [ tag: "result", Type ];
export type Locals       = [ tag: "locals", ...Type[]];
export type Blocks       = [ tag: "blocks", ...Block[]];
export type Block        = [ tag: "block", ...Line[]];
export type Arguments    = [ tag: "arguments", ...(Operand)[]];

export type Line         = Let | Drop | Terminator;
export type Value        = Phi | Call | Memory | Arithmetic | Comparison;
export type Memory       = Constant | Copy | Own | Borrow | Load;
export type Arithmetic   = Add | Subtract | Multiply | Divide | Remainder | Minimum | Maximum | Negative;
export type Comparison   = Equal | Unequal | Less | LessEqual | Greater | GreaterEqual;
export type Terminator   = Return | Jump | Branch;
export type Operand      = Read | Move | Literal;

export type Let          = [ tag: "let",           resource: number, value: Value ]; // define a Resource
export type Drop         = [ tag: 'drop',          source: Move ];
export type Return       = [ tag: 'return',        source: Operand ];
export type Jump         = [ tag: 'jump',          target: BlockId ];
export type Branch       = [ tag: 'branch',        condition: Operand, thenBlock: BlockId, elseBlock: BlockId ];

export type Phi          = [ tag: 'phi',           inputs: Sources];
export type Call         = [ tag: 'call',          function: FunctionId, arguments: Arguments ];
export type Constant     = [ tag: 'constant',      value: Literal ];
export type Copy         = [ tag: 'copy',          value: Read | Move ];
export type Own          = [ tag: 'own',           value: Read | Move ]; // cannot be lowered yet, LIR is missing the corresponding functionality
export type Borrow       = [ tag: 'borrow',        value: Read | Move ]; // take the address of a resource and create a read-only pointer
export type Load         = [ tag: 'load',          pointer: Read | Move ]; // dereference pointer and load the value
export type Add          = [ tag: 'add',           left: Operand, right: Operand ];
export type Subtract     = [ tag: 'subtract',      left: Operand, right: Operand ];
export type Multiply     = [ tag: 'multiply',      left: Operand, right: Operand ];
export type Divide       = [ tag: 'divide',        left: Operand, right: Operand ];
export type Remainder    = [ tag: 'remainder',     left: Operand, right: Operand ];
export type Minimum      = [ tag: 'minimum',       left: Operand, right: Operand ];
export type Maximum      = [ tag: 'maximum',       left: Operand, right: Operand ];
export type Negative     = [ tag: 'negate',        left: Operand ];
export type Equal        = [ tag: 'equal',         left: Operand, right: Operand ];
export type Unequal      = [ tag: 'unequal',       left: Operand, right: Operand ];
export type Less         = [ tag: 'less',          left: Operand, right: Operand ];
export type LessEqual    = [ tag: 'less_equal',    left: Operand, right: Operand ];
export type Greater      = [ tag: 'greater',       left: Operand, right: Operand ];
export type GreaterEqual = [ tag: 'greater_equal', left: Operand, right: Operand ];

export type Sources      = [ tag: "sources",       ...From[] ];
export type From         = [ tag: "from",          block: BlockId, resource: Operand ];
export type Read         = [ tag: "read",          resource: number ]; // use the value of a Resource
export type Move         = [ tag: "move",          resource: number ]; // destructively move, i.e. consume, the Resource
export type Literal      = [ tag: "literal",       value: number ];
export type FunctionId   = [ tag: "function_id",   id: number ];
export type BlockId      = [ tag: "block_id",      id: number ];
export type BlockIds     = [ tag: "block_ids",     ...number[] ];

export enum Get {
    Tag       = 0,
    Resource  = 1,
    Value     = 2,
    Left      = 1, // alias to first value argument
    Right     = 2, // alias to second value argument
}
