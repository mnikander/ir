// Copyright (c) 2026 Marco Nikander

export type Program      = readonly Instruction[];

export type Instruction  = Noop | Memory | Arithmetic | Comparison | Control;

export type Noop         = [ destination: null,   tag: 'noop',          note?: string ];

export type Memory       = Constant | Copy | Load | Store | AddressOf | Drop;
export type Constant     = [ destination: Offset, tag: 'constant',      value:  Primitive ];
export type Copy         = [ destination: Offset, tag: 'copy',          source: Offset ];
export type Load         = [ destination: Offset, tag: 'load',          source: Offset ];
export type Store        = [ destination: Offset ,tag: 'store',         source: Offset ];
export type AddressOf    = [ destination: Offset, tag: 'address_of',    source: Offset ];
export type Drop         = [ destination: Offset, tag: 'drop',          note?: string ];

export type Arithmetic   = Add | Subtract | Multiply | Divide | Remainder | Minimum | Maximum | Negative;
export type Add          = [ destination: Offset, tag: 'add',           left: Offset, right: Offset ];
export type Subtract     = [ destination: Offset, tag: 'subtract',      left: Offset, right: Offset ];
export type Multiply     = [ destination: Offset, tag: 'multiply',      left: Offset, right: Offset ];
export type Divide       = [ destination: Offset, tag: 'divide',        left: Offset, right: Offset ];
export type Remainder    = [ destination: Offset, tag: 'remainder',     left: Offset, right: Offset ];
export type Minimum      = [ destination: Offset, tag: 'minimum',       left: Offset, right: Offset ];
export type Maximum      = [ destination: Offset, tag: 'maximum',       left: Offset, right: Offset ];
export type Negative     = [ destination: Offset, tag: 'negate',        left: Offset ];

export type Comparison   = Equal | Unequal | Less | LessEqual | Greater | GreaterEqual;
export type Equal        = [ destination: Offset, tag: 'equal',         left: Offset, right: Offset ];
export type Unequal      = [ destination: Offset, tag: 'unequal',       left: Offset, right: Offset ];
export type Less         = [ destination: Offset, tag: 'less',          left: Offset, right: Offset ];
export type LessEqual    = [ destination: Offset, tag: 'less_equal',    left: Offset, right: Offset ];
export type Greater      = [ destination: Offset, tag: 'greater',       left: Offset, right: Offset ];
export type GreaterEqual = [ destination: Offset, tag: 'greater_equal', left: Offset, right: Offset ];

export type Control      = Jump | Branch | Call | Return;
export type Jump         = [ destination: null,   tag: 'jump',          target: LineNumber ];
export type Branch       = [ destination: null,   tag: 'branch',        condition: Offset, targets: [LineNumber, LineNumber] ];
export type Call         = [ destination: Offset, tag: 'call',          target: LineNumber, arguments: Offset[],  note: string ];
export type Return       = [ destination: null,   tag: 'return',        source: Offset ];

export enum Get {
  Dest   = 0,
  Tag    = 1,
  Left   = 2, // alias to first argument
  Right  = 3, // alias to second argument
}

export type Primitive = { value: number };
export type Offset = number;
export type LineNumber = { line: number };
