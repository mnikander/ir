// Copyright (c) 2025 Marco Nikander

import { assert_boolean, assert_defined, assert_number } from './type_assertions.ts'
import { Call, Function, Get, Instruction, Label, RawValue, Register, Value } from './instructions.ts'
import { verify_single_assignment } from './analysis.ts';

type Frame = { registers: (undefined | Value)[], return_pc: undefined | number, return_block: undefined | string };

export function evaluate(instructions: readonly Instruction[]): RawValue {
    instructions = verify_single_assignment(instructions);
    let stack: Frame[] = [ {registers: [], return_pc: undefined, return_block: undefined } ];
    let pc: number                         = 0;
    let current_block: string              = 'Entry';
    let previous_block: undefined | string = undefined;

    while (pc < instructions.length) {
        if (top(stack) === undefined) throw Error(`Line ${pc}: Bug -- no valid stack frame`);
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
            case 'Equal':
                reg[instruc[Get.Dest]] = { tag: 'Value', value: reg[instruc[Get.Left]]?.value === reg[instruc[Get.Right]]?.value };
                break;
            case 'Unequal':
                reg[instruc[Get.Dest]] = { tag: 'Value', value: reg[instruc[Get.Left]]?.value !== reg[instruc[Get.Right]]?.value };
                break;
            case 'Label':
                previous_block = current_block;
                current_block  = (instructions[pc] as Label)[Get.Left];
                break;
            case 'Jump':
                pc = find_label(instructions, instruc[Get.Left]);
                previous_block = current_block;
                current_block  = (instructions[pc] as Label)[Get.Left];
                break;
            case 'Branch':
                if (assert_boolean(reg[instruc[Get.Right]])) {
                    pc = find_label(instructions, instruc[Get.Left]);
                    previous_block = current_block;
                    current_block  = (instructions[pc] as Label)[Get.Left];
                }
                break;
            case 'Function':
                throw Error(`Line ${pc}: Encountered unexpected function body of '${instruc[Get.Left]}'.`)
            case 'Call':
                // TODO: add arity check when calling a function
                stack.push(
                    { registers: instruc[Get.Right].map((r) => {return reg[r];}),
                      return_pc: pc,
                      return_block: current_block }
                    );
                pc = find_label(instructions, instruc[Get.Left]);
                previous_block = current_block;
                current_block  = (instructions[pc] as Function)[Get.Left];
                break;
            case 'Return':
                pc = assert_defined(top(stack).return_pc);
                previous_block = current_block;
                current_block  = assert_defined(top(stack).return_block);
                predecessor(stack).registers[(instructions[pc] as Call)[Get.Dest]] = reg[instruc[Get.Left]];
                stack.pop();
                break;
            case 'Phi':
                if (previous_block === find_label_for_register(instructions, instruc[Get.Left])) {
                    reg[instruc[Get.Dest]] = reg[instruc[Get.Left]];
                }
                else if (previous_block === find_label_for_register(instructions, instruc[Get.Right])) {
                    reg[instruc[Get.Dest]] = reg[instruc[Get.Right]];
                }
                else {
                    throw Error(`Line ${pc}: cannot compute Phi(${instruc[Get.Left]}, ${instruc[Get.Right]}) when previous block is '${previous_block}'.`)
                }
                break;
            case 'Exit':
                return assert_defined(reg[instruc[Get.Left]]).value;
            default:
                throw Error(`Line ${pc}: Unhandled instruction type '${(instruc as Instruction)[Get.Tag]}'`);
        }
        pc++;
    }
    throw Error(`Line ${pc}: Reached end of instructions without an 'Exit' command`);
}

function top(stack: Frame[]): Frame {
    return assert_defined(stack[stack.length - 1]);
}

function predecessor(stack: Frame[]): Frame {
    return assert_defined(stack[stack.length - 2]);
}

function find_label(instructions: readonly Instruction[], label: string): number {
    return instructions.findIndex((inst: Instruction) => { return (inst[Get.Tag] === 'Label' || inst[Get.Tag] === 'Function') && inst[Get.Left] === label; });
}

function find_label_for_register(instructions: readonly  Instruction[], register: Register): string {
    let label: string = 'Entry';
    for (let line: number = 0; line < instructions.length; line++) {
        const instruc: Instruction = instructions[line];
        if (instruc[Get.Tag] === 'Label' || instruc[Get.Tag] === 'Function') {
            label = instruc[Get.Left];
        }
        if (instruc[Get.Dest] !== null && instruc[Get.Dest] === register) {
            return label;
        }
    }
    return label;
}
