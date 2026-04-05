// Copyright (c) 2026 Marco Nikander

export type Program      = Function[];
export type Function     = { name: Label,        parameters: Input[],  blocks: Block[] };
export type Block        = { name: Label,        phi_nodes: Phi[],     instructions: Instruction[], terminator: Terminator };
export type Instruction  = Call | Ownership | Arithmetic | Comparison;

export type Phi          = [ destination: Value, tag: 'Phi',           inputs: [label: Label, value: Input][]];
export type Call         = [ destination: Value, tag: 'Call',          label: Label, arguments: Input[] ];

export type Ownership    = Define | Stack | Heap | Borrow | Dereference | Update | Drop;
export type Define       = [ destination: Value, tag: 'Define',        value: Input ];
export type Stack        = [ destination: Value, tag: 'Stack',         value: Input ];
export type Heap         = [ destination: Value, tag: 'Heap',          value: Input ];
export type Borrow       = [ destination: Value, tag: 'Borrow',        pointer: Value ];
export type Dereference  = [ destination: Value, tag: 'Dereference',   pointer: Value ];
export type Update       = [ destination: Value, tag: 'Update',        pointer: Value, value: Value ];
export type Drop         = [ destination: null,  tag: 'Drop',          value: Value ];

export type Arithmetic   = Add | Subtract | Multiply | Divide | Remainder | Minimum | Maximum | Negative;
export type Add          = [ destination: Value, tag: 'Add',           left: Input, right: Input ];
export type Subtract     = [ destination: Value, tag: 'Subtract',      left: Input, right: Input ];
export type Multiply     = [ destination: Value, tag: 'Multiply',      left: Input, right: Input ];
export type Divide       = [ destination: Value, tag: 'Divide',        left: Input, right: Input ];
export type Remainder    = [ destination: Value, tag: 'Remainder',     left: Input, right: Input ];
export type Minimum      = [ destination: Value, tag: 'Minimum',       left: Input, right: Input ];
export type Maximum      = [ destination: Value, tag: 'Maximum',       left: Input, right: Input ];
export type Negative     = [ destination: Value, tag: 'Negate',        left: Input ];

export type Comparison   = Equal | Unequal | Less | LessEqual | Greater | GreaterEqual;
export type Equal        = [ destination: Value, tag: 'Equal',         left: Input, right: Input ];
export type Unequal      = [ destination: Value, tag: 'Unequal',       left: Input, right: Input ];
export type Less         = [ destination: Value, tag: 'Less',          left: Input, right: Input ];
export type LessEqual    = [ destination: Value, tag: 'LessEqual',     left: Input, right: Input ];
export type Greater      = [ destination: Value, tag: 'Greater',       left: Input, right: Input ];
export type GreaterEqual = [ destination: Value, tag: 'GreaterEqual',  left: Input, right: Input ];

export type Terminator   = Jump | Branch | Return | Exit;
export type Jump         = [ destination: null,  tag: 'Jump',          block: Label ];
export type Branch       = [ destination: null,  tag: 'Branch',        condition: Input, block: [Label, Label] ];
export type Return       = [ destination: null,  tag: 'Return',        left: Input ];
export type Exit         = [ destination: null,  tag: 'Exit',          left: Input ];

export type Input        = [number] | [Value] | ['Move', Value];
export type Value        = `%${string}`;
export type Label        = `@${string}`;

export enum Get {
    Dest   = 0,
    Tag    = 1,
    Left   = 2, // alias to first argument
    Right  = 3, // alias to second argument
}

const program : Program =
[
    {
        name: '@main',
        parameters: [],
        blocks:
        [
            {
                name: '@entry',
                phi_nodes: [],
                instructions: [],
                terminator: [ null, 'Exit', [0]],
            },
        ]
    },
];
