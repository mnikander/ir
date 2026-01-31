import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { evaluate } from "../src/evaluate.ts";
import { Instruction, Label } from "../src/instructions.ts";
import { adjacency_list, control_flow_graph, Edge, node_list } from "../src/analysis.ts";

function count_cfg_nodes(program: Instruction[]): number {
    const nodes: Label[] = node_list(program);
    const edges: Edge[] = adjacency_list(program);
    return control_flow_graph(nodes, edges).length;
}

describe('constants and exit', () => {
    it('must throw error on empty input', () => {
        const input: Instruction[] = [];
        expect(() => evaluate(input)).toThrow();
    });

    it('must throw error if there is no Exit instruction', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
        ];
        expect(() => evaluate(input)).toThrow();
        expect(count_cfg_nodes(input)).toBe(1);
    });

    it('must throw error if there is no Entry block', () => {
        const input: Instruction[] = [
            [ '%0', 'Const', 11 ],
            [ null, 'Exit', '%0' ],
        ];
        expect(() => evaluate(input)).toThrow();
        // TODO: it would be nice if I could enforce 'CFG.length === 0' here
    });

    it('must throw a runtime-error when exiting with a Reference instead of a Value', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 0 ],
            [ '%1', 'Ref', '%0' ],
            [ null, 'Exit', '%1' ],
        ];
        expect(() => {evaluate(input)}).toThrow();
        expect(count_cfg_nodes(input)).toBe(1);
    });

    it('must evaluate a constant', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ null, 'Exit', '%0' ],
        ];
        expect(evaluate(input)).toBe(11);
        expect(count_cfg_nodes(input)).toBe(1);
    });
});

describe('copying of registers', () => {
    it('must copy a constant', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%1', 'Copy', '%0' ],
            [ null, 'Exit', '%1' ],
        ];
        expect(evaluate(input)).toBe(11);
        expect(count_cfg_nodes(input)).toBe(1);
    });
});

describe('arithmetic operations', () => {
    it('must evaluate integer addition', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%1', 'Const', 22 ],
            [ '%2', 'Add',  '%0', '%1' ],
            [ null, 'Exit', '%2' ],
        ];
        expect(evaluate(input)).toBe(33);
        expect(count_cfg_nodes(input)).toBe(1);
    });
});

describe('labels, jump, and branch', () => {
    it('must report an error if a block falls through into the next label', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            // the missing Terminator statement here, should cause an error

            [ null, 'Block', '@first' ],
            [ '%1', 'Const', 22 ],
            [ null, 'Exit',  '%2' ],
        ];
        expect(() => {evaluate(input)}).toThrow();
        expect(count_cfg_nodes(input)).toBeGreaterThanOrEqual(1);
    });

    it('must execute the correct line of code after an unconditional jump', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ null, 'Jump',  '@second' ],

            [ null, 'Block', '@first' ],
            [ '%1', 'Const', 11 ],
            [ null, 'Exit',  '%1' ],
            
            [ null, 'Block', '@second' ],
            [ '%2', 'Const', 22 ],
            [ null, 'Exit',  '%2' ],
        ];
        expect(evaluate(input)).toBe(22);
        expect(count_cfg_nodes(input)).toBe(3);
    });

    it('must execute first branch if the condition is true', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', true ],
            [ '%1', 'Const', 11 ],
            [ '%2', 'Const', 22 ],
            [ '%3', 'Const', 44 ],
            [ null, 'Branch', '@then', '@else', '%0' ],

            [ null, 'Block', '@then' ],
            [ '%4', 'Add',   '%1', '%2' ],
            [ null, 'Jump',  '@end' ],

            [ null, 'Block', '@else' ],
            [ '%5', 'Add',   '%2', '%3' ],
            [ null, 'Jump',  '@end' ],

            [ null, 'Block', '@end' ],
            [ null, 'Exit',  '%4' ],
        ];
        expect(evaluate(input)).toBe(33);
        expect(count_cfg_nodes(input)).toBe(4);
    });

    it('must execute the second branch when condition is false', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', false ],
            [ '%1', 'Const', 11 ],
            [ '%2', 'Const', 22 ],
            [ '%3', 'Const', 44 ],
            [ null, 'Branch', '@then', '@else' , '%0' ],
            
            [ null, 'Block', '@then' ],
            [ '%4', 'Add',   '%1', '%2' ],
            [ null, 'Jump',  '@end' ],
            
            [ null, 'Block', '@else' ],
            [ '%5', 'Add',   '%2', '%3' ],
            [ null, 'Jump',  '@end' ],
            
            [ null, 'Block', '@end' ],
            [ null, 'Exit',  '%5' ],
        ];
        expect(evaluate(input)).toBe(66);
        expect(count_cfg_nodes(input)).toBe(4);
    });
});

describe('function call', () => {
    it('must support calling the identity function', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%1', 'Const', 22 ],
            [ '%2', 'Call', '@identity', ['%1'] ],
            [ null, 'Exit', '%2' ],

            [ null, 'Function', '@identity', ['%a'] ],
            [ null, 'Return', '%a' ],
        ];
        expect(evaluate(input)).toBe(22);
        expect(count_cfg_nodes(input)).toBe(2);
    });

    it('must support calling a binary function', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%1', 'Const', 22 ],
            [ '%2', 'Call', '@first', ['%0', '%1'] ],
            [ null, 'Exit', '%2' ],

            [ null, 'Function', '@first', ['%a', '%b'] ],
            [ null, 'Return', '%a' ],
        ];
        expect(evaluate(input)).toBe(11);
        expect(count_cfg_nodes(input)).toBe(2);
    });

    it('must evaluate tail-recursive functions', () => {
        // return factorial(5)
        // function factorial(n, acc = 1):
        //     return n == 1 ? acc : factorial(n-1, n*acc);
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 5 ],
            [ '%1', 'Const', 1 ],
            [ '%2', 'Call', '@factorial', ['%0', '%1'] ],
            [ null, 'Exit', '%2' ],

            [ null, 'Function', '@factorial', ['%n', '%acc'] ],
            [ '%3', 'Const', 1 ],
            [ '%6', 'Equal', '%n', '%3' ],
            [ null, 'Branch', '@termination', '@body', '%6' ],
            
            [ null, 'Block', '@body' ],
            [ '%7', 'Subtract', '%n', '%3' ],
            [ '%8', 'Multiply', '%n', '%acc' ],
            [ '%9', 'Call', '@factorial', ['%7', '%8'] ],
            [ null, 'Jump', '@termination' ],
            
            [ null, 'Block', '@termination' ],
            [ '%10', 'Phi', '@body', '%9', '@factorial', '%acc' ],
            [ null, 'Return', '%10' ],
        ];
        expect(evaluate(input)).toBe(120);
        expect(count_cfg_nodes(input)).toBe(4);
    });
});

describe('static single assignment', () => {
    it('must throw an error when re-assigning to a register', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%0', 'Const', 22 ], // attempt to reassign register 0
            [ null, 'Exit', '%1' ],
        ];
        expect(() => {evaluate(input)}).toThrow();
        expect(count_cfg_nodes(input)).toBe(1);
    });

    it('must throw an error when function parameters have the same name', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%1', 'Const', 22 ],
            [ '%2', 'Call', '@first', ['%0', '%1'] ],
            [ null, 'Exit', '%2' ],

            [ null, 'Function', '@first', ['%a', '%a'] ],
            [ null, 'Return', '%a' ],
        ];
        expect(() => {evaluate(input)}).toThrow();
        expect(count_cfg_nodes(input)).toBe(2);
    });

    it('must throw an error when function parameter registers are not unique', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%1', 'Const', 22 ],
            [ '%2', 'Call', '@identity', ['%1'] ],
            [ null, 'Exit', '%2' ],

            [ null, 'Function', '@identity', ['%a'] ],
            [ null, 'Return', '%a' ],

            [ null, 'Function', '@identity2', ['%a'] ],
            [ null, 'Return', '%a' ],
        ];
        expect(() => {evaluate(input)}).toThrow();
        expect(count_cfg_nodes(input)).toBe(3);
    });

    it('phi node must assign from the correct register after an unconditional jump', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ null, 'Jump',  '@second' ],

            [ null, 'Block', '@first' ],
            [ '%1', 'Const', 11 ],
            [ null, 'Jump',  '@end' ],

            [ null, 'Block', '@second' ],
            [ '%2', 'Const', 22 ],
            [ null, 'Jump',  '@end' ],

            [ null, 'Block', '@end' ],
            [ '%3', 'Phi', '@first', '%1', '@second', '%2' ],
            [ null, 'Exit', '%3' ],
        ];
        expect(evaluate(input)).toBe(22);
        expect(count_cfg_nodes(input)).toBe(4);
    });

    it('phi node must assign from the correct register when executing a loop', () => {
        // int i = 0;
        // while (i != 3) {
        //     i++;
        // }
        // return i;
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 0 ],
            [ '%1', 'Const', 1 ],
            [ '%2', 'Const', 3 ],
            [ null, 'Jump',  '@loop' ],
            
            [ null, 'Block', '@loop' ],
            [ '%3', 'Phi', '@entry', '%0', '@loop', '%4' ],
            [ '%4', 'Add',   '%1', '%3' ],
            [ '%5', 'Unequal', '%3', '%2' ],
            [ null, 'Branch', '@loop', '@end', '%5' ],
            
            [ null, 'Block', '@end' ],
            [ null, 'Exit',  '%3' ],
        ];
        expect(evaluate(input)).toBe(3);
        expect(count_cfg_nodes(input)).toBe(3);
    });

    it('phi node must allow assignment from dominator blocks which are not the immediate dominator', () => {
        // Control flow graph with a split in the Entry node and a Join in node D
        //
        //      Entry
        //      /   \
        //     A     B
        //      \    |
        //       \   C
        //        \ /
        //         D
        //
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%condition', 'Const', false ],
            [ null, 'Branch', '@a', '@b', '%condition' ], // hard-code that we take the else-branch to block B

            [ null, 'Block', '@a' ],
            [ '%alpha', 'Const', 10 ],
            [ null, 'Jump', '@d' ],
            
            [ null, 'Block', '@b' ],
            [ '%bravo', 'Const', 20 ],
            [ null, 'Jump', '@c' ],
            
            [ null, 'Block', '@c' ],
            [ '%charlie', 'Const', 21 ],
            [ null, 'Jump', '@d' ],
            
            // join the register from block A with those of block B and C respectively
            [ null, 'Block', '@d' ],
            [ '%grandparent', 'Phi', '@a', '%alpha', '@c', '%bravo' ], // this currently fails, only the immediate predecessor block is available in the interpreter and 'B' comes from a grandparent
            [ '%parent',      'Phi', '@a', '%alpha', '@c', '%charlie' ],
            [ '%total', 'Add', '%grandparent', '%parent'],
            [ null, 'Exit',  '%total' ],
        ];
        expect(evaluate(input)).toBe(41);
        expect(count_cfg_nodes(input)).toBe(5);
    });

    it('phi node must allow assignment when both inputs are available', () => {
        //
        //      Entry
        //        |
        //        A
        //      / |
        //     B  |
        //      \ |
        //        C
        //
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ null, 'Jump', '@a' ],
            
            [ null, 'Block', '@a' ],
            [ '%alpha', 'Const', 10 ],
            [ '%condition', 'Const', true ],
            [ null, 'Branch', '@b', '@c', '%condition' ], // branch to B
            
            [ null, 'Block', '@b' ],
            [ '%bravo', 'Const', 20 ],
            [ null, 'Jump', '@c' ],
            
            [ null, 'Block', '@c' ],
            [ '%result', 'Phi', '@a', '%alpha', '@b', '%bravo' ], // this currently fails, only the immediate predecessor block is available in the interpreter and 'B' comes from a grandparent
            [ null, 'Exit',  '%result' ],
        ];
        expect(evaluate(input)).toBe(20);
        expect(count_cfg_nodes(input)).toBe(4);
    });
});

describe('memory and ownership', () => {
    it('must reference and dereference a register', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%x', 'Const', 42 ],
            [ '%r', 'Ref', '%x' ],
            [ '%t', 'Deref', '%r' ],
            [ null, 'Exit', '%t' ],
        ];
        expect(evaluate(input)).toBe(42);
        expect(count_cfg_nodes(input)).toBe(1);
    });

    it('must detect a use-after-drop', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 0 ],
            [ null, 'Drop', '%0' ],
            [ null, 'Exit', '%0' ],
        ];
        expect(() => {evaluate(input)}).toThrow();
        expect(count_cfg_nodes(input)).toBe(1);
    });

    it.skip('must detect a double-drop', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 0 ],
            [ '%1', 'Const', 0 ],
            [ null, 'Drop', '%0' ],
            [ null, 'Drop', '%0' ],
            [ null, 'Exit', '%1' ],
        ];
        expect(() => {evaluate(input)}).toThrow();
        expect(count_cfg_nodes(input)).toBe(1);
    });

    it('must detect a use-after-move', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 0 ],
            [ '%1', 'Move', '%0' ],
            [ null, 'Exit', '%0' ],
        ];
        expect(() => {evaluate(input)}).toThrow();
        expect(count_cfg_nodes(input)).toBe(1);
    });

    it('must detect a dangling reference when the source register is dropped', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%x', 'Const', 42 ],
            [ '%r', 'Ref', '%x' ],
            [ null, 'Drop', '%x' ],
            [ '%t', 'Deref', '%r' ],
            [ null, 'Exit', '%t' ],
        ];
        // TODO: a borrow-checker should detect this, instead of it being a runtime error:
        expect(() => {evaluate(input)}).toThrow();
        expect(count_cfg_nodes(input)).toBe(1);
    });

    it('must detect a dangling reference when the source register is moved', () => {
        const input: Instruction[] = [
            [ null, 'Block', '@entry' ],
            [ '%x', 'Const', 42 ],
            [ '%r', 'Ref', '%x' ],
            [ '%y', 'Move', '%x' ],
            [ '%t', 'Deref', '%r' ],
            [ null, 'Exit', '%t' ],
        ];
        // TODO: a borrow-checker should detect this, instead of it being a runtime error:
        expect(() => {evaluate(input)}).toThrow();
        expect(count_cfg_nodes(input)).toBe(1);
    });
});
