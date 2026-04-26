// Copyright (c) 2026 Marco Nikander

import { Borrowed, Int, Owned, Type } from "./types.ts";
export type { Borrowed, Int, Owned, Type } from "./types.ts";

export type Program      = readonly Function[];
export type Function     = { name: Label,           params: [Type, Input][], type: Type, blocks: Block[] }; // TODO: should params just be Register instead of Input, or can a function require a move?
export type Block        = { name: Label,           phis: Phi[], lines: Line[], terminator: Terminator };
export type Line         = Call | Memory | Arithmetic | Comparison;

export type Phi          = [ destination: Register, tag: 'phi',           type: Type, inputs: [label: Label, value: Input][]];
export type Call         = [ destination: Register, tag: 'call',          type: Type, label: Label, arguments: Input[] ];

export type Memory       = Constant | Copy | Own | Borrow | Load | Drop;
export type Constant     = [ destination: Register, tag: 'constant',      type: Int,  value: Primitive ];
export type Copy         = [ destination: Register, tag: 'copy',          type: Type, value: Input ];
export type Own          = [ destination: Register, tag: 'own',           type: Owned, value: Input ];
// export type Heap         = [ destination: Register, tag: 'Heap',          type: Type, value: Input ];
export type Borrow       = [ destination: Register, tag: 'borrow',        type: Borrowed, value: Register ];
export type Load         = [ destination: Register, tag: 'load',          type: Type, pointer: Register ];
export type Drop         = [ destination: Register, tag: 'drop',          type: null ];

export type Arithmetic   = Add | Subtract | Multiply | Divide | Remainder | Minimum | Maximum | Negative;
export type Add          = [ destination: Register, tag: 'add',           type: Int,  left: Input, right: Input ];
export type Subtract     = [ destination: Register, tag: 'subtract',      type: Int,  left: Input, right: Input ];
export type Multiply     = [ destination: Register, tag: 'multiply',      type: Int,  left: Input, right: Input ];
export type Divide       = [ destination: Register, tag: 'divide',        type: Int,  left: Input, right: Input ];
export type Remainder    = [ destination: Register, tag: 'remainder',     type: Int,  left: Input, right: Input ];
export type Minimum      = [ destination: Register, tag: 'minimum',       type: Int,  left: Input, right: Input ];
export type Maximum      = [ destination: Register, tag: 'maximum',       type: Int,  left: Input, right: Input ];
export type Negative     = [ destination: Register, tag: 'negate',        type: Int,  left: Input ];

export type Comparison   = Equal | Unequal | Less | LessEqual | Greater | GreaterEqual;
export type Equal        = [ destination: Register, tag: 'equal',         type: Int,  left: Input, right: Input ];
export type Unequal      = [ destination: Register, tag: 'unequal',       type: Int,  left: Input, right: Input ];
export type Less         = [ destination: Register, tag: 'less',          type: Int,  left: Input, right: Input ];
export type LessEqual    = [ destination: Register, tag: 'less_equal',    type: Int,  left: Input, right: Input ];
export type Greater      = [ destination: Register, tag: 'greater',       type: Int,  left: Input, right: Input ];
export type GreaterEqual = [ destination: Register, tag: 'greater_equal', type: Int,  left: Input, right: Input ];

export type Terminator   = Jump | Branch | Return;
export type Jump         = [ destination: null,     tag: 'jump',          type: null, block: Label ];
export type Branch       = [ destination: null,     tag: 'branch',        type: null, condition: Input, block: [Label, Label] ];
export type Return       = [ destination: null,     tag: 'return',        type: Type, left: Input ];

export type Input        = [Register] | ['consume', Register]; // could add support for immediate values later
export type Register     = `%${string}`;
export type Label        = `@${string}`;
export type Primitive    = { value: number };

export enum Get {
    Dest   = 0,
    Tag    = 1,
    Type   = 2,
    Left   = 3, // alias to first argument
    Right  = 4, // alias to second argument
}
