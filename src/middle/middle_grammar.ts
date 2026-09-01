// Copysecond (c) 2026 Marco Nikander

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

export type Line         = Let | Drop | Terminator;
export type Operation    = Phi | Call | Memory | Copy | Arithmetic | Comparison;
export type Memory       = Own | Borrow | Dereference;
export type Arithmetic   = Add | Subtract | Multiply | Divide | Remainder | Minimum | Maximum | Negative;
export type Comparison   = Equal | Unequal | Less | LessEqual | Greater | GreaterEqual;
export type Terminator   = Return | Jump | Branch;
export type Operand      = Access | Consume | Literal;

export type Let          = [ tag: "let",           resource: number, value: Operation ]; // define a Resource
export type Drop         = [ tag: "drop",          resource: number ];
export type Return       = [ tag: "return",        Operand ];
export type Jump         = [ tag: "jump",          targetBlock: BlockId ];
export type Branch       = [ tag: "branch",        condition: Operand, thenBlock: BlockId, elseBlock: BlockId ];
export type Phi          = [ tag: "phi",           inputs: Sources];
export type Call         = [ tag: "call",          function: FunctionId, arguments: Arguments ];
export type Own          = [ tag: "own",           Access | Consume ]; // cannot be lowered yet, LIR is missing the corresponding functionality
export type Borrow       = [ tag: "borrow",        Access | Consume ]; // take the address of a resource and create a read-only pointer
export type Dereference  = [ tag: "dereference",   Access | Consume ]; // dereference pointer and load the value
export type Copy         = [ tag: "copy",          Operand ];
export type Add          = [ tag: "add",           Operand, Operand ];
export type Subtract     = [ tag: "subtract",      Operand, Operand ];
export type Multiply     = [ tag: "multiply",      Operand, Operand ];
export type Divide       = [ tag: "divide",        Operand, Operand ];
export type Remainder    = [ tag: "remainder",     Operand, Operand ];
export type Minimum      = [ tag: "minimum",       Operand, Operand ];
export type Maximum      = [ tag: "maximum",       Operand, Operand ];
export type Negative     = [ tag: "negate",        Operand ];
export type Equal        = [ tag: "equal",         Operand, Operand ];
export type Unequal      = [ tag: "unequal",       Operand, Operand ];
export type Less         = [ tag: "less",          Operand, Operand ];
export type LessEqual    = [ tag: "less_equal",    Operand, Operand ];
export type Greater      = [ tag: "greater",       Operand, Operand ];
export type GreaterEqual = [ tag: "greater_equal", Operand, Operand ];

export type Access       = [ tag: "access",        resource: number ]; // read the value of a Resource
export type Consume      = [ tag: "consume",       resource: number ]; // destructively move a Resource
export type Literal      = [ tag: "literal",       value: number ];
export type Arguments    = [ tag: "arguments",     ...Operand[]];
export type Sources      = [ tag: "sources",       ...From[] ];
export type From         = [ tag: "from",          block: BlockId, resource: Operand ];
export type FunctionId   = [ tag: "function_id",   index: number ];
export type BlockId      = [ tag: "block_id",      index: number ];

export enum Get {
    Tag       = 0,
    First     = 1, // alias to first value argument
    Second    = 2, // alias to second value argument
}
