// Copyright (c) 2025 Marco Nikander

import { Get, Instruction, Label, RawValue, Reference, Register, Value } from './instructions.ts'
import { Interval, table_of_contents, verify_single_assignment } from './analysis.ts';
import { add, branch, call, constant, copy, deref, divide, drop, equal, exit, jump, move, multiply, phi, ref, remainder, returning, State, subtract, top, unequal } from "./state.ts";

export function evaluate(program: readonly Instruction[]): RawValue {
    program = verify_single_assignment(program);
    const toc: Map<Label, Interval> = table_of_contents(program);
    if (program[0][Get.Left] !== '@entry') throw Error(`Expected valid '@entry' block at start of program`);

    let state: State = {
        stack: [ {registers: new Map<Register, Value | Reference>(), return_pc: undefined, return_block: undefined } ],
        pc: 1, // we skip over the Entry-block statement at index 0
        current_block: '@entry',
        previous_block: undefined,
    };

    try {
        while (state.pc < program.length) {
            if (top(state.stack) === undefined) throw Error(`Bug -- no valid stack frame`);
            const line: Instruction     = program[state.pc];
    
            switch (line[Get.Tag]) {
                case 'Const':     state =  constant(state, line); break;
                case 'Copy':      state =      copy(state, line); break;
                case 'Drop':      state =      drop(state, line); break;
                case 'Move':      state =      move(state, line); break;
                case 'Ref':       state =       ref(state, line); break;
                case 'Deref':     state =     deref(state, line); break;
                case 'Add':       state =       add(state, line); break;
                case 'Subtract':  state =  subtract(state, line); break;
                case 'Multiply':  state =  multiply(state, line); break;
                case 'Divide':    state =    divide(state, line); break;
                case 'Remainder': state = remainder(state, line); break;
                case 'Equal':     state =     equal(state, line); break;
                case 'Unequal':   state =   unequal(state, line); break;
                case 'Jump':      state =      jump(state, line, program, toc); break;
                case 'Branch':    state =    branch(state, line, program, toc); break;
                case 'Call':      state =      call(state, line, program, toc); break;
                case 'Return':    state = returning(state, line, program); break;
                case 'Phi':       state =       phi(state, line); break;
                case 'Exit':      return exit(state, line);
                case 'Block':     throw Error(`encountered unexpected Block '${line[Get.Left]}'.`);
                case 'Function':  throw Error(`encountered unexpected Function '${line[Get.Left]}'.`);
                default:          throw Error(`unhandled instruction type '${(line as Instruction)[Get.Tag]}'`);
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
