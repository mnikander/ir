import { Add, Block, Branch, Call, Copy, Const, Divide, Equal, find_label, 
    Function, Get, Instruction, Jump, Multiply, Remainder, Register, Subtract, 
    Unequal, Value } from "./instructions.ts";
import { get_boolean, get_number, valid } from "./type_assertions.ts";

export type Frame = { 
    registers: Map<Register, Value>,
    return_pc: undefined | number,
    return_block: undefined | string,
};

export type State = {
    stack: Frame[],
    pc: number,
    current_block: string,
    previous_block: undefined | string,
};

export function top(stack: Frame[]): Frame {
    return valid(stack[stack.length - 1]);
}

export function previous(stack: Frame[]): Frame {
    return valid(stack[stack.length - 2]);
}

// function line(program: readonly Instruction[], state: State): Instruction {
//     return program[state.pc];
// }

function registers(state: State): Map<Register, Value> {
    return top(state.stack).registers;
}

function dest(line: Instruction): Register {
    return valid(line[Get.Dest]);
}

export function constant(line: Const, state: State): State {
    registers(state).set(dest(line), { tag: 'Value', value: line[Get.Left] });
    return state;
}

export function copy(line: Copy, state: State): State {
    registers(state).set(dest(line), valid(registers(state).get(line[Get.Left])));
    return state;
}

export function add(line: Add, state: State): State {
    const left:  number = get_number(registers(state).get(line[Get.Left]));
    const right: number = get_number(registers(state).get(line[Get.Right]));
    registers(state).set(dest(line), { tag: 'Value', value: left + right });
    return state;
}

export function subtract(line: Subtract, state: State): State {
    const left:  number = get_number(registers(state).get(line[Get.Left]));
    const right: number = get_number(registers(state).get(line[Get.Right]));
    registers(state).set(dest(line), { tag: 'Value', value: left - right });
    return state;
}

export function multiply(line: Multiply, state: State): State {
    const left:  number = get_number(registers(state).get(line[Get.Left]));
    const right: number = get_number(registers(state).get(line[Get.Right]));
    registers(state).set(dest(line), { tag: 'Value', value: left * right });
    return state;
}

export function divide(line: Divide, state: State): State {
    const left:  number = get_number(registers(state).get(line[Get.Left]));
    const right: number = get_number(registers(state).get(line[Get.Right]));
    registers(state).set(dest(line), { tag: 'Value', value: left / right });
    return state;
}

export function remainder(line: Remainder, state: State): State {
    const left:  number = get_number(registers(state).get(line[Get.Left]));
    const right: number = get_number(registers(state).get(line[Get.Right]));
    registers(state).set(dest(line), { tag: 'Value', value: left % right });
    return state;
}

export function equal(line: Equal, state: State): State {
    const left  = valid(registers(state).get(line[Get.Left])).value;
    const right = valid(registers(state).get(line[Get.Right])).value;
    registers(state).set(dest(line), { tag: 'Value', value: left === right });
    return state;
}

export function unequal(line: Unequal, state: State): State {
    const left  = valid(registers(state).get(line[Get.Left])).value;
    const right = valid(registers(state).get(line[Get.Right])).value;
    registers(state).set(dest(line), { tag: 'Value', value: left !== right });
    return state;
}

export function jump(line: Jump, state: State, program: readonly Instruction[]): State {
    state.pc = find_label(program, line[Get.Left]);
    state.previous_block = state.current_block;
    state.current_block  = (program[state.pc] as Block)[Get.Left];
    return state;
}

export function branch(line: Branch, state: State, program: readonly Instruction[]): State {
    const condition = get_boolean(registers(state).get(line[Get.Last]));
    if (condition) {
        state.pc = find_label(program, line[Get.Left]);
    }
    else {
        state.pc = find_label(program, line[Get.Right]);
    }
    state.previous_block = state.current_block;
    state.current_block  = (program[state.pc] as Block)[Get.Left];
    return state;
}

export function call(line: Call, state: State, program: readonly Instruction[]): State {
    const old_reg: Map<Register, Value> = registers(state);
    const new_pc: number   = find_label(program, line[Get.Left]);
    const provided: number = valid(line[Get.Right]).length;
    const expected: number = valid(program[new_pc][Get.Right]).length;
    if (provided !== expected) {
        throw Error(`function '${program[new_pc][Get.Left]}' expects ${expected} arguments, got ${provided}`);
    }
    state.stack.push({ registers: new Map<Register, Value>(),
                    return_pc: state.pc,
                    return_block: state.current_block });
    state.pc = new_pc;
    // copy register contents into new frame, as function arguments
    for (let i: number = 0; i < line[Get.Right]?.length; i++) {
        const parameter: Register = (program[state.pc] as Function)[Get.Right][i];
        const value: Value        = valid(old_reg.get(line[Get.Right][i]));
        registers(state).set(parameter, value);
    }
    state.previous_block = state.current_block;
    state.current_block  = (program[state.pc] as Function)[Get.Left];
    return state;
}
