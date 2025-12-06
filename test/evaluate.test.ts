import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { evaluate } from "../src/evaluate.ts";
import { Instruction } from "../src/instructions.ts";

describe('constants and exit', () => {
    it('must throw error on empty input', () => {
        const input: Instruction[] = [];
        expect(() => evaluate(input)).toThrow();
    });

    it('must evaluate a constant', () => {
        const input: Instruction[] = [
            [    0, 'Const', 42 ],
            [ null, 'Exit',  0 ],
        ];
        expect(evaluate(input)).toBe(42);
    });
});

describe('copying of registers', () => {
    it('must copy a constant', () => {
        const input: Instruction[] = [
            [    0, 'Const', 42 ],
            [    1, 'Copy',  0 ],
            [ null, 'Exit',  1 ],
        ];
        expect(evaluate(input)).toBe(42);
    });
});

describe('arithmetic operations', () => {
    it('must evaluate integer addition', () => {
        const input: Instruction[] = [
            [    0, 'Const', 1 ],
            [    1, 'Const', 2 ],
            [    2, 'Add',   0, 1 ],
            [ null, 'Exit',  2 ],
        ];
        expect(evaluate(input)).toBe(3);
    });
});

describe('labels, jump, and branch', () => {
    it('must skip over labels as if they are a "no-op"', () => {
        const input: Instruction[] = [
            [    0, 'Const', 1 ],
            [ null, 'Label', 'First'],
            [    1, 'Const', 2 ],
            [ null, 'Label', 'Second'],
            [    2, 'Add',   0, 1 ],
            [ null, 'Label', 'Third'],
            [ null, 'Exit',  2 ],
        ];
        expect(evaluate(input)).toBe(3);
    });

    it('must execute the correct line of code after an unconditional jump ', () => {
        const input: Instruction[] = [
            [ null, 'Jump',  'Second'],
            [ null, 'Label', 'First'],
            [    1, 'Const', 1 ],
            [ null, 'Label', 'Second'],
            [    1, 'Const', 2 ],
            [ null, 'Exit',  1 ],
        ];
        expect(evaluate(input)).toBe(2);
    });

    it('must not branch when condition is false', () => {
        const input: Instruction[] = [
            [    0, 'Const',  false ],
            [    1, 'Const',  1 ],
            [    2, 'Const',  2 ],
            [    3, 'Const',  4 ],
            [ null, 'Branch', 0, 'Else' ],
            [    4, 'Add',    1, 2 ],
            [ null, 'Jump',  'End' ],
            [ null, 'Label', 'Else' ],
            [    4, 'Add',    2, 3 ],
            [ null, 'Label', 'End'],
            [ null, 'Exit',   4 ],
        ];
        expect(evaluate(input)).toBe(3);
    });

    it('must branch when condition is true', () => {
        const input: Instruction[] = [
            [    0, 'Const',  true ],
            [    1, 'Const',  1 ],
            [    2, 'Const',  2 ],
            [    3, 'Const',  4 ],
            [ null, 'Branch', 0, 'Else' ],
            [    4, 'Add',    1, 2 ],
            [ null, 'Jump',   'End' ],
            [ null, 'Label',  'Else' ],
            [    4, 'Add',    2, 3 ],
            [ null, 'Label',  'End'],
            [ null, 'Exit',   4 ],
        ];
        expect(evaluate(input)).toBe(6);
    });
});

describe('function call', () => {
    it('must support calling the identity function', () => {
        const input: Instruction[] = [
            [    0, 'Const', 0 ],
            [    1, 'Const', 42 ],
            [    2, 'Call',  'identity', [1] ],
            [ null, 'Exit',  2 ],
            [ null, 'Function', 'identity', ['a'] ],
            [ null, 'Return', 0 ], // return register (i.e. argument) 0
        ];
        expect(evaluate(input)).toBe(42);
    });

    it('must support calling a binary function', () => {
        const input: Instruction[] = [
            [    0, 'Const', 10 ],
            [    1, 'Const', 20 ],
            [    2, 'Call',  'first', [0, 1] ],
            [ null, 'Exit',  2 ],
            [ null, 'Function', 'first', ['a', 'b'] ],
            [ null, 'Return', 0 ], // return register (i.e. argument) 0
        ];
        expect(evaluate(input)).toBe(10);
    });
});
