// Copyright (c) 2025 Marco Nikander

import {
  Get,
  Instruction,
  Label,
  Primitive,
  Program,
  Reference,
  Register,
  Value,
} from "./current_grammar.ts";
import { Interval, table_of_contents } from "./analysis.ts";
import {
  add,
  branch,
  call,
  constant,
  copy,
  deref,
  divide,
  drop,
  equal,
  exit,
  greater,
  greater_equal,
  jump,
  less,
  less_equal,
  maximum,
  minimum,
  move,
  multiply,
  negative,
  phi,
  ref,
  remainder,
  returning,
  State,
  subtract,
  top,
  unequal,
} from "./state.ts";

export function evaluate(program: Program): Primitive {
  const toc: Map<Label, Interval> = table_of_contents(program);

  let state: State = {
    stack: [ {registers: new Map<Register, Value | Reference>(), return_pc: undefined, return_block: undefined } ],
    pc: 2, // we skip over `function @main` and its entry-block statement
    current_block: '@main.entry',
    previous_block: undefined,
  };

  try {
    while (state.pc < program.length) {
      if (top(state.stack) === undefined) throw Error(`Bug -- no valid stack frame`);
     
      const line: Instruction     = program[state.pc];
        switch (line[Get.Tag]) {
          case 'Phi':          state =           phi(state, line); break;
          case 'Call':         state =          call(state, line, program, toc); break;
          case 'Const':        state =      constant(state, line); break;
          case 'Copy':         state =          copy(state, line); break;
          case 'Move':         state =          move(state, line); break;
          case 'Drop':         state =          drop(state, line); break;
          case 'Ref':          state =           ref(state, line); break;
          case 'Deref':        state =         deref(state, line); break;
          case 'Add':          state =           add(state, line); break;
          case 'Subtract':     state =      subtract(state, line); break;
          case 'Multiply':     state =      multiply(state, line); break;
          case 'Divide':       state =        divide(state, line); break;
          case 'Remainder':    state =     remainder(state, line); break;
          case 'Minimum':      state =       minimum(state, line); break;
          case 'Maximum':      state =       maximum(state, line); break;
          case 'Negate':       state =      negative(state, line); break;
          case 'Equal':        state =         equal(state, line); break;
          case 'Unequal':      state =       unequal(state, line); break;
          case 'Less':         state =          less(state, line); break;
          case 'LessEqual':    state =    less_equal(state, line); break;
          case 'Greater':      state =       greater(state, line); break;
          case 'GreaterEqual': state = greater_equal(state, line); break;
          case 'Jump':         state =          jump(state, line, program, toc); break;
          case 'Branch':       state =        branch(state, line, program, toc); break;
          case 'Return':       state =     returning(state, line, program); break;
          case 'Exit':         return exit(state, line);
          case 'Function':     throw Error(`encountered unexpected Function '${line[Get.Left]}'.`);
          case 'Block':        throw Error(`encountered unexpected Block '${line[Get.Left]}'.`);
          default:             throw Error(`unhandled instruction type '${(line as Line)[Get.Tag]}'`);
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
