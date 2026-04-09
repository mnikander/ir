// Copyright (c) 2025 Marco Nikander

export type Program      = readonly Instruction[];
export type Instruction  = Line | Misc | Function | Block | Phi | Call | Terminator;
export type Function     = [ destination: null,     tag: 'Function',      block: Label, parameters: Register[] ];
export type Block        = [ destination: null,     tag: 'Block',         block: Label ];

export type Phi          = [ destination: Register, tag: 'Phi',           inputs: [label: Label, source: Register][] ];
export type Call         = [ destination: Register, tag: 'Call',          label: Label, arguments: Register[] ];

export type Misc         = Const | Copy | Move | Ref | Deref ;
export type Const        = [ destination: Register, tag: 'Const',         constant: Primitive ]; // TODO: replace with inline literals
export type Copy         = [ destination: Register, tag: 'Copy',          source: Register ]; // TODO: remove
export type Move        =  [ destination: Register, tag: 'Move',          source: Register ]; // TODO: replace with an inline specifier
export type Ref          = [ destination: Register, tag: 'Ref',           source: Register ]; // TODO: replace with pointer operations
export type Deref        = [ destination: Register, tag: 'Deref',         source: Register ]; // TODO: replace with pointer operations

export type Line         = Call | Ownership | Arithmetic | Comparison;

export type Ownership    = Drop;
// export type Ownership    = Define | Stack | Heap | Borrow | Dereference | Update | Drop;
// export type Define       = [ destination: Register, tag: 'Define',        source: Register ];
// export type Stack        = [ destination: Register, tag: 'Stack',         source: Register ];
// export type Heap         = [ destination: Register, tag: 'Heap',          source: Register ];
// export type Borrow       = [ destination: Register, tag: 'Borrow',        pointer: Register ];
// export type Dereference  = [ destination: Register, tag: 'Dereference',   pointer: Register ];
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
