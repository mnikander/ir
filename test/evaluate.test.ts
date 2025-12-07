import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { evaluate } from "../src/evaluate.ts";
import { Instruction } from "../src/instructions.ts";

describe('constants and exit', () => {
    it('must throw error on empty input', () => {
        const input: Instruction[] = [];
        expect(() => evaluate(input)).toThrow();
    });

    it('must throw error if there is no Exit instruction', () => {
        const input: Instruction[] = [
            [    0, 'Const', 11 ],
        ];
        expect(() => evaluate(input)).toThrow();
    });

    it('must evaluate a constant', () => {
        const input: Instruction[] = [
            [    0, 'Const', 11 ],
            [ null, 'Exit',  0 ],
        ];
        expect(evaluate(input)).toBe(11);
    });
});

describe('copying of registers', () => {
    it('must copy a constant', () => {
        const input: Instruction[] = [
            [    0, 'Const', 11 ],
            [    1, 'Copy',  0 ],
            [ null, 'Exit',  1 ],
        ];
        expect(evaluate(input)).toBe(11);
    });
});

describe('arithmetic operations', () => {
    it('must evaluate integer addition', () => {
        const input: Instruction[] = [
            [    0, 'Const', 11 ],
            [    1, 'Const', 22 ],
            [    2, 'Add',   0, 1 ],
            [ null, 'Exit',  2 ],
        ];
        expect(evaluate(input)).toBe(33);
    });
});

describe('labels, jump, and branch', () => {
    it('must skip over labels as if they are a "no-op"', () => {
        const input: Instruction[] = [
            [    0, 'Const', 11 ],
            [ null, 'Label', 'First'],
            [    1, 'Const', 22 ],
            [ null, 'Label', 'Second'],
            [    2, 'Add',   0, 1 ],
            [ null, 'Label', 'Third'],
            [ null, 'Exit',  2 ],
        ];
        expect(evaluate(input)).toBe(33);
    });

    it('must execute the correct line of code after an unconditional jump ', () => {
        const input: Instruction[] = [
            [ null, 'Jump',  'Second'],
            [ null, 'Label', 'First'],
            [    1, 'Const', 11 ],
            [ null, 'Label', 'Second'],
            [    2, 'Const', 22 ],
            [ null, 'Exit',  2 ],
        ];
        expect(evaluate(input)).toBe(22);
    });

    it('must not branch when condition is false', () => {
        const input: Instruction[] = [
            [    0, 'Const',  false ],
            [    1, 'Const',  11 ],
            [    2, 'Const',  22 ],
            [    3, 'Const',  44 ],
            [ null, 'Branch', 'Else', 0 ],
            [    4, 'Add',    1, 2 ],
            [ null, 'Jump',  'End' ],
            [ null, 'Label', 'Else' ],
            [    5, 'Add',    2, 3 ],
            [ null, 'Label', 'End'],
            [ null, 'Exit',   4 ],
        ];
        expect(evaluate(input)).toBe(33);
    });

    it('must branch when condition is true', () => {
        const input: Instruction[] = [
            [    0, 'Const',  true ],
            [    1, 'Const',  11 ],
            [    2, 'Const',  22 ],
            [    3, 'Const',  44 ],
            [ null, 'Branch', 'Else' , 0],
            [    4, 'Add',    1, 2 ],
            [ null, 'Jump',   'End' ],
            [ null, 'Label',  'Else' ],
            [    5, 'Add',    2, 3 ],
            [ null, 'Label',  'End'],
            [ null, 'Exit',   5 ],
        ];
        expect(evaluate(input)).toBe(66);
    });
});

describe('function call', () => {
    it('must support calling the identity function', () => {
        const input: Instruction[] = [
            [    0, 'Const', 11 ],
            [    1, 'Const', 22 ],
            [    2, 'Call',  'identity', [1] ],
            [ null, 'Exit',  2 ],
            [ null, 'Function', 'identity', ['a'] ],
            [ null, 'Return', 0 ], // return register (i.e. argument) 0
        ];
        expect(evaluate(input)).toBe(22);
    });

    it('must support calling a binary function', () => {
        const input: Instruction[] = [
            [    0, 'Const', 11 ],
            [    1, 'Const', 22 ],
            [    2, 'Call',  'first', [0, 1] ],
            [ null, 'Exit',  2 ],
            [ null, 'Function', 'first', ['a', 'b'] ],
            [ null, 'Return', 0 ], // return register (i.e. argument) 0
        ];
        expect(evaluate(input)).toBe(11);
    });
});

describe('static single assignment', () => {
    it('must throw an error when re-assigning to a register', () => {
        const input: Instruction[] = [
            [    0, 'Const', 11 ],
            [    0, 'Const', 22 ], // attempt to reassign register 0
            [ null, 'Exit',  1 ],
        ];
        expect(() => {evaluate(input)}).toThrow();
    });

    it('phi node must assign from the correct register after an unconditional jump ', () => {
        const input: Instruction[] = [
            [ null, 'Jump',  'Second'],
            [ null, 'Label', 'First'],
            [    1, 'Const', 11 ],
            [ null, 'Label', 'Second'],
            [    2, 'Const', 22 ],
            [ null, 'Label', 'End'],
            [    3, 'Phi',   1, 2 ],
            [ null, 'Exit',  3 ],
        ];
        expect(evaluate(input)).toBe(22);
    });

    it('phi node must assign from the correct register when executing a loop ', () => {
        const input: Instruction[] = [
            [    0, 'Const', 0 ],
            [    1, 'Const', 1 ],
            [    2, 'Const', 3 ],
            [ null, 'Label', 'Loop'],
            [    3, 'Phi',   0, 4 ],
            [    4, 'Add',   1, 3 ],
            [    5, 'Unequal', 3, 2 ],
            [ null, 'Branch', 'Loop', 5],
            [ null, 'Label', 'End'],
            [ null, 'Exit',  3 ],
        ];
        expect(evaluate(input)).toBe(3);
    });
});
