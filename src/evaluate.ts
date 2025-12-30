// Copyright (c) 2025 Marco Nikander

import { valid } from './type_assertions.ts'
import { Call, find_label_for_register, Get, Instruction, RawValue, Register, Value } from './instructions.ts'
import { verify_single_assignment } from './analysis.ts';
import { add, branch, call, constant, copy, divide, equal, jump, multiply, previous, remainder, returning, State, subtract, top, unequal } from "./state.ts";

export function evaluate(program: readonly Instruction[]): RawValue {
    program = verify_single_assignment(program);
    let state: State = {
        stack: [ {registers: new Map<Register, Value>(), return_pc: undefined, return_block: undefined } ],
        pc: 0,
        current_block: '@Entry',
        previous_block: undefined,
    };

    try {
        while (state.pc < program.length) {
            if (top(state.stack) === undefined) throw Error(`Bug -- no valid stack frame`);
            const line: Instruction          = program[state.pc];
            const reg: Map<Register, Value>  = top(state.stack).registers;
            const dest: null | Register      = line[Get.Dest];
    
            switch (line[Get.Tag]) {
                case 'Const':     state = constant(line, state);  break;
                case 'Copy':      state = copy(line, state);      break;
                case 'Add':       state = add(line, state);       break;
                case 'Subtract':  state = subtract(line, state);  break;
                case 'Multiply':  state = multiply(line, state);  break;
                case 'Divide':    state = divide(line, state);    break;
                case 'Remainder': state = remainder(line, state); break;
                case 'Equal':     state = equal(line, state);     break;
                case 'Unequal':   state = unequal(line, state);   break;
                case 'Jump':      state = jump(line, state, program); break;
                case 'Branch':    state = branch(line, state, program); break;
                case 'Call':      state = call(line, state, program); break;
                case 'Return':    state = returning(line, state, program); break;
                case 'Phi': {
                    const left:  Register = line[Get.Left];
                    const right: Register = line[Get.Right];
                    if (state.previous_block === find_label_for_register(program, left)) {
                        reg.set(valid(dest), valid(reg.get(left)));
                    }
                    else if (state.previous_block === find_label_for_register(program, right)) {
                        reg.set(valid(dest), valid(reg.get(right)));
                    }
                    else {
                        throw Error(`cannot compute Phi(${left}, ${right}) when previous block is '${state.previous_block}'.`)
                    }
                    break;
                }
                case 'Exit':
                    return valid(reg.get(line[Get.Left])).value;
                case 'Block':
                    throw Error(`encountered unexpected Block '${line[Get.Left]}'.`)
                case 'Function':
                    throw Error(`encountered unexpected Function '${line[Get.Left]}'.`)
                default:
                    throw Error(`unhandled instruction type '${(line as Instruction)[Get.Tag]}'`);
            }
            state.pc++;
        }
        throw Error(`reached end of program without an 'Exit' command`);
    }
    catch (error) {
        // catch and then re-throw all errors, with the line-number prepended, for easier debugging
        throw Error(`Line ${state.pc}: ` + (error as Error).message);
    }
}
