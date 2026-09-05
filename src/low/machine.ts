// Copyright (c) 2026 Marco Nikander

import {
  assert_boolean,
  assert_not_dead,
  assert_pointer,
  assert_value,
  Data,
  Dead,
  Frame,
  initialize_stack,
  is_executable,
  peek,
  Pointer,
  Stack,
  top,
  Value,
} from "../low/stack.ts";
import * as LOW from "./low_grammar.ts";
import assert from "node:assert";

export function evaluate(program: LOW.Program): number {
  let stack: Stack = initialize_stack();
  try {
    while (is_executable(stack)) {
      const op: LOW.Instruction = program[top(stack).pc];
      switch (op[LOW.Get.Tag]) {
        case "noop":          stack =          noop(stack, op); break;
        case "constant":      stack =      constant(stack, op); break;
        case "copy":          stack =          copy(stack, op); break;
        case "load":          stack =          load(stack, op); break;
        case "store":         stack =         store(stack, op); break;
        case "address_of":    stack =    address_of(stack, op); break;
        case "drop":          stack =          drop(stack, op); break;
        case "add":           stack =           add(stack, op); break;
        case "subtract":      stack =      subtract(stack, op); break;
        case "multiply":      stack =      multiply(stack, op); break;
        case "divide":        stack =        divide(stack, op); break;
        case "remainder":     stack =     remainder(stack, op); break;
        case "minimum":       stack =       minimum(stack, op); break;
        case "maximum":       stack =       maximum(stack, op); break;
        case "negate":        stack =        negate(stack, op); break;
        case "equal":         stack =         equal(stack, op); break;
        case "unequal":       stack =       unequal(stack, op); break;
        case "less":          stack =          less(stack, op); break;
        case "less_equal":    stack =    less_equal(stack, op); break;
        case "greater":       stack =       greater(stack, op); break;
        case "greater_equal": stack = greater_equal(stack, op); break;
        case "jump":          stack =          jump(stack, op); break;
        case "branch":        stack =        branch(stack, op); break;
        case "call":          stack =          call(stack, op); break;
        case "return":        stack =           ret(stack, op); break;
        default: throw Error(`unhandled instruction type '${(op as LOW.Instruction)[LOW.Get.Tag]}'`);
      }
    }
  } catch (error) {
    // catch and then re-throw all errors, with the line-number prepended, for easier debugging
    throw Error(`LOW line ${top(stack).pc}: ` + (error as Error).message);
  }
  assert(stack.data.length === 1, "Expect only the main return value to be on the stack.");
  assert(stack.generation.length === 1, "Expect only the main return value to be on the stack.");
  return assert_value(stack.data[0]).value;
}

function noop(stack: Stack, _op: LOW.Noop): Stack {
  top(stack).pc++;
  return stack;
}

function constant(stack: Stack, op: LOW.Constant): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + op[LOW.Get.Dest];
  const value: Value = { tag: "Value", value: op[LOW.Get.Left].value };
  assert_not_dead(stack.data[dest]);
  stack.data[dest] = value;
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function copy(stack: Stack, op: LOW.Copy): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + op[LOW.Get.Dest];
  const source: number = base + op[LOW.Get.Left];
  assert_not_dead(stack.data[source]);
  assert_not_dead(stack.data[dest]);
  stack.data[dest] = stack.data[source];
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function load(stack: Stack, op: LOW.Load): Stack {
  const base: number = top(stack).base_address;
  const source: number = base + op[LOW.Get.Left];
  const source_ptr: Pointer = assert_pointer(stack.data[source]);
  const dest: number = base + op[LOW.Get.Dest];
  assert_not_dead(stack.data[source_ptr.address]);
  assert_not_dead(stack.data[dest]);
  assert(source_ptr.generation === stack.generation[source_ptr.address], "Attempted 'load' from a dangling pointer.");
  stack.data[dest] = stack.data[source_ptr.address];
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function store(stack: Stack, op: LOW.Store): Stack {
  const base: number = top(stack).base_address;
  const source: number = base + op[LOW.Get.Left];
  const dest: number = base + op[LOW.Get.Dest];
  assert_not_dead(stack.data[source]);
  assert_not_dead(stack.data[dest]);
  const dest_ptr: Pointer = assert_pointer(stack.data[dest]);
  assert_not_dead(stack.data[dest_ptr.address]);
  assert(dest_ptr.generation === stack.generation[dest_ptr.address], "Attempted 'store' to a dangling pointer.");
  stack.data[dest_ptr.address] = stack.data[source];
  top(stack).pc++;
  return stack;
}

function address_of(stack: Stack, op: LOW.AddressOf): Stack {
  const base: number = top(stack).base_address;
  const target: number = base + op[LOW.Get.Left];
  const dest: number = base + op[LOW.Get.Dest];
  const target_generation: number = stack.generation[target];
  assert_not_dead(stack.data[dest]);
  assert_not_dead(stack.data[target]);
  stack.data[dest] = { tag: "Pointer", address: target, generation: target_generation };
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function drop(stack: Stack, op: LOW.Drop): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + op[LOW.Get.Dest];
  const value: Dead = { tag: "Dead" };
  assert_not_dead(stack.data[dest]);
  stack.data[dest] = value;
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function add(stack: Stack, op: LOW.Add): Stack {
  return binary_operation(stack, op, (left, right) => left + right);
}

function subtract(stack: Stack, op: LOW.Subtract): Stack {
  return binary_operation(stack, op, (left, right) => left - right);
}

function multiply(stack: Stack, op: LOW.Multiply): Stack {
  return binary_operation(stack, op, (left, right) => left * right);
}

function divide(stack: Stack, op: LOW.Divide): Stack {
  return binary_operation(stack, op, (left, right) => left / right);
}

function remainder(stack: Stack, op: LOW.Remainder): Stack {
  return binary_operation(stack, op, (left, right) => left % right);
}

function minimum(stack: Stack, op: LOW.Minimum): Stack {
  return binary_operation(stack, op, (left, right) => Math.min(left, right));
}

function maximum(stack: Stack, op: LOW.Maximum): Stack {
  return binary_operation(stack, op, (left, right) => Math.max(left, right));
}

function negate(stack: Stack, op: LOW.Negative): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + op[LOW.Get.Dest];
  const left: number = base + op[LOW.Get.Left];
  const l: Value = assert_value(stack.data[left]);
  assert_not_dead(stack.data[dest]);
  assert_not_dead(stack.data[left]);
  stack.data[dest] = { tag: "Value", value: -l.value };
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function equal(stack: Stack, op: LOW.Equal): Stack {
  return comparison_operation(stack, op, (left, right) => left === right);
}

function unequal(stack: Stack, op: LOW.Unequal): Stack {
  return comparison_operation(stack, op, (left, right) => left !== right);
}

function less(stack: Stack, op: LOW.Less): Stack {
  return comparison_operation(stack, op, (left, right) => left < right);
}

function less_equal(stack: Stack, op: LOW.LessEqual): Stack {
  return comparison_operation(stack, op, (left, right) => left <= right);
}

function greater(stack: Stack, op: LOW.Greater): Stack {
  return comparison_operation(stack, op, (left, right) => left > right);
}

function greater_equal(stack: Stack, op: LOW.GreaterEqual): Stack {
  return comparison_operation(stack, op, (left, right) => left >= right);
}

function jump(stack: Stack, op: LOW.Jump): Stack {
  const target: LOW.LineNumber = op[LOW.Get.Left];
  top(stack).pc = target.line;
  return stack;
}

function branch(stack: Stack, op: LOW.Branch): Stack {
  const base: number = top(stack).base_address;
  const condition: number = base + op[LOW.Get.Left];
  const left: LOW.LineNumber = op[LOW.Get.Right][0];
  const right: LOW.LineNumber = op[LOW.Get.Right][1];
  const c: Value = assert_boolean(stack.data[condition]);
  top(stack).pc = (c.value !== 0) ? left.line : right.line;
  return stack;
}

function call(stack: Stack, op: LOW.Call): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + op[LOW.Get.Dest];
  const target: number = op[LOW.Get.Left].line;
  const args: number[] = op[LOW.Get.Right];
  const note: string = op[4];
  assert_not_dead(stack.data[dest]);
  
  stack.data.length++; // allocate space for the return value
  const new_frame: Frame = {
    tag: "Frame",
    return_address: dest,
    base_address: stack.data.length,
    pc: target,
    generation_counter: top(stack).generation_counter,
    note: note,
  };
  const arg_values: Data[] = args.map((offset: number) => { return assert_not_dead(stack.data[base + offset]) });
  stack.data.push(...arg_values)
  stack.control.push(new_frame);
  return stack;
}

function ret(stack: Stack, op: LOW.Return): Stack {
  // copy return value
  const base: number = top(stack).base_address;
  const source: number = base + op[LOW.Get.Left];
  const dest: number = top(stack).return_address;
  assert_not_dead(stack.data[source]);
  assert_not_dead(stack.data[dest]);
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
    | LOW.Add
    | LOW.Subtract
    | LOW.Multiply
    | LOW.Divide
    | LOW.Remainder
    | LOW.Minimum
    | LOW.Maximum
    | LOW.Equal
    | LOW.Unequal
    | LOW.Less
    | LOW.LessEqual
    | LOW.Greater
    | LOW.GreaterEqual,
  operation: (left: number, right: number) => number,
): Stack {
  const base: number = top(stack).base_address;
  const dest: number = base + op[LOW.Get.Dest];
  const left: number = base + op[LOW.Get.Left];
  const right: number = base + op[LOW.Get.Right];
  assert_not_dead(stack.data[left]);
  assert_not_dead(stack.data[right]);
  assert_not_dead(stack.data[dest]);
  const l: Value = assert_value(stack.data[left]);
  const r: Value = assert_value(stack.data[right]);
  stack.data[dest] = { tag: "Value", value: operation(l.value, r.value) };
  stack.generation[dest] = top(stack).generation_counter++;
  top(stack).pc++;
  return stack;
}

function comparison_operation(
  stack: Stack,
  op: LOW.Equal | LOW.Unequal | LOW.Less | LOW.LessEqual | LOW.Greater | LOW.GreaterEqual,
  comparison: (left: number, right: number) => boolean,
): Stack {
  return binary_operation(stack, op, (left, right) => comparison(left, right) ? 1 : 0);
}
