import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { evaluate, Instruction } from "./three_address_code.ts";

describe('constants and exit', () => {
    it('must throw error on empty input', () => {
        const input: Instruction[] = [];
        expect(() => evaluate(input)).toThrow();
    });

    it('must evaluate a constant', () => {
        const input: Instruction[] = [
            { tag: 'Const', destination: 0, constant: 42 },
            { tag: 'Exit',  result: 0 },
        ];
        expect(evaluate(input)).toBe(42);
    });
});

describe('copying of registers', () => {
    it('must copy a constant', () => {
        const input: Instruction[] = [
            { tag: 'Const', destination: 0, constant: 42 },
            { tag: 'Copy',  destination: 1, source: 0 },
            { tag: 'Exit',  result: 1 },
        ];
        expect(evaluate(input)).toBe(42);
    });
});

describe('arithmetic operations', () => {
    it('must evaluate integer addition', () => {
        const input: Instruction[] = [
            { tag: 'Const', destination: 0, constant: 1 },
            { tag: 'Const', destination: 1, constant: 2 },
            { tag: 'Add',   destination: 2, left: 0, right: 1 },
            { tag: 'Exit',  result: 2 },
        ];
        expect(evaluate(input)).toBe(3);
    });
});

describe('labels, jump, and branch', () => {
    it('must skip over labels as if they are a "no-op"', () => {
        const input: Instruction[] = [
            { tag: 'Const', destination: 0, constant: 1 },
            { tag: 'Label', label: 'First'},
            { tag: 'Const', destination: 1, constant: 2 },
            { tag: 'Label', label: 'Second'},
            { tag: 'Add',   destination: 2, left: 0, right: 1 },
            { tag: 'Label', label: 'Third'},
            { tag: 'Exit',  result: 2 },
        ];
        expect(evaluate(input)).toBe(3);
    });

    it('must execute the correct line of code after an unconditional jump ', () => {
        const input: Instruction[] = [
            { tag: 'Jump',  label: 'Second'},
            { tag: 'Label', label: 'First'},
            { tag: 'Const', destination: 1, constant: 1 },
            { tag: 'Label', label: 'Second'},
            { tag: 'Const', destination: 1, constant: 2 },
            { tag: 'Exit',  result: 1 },
        ];
        expect(evaluate(input)).toBe(2);
    });

    it('must not branch when condition is false', () => {
        const input: Instruction[] = [
            { tag: 'Const',  destination: 0, constant: false },
            { tag: 'Const',  destination: 1, constant: 1 },
            { tag: 'Const',  destination: 2, constant: 2 },
            { tag: 'Const',  destination: 3, constant: 4 },
            { tag: 'Branch', condition: 0, label: 'Else' },
            { tag: 'Add',    destination: 4, left: 1, right: 2 },
            { tag: 'Jump',   label: 'End' },
            { tag: 'Label',  label: 'Else' },
            { tag: 'Add',    destination: 4, left: 2, right: 3 },
            { tag: 'Label',  label: 'End'},
            { tag: 'Exit',   result: 4 },
        ];
        expect(evaluate(input)).toBe(3);
    });

    it('must branch when condition is true', () => {
        const input: Instruction[] = [
            { tag: 'Const',  destination: 0, constant: true },
            { tag: 'Const',  destination: 1, constant: 1 },
            { tag: 'Const',  destination: 2, constant: 2 },
            { tag: 'Const',  destination: 3, constant: 4 },
            { tag: 'Branch', condition: 0, label: 'Else' },
            { tag: 'Add',    destination: 4, left: 1, right: 2 },
            { tag: 'Jump',   label: 'End' },
            { tag: 'Label',  label: 'Else' },
            { tag: 'Add',    destination: 4, left: 2, right: 3 },
            { tag: 'Label',  label: 'End'},
            { tag: 'Exit',   result: 4 },
        ];
        expect(evaluate(input)).toBe(6);
    });
});

describe('function call', () => {
    it('must support calling the identity function', () => {
        const input: Instruction[] = [
            { tag: 'Const',    destination: 0, constant: 0 },
            { tag: 'Const',    destination: 1, constant: 42 },
            { tag: 'Call',     label: 'identity', destination: 2, arguments: [1] },
            { tag: 'Exit',     result: 2 },
            { tag: 'Function', label: 'identity', parameters: ['a'] },
            { tag: 'Return',   result: 0 }, // return register (i.e. argument) 0
        ];
        expect(evaluate(input)).toBe(42);
    });

    it('must support calling a binary function', () => {
        const input: Instruction[] = [
            { tag: 'Const',    destination: 0, constant: 10 },
            { tag: 'Const',    destination: 1, constant: 20 },
            { tag: 'Call',     label: 'first', destination: 2, arguments: [0, 1] },
            { tag: 'Exit',     result: 2 },
            { tag: 'Function', label: 'first', parameters: ['a', 'b'] },
            { tag: 'Return',   result: 0 }, // return register (i.e. argument) 0
        ];
        expect(evaluate(input)).toBe(10);
    });
});
