// Copyright (c) 2025 Marco Nikander

export type Register    = number;
export type RawValue    = boolean | number;
export type Value       = { tag: 'Value', value: RawValue };

export enum Get {
    Dest  = 0,
    Tag   = 1,
    Left  = 2,
    Right = 3,
}

export type Instruction = Add | Const | Copy | Label | Jump | Branch | Function | Call | Return | Phi | Exit;
export type Const       = [ destination: Register, tag: 'Const', constant: RawValue ];
export type Copy        = [ destination: Register, tag: 'Copy', source: Register ];
export type Add         = [ destination: Register, tag: 'Add', left: Register, right: Register ];
export type Label       = [ destination: null,     tag: 'Label', label: string ];
export type Jump        = [ destination: null,     tag: 'Jump', label: string ];
export type Branch      = [ destination: null,     tag: 'Branch', label: string, condition: Register];
export type Function    = [ destination: null,     tag: 'Function', label: string, parameters: string[] ];
export type Call        = [ destination: Register, tag: 'Call', label: string, arguments: Register[] ];
export type Return      = [ destination: null,     tag: 'Return', result: Register ];
export type Exit        = [ destination: null,     tag: 'Exit', result: Register ];
export type Phi         = [ destination: Register, tag: 'Phi', left: Register, right: Register ];
