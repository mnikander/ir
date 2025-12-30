import { Add, Block, Branch, Call, Copy, Const, Divide, Equal, find_label_for_register,
    find_label, Function, Get, Instruction, Jump, Multiply, Phi, Register,
    Remainder, Return, Subtract, Unequal, Value } from "./instructions.ts";
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

export function constant(state: State, line: Const): State {
    registers(state).set(dest(line), { tag: 'Value', value: line[Get.Left] });
    return state;
}

export function copy(state: State, line: Copy): State {
    registers(state).set(dest(line), valid(registers(state).get(line[Get.Left])));
    return state;
}

export function add(state: State, line: Add): State {
    const left:  number = get_number(registers(state).get(line[Get.Left]));
    const right: number = get_number(registers(state).get(line[Get.Right]));
    registers(state).set(dest(line), { tag: 'Value', value: left + right });
    return state;
}

export function subtract(state: State, line: Subtract): State {
    const left:  number = get_number(registers(state).get(line[Get.Left]));
    const right: number = get_number(registers(state).get(line[Get.Right]));
    registers(state).set(dest(line), { tag: 'Value', value: left - right });
    return state;
}

export function multiply(state: State, line: Multiply): State {
    const left:  number = get_number(registers(state).get(line[Get.Left]));
    const right: number = get_number(registers(state).get(line[Get.Right]));
    registers(state).set(dest(line), { tag: 'Value', value: left * right });
    return state;
}

export function divide(state: State, line: Divide): State {
    const left:  number = get_number(registers(state).get(line[Get.Left]));
    const right: number = get_number(registers(state).get(line[Get.Right]));
    registers(state).set(dest(line), { tag: 'Value', value: left / right });
    return state;
}

export function remainder(state: State, line: Remainder): State {
    const left:  number = get_number(registers(state).get(line[Get.Left]));
    const right: number = get_number(registers(state).get(line[Get.Right]));
    registers(state).set(dest(line), { tag: 'Value', value: left % right });
    return state;
}

export function equal(state: State, line: Equal): State {
    const left  = valid(registers(state).get(line[Get.Left])).value;
    const right = valid(registers(state).get(line[Get.Right])).value;
    registers(state).set(dest(line), { tag: 'Value', value: left === right });
    return state;
}

export function unequal(state: State, line: Unequal): State {
    const left  = valid(registers(state).get(line[Get.Left])).value;
    const right = valid(registers(state).get(line[Get.Right])).value;
    registers(state).set(dest(line), { tag: 'Value', value: left !== right });
    return state;
}

export function jump(state: State, line: Jump, program: readonly Instruction[]): State {
    state.pc = find_label(program, line[Get.Left]);
    state.previous_block = state.current_block;
    state.current_block  = (program[state.pc] as Block)[Get.Left];
    return state;
}

export function branch(state: State, line: Branch, program: readonly Instruction[]): State {
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

export function call(state: State, line: Call, program: readonly Instruction[]): State {
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

export function returning(state: State, line: Return, program: readonly Instruction[]): State {
    state.pc             = valid(top(state.stack).return_pc);
    state.previous_block = state.current_block;
    state.current_block  = valid(top(state.stack).return_block);
    const call: Call     = program[state.pc] as Call;
    const result: Value  = valid(registers(state).get(line[Get.Left]));
    previous(state.stack).registers.set(call[Get.Dest], result);
    state.stack.pop();
    return state;
}

export function phi(state: State, line: Phi, program: readonly Instruction[]): State {
    const left:  Register = line[Get.Left];
    const right: Register = line[Get.Right];
    const reg: Map<Register, Value> = registers(state);
    if (state.previous_block === find_label_for_register(program, left)) {
        reg.set(dest(line), valid(reg.get(left)));
    }
    else if (state.previous_block === find_label_for_register(program, right)) {
        reg.set(dest(line), valid(reg.get(right)));
    }
    else {
        throw Error(`cannot compute Phi(${left}, ${right}) when previous block is '${state.previous_block}'.`)
    }
    return state;
}
