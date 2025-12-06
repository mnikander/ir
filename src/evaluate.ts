// Copyright (c) 2025 Marco Nikander

import { assert_boolean, assert_number, assert_defined } from './type_assertions.ts'
import { Instruction, Register, RawValue, Value } from './instructions.ts'

type Frame = { registers: (undefined | Value)[], return_register: undefined | Register, return_pc: undefined | number };

export function evaluate(instructions: readonly Instruction[]): RawValue {

    let stack: Frame[] = [ {registers: [], return_register: undefined, return_pc: undefined} ];
    let pc: number = 0;

    while (pc < instructions.length) {
        if (top(stack) === undefined) throw Error('Bug: no valid stack frame');
        const instruc: Instruction       = instructions[pc];
        const reg: (undefined | Value)[] = top(stack).registers;

        switch (instruc[1]) {
            case 'Const':
                reg[instruc[0]] = { tag: 'Value', value: instruc[2] };
                pc++;
                break;
            case 'Copy':
                reg[instruc[0]] = reg[instruc[2]];
                pc++;
                break;
            case 'Add':
                reg[instruc[0]] = { tag: 'Value', value: assert_number(reg[instruc[2]]) + assert_number(reg[instruc[3]]) };
                pc++;
                break;
            case 'Label':
                pc++;
                break;
            case 'Jump':
                pc = find_label(instructions, instruc[2]);
                break;
            case 'Branch':
                if (assert_boolean(reg[instruc[2]])) {
                    pc = find_label(instructions, instruc[3]);
                }
                else {
                    pc++;
                }
                break;
            case 'Function':
                throw Error(`Encountered unexpected function body of '${instruc[2]}'.`)
            case 'Call':
                // TODO: add arity check when calling a function
                stack.push(
                    { registers: instruc[3].map((r) => {return reg[r];}),
                      return_register: instruc[0],
                      return_pc: pc + 1 }
                    );
                pc = find_label(instructions, instruc[2]) + 1;
                break;
            case 'Return':
                peek(stack).registers[assert_defined(top(stack).return_register)] = reg[instruc[2]];
                pc = assert_defined(top(stack).return_pc);
                stack.pop();
                break;
            case 'Exit':
                return assert_defined(reg[instruc[2]]).value;
            default:
                throw Error(`Unhandled instruction type '${(instruc as Instruction)[1]}'`);
        }
    }
    throw Error(`Reached end of instructions without an 'Exit' command`);
}

function find_label(instructions: readonly Instruction[], label: string): number {
    return instructions.findIndex((i: Instruction) => { return (i[1] === 'Label' || i[1] === 'Function') && i[2] === label; });
}

function top(stack: Frame[]): Frame {
    return assert_defined(stack[stack.length - 1]);
}

function peek(stack: Frame[]): Frame {
    return assert_defined(stack[stack.length - 2]);
}
