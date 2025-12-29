import { Add, Subtract, Multiply, Divide, Remainder, Register, Value, Get, Equal, Unequal, RawValue } from "./instructions.ts";
import { get_number, valid } from "./type_assertions.ts";

export function arithmetic(instruction: Add | Subtract | Multiply | Divide | Remainder, registers: Map<Register, Value>, op: (left: number, right: number) => number): Value {
    const left: number = get_number(registers.get(instruction[Get.Left]));
    const right: number = get_number(registers.get(instruction[Get.Right]));
    return { tag: 'Value', value: op(left, right) };
}

export function comparison(instruction: Equal | Unequal, registers: Map<Register, Value>, op: (left: RawValue, right: RawValue) => boolean): Value {
    const left = valid(registers.get(instruction[Get.Left])).value;
    const right = valid(registers.get(instruction[Get.Right])).value;
    return { tag: 'Value', value: op(left, right) };
}
