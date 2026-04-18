// Copyright (c) 2026 Marco Nikander

export type Program      = readonly Function[];
export type Function     = { name: Label,           params: Input[],      blocks: Block[] };
export type Block        = { name: Label,           joins: Phi[],         lines: Line[], terminator: Terminator };
export type Line         = Call | Memory | Arithmetic | Comparison;

export type Phi          = [ destination: Register, tag: 'Phi',           inputs: [label: Label, value: Input][]];
export type Call         = [ destination: Register, tag: 'Call',          label: Label, arguments: Input[] ];

export type Memory       = Constant | Assign | Stack | Heap | Borrow | Load | Drop;
export type Constant     = [ destination: Register, tag: 'Constant',      value: Primitive ];
export type Assign       = [ destination: Register, tag: 'Assign',        value: Input ];
export type Stack        = [ destination: Register, tag: 'Stack',         value: Input ];
export type Heap         = [ destination: Register, tag: 'Heap',          value: Input ];
export type Borrow       = [ destination: Register, tag: 'Borrow',        pointer: Register ];
export type Load         = [ destination: Register, tag: 'Load',          pointer: Register ];
export type Drop         = [ destination: null,     tag: 'Drop',          value: Register ];

export type Arithmetic   = Add | Subtract | Multiply | Divide | Remainder | Minimum | Maximum | Negative;
export type Add          = [ destination: Register, tag: 'Add',           left: Input, right: Input ];
export type Subtract     = [ destination: Register, tag: 'Subtract',      left: Input, right: Input ];
export type Multiply     = [ destination: Register, tag: 'Multiply',      left: Input, right: Input ];
export type Divide       = [ destination: Register, tag: 'Divide',        left: Input, right: Input ];
export type Remainder    = [ destination: Register, tag: 'Remainder',     left: Input, right: Input ];
export type Minimum      = [ destination: Register, tag: 'Minimum',       left: Input, right: Input ];
export type Maximum      = [ destination: Register, tag: 'Maximum',       left: Input, right: Input ];
export type Negative     = [ destination: Register, tag: 'Negate',        left: Input ];

export type Comparison   = Equal | Unequal | Less | LessEqual | Greater | GreaterEqual;
export type Equal        = [ destination: Register, tag: 'Equal',         left: Input, right: Input ];
export type Unequal      = [ destination: Register, tag: 'Unequal',       left: Input, right: Input ];
export type Less         = [ destination: Register, tag: 'Less',          left: Input, right: Input ];
export type LessEqual    = [ destination: Register, tag: 'LessEqual',     left: Input, right: Input ];
export type Greater      = [ destination: Register, tag: 'Greater',       left: Input, right: Input ];
export type GreaterEqual = [ destination: Register, tag: 'GreaterEqual',  left: Input, right: Input ];

export type Terminator   = Jump | Branch | Return;
export type Jump         = [ destination: null,     tag: 'Jump',          block: Label ];
export type Branch       = [ destination: null,     tag: 'Branch',        condition: Input, block: [Label, Label] ];
export type Return       = [ destination: null,     tag: 'Return',        left: Input ];

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
