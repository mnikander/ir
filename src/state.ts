import { Copy, Const, Add, Subtract, Multiply, Divide, Remainder, Register, Value, Get, Instruction, Equal, Unequal } from "./instructions.ts";
import { get_number, valid } from "./type_assertions.ts";

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
