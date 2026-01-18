// Copyright (c) 2025 Marco Nikander

export type Register    = `%${string}`;
export type Label       = `@${string}`;
export type RawValue    = boolean | number;
export type Value       = { tag: 'Value', value: RawValue };
export type Reference   = { tag: 'Reference', value: Register };

export enum Get {
    Dest   = 0,
    Tag    = 1,
    Left   = 2,
    Right  = 3,
    First  = 2,
    Second = 3,
    Third  = 4,
    Fourth = 5,
}

export type Instruction = Const | Copy | Drop | Move | Ref | Deref
                        | Add | Subtract | Multiply | Divide | Remainder
                        | Equal | Unequal
                        | Block | Function | Call | Phi
                        | Jump | Branch | Return | Exit;

export type Unary       = Const | Copy | Drop | Move | Ref | Deref;
export type Binary      = Add | Subtract | Multiply | Divide | Remainder | Equal | Unequal;
export type Terminator  = Jump | Branch | Return | Exit;

export type Const       = [ destination: Register, tag: 'Const',     constant: RawValue ];
export type Copy        = [ destination: Register, tag: 'Copy',      source: Register ];
export type Drop        = [ destination: null,     tag: 'Drop',      source: Register ];
export type Move        = [ destination: Register, tag: 'Move',      source: Register ];
export type Ref         = [ destination: Register, tag: 'Ref',       source: Register ];
export type Deref       = [ destination: Register, tag: 'Deref',     source: Register ];
// dereference feels like a problem: do I need to deref inline? That requires a grammar change.

export type Add         = [ destination: Register, tag: 'Add',       left: Register, right: Register ];
export type Subtract    = [ destination: Register, tag: 'Subtract',  left: Register, right: Register ];
export type Multiply    = [ destination: Register, tag: 'Multiply',  left: Register, right: Register ];
export type Divide      = [ destination: Register, tag: 'Divide',    left: Register, right: Register ];
export type Remainder   = [ destination: Register, tag: 'Remainder', left: Register, right: Register ];
export type Equal       = [ destination: Register, tag: 'Equal',     left: Register, right: Register ];
export type Unequal     = [ destination: Register, tag: 'Unequal',   left: Register, right: Register ];

export type Block       = [ destination: null,     tag: 'Block',     block: Label ];
export type Function    = [ destination: null,     tag: 'Function',  block: Label, parameters: Register[] ];
export type Call        = [ destination: Register, tag: 'Call',      block: Label, arguments: Register[] ];
export type Phi         = [ destination: Register, tag: 'Phi',       first: Label, second: Register, third: Label, fourth: Register ];

export type Jump        = [ destination: null,     tag: 'Jump',      block: Label ];
export type Branch      = [ destination: null,     tag: 'Branch',    thenLabel: Label, elseLabel: Label, condition: Register ];
export type Return      = [ destination: null,     tag: 'Return',    left: Register ];
export type Exit        = [ destination: null,     tag: 'Exit',      left: Register ];
