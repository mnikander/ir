// Copyright (c) 2025 Marco Nikander

export type Register    = `%${string}`;
export type LabelName   = `@${string}`;
export type RawValue    = boolean | number;
export type Value       = { tag: 'Value', value: RawValue };

export enum Get {
    Dest  = 0,
    Tag   = 1,
    Left  = 2,
    Right = 3,
    Last  = 4,
}

export type Instruction = Const | Copy | Add | Subtract | Multiply | Divide | Remainder | Equal | Unequal | Label | Function | Call | Jump | Branch | Return | Exit | Phi;
export type Terminator  = Jump | Branch | Return | Exit;
export type Const       = [ destination: Register, tag: 'Const',     constant: RawValue ];
export type Copy        = [ destination: Register, tag: 'Copy',      source: Register ];
export type Add         = [ destination: Register, tag: 'Add',       left: Register, right: Register ];
export type Subtract    = [ destination: Register, tag: 'Subtract',  left: Register, right: Register ];
export type Multiply    = [ destination: Register, tag: 'Multiply',  left: Register, right: Register ];
export type Divide      = [ destination: Register, tag: 'Divide',    left: Register, right: Register ];
export type Remainder   = [ destination: Register, tag: 'Remainder', left: Register, right: Register ];
export type Equal       = [ destination: Register, tag: 'Equal',     left: Register, right: Register ];
export type Unequal     = [ destination: Register, tag: 'Unequal',   left: Register, right: Register ];
export type Label       = [ destination: null,     tag: 'Label',     label: LabelName ];
export type Function    = [ destination: null,     tag: 'Function',  label: LabelName, parameters: Register[] ];
export type Call        = [ destination: Register, tag: 'Call',      label: LabelName, arguments: Register[] ];
export type Jump        = [ destination: null,     tag: 'Jump',      label: LabelName ];
export type Branch      = [ destination: null,     tag: 'Branch',    thenLabel: LabelName, elseLabel: LabelName, condition: Register ];
export type Return      = [ destination: null,     tag: 'Return',    left: Register ];
export type Exit        = [ destination: null,     tag: 'Exit',      left: Register ];
export type Phi         = [ destination: Register, tag: 'Phi',       left: Register, right: Register ];

export function find_label(program: readonly Instruction[], label: string): number {
    const isCorrectLabelOrFunction = (inst: Instruction) => { return (inst[Get.Tag] === 'Label' || inst[Get.Tag] === 'Function') && inst[Get.Left] === label; };
    return program.findIndex(isCorrectLabelOrFunction);
}

export function find_label_for_register(program: readonly Instruction[], register: Register): string {
    let label: string = '@Entry';
    for (let index: number = 0; index < program.length; index++) {
        const line: Instruction     = program[index];
        const dest: null | Register = line[Get.Dest];

        if (line[Get.Tag] === 'Label') {
            label = line[Get.Left];
        }
        else if (line[Get.Tag] === 'Function') {
            label = line[Get.Left];
            for (const arg of line[Get.Right]) {
                if (arg === register) {
                    return label;
                }
            }
        }
        else if (dest !== null && dest === register) {
            return label;
        }
    }
    return label;
}
