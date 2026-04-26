// Copyright (c) 2026 Marco Nikander

export type Program      = readonly Function[];
export type Function     = { name: Label,           params: Input[],      blocks: Block[] }; // TODO: should params just be Register[], or can a function require a move?
export type Block        = { name: Label,           phis: Phi[],          lines: Line[], terminator: Terminator };
export type Line         = Call | Memory | Arithmetic | Comparison;

export type Phi          = [ destination: Register, tag: 'phi',           inputs: [label: Label, value: Input][]];
export type Call         = [ destination: Register, tag: 'call',          label: Label, arguments: Input[] ];

export type Memory       = Constant | Copy | Own | Borrow | Load | Drop;
export type Constant     = [ destination: Register, tag: 'constant',      value: Primitive ];
export type Copy         = [ destination: Register, tag: 'copy',          value: Input ];
export type Own          = [ destination: Register, tag: 'own',           value: Input ];
// export type Heap         = [ destination: Register, tag: 'Heap',          value: Input ];
export type Borrow       = [ destination: Register, tag: 'borrow',        value: Register ];
export type Load         = [ destination: Register, tag: 'load',          pointer: Register ];
export type Drop         = [ destination: Register, tag: 'drop' ];

export type Arithmetic   = Add | Subtract | Multiply | Divide | Remainder | Minimum | Maximum | Negative;
export type Add          = [ destination: Register, tag: 'add',           left: Input, right: Input ];
export type Subtract     = [ destination: Register, tag: 'subtract',      left: Input, right: Input ];
export type Multiply     = [ destination: Register, tag: 'multiply',      left: Input, right: Input ];
export type Divide       = [ destination: Register, tag: 'divide',        left: Input, right: Input ];
export type Remainder    = [ destination: Register, tag: 'remainder',     left: Input, right: Input ];
export type Minimum      = [ destination: Register, tag: 'minimum',       left: Input, right: Input ];
export type Maximum      = [ destination: Register, tag: 'maximum',       left: Input, right: Input ];
export type Negative     = [ destination: Register, tag: 'negate',        left: Input ];

export type Comparison   = Equal | Unequal | Less | LessEqual | Greater | GreaterEqual;
export type Equal        = [ destination: Register, tag: 'equal',         left: Input, right: Input ];
export type Unequal      = [ destination: Register, tag: 'unequal',       left: Input, right: Input ];
export type Less         = [ destination: Register, tag: 'less',          left: Input, right: Input ];
export type LessEqual    = [ destination: Register, tag: 'less_equal',    left: Input, right: Input ];
export type Greater      = [ destination: Register, tag: 'greater',       left: Input, right: Input ];
export type GreaterEqual = [ destination: Register, tag: 'greater_equal', left: Input, right: Input ];

export type Terminator   = Jump | Branch | Return;
export type Jump         = [ destination: null,     tag: 'jump',          block: Label ];
export type Branch       = [ destination: null,     tag: 'branch',        condition: Input, block: [Label, Label] ];
export type Return       = [ destination: null,     tag: 'return',        left: Input ];

export type Input        = [Register] | ['consume', Register]; // could add support for immediate values later
export type Register     = `%${string}`;
export type Label        = `@${string}`;
export type Primitive    = { value: number };

export enum Get {
    Dest   = 0,
    Tag    = 1,
    Left   = 2, // alias to first argument
    Right  = 3, // alias to second argument
}
