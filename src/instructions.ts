// Copyright (c) 2025 Marco Nikander

export type Register    = `%${string}`;
export type RawValue    = boolean | number;
export type Value       = { tag: 'Value', value: RawValue };

export enum Get {
    Dest  = 0,
    Tag   = 1,
    Left  = 2,
    Right = 3,
}

export type Instruction = Add | Subtract | Multiply | Divide | Remainder | Const | Copy | Equal | Unequal | Label | Jump | Branch | Function | Call | Return | Phi | Exit;
export type Const       = [ destination: Register, tag: 'Const',     constant: RawValue ];
export type Copy        = [ destination: Register, tag: 'Copy',      source: Register ];
export type Add         = [ destination: Register, tag: 'Add',       left: Register, right: Register ];
export type Subtract    = [ destination: Register, tag: 'Subtract',  left: Register, right: Register ];
export type Multiply    = [ destination: Register, tag: 'Multiply',  left: Register, right: Register ];
export type Divide      = [ destination: Register, tag: 'Divide',    left: Register, right: Register ];
export type Remainder   = [ destination: Register, tag: 'Remainder', left: Register, right: Register ];
export type Equal       = [ destination: Register, tag: 'Equal',     left: Register, right: Register ];
export type Unequal     = [ destination: Register, tag: 'Unequal',   left: Register, right: Register ];
export type Label       = [ destination: null,     tag: 'Label',     label: string ];
export type Jump        = [ destination: null,     tag: 'Jump',      label: string ];
export type Branch      = [ destination: null,     tag: 'Branch',    label: string, condition: Register ];
export type Function    = [ destination: null,     tag: 'Function',  label: string, parameters: Register[] ];
export type Call        = [ destination: Register, tag: 'Call',      label: string, arguments: Register[] ];
export type Return      = [ destination: null,     tag: 'Return',    left: Register ];
export type Exit        = [ destination: null,     tag: 'Exit',      left: Register ];
export type Phi         = [ destination: Register, tag: 'Phi',       left: Register, right: Register ];
