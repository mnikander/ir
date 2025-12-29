import { Copy, Const, Add, Subtract, Multiply, Divide, Remainder, Register, Value, Get, Equal, Unequal } from "./instructions.ts";
import { get_number, valid } from "./type_assertions.ts";

export function constant(line: Const): Value {
    return { tag: 'Value', value: line[Get.Left] };
}

export function copy(line: Copy, registers: Map<Register, Value>): Value {
    // no need to unpack and repack the object in the register, just copy it
    return valid(registers.get(line[Get.Left]));
}

export function add(line: Add, registers: Map<Register, Value>): Value {
    const left:  number = get_number(registers.get(line[Get.Left]));
    const right: number = get_number(registers.get(line[Get.Right]));
    return { tag: 'Value', value: left + right };
}

export function subtract(line: Subtract, registers: Map<Register, Value>): Value {
    const left:  number = get_number(registers.get(line[Get.Left]));
    const right: number = get_number(registers.get(line[Get.Right]));
    return { tag: 'Value', value: left - right };
}

export function multiply(line: Multiply, registers: Map<Register, Value>): Value {
    const left:  number = get_number(registers.get(line[Get.Left]));
    const right: number = get_number(registers.get(line[Get.Right]));
    return { tag: 'Value', value: left * right };
}

export function divide(line: Divide, registers: Map<Register, Value>): Value {
    const left:  number = get_number(registers.get(line[Get.Left]));
    const right: number = get_number(registers.get(line[Get.Right]));
    return { tag: 'Value', value: left / right };
}

export function remainder(line: Remainder, registers: Map<Register, Value>): Value {
    const left:  number = get_number(registers.get(line[Get.Left]));
    const right: number = get_number(registers.get(line[Get.Right]));
    return { tag: 'Value', value: left % right };
}

export function equal(line: Equal, registers: Map<Register, Value>): Value {
    const left = valid(registers.get(line[Get.Left])).value;
    const right = valid(registers.get(line[Get.Right])).value;
    return { tag: 'Value', value: left === right };
}

export function unequal(line: Unequal, registers: Map<Register, Value>): Value {
    const left = valid(registers.get(line[Get.Left])).value;
    const right = valid(registers.get(line[Get.Right])).value;
    return { tag: 'Value', value: left !== right };
}
