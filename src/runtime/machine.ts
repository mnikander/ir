// Copyright (c) 2026 Marco Nikander

import {
  Data,
  Pointer,
  Stack,
  to_pointer,
  to_value,
  top,
  Value,
} from "./stack.ts";
import * as LIR from "../low/low_grammar.ts";

export function evaluate(program: LIR.Program): LIR.Primitive {
  let stack: Stack = {
    data: [
      {
        tag: "Value",
        value: 0,
        annotation: "placeholder for the return value of the main-function",
      },
    ],
    frames: [
      {
        // this is a special 'exit-frame' whose only purpose is to catch the
        // return value of the main function
        tag: "Frame",
        return_address: -1,
        base_address: 0,
        pc: -1,
      },
      {
        // main-function frame
        tag: "Frame",
        return_address: 0,
        base_address: 1,
        pc: 0,
      },
    ],
  };

  try {
    while (stack.frames.length > 1) {
      const line: LIR.Instruction = program[top(stack).pc];
      switch (line[LIR.Get.Tag]) {
        case "Constant":     stack =      constant(stack, line); break;
        case "Copy":         stack =          copy(stack, line); break;
        case "Load":         stack =          load(stack, line); break;
        case "Store":        stack =         store(stack, line); break;
        case "Alloc":        stack =         alloc(stack, line); break;
        case "Add":          stack =           add(stack, line); break;
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
        case "Jump":         stack =          jump(stack, line); break;
        case 'Branch':       stack =        branch(stack, line); break;
        // case 'Call':         stack =          call(stack, line, program); break; // TODO: implement next
        case "Return":       stack = ret(stack, line); break;
        default: throw Error(`unhandled instruction type '${(line as LIR.Instruction)[LIR.Get.Tag]}'`);
      }
    }
    return to_value(stack.data[0]).value;
  } catch (error) {
    // catch and then re-throw all errors, with the line-number prepended, for easier debugging
    throw Error(`Line ${top(stack).pc}: ` + (error as Error).message);
  }
}

function constant(stack: Stack, line: LIR.Constant): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + line[LIR.Get.Dest];
  const value: Value = { tag: "Value", value: line[LIR.Get.Left] };
  stack.data[dest] = value;
  top(stack).pc++;
  return stack;
}

function copy(stack: Stack, line: LIR.Copy): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + line[LIR.Get.Dest];
  const source: number = base + line[LIR.Get.Left];
  stack.data[dest] = stack.data[source];
  top(stack).pc++;
  return stack;
}

function load(stack: Stack, line: LIR.Load): Stack {
  const base: number = top(stack).base_address;
  const source_ptr: Pointer = to_pointer(stack.data[line[LIR.Get.Left]]);
  const dest: number = base + line[LIR.Get.Dest];
  stack.data[dest] = stack.data[source_ptr.address];
  top(stack).pc++;
  return stack;
}

function store(stack: Stack, line: LIR.Store): Stack {
  const base: number = top(stack).base_address;
  const source: number = base + line[LIR.Get.Left];
  const dest_ptr: Pointer = to_pointer(stack.data[line[LIR.Get.Dest]]);
  stack.data[dest_ptr.address] = stack.data[source];
  top(stack).pc++;
  return stack;
}

function alloc(stack: Stack, line: LIR.Alloc): Stack {
  const base: number = top(stack).base_address;
  const source: number = base + line[LIR.Get.Left];
  const dest: number = base + line[LIR.Get.Dest];
  const data: Data = stack.data[source];
  const ptr: number = stack.data.push(data) - 1;
  stack.data[dest] = { tag: "Pointer", address: ptr };
  top(stack).pc++;
  return stack;
}

function add(stack: Stack, line: LIR.Add): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + line[LIR.Get.Dest];
  const left: number = base + line[LIR.Get.Left];
  const right: number = base + line[LIR.Get.Right];
  const l: Value = to_value(stack.data[left]);
  const r: Value = to_value(stack.data[right]);
  stack.data[dest] = { tag: "Value", value: l.value + r.value };
  top(stack).pc++;
  return stack;
}

function jump(stack: Stack, line: LIR.Jump): Stack {
  const target: number = line[LIR.Get.Left].line;
  top(stack).pc = target;
  return stack;
}

function branch(stack: Stack, line: LIR.Branch): Stack {
  const base: number = top(stack).base_address;
  const condition: number = base + line[LIR.Get.Left];
  const left: LIR.LineNumber = line[LIR.Get.Right][0];
  const right: LIR.LineNumber = line[LIR.Get.Right][1];
  const c: Value = to_value(stack.data[condition]);
  top(stack).pc = (c.value !== 0) ? left.line : right.line;
  return stack;
}

// TODO: implement call

function ret(stack: Stack, line: LIR.Return): Stack {
  // copy return value
  const base: number = top(stack).base_address;
  const source: number = base + line[LIR.Get.Left];
  const dest: number = top(stack).return_address;
  stack.data[dest] = stack.data[source];
  stack.frames.pop();
  top(stack).pc++;
  return stack;
}
