// Copyright (c) 2025 Marco Nikander

import { Instruction, Get, Register, Function } from "./instructions.ts";

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
