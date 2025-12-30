// Copyright (c) 2025 Marco Nikander

import { get_boolean, valid } from './type_assertions.ts'
import { Call, Function, Get, Instruction, Label, RawValue, Register, Value } from './instructions.ts'
import { verify_single_assignment } from './analysis.ts';
import { add, constant, copy, divide, equal, multiply, remainder, subtract, unequal } from "./basic_operations.ts";

type Frame = { 
    registers: Map<Register, Value>,
    return_pc: undefined | number,
    return_block: undefined | string,
};

export function evaluate(program: readonly Instruction[]): RawValue {
    program = verify_single_assignment(program);
    const stack: Frame[] = [ {registers: new Map<Register, Value>(), return_pc: undefined, return_block: undefined } ];
    let pc: number                         = 0;
    let current_block: string              = '@Entry';
    let previous_block: undefined | string = undefined;

    try {
        while (pc < program.length) {
            if (top(stack) === undefined) throw Error(`Bug -- no valid stack frame`);
            const line: Instruction          = program[pc];
            const reg: Map<Register, Value>  = top(stack).registers;
            const dest: null | Register      = line[Get.Dest];
    
            switch (line[Get.Tag]) {
                case 'Const':     reg.set(valid(dest), constant(line));       break;
                case 'Copy':      reg.set(valid(dest), copy(line, reg));      break;
                case 'Add':       reg.set(valid(dest), add(line, reg));       break;
                case 'Subtract':  reg.set(valid(dest), subtract(line, reg));  break;
                case 'Multiply':  reg.set(valid(dest), multiply(line, reg));  break;
                case 'Divide':    reg.set(valid(dest), divide(line, reg));    break;
                case 'Remainder': reg.set(valid(dest), remainder(line, reg)); break;
                case 'Equal':     reg.set(valid(dest), equal(line, reg));     break;
                case 'Unequal':   reg.set(valid(dest), unequal(line, reg));   break;
                case 'Jump': {
                    pc = find_label(program, line[Get.Left]);
                    previous_block = current_block;
                    current_block  = (program[pc] as Label)[Get.Left];
                    break;
                }
                case 'Branch': {
                    const condition = get_boolean(reg.get(line[Get.Last]));
                    if (condition) {
                        pc = find_label(program, line[Get.Left]);
                    }
                    else {
                        pc = find_label(program, line[Get.Right]);
                    }
                    previous_block = current_block;
                    current_block  = (program[pc] as Label)[Get.Left];
                    break;
                }
                case 'Call': {
                    const new_pc: number = find_label(program, line[Get.Left]);
                    const provided: number = valid(line[Get.Right]).length;
                    const expected: number = valid(program[new_pc][Get.Right]).length;
                    if (provided !== expected) {
                        throw Error(`function '${program[new_pc][Get.Left]}' expects ${expected} arguments, got ${provided}`);
                    }
                    stack.push({ registers: new Map<Register, Value>(),
                                 return_pc: pc,
                                 return_block: current_block });
                    pc = new_pc;
                    // copy register contents into new frame, as function arguments
                    for (let i: number = 0; i < line[Get.Right]?.length; i++) {
                        const parameter: Register = (program[pc] as Function)[Get.Right][i];
                        const value: Value        = valid(reg.get(line[Get.Right][i]));
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
                    const result: Value = valid(reg.get(line[Get.Left]));
                    previous(stack).registers.set(call[Get.Dest], result);
                    stack.pop();
                    break;
                }
                case 'Phi': {
                    const left:  Register = line[Get.Left];
                    const right: Register = line[Get.Right];
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
                    return valid(reg.get(line[Get.Left])).value;
                case 'Label':
                    throw Error(`encountered unexpected Label '${line[Get.Left]}'.`)
                case 'Function':
                    throw Error(`encountered unexpected Function '${line[Get.Left]}'.`)
                default:
                    throw Error(`unhandled instruction type '${(line as Instruction)[Get.Tag]}'`);
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
    let label: string = '@Entry';
    for (let index: number = 0; index < program.length; index++) {
        const line: Instruction     = program[index];
        const dest: null | Register = line[Get.Dest];

        if (line[Get.Tag] === 'Label') {
            label = line[Get.Left];
        }
        else if (line[Get.Tag] === 'Function') {
            label = line[Get.Left];
            for (const arg of line[Get.Right]) {
                if (arg === register) {
                    return label;
                }
            }
        }
        else if (dest !== null && dest === register) {
            return label;
        }
    }
    return label;
}
