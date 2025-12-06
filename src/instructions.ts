// Copyright (c) 2025 Marco Nikander

export type Register    = number;
export type RawValue    = boolean | number;
export type Value       = { tag: 'Value', value: RawValue };

export type Instruction = Add | Const | Copy | Label | Jump | Branch | Function | Call | Return | Exit;
export type Const       = { tag: 'Const', destination: Register, constant: RawValue };
export type Copy        = { tag: 'Copy', destination: Register, source: Register };
export type Add         = { tag: 'Add', destination: Register, left: Register, right: Register };
export type Jump        = { tag: 'Jump', label: string };
export type Label       = { tag: 'Label', label: string };
export type Branch      = { tag: 'Branch', condition: Register, label: string };
export type Function    = { tag: 'Function', label: string, parameters: string[] };
export type Call        = { tag: 'Call', label: string, destination: Register, arguments: Register[] };
export type Return      = { tag: 'Return', result: Register };
export type Exit        = { tag: 'Exit', result: Register };
