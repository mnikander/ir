// Copyright (c) 2025 Marco Nikander

import { Instruction, Get, Register } from "./instructions.ts";

export function verify_single_assignment(instructions: readonly Instruction[]): readonly Instruction[] {
    const registers = new Set();

    for (let i: number = 0; i < instructions.length; ++i) {
        const reg: null | Register = instructions[i][Get.Dest];
        if(reg !== null) {
            if (registers.has(reg)) {
                throw Error(`Register ${reg} is already assigned, reassignment in line ${i}`);
            }
            else {
                registers.add(reg);
            }
        }
    }
    return instructions;
}
