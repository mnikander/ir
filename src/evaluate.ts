// Copyright (c) 2025 Marco Nikander

import { get_boolean, valid } from './type_assertions.ts'
import { Call, Function, Get, Instruction, Label, RawValue, Register, Value } from './instructions.ts'
import { verify_single_assignment } from './analysis.ts';
import { arithmetic, comparison } from "./basic_operations.ts";

type Frame = { registers: Map<Register, Value>, return_pc: undefined | number, return_block: undefined | string };

export function evaluate(program: readonly Instruction[]): RawValue {
    program = verify_single_assignment(program);
    const stack: Frame[] = [ {registers: new Map<Register, Value>(), return_pc: undefined, return_block: undefined } ];
    let pc: number                         = 0;
    let current_block: string              = 'Entry';
    let previous_block: undefined | string = undefined;

    try {
        while (pc < program.length) {
            if (top(stack) === undefined) throw Error(`Bug -- no valid stack frame`);
            const instruc: Instruction       = program[pc];
            const reg: Map<Register, Value>  = top(stack).registers;
            const dest: null | Register      = instruc[Get.Dest];
    
            switch (instruc[Get.Tag]) {
                case 'Const':
                    reg.set(valid(dest), { tag: 'Value', value: instruc[Get.Left] });
                    break;
                case 'Copy':
                    reg.set(valid(dest), valid(reg.get(instruc[Get.Left])));
                    break;
                case 'Add':
                    reg.set(valid(dest), arithmetic(instruc, reg, (l: number, r: number) => {return l + r;}));
                    break;
                case 'Subtract':
                    reg.set(valid(dest), arithmetic(instruc, reg, (l: number, r: number) => {return l - r;}));
                    break;
                case 'Multiply':
                    reg.set(valid(dest), arithmetic(instruc, reg, (l: number, r: number) => {return l * r;}));
                    break;
                case 'Divide':
                    reg.set(valid(dest), arithmetic(instruc, reg, (l: number, r: number) => {return l / r;}));
                    break;
                case 'Remainder':
                    reg.set(valid(dest), arithmetic(instruc, reg, (l: number, r: number) => {return l % r;}));
                    break;
                case 'Equal':
                    reg.set(valid(dest), comparison(instruc, reg, (l, r) => { return l === r; }));
                    break;
                case 'Unequal':
                    reg.set(valid(dest), comparison(instruc, reg, (l, r) => { return l !== r; }));
                    break;
                case 'Jump': {
                    pc = find_label(program, instruc[Get.Left]);
                    previous_block = current_block;
                    current_block  = (program[pc] as Label)[Get.Left];
                    break;
                }
                case 'Branch': {
                    const condition = get_boolean(reg.get(instruc[Get.Last]));
                    if (condition) {
                        pc = find_label(program, instruc[Get.Left]);
                    }
                    else {
                        pc = find_label(program, instruc[Get.Right]);
                    }
                    previous_block = current_block;
                    current_block  = (program[pc] as Label)[Get.Left];
                    break;
                }
                case 'Call': {
                    const new_pc: number = find_label(program, instruc[Get.Left]);
                    const provided: number = valid(instruc[Get.Right]).length;
                    const expected: number = valid(program[new_pc][Get.Right]).length;
                    if (provided !== expected) {
                        throw Error(`function '${program[new_pc][Get.Left]}' expects ${expected} arguments, got ${provided}`);
                    }
                    stack.push({ registers: new Map<Register, Value>(),
                                 return_pc: pc,
                                 return_block: current_block });
                    pc = new_pc;
                    // copy register contents into new frame, as function arguments
                    for (let i: number = 0; i < instruc[Get.Right]?.length; i++) {
                        const parameter: Register = (program[pc] as Function)[Get.Right][i];
                        const value: Value        = valid(reg.get(instruc[Get.Right][i]));
                        top(stack).registers.set(parameter, value);
                    }
                    previous_block = current_block;
                    current_block  = (program[pc] as Function)[Get.Left];
                    break;
                }
                case 'Return': {
                    pc                  = valid(top(stack).return_pc);
                    previous_block      = current_block;
                    current_block       = valid(top(stack).return_block);
                    const call: Call    = program[pc] as Call;
                    const result: Value = valid(reg.get(instruc[Get.Left]));
                    previous(stack).registers.set(call[Get.Dest], result);
                    stack.pop();
                    break;
                }
                case 'Phi': {
                    const left:  Register = instruc[Get.Left];
                    const right: Register = instruc[Get.Right];
                    if (previous_block === find_label_for_register(program, left)) {
                        reg.set(valid(dest), valid(reg.get(left)));
                    }
                    else if (previous_block === find_label_for_register(program, right)) {
                        reg.set(valid(dest), valid(reg.get(right)));
                    }
                    else {
                        throw Error(`cannot compute Phi(${left}, ${right}) when previous block is '${previous_block}'.`)
                    }
                    break;
                }
                case 'Exit':
                    return valid(reg.get(instruc[Get.Left])).value;
                case 'Label':
                    throw Error(`encountered unexpected Label '${instruc[Get.Left]}'.`)
                case 'Function':
                    throw Error(`encountered unexpected Function '${instruc[Get.Left]}'.`)
                default:
                    throw Error(`unhandled instruction type '${(instruc as Instruction)[Get.Tag]}'`);
            }
            pc++;
        }
        throw Error(`reached end of program without an 'Exit' command`);
    }
    catch (error) {
        // catch and then re-throw all errors, with the line-number prepended, for easier debugging
        throw Error(`Line ${pc}: ` + (error as Error).message);
    }
}

function top(stack: Frame[]): Frame {
    return valid(stack[stack.length - 1]);
}

function previous(stack: Frame[]): Frame {
    return valid(stack[stack.length - 2]);
}

function find_label(program: readonly Instruction[], label: string): number {
    const isCorrectLabelOrFunction = (inst: Instruction) => { return (inst[Get.Tag] === 'Label' || inst[Get.Tag] === 'Function') && inst[Get.Left] === label; };
    return program.findIndex(isCorrectLabelOrFunction);
}

function find_label_for_register(program: readonly Instruction[], register: Register): string {
    let label: string = 'Entry';
    for (let line: number = 0; line < program.length; line++) {
        const instruc: Instruction  = program[line];
        const dest: null | Register = instruc[Get.Dest];

        if (instruc[Get.Tag] === 'Label' || instruc[Get.Tag] === 'Function') {
            label = instruc[Get.Left];
        }
        if (dest !== null && dest === register) {
            return label;
        }
        else if (instruc[Get.Tag] === 'Function') {
            for (const arg of instruc[Get.Right]) {
                if (arg === register) {
                    return label;
                }
            }
        }
    }
    return label;
}
