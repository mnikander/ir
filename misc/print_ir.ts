// Copyright (c) 2026 Marco Nikander

import { Instruction } from "../src/instructions.ts";
import { to_string } from "../src/to_string.ts";

const program: Instruction[] = [
    [ null, 'Block', '@entry' ],
    [ '%0', 'Const', 5 ],
    [ '%1', 'Const', 1 ],
    [ '%2', 'Call', '@factorial', ['%0', '%1'] ],
    [ null, 'Exit', '%2' ],

    [ null, 'Function', '@factorial', ['%n', '%acc'] ],
    [ '%3', 'Const', 1 ],
    [ '%6', 'Equal', '%n', '%3' ],
    [ null, 'Branch', '@termination', '@body', '%6' ],
    
    [ null, 'Block', '@body' ],
    [ '%7', 'Subtract', '%n', '%3' ],
    [ '%8', 'Multiply', '%n', '%acc' ],
    [ '%9', 'Call', '@factorial', ['%7', '%8'] ],
    [ null, 'Jump', '@termination' ],
    
    [ null, 'Block', '@termination' ],
    [ '%10', 'Phi', '@body', '%9', '@factorial', '%acc' ],
    [ null, 'Return', '%10' ],
];

console.log(to_string(program));
