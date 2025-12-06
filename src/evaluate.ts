// Copyright (c) 2025 Marco Nikander

import { assert_boolean, assert_number, assert_defined } from './type_assertions.ts'
import { Get, Instruction, Register, RawValue, Value, Call, Return } from './instructions.ts'

type Frame = { registers: (undefined | Value)[], return_pc: undefined | number };

export function evaluate(instructions: readonly Instruction[]): RawValue {

    let stack: Frame[] = [ {registers: [], return_pc: undefined} ];
    let pc: number = -1;

    while (pc < instructions.length) {
        if (top(stack) === undefined) throw Error('Bug: no valid stack frame');
        pc++;
        const instruc: Instruction       = instructions[pc];
        const reg: (undefined | Value)[] = top(stack).registers;

        switch (instruc[Get.Tag]) {
            case 'Const':
                reg[instruc[Get.Dest]] = { tag: 'Value', value: instruc[Get.Left] };
                break;
            case 'Copy':
                reg[instruc[Get.Dest]] = reg[instruc[Get.Left]];
                break;
            case 'Add':
                reg[instruc[Get.Dest]] = { tag: 'Value', value: assert_number(reg[instruc[Get.Left]]) + assert_number(reg[instruc[Get.Right]]) };
                break;
            case 'Label':
                break;
            case 'Jump':
                pc = find_label(instructions, instruc[Get.Left]);
                break;
            case 'Branch':
                if (assert_boolean(reg[instruc[Get.Left]])) {
                    pc = find_label(instructions, instruc[Get.Right]);
                }
                break;
            case 'Function':
                throw Error(`Encountered unexpected function body of '${instruc[Get.Left]}'.`)
            case 'Call':
                // TODO: add arity check when calling a function
                stack.push(
                    { registers: instruc[Get.Right].map((r) => {return reg[r];}),
                      return_pc: pc }
                    );
                pc = find_label(instructions, instruc[Get.Left]);
                break;
            case 'Return':
                pc = assert_defined(top(stack).return_pc);
                peek(stack).registers[(instructions[pc] as Call)[Get.Dest]] = reg[instruc[Get.Left]];;
                stack.pop();
                break;
            case 'Exit':
                return assert_defined(reg[instruc[Get.Left]]).value;
            default:
                throw Error(`Unhandled instruction type '${(instruc as Instruction)[Get.Tag]}'`);
        }
    }
    throw Error(`Reached end of instructions without an 'Exit' command`);
}

function find_label(instructions: readonly Instruction[], label: string): number {
    return instructions.findIndex((inst: Instruction) => { return (inst[Get.Tag] === 'Label' || inst[Get.Tag] === 'Function') && inst[Get.Left] === label; });
}

function top(stack: Frame[]): Frame {
    return assert_defined(stack[stack.length - 1]);
}

function peek(stack: Frame[]): Frame {
    return assert_defined(stack[stack.length - 2]);
}
