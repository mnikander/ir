// Copyright (c) 2026 Marco Nikander

export type Program      = readonly Function[];
export type Function     = { func: Label,           params: Register[],   blocks: Block[] };
export type Block        = { block: Label,          joins: Phi[],         lines: Line[], terminator: Terminator };

export type Phi          = [ destination: Register, tag: 'Phi',           inputs: [label: Label, source: Register][] ];
export type Call         = [ destination: Register, tag: 'Call',          label: Label, arguments: Register[] ];

export type Misc         = Const | Copy | Move | AddressOf | Load;
export type Const        = [ destination: Register, tag: 'Constant',      constant: Primitive ]; // TODO: replace with more flexible 'Define'
export type Copy         = [ destination: Register, tag: 'Copy',          source: Register ]; // TODO: replace with more flexible 'Define'
export type Move         = [ destination: Register, tag: 'Move',          source: Register ]; // TODO: replace with inline access-modifier
export type AddressOf    = [ destination: Register, tag: 'AddressOf',     source: Register ]; // TODO: replace with pointer operations

export type Line         = Call | Memory | Arithmetic | Comparison | Misc;

export type Memory       = Drop;
// export type Ownership    = Define | Stack | Heap | Borrow | Dereference | Update | Drop;
// export type Define       = [ destination: Register, tag: 'Define',        source: Register ];
// export type Stack        = [ destination: Register, tag: 'Stack',         source: Register ];
// export type Heap         = [ destination: Register, tag: 'Heap',          source: Register ];
// export type Borrow       = [ destination: Register, tag: 'Borrow',        pointer: Register ];
export type Load         = [ destination: Register, tag: 'Load',          pointer: Register ];
// export type Update       = [ destination: Register, tag: 'Update',        pointer: Register, source: Register ];
export type Drop         = [ destination: null,     tag: 'Drop',          source: Register ];

export type Arithmetic   = Add | Subtract | Multiply | Divide | Remainder | Minimum | Maximum | Negative;
export type Add          = [ destination: Register, tag: 'Add',           left: Register, right: Register ];
export type Subtract     = [ destination: Register, tag: 'Subtract',      left: Register, right: Register ];
export type Multiply     = [ destination: Register, tag: 'Multiply',      left: Register, right: Register ];
export type Divide       = [ destination: Register, tag: 'Divide',        left: Register, right: Register ];
export type Remainder    = [ destination: Register, tag: 'Remainder',     left: Register, right: Register ];
export type Minimum      = [ destination: Register, tag: 'Minimum',       left: Register, right: Register ];
export type Maximum      = [ destination: Register, tag: 'Maximum',       left: Register, right: Register ];
export type Negative     = [ destination: Register, tag: 'Negate',        left: Register ];

export type Comparison   = Equal | Unequal | Less | LessEqual | Greater | GreaterEqual;
export type Equal        = [ destination: Register, tag: 'Equal',         left: Register, right: Register ];
export type Unequal      = [ destination: Register, tag: 'Unequal',       left: Register, right: Register ];
export type Less         = [ destination: Register, tag: 'Less',          left: Register, right: Register ];
export type LessEqual    = [ destination: Register, tag: 'LessEqual',     left: Register, right: Register ];
export type Greater      = [ destination: Register, tag: 'Greater',       left: Register, right: Register ];
export type GreaterEqual = [ destination: Register, tag: 'GreaterEqual',  left: Register, right: Register ];

export type Terminator   = Jump | Branch | Return | Exit;
export type Jump         = [ destination: null,     tag: 'Jump',          block: Label ];
export type Branch       = [ destination: null,     tag: 'Branch',        condition: Register, block: [Label, Label] ];
export type Return       = [ destination: null,     tag: 'Return',        left: Register ];
export type Exit         = [ destination: null,     tag: 'Exit',          left: Register ];

export type Value        = { tag: 'Value', value: Primitive };
export type Reference    = { tag: 'Reference', value: Register };
export type Register     = `%${string}`;
export type Label        = `@${string}`;
export type Primitive    = boolean | number;

export enum Get {
    Dest  = 0,
    Tag   = 1,
    Left  = 2, // alias to first argument
    Right = 3, // alias to second argument
}
