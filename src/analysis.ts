// Copyright (c) 2025 Marco Nikander

import { Instruction, Get, Register } from "./instructions.ts";

export function verify_single_assignment(instructions: readonly Instruction[]): readonly Instruction[] {
    const registers = new Set();

    for (let line: number = 0; line < instructions.length; ++line) {
        const reg: null | Register = instructions[line][Get.Dest];
        if(reg !== null) {
            if (registers.has(reg)) {
                throw Error(`Line ${line}: Register ${reg} is already assigned`);
            }
            else {
                registers.add(reg);
            }
        }
    }
    return instructions;
}
