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
export type Phi         = [ destination: Register, tag: 'Phi',       left: Register, right: Register ];

export type Jump        = [ destination: null,     tag: 'Jump',      block: Label ];
export type Branch      = [ destination: null,     tag: 'Branch',    thenLabel: Label, elseLabel: Label, condition: Register ];
export type Return      = [ destination: null,     tag: 'Return',    left: Register ];
export type Exit        = [ destination: null,     tag: 'Exit',      left: Register ];

export function find_label(program: readonly Instruction[], block: string): number {
    const isCorrectLabelOrFunction = (inst: Instruction) => { return (inst[Get.Tag] === 'Block' || inst[Get.Tag] === 'Function') && inst[Get.Left] === block; };
    return program.findIndex(isCorrectLabelOrFunction);
}

export function find_label_for_register(program: readonly Instruction[], register: Register): string {
    let block: string = '@Entry';
    for (let index: number = 0; index < program.length; index++) {
        const line: Instruction     = program[index];
        const dest: null | Register = line[Get.Dest];

        if (line[Get.Tag] === 'Block') {
            block = line[Get.Left];
        }
        else if (line[Get.Tag] === 'Function') {
            block = line[Get.Left];
            for (const arg of line[Get.Right]) {
                if (arg === register) {
                    return block;
                }
            }
        }
        else if (dest !== null && dest === register) {
            return block;
        }
    }
    return block;
}
