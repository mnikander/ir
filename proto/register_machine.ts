// Copyright (c) 2026 Marco Nikander

import {
  Frame,
  peek,
  Stack,
  top,
} from "./separate_stacks.ts"
import {
  Get,
  Instruction,
  Primitive,
  Value,
  Copy,
  Constant,
  Load,
  Store,
  Alloc,
  Add,
  Pointer,
  to_value,
  to_pointer,
  Data,
  Return,
  Program,
} from "./low_grammar.ts";

export function evaluate(program: Program): Primitive {

  let stack: Stack = {
    data:
    [
      {
        tag: "Value", 
        value: 0,
        annotation: "placeholder for the return value of the main-function"
      },
    ],
    frames:
    [
      {
        tag: "Frame",
        // this is a special 'exit-frame' whose only purpose is to catch the 
        // return value of the main function
        return_address: -1,
        base_address: 0,
        pc: -1,
      },
      {
        tag: "Frame",
        // this is a special 'exit-frame' whose only purpose is to catch the 
        // return value of the main function
        return_address: 0,
        base_address: 1,
        pc: 0,
      },
    ],
  }
    
    try {
      while (stack.frames.length > 1) {
        const line: Instruction = program[top(stack).pc];
        switch (line[Get.Tag]) {
          case 'Constant':     stack =      constant(stack, line); break;
          case 'Copy':         stack =          copy(stack, line); break;
          case 'Load':         stack =          load(stack, line); break;
          case 'Store':        stack =         store(stack, line); break;
          case 'Alloc':        stack =         alloc(stack, line); break;
          case 'Add':          stack =           add(stack, line); break;
          // case 'Subtract':     stack =      subtract(stack, line); break;
          // case 'Multiply':     stack =      multiply(stack, line); break;
          // case 'Divide':       stack =        divide(stack, line); break;
          // case 'Remainder':    stack =     remainder(stack, line); break;
          // case 'Minimum':      stack =       minimum(stack, line); break;
          // case 'Maximum':      stack =       maximum(stack, line); break;
          // case 'Negate':       stack =      negative(stack, line); break;
          // case 'Equal':        stack =         equal(stack, line); break;
          // case 'Unequal':      stack =       unequal(stack, line); break;
          // case 'Less':         stack =          less(stack, line); break;
          // case 'LessEqual':    stack =    less_equal(stack, line); break;
          // case 'Greater':      stack =       greater(stack, line); break;
          // case 'GreaterEqual': stack = greater_equal(stack, line); break;
          // case 'Jump':         stack =          jump(stack, line, program); break;
          // case 'Branch':       stack =        branch(stack, line, program); break;
          // case 'Call':         stack =          call(stack, line, program); break;
          case 'Return':       stack =           ret(stack, line); break;
          default:             throw Error(`unhandled instruction type '${(line as Instruction)[Get.Tag]}'`);
      }
    }
    return to_value(stack.data[0]).value;
  }
  catch (error) {
    // catch and then re-throw all errors, with the line-number prepended, for easier debugging
    throw Error(`Line ${top(stack).pc}: ` + (error as Error).message);
  }
}

function constant(stack: Stack, line: Constant): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + line[Get.Dest];
  const value: Value = line[Get.Left];
  stack.data[dest] = value;
  top(stack).pc++;
  return stack;
}

function copy(stack: Stack, line: Copy): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + line[Get.Dest];
  const source: number = base + line[Get.Left];
  stack.data[dest] = stack.data[source];
  top(stack).pc++;
  return stack;
}

function load(stack: Stack, line: Load): Stack {
  const base: number = top(stack).base_address;
  const source_ptr: Pointer = to_pointer(stack.data[line[Get.Left]]);
  const dest: number = base + line[Get.Dest];
  stack.data[dest] = stack.data[source_ptr.address];
  top(stack).pc++;
  return stack;
}

function store(stack: Stack, line: Store): Stack {
  const base: number = top(stack).base_address;
  const source: number = base + line[Get.Left];
  const dest_ptr: Pointer = to_pointer(stack.data[line[Get.Dest]]);
  stack.data[dest_ptr.address] = stack.data[source];
  top(stack).pc++;
  return stack;
}

function alloc(stack: Stack, line: Alloc): Stack {
  const base: number = top(stack).base_address;
  const source: number = base + line[Get.Left];
  const dest: number = base + line[Get.Dest];
  const data: Data = stack.data[source];
  const ptr: number = stack.data.push(data) - 1;
  stack.data[dest] = { tag: 'Pointer', address: ptr };
  return stack;
}

function add(stack: Stack, line: Add): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + line[Get.Dest];
  const left: number = base + line[Get.Left];
  const right: number = base + line[Get.Right];
  const l: Value = to_value(stack.data[left]);
  const r: Value = to_value(stack.data[right])
  stack.data[dest] = { tag: "Value", value: l.value + r.value };
  top(stack).pc++;
  return stack;
}

function ret(stack: Stack, line: Return): Stack {
  // copy return value
  const base: number = top(stack).base_address;
  const source: number = base + line[Get.Left];
  const dest: number = top(stack).return_address;
  stack.data[dest] = stack.data[source];
  stack.frames.pop();
  top(stack).pc++;
  return stack;
}
