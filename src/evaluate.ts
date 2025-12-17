// Copyright (c) 2025 Marco Nikander

import { assert_defined, get_boolean, get_number } from './type_assertions.ts'
import { Call, Function, Get, Instruction, Label, RawValue, Register, Value, Add, Subtract, Multiply, Divide, Remainder, Equal, Unequal } from './instructions.ts'
import { verify_single_assignment } from './analysis.ts';

type Frame = { registers: Map<Register, Value>, return_pc: undefined | number, return_block: undefined | string };

export function evaluate(instructions: readonly Instruction[]): RawValue {
    instructions = verify_single_assignment(instructions);
    const stack: Frame[] = [ {registers: new Map<Register, Value>(), return_pc: undefined, return_block: undefined } ];
    let pc: number                         = 0;
    let current_block: string              = 'Entry';
    let previous_block: undefined | string = undefined;

    try {
        while (pc < instructions.length) {
            if (top(stack) === undefined) throw Error(`Bug -- no valid stack frame`);
            const instruc: Instruction       = instructions[pc];
            const reg: Map<Register, Value>  = top(stack).registers;
    
            switch (instruc[Get.Tag]) {
                case 'Const':
                    reg.set(instruc[Get.Dest], { tag: 'Value', value: instruc[Get.Left] });
                    break;
                case 'Copy':
                    reg.set(instruc[Get.Dest], assert_defined(reg.get(instruc[Get.Left])));
                    break;
                case 'Add':
                    reg.set(instruc[Get.Dest], arithmetic(instruc, reg, (l: number, r: number) => {return l + r;}));
                    break;
                case 'Subtract':
                    reg.set(instruc[Get.Dest], arithmetic(instruc, reg, (l: number, r: number) => {return l - r;}));
                    break;
                case 'Multiply':
                    reg.set(instruc[Get.Dest], arithmetic(instruc, reg, (l: number, r: number) => {return l * r;}));
                    break;
                case 'Divide':
                    reg.set(instruc[Get.Dest], arithmetic(instruc, reg, (l: number, r: number) => {return l / r;}));
                    break;
                case 'Remainder':
                    reg.set(instruc[Get.Dest], arithmetic(instruc, reg, (l: number, r: number) => {return l % r;}));
                    break;
                case 'Equal':
                    reg.set(instruc[Get.Dest], comparison(instruc, reg, (l, r) => { return l === r; }));
                    break;
                case 'Unequal':
                    reg.set(instruc[Get.Dest], comparison(instruc, reg, (l, r) => { return l !== r; }));
                    break;
                case 'Jump': {
                    pc = find_label(instructions, instruc[Get.Left]);
                    previous_block = current_block;
                    current_block  = (instructions[pc] as Label)[Get.Left];
                    break;
                }
                case 'Branch': {
                    const condition = get_boolean(reg.get(instruc[Get.Last]));
                    if (condition) {
                        pc = find_label(instructions, instruc[Get.Left]);
                    }
                    else {
                        pc = find_label(instructions, instruc[Get.Right]);
                    }
                    previous_block = current_block;
                    current_block  = (instructions[pc] as Label)[Get.Left];
                    break;
                }
                case 'Call': {
                    stack.push({ registers: new Map<Register, Value>(),
                                 return_pc: pc,
                                 return_block: current_block });
                    pc = find_label(instructions, instruc[Get.Left]);
                    if (instruc[Get.Right]?.length !== instructions[pc][Get.Right]?.length) {
                        throw Error(`Line ${top(stack).return_pc}: function '${instructions[pc][Get.Left]}' expects ${instructions[pc][Get.Right]?.length} arguments, got ${instruc[Get.Right]?.length}`);
                    }
                    // copy register contents into new frame as function arguments, with the parameter names as their register names
                    for (let i: number = 0; i < instruc[Get.Right]?.length; i++) {
                        const parameter: Register = (instructions[pc] as Function)[Get.Right][i];
                        const value: Value        = assert_defined(reg.get(instruc[Get.Right][i]));
                        top(stack).registers.set(parameter, value);
                    }
                    previous_block = current_block;
                    current_block  = (instructions[pc] as Function)[Get.Left];
                    break;
                }
                case 'Return': {
                    pc = assert_defined(top(stack).return_pc);
                    previous_block      = current_block;
                    current_block       = assert_defined(top(stack).return_block);
                    const call: Call    = instructions[pc] as Call;
                    const result: Value = assert_defined(reg.get(instruc[Get.Left]));
                    previous(stack).registers.set(call[Get.Dest], result);
                    stack.pop();
                    break;
                }
                case 'Phi': {
                    if (previous_block === find_label_for_register(instructions, instruc[Get.Left])) {
                        reg.set(instruc[Get.Dest], assert_defined(reg.get(instruc[Get.Left])));
                    }
                    else if (previous_block === find_label_for_register(instructions, instruc[Get.Right])) {
                        reg.set(instruc[Get.Dest], assert_defined(reg.get(instruc[Get.Right])));
                    }
                    else {
                        throw Error(`cannot compute Phi(${instruc[Get.Left]}, ${instruc[Get.Right]}) when previous block is '${previous_block}'.`)
                    }
                    break;
                }
                case 'Exit':
                    return assert_defined(reg.get(instruc[Get.Left])).value;
                case 'Label':
                    throw Error(`encountered unexpected Label '${instruc[Get.Left]}'.`)
                case 'Function':
                    throw Error(`encountered unexpected Function '${instruc[Get.Left]}'.`)
                default:
                    throw Error(`unhandled instruction type '${(instruc as Instruction)[Get.Tag]}'`);
            }
            pc++;
        }
        throw Error(`reached end of instructions without an 'Exit' command`);
    }
    catch (error) {
        // catch and then re-throw all errors, with the line-number prepended, for easier debugging
        throw Error(`Line ${pc}: ` + (error as Error).message);
    }
}

function top(stack: Frame[]): Frame {
    return assert_defined(stack[stack.length - 1]);
}

function previous(stack: Frame[]): Frame {
    return assert_defined(stack[stack.length - 2]);
}

function find_label(instructions: readonly Instruction[], label: string): number {
    const isCorrectLabelOrFunction = (inst: Instruction) => { return (inst[Get.Tag] === 'Label' || inst[Get.Tag] === 'Function') && inst[Get.Left] === label; };
    return instructions.findIndex(isCorrectLabelOrFunction);
}

function find_label_for_register(instructions: readonly Instruction[], register: Register): string {
    let label: string = 'Entry';
    for (let line: number = 0; line < instructions.length; line++) {
        const instruc: Instruction = instructions[line];
        if (instruc[Get.Tag] === 'Label' || instruc[Get.Tag] === 'Function') {
            label = instruc[Get.Left];
        }
        if (instruc[Get.Dest] !== null && instruc[Get.Dest] === register) {
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

function arithmetic(instruction: Add | Subtract | Multiply | Divide | Remainder, registers: Map<Register, Value>, op: (left: number, right: number)=>number): Value {
    const left: number = get_number(registers.get(instruction[Get.Left]));
    const right: number = get_number(registers.get(instruction[Get.Right]));
    return { tag: 'Value', value: op(left, right) };
}

function comparison(instruction: Equal | Unequal, registers: Map<Register, Value>, op: (left: RawValue, right: RawValue)=>boolean): Value {
    const left = assert_defined(registers.get(instruction[Get.Left])).value;
    const right = assert_defined(registers.get(instruction[Get.Right])).value;
    return { tag: 'Value', value: op(left, right) };
}
