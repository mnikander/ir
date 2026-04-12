// Copyright (c) 2026 Marco Nikander

export type Program      = readonly Instruction[];

export type Instruction  = Noop | Memory | Arithmetic | Comparison | Control;

export type Noop         = [ destination: null,   tag: 'Noop',         note?: string ];

export type Memory       = Constant | Copy | Load | Store | AddressOf | Drop;
export type Constant     = [ destination: Offset, tag: 'Constant',     value:  Primitive ];
export type Copy         = [ destination: Offset, tag: 'Copy',         source: Offset ];
export type Load         = [ destination: Offset, tag: 'Load',         source: Offset ];
export type Store        = [ destination: Offset ,tag: 'Store',        source: Offset ];
export type AddressOf    = [ destination: Offset, tag: 'AddressOf',    source: Offset ];
export type Drop         = [ destination: Offset, tag: 'Drop',         note?: string ];

export type Arithmetic   = Add | Subtract | Multiply | Divide | Remainder | Minimum | Maximum | Negative;
export type Add          = [ destination: Offset, tag: 'Add',          left: Offset, right: Offset ];
export type Subtract     = [ destination: Offset, tag: 'Subtract',     left: Offset, right: Offset ];
export type Multiply     = [ destination: Offset, tag: 'Multiply',     left: Offset, right: Offset ];
export type Divide       = [ destination: Offset, tag: 'Divide',       left: Offset, right: Offset ];
export type Remainder    = [ destination: Offset, tag: 'Remainder',    left: Offset, right: Offset ];
export type Minimum      = [ destination: Offset, tag: 'Minimum',      left: Offset, right: Offset ];
export type Maximum      = [ destination: Offset, tag: 'Maximum',      left: Offset, right: Offset ];
export type Negative     = [ destination: Offset, tag: 'Negate',       left: Offset ];

export type Comparison   = Equal | Unequal | Less | LessEqual | Greater | GreaterEqual;
export type Equal        = [ destination: Offset, tag: 'Equal',        left: Offset, right: Offset ];
export type Unequal      = [ destination: Offset, tag: 'Unequal',      left: Offset, right: Offset ];
export type Less         = [ destination: Offset, tag: 'Less',         left: Offset, right: Offset ];
export type LessEqual    = [ destination: Offset, tag: 'LessEqual',    left: Offset, right: Offset ];
export type Greater      = [ destination: Offset, tag: 'Greater',      left: Offset, right: Offset ];
export type GreaterEqual = [ destination: Offset, tag: 'GreaterEqual', left: Offset, right: Offset ];

export type Control      = Jump | Branch | Call | Return;
export type Jump         = [ destination: null,   tag: 'Jump',         target: LineNumber ];
export type Branch       = [ destination: null,   tag: 'Branch',       condition: Offset, targets: [LineNumber, LineNumber] ];
export type Call         = [ destination: Offset, tag: 'Call',         target: LineNumber, arguments: Offset[],  note: string ];
export type Return       = [ destination: null,   tag: 'Return',       source: Offset ];

export enum Get {
  Dest   = 0,
  Tag    = 1,
  Left   = 2, // alias to first argument
  Right  = 3, // alias to second argument
}

export type Primitive = { value: number };
export type Offset = number;
export type LineNumber = { line: number };
