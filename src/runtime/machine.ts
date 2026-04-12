// Copyright (c) 2026 Marco Nikander

import {
  not_dead,
  Data,
  Dead,
  Frame,
  initialize_stack,
  is_executable,
  peek,
  Pointer,
  Stack,
  to_pointer,
  to_value,
  top,
  Value,
} from "./stack.ts";
import * as LIR from "../low/low_grammar.ts";
import assert from "node:assert";

export function evaluate(program: LIR.Program): number {
  let stack: Stack = initialize_stack();
  try {
    while (is_executable(stack)) {
      const op: LIR.Instruction = program[top(stack).pc];
      switch (op[LIR.Get.Tag]) {
        case "Noop":         stack =          noop(stack, op); break;
        case "Constant":     stack =      constant(stack, op); break;
        case "Copy":         stack =          copy(stack, op); break;
        case "Load":         stack =          load(stack, op); break;
        case "Store":        stack =         store(stack, op); break;
        case "AddressOf":    stack =    address_of(stack, op); break;
        case "Drop":         stack =          drop(stack, op); break;
        case "Add":          stack =           add(stack, op); break;
        case "Subtract":     stack =      subtract(stack, op); break;
        case "Multiply":     stack =      multiply(stack, op); break;
        case "Divide":       stack =        divide(stack, op); break;
        case "Remainder":    stack =     remainder(stack, op); break;
        case "Minimum":      stack =       minimum(stack, op); break;
        case "Maximum":      stack =       maximum(stack, op); break;
        case "Negate":       stack =        negate(stack, op); break;
        case "Equal":        stack =         equal(stack, op); break;
        case "Unequal":      stack =       unequal(stack, op); break;
        case "Less":         stack =          less(stack, op); break;
        case "LessEqual":    stack =    less_equal(stack, op); break;
        case "Greater":      stack =       greater(stack, op); break;
        case "GreaterEqual": stack = greater_equal(stack, op); break;
        case "Jump":         stack =          jump(stack, op); break;
        case 'Branch':       stack =        branch(stack, op); break;
        case 'Call':         stack =          call(stack, op); break;
        case "Return":       stack =           ret(stack, op); break;
        default: throw Error(`unhandled instruction type '${(op as LIR.Instruction)[LIR.Get.Tag]}'`);
      }
    }
  } catch (error) {
    // catch and then re-throw all errors, with the line-number prepended, for easier debugging
    throw Error(`Line ${top(stack).pc}: ` + (error as Error).message);
  }
  assert(stack.data.length === 1, "Expect only the main return value to be on the stack.");
  assert(stack.generation.length === 1, "Expect only the main return value to be on the stack.");
  return to_value(stack.data[0]).value;
}

function noop(stack: Stack, _op: LIR.Noop): Stack {
  top(stack).pc++;
  return stack;
}

function constant(stack: Stack, op: LIR.Constant): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + op[LIR.Get.Dest];
  const value: Value = { tag: "Value", value: op[LIR.Get.Left].value };
  not_dead(stack.data[dest]);
  stack.data[dest] = value;
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function copy(stack: Stack, op: LIR.Copy): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + op[LIR.Get.Dest];
  const source: number = base + op[LIR.Get.Left];
  not_dead(stack.data[source]);
  not_dead(stack.data[dest]);
  stack.data[dest] = stack.data[source];
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function load(stack: Stack, op: LIR.Load): Stack {
  const base: number = top(stack).base_address;
  const source: number = base + op[LIR.Get.Left];
  const source_ptr: Pointer = to_pointer(stack.data[source]);
  const dest: number = base + op[LIR.Get.Dest];
  not_dead(stack.data[source_ptr.address]);
  not_dead(stack.data[dest]);
  assert(source_ptr.generation === stack.generation[source_ptr.address], "Attempted 'load' from a dangling pointer.");
  stack.data[dest] = stack.data[source_ptr.address];
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function store(stack: Stack, op: LIR.Store): Stack {
  const base: number = top(stack).base_address;
  const source: number = base + op[LIR.Get.Left];
  const dest: number = base + op[LIR.Get.Dest];
  not_dead(stack.data[source]);
  not_dead(stack.data[dest]);
  const dest_ptr: Pointer = to_pointer(stack.data[dest]);
  not_dead(stack.data[dest_ptr.address]);
  assert(dest_ptr.generation === stack.generation[dest_ptr.address], "Attempted 'store' to a dangling pointer.");
  stack.data[dest_ptr.address] = stack.data[source];
  top(stack).pc++;
  return stack;
}

function address_of(stack: Stack, op: LIR.AddressOf): Stack {
  const base: number = top(stack).base_address;
  const target: number = base + op[LIR.Get.Left];
  const dest: number = base + op[LIR.Get.Dest];
  const target_generation: number = stack.generation[target];
  not_dead(stack.data[dest]);
  not_dead(stack.data[target]);
  stack.data[dest] = { tag: "Pointer", address: target, generation: target_generation };
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function drop(stack: Stack, op: LIR.Drop): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + op[LIR.Get.Dest];
  const value: Dead = { tag: "Dead" };
  not_dead(stack.data[dest]);
  stack.data[dest] = value;
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function add(stack: Stack, op: LIR.Add): Stack {
  return binary_operation(stack, op, (left, right) => left + right);
}

function subtract(stack: Stack, op: LIR.Subtract): Stack {
  return binary_operation(stack, op, (left, right) => left - right);
}

function multiply(stack: Stack, op: LIR.Multiply): Stack {
  return binary_operation(stack, op, (left, right) => left * right);
}

function divide(stack: Stack, op: LIR.Divide): Stack {
  return binary_operation(stack, op, (left, right) => left / right);
}

function remainder(stack: Stack, op: LIR.Remainder): Stack {
  return binary_operation(stack, op, (left, right) => left % right);
}

function minimum(stack: Stack, op: LIR.Minimum): Stack {
  return binary_operation(stack, op, (left, right) => Math.min(left, right));
}

function maximum(stack: Stack, op: LIR.Maximum): Stack {
  return binary_operation(stack, op, (left, right) => Math.max(left, right));
}

function negate(stack: Stack, op: LIR.Negative): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + op[LIR.Get.Dest];
  const left: number = base + op[LIR.Get.Left];
  const l: Value = to_value(stack.data[left]);
  not_dead(stack.data[dest]);
  not_dead(stack.data[left]);
  stack.data[dest] = { tag: "Value", value: -l.value };
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function equal(stack: Stack, op: LIR.Equal): Stack {
  return comparison_operation(stack, op, (left, right) => left === right);
}

function unequal(stack: Stack, op: LIR.Unequal): Stack {
  return comparison_operation(stack, op, (left, right) => left !== right);
}

function less(stack: Stack, op: LIR.Less): Stack {
  return comparison_operation(stack, op, (left, right) => left < right);
}

function less_equal(stack: Stack, op: LIR.LessEqual): Stack {
  return comparison_operation(stack, op, (left, right) => left <= right);
}

function greater(stack: Stack, op: LIR.Greater): Stack {
  return comparison_operation(stack, op, (left, right) => left > right);
}

function greater_equal(stack: Stack, op: LIR.GreaterEqual): Stack {
  return comparison_operation(stack, op, (left, right) => left >= right);
}

function jump(stack: Stack, op: LIR.Jump): Stack {
  const target: LIR.LineNumber = op[LIR.Get.Left];
  top(stack).pc = target.line;
  return stack;
}

function branch(stack: Stack, op: LIR.Branch): Stack {
  const base: number = top(stack).base_address;
  const condition: number = base + op[LIR.Get.Left];
  const left: LIR.LineNumber = op[LIR.Get.Right][0];
  const right: LIR.LineNumber = op[LIR.Get.Right][1];
  const c: Value = to_value(stack.data[condition]);
  top(stack).pc = (c.value !== 0) ? left.line : right.line;
  return stack;
}

function call(stack: Stack, op: LIR.Call): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + op[LIR.Get.Dest];
  const target: number = op[LIR.Get.Left].line;
  const args: number[] = op[LIR.Get.Right];
  const note: string = op[4];
  not_dead(stack.data[dest]);
  
  stack.data.length++; // allocate space for the return value
  const new_frame: Frame = {
    tag: "Frame",
    return_address: dest,
    base_address: stack.data.length,
    pc: target,
    generation_counter: top(stack).generation_counter,
    note: note,
  };
  const arg_values: Data[] = args.map((offset: number) => { return not_dead(stack.data[base + offset]) });
  stack.data.push(...arg_values)
  stack.control.push(new_frame);
  return stack;
}

function ret(stack: Stack, op: LIR.Return): Stack {
  // copy return value
  const base: number = top(stack).base_address;
  const source: number = base + op[LIR.Get.Left];
  const dest: number = top(stack).return_address;
  not_dead(stack.data[source]);
  not_dead(stack.data[dest]);
  stack.data[dest] = stack.data[source];
  stack.data.length = top(stack).base_address;
  stack.generation.length = top(stack).base_address;
  peek(stack).generation_counter = top(stack).generation_counter;
  stack.control.pop();
  top(stack).pc++;
  return stack;
}

function binary_operation(
  stack: Stack,
  op:
    | LIR.Add
    | LIR.Subtract
    | LIR.Multiply
    | LIR.Divide
    | LIR.Remainder
    | LIR.Minimum
    | LIR.Maximum
    | LIR.Equal
    | LIR.Unequal
    | LIR.Less
    | LIR.LessEqual
    | LIR.Greater
    | LIR.GreaterEqual,
  operation: (left: number, right: number) => number,
): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + op[LIR.Get.Dest];
  const left: number = base + op[LIR.Get.Left];
  const right: number = base + op[LIR.Get.Right];
  not_dead(stack.data[left]);
  not_dead(stack.data[right]);
  not_dead(stack.data[dest]);
  const l: Value = to_value(stack.data[left]);
  const r: Value = to_value(stack.data[right]);
  stack.data[dest] = { tag: "Value", value: operation(l.value, r.value) };
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function comparison_operation(
  stack: Stack,
  op: LIR.Equal | LIR.Unequal | LIR.Less | LIR.LessEqual | LIR.Greater | LIR.GreaterEqual,
  comparison: (left: number, right: number) => boolean,
): Stack {
  return binary_operation(stack, op, (left, right) => comparison(left, right) ? 1 : 0);
}
