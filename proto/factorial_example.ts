// Copyright (c) 2026 Marco Nikander

import { Program } from "./grammar.ts";

export const factorial : Program =
[
    {
        name: '@main',
        parameters: [],
        blocks:
        [
            {
                name: '@entry',
                phi_nodes: [],
                instructions: [
                    ['%result', 'Call', '@factorial', [[5]]],
                ],
                terminator: [ null, 'Exit', ['%result']],
            },
        ]
    },
    {
        name: '@factorial',
        parameters: [['%arg'],],
        blocks:
        [
            {
                name: '@entry',
                phi_nodes: [],
                instructions: [],
                terminator: [null, 'Jump', '@gate']
            },
            {
                name: '@gate',
                phi_nodes: [
                    ['%acc', 'Phi', [ ['@entry', [1]     ], ['@body', ['%new_acc']] ] ],
                    ['%n',   'Phi', [ ['@entry', ['%arg']], ['@body', ['%new_n']  ] ] ],
                ],
                instructions:
                [
                    ['%continue',   'Greater',   ['%n'], [1]],
                ],
                terminator: [null, 'Branch', ['%continue'], ['@body', '@end']]
            },
            {
                name: '@body',
                phi_nodes: [],
                instructions:
                [
                    ['%new_acc', 'Multiply', ['%n'], ['%acc']],
                    ['%new_n',   'Subtract', ['%n'], [1]],
                ],
                terminator: [null, 'Jump', '@gate']
            },
            {
                name: '@end',
                phi_nodes: [],
                instructions: [],
                terminator: [null, 'Return', ['%n']]
            },
        ]
    },
];
