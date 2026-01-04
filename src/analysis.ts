// Copyright (c) 2025 Marco Nikander

import { Function, Get, Instruction, Label, Register } from "./instructions.ts";

export type Interval = { begin: number, end: number };

export function verify_single_assignment(instructions: readonly Instruction[]): readonly Instruction[] {
    const assigned_registers = new Set<Register>();

    for (let line: number = 0; line < instructions.length; ++line) {
        const destination: null | Register = instructions[line][Get.Dest];
        if(destination !== null) {
            assign(destination, assigned_registers, line);
        }
        else if (instructions[line][Get.Tag] === 'Function') {
            const args: Register[] = (instructions[line] as Function)[Get.Right];
            args.forEach((arg: Register) => { assign(arg, assigned_registers, line)});
        }
    }
    return instructions;
}

function assign(register: Register, assigned_registers: Set<Register>, line: number): Set<Register> {
    if (assigned_registers.has(register)) {
        throw Error(`Line ${line}: Register ${register} is already assigned`);
    }
    else {
        assigned_registers.add(register);
    }
    return assigned_registers;
}

export function table_of_contents(program: readonly Instruction[]): Map<Label, Interval> {
    if (program[0][Get.Left] !== '@Entry') throw Error(`Expected valid '@Entry' block at start of program`);
    
    const blocks: Map<Label, Interval> = new Map();
    let block: Label = '@Entry';
    let first: number = 0;

    for (let index: number = 1; index < program.length; index++) {
        const line: Instruction = program[index];

        if (line[Get.Tag] === 'Block' || line[Get.Tag] === 'Function') {
            // store the current block
            const interval: Interval = { begin: first, end: index };
            blocks.set(block, interval);
            
            // start next block
            block = line[Get.First];
            first = index;
        }
    }
    const interval: Interval = { begin: first, end: program.length };
    blocks.set(block, interval);

    return blocks;
}
