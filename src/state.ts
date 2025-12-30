import { Register, Value } from "./instructions.ts";
import { valid } from "./type_assertions.ts";

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
