import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { evaluate } from "../src/evaluate.ts";
import { Label, Program } from "../src/instructions.ts";
import { adjacency_list, analyze, control_flow_graph, Edge, node_list, table_of_contents } from "../src/analysis.ts";

function count_cfg_nodes(program: Program): number {
    const nodes: Label[] = node_list(program);
    const edges: Edge[]  = adjacency_list(program);
    return control_flow_graph(nodes, edges).length;
}

describe('constants and exit', () => {
    it('must throw error on empty input', () => {
        // (empty program)
        const input: Program = [];
        expect(() => evaluate(analyze(input))).toThrow();
    });

    it('must throw error if there is no Exit instruction', () => {
        // block @entry:
        // %0 = constant 11

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
        ];
        expect(() => evaluate(analyze(input))).toThrow();
        expect(count_cfg_nodes(input)).toBe(1);
        expect(table_of_contents(input).size).toBe(1);
    });

    it('must throw error if there is no Entry block', () => {
        // %0 = constant 11
        // exit %0

        const input: Program = [
            [ '%0', 'Const', 11 ],
            [ null, 'Exit', '%0' ],
        ];
        expect(() => evaluate(analyze(input))).toThrow();
        // TODO: it would be nice if I could enforce 'CFG.length === 0' here
    });

    it('must throw a runtime-error when exiting with a Reference instead of a Value', () => {
        // block @entry:
        // %0 = constant 0
        // %1 = ref %0
        // exit %1

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 0 ],
            [ '%1', 'Ref', '%0' ],
            [ null, 'Exit', '%1' ],
        ];
        expect(() => {evaluate(analyze(input))}).toThrow();
        expect(count_cfg_nodes(input)).toBe(1);
        expect(table_of_contents(input).size).toBe(1);
    });

    it('must evaluate a constant', () => {
        // block @entry:
        // %0 = constant 11
        // exit %0

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ null, 'Exit', '%0' ],
        ];
        expect(evaluate(analyze(input))).toBe(11);
        expect(count_cfg_nodes(input)).toBe(1);
        expect(table_of_contents(input).size).toBe(1);
    });
});

describe('copying of registers', () => {
    it('must copy a constant', () => {
        // block @entry:
        // %0 = constant 11
        // %1 = copy %0
        // exit %1

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%1', 'Copy', '%0' ],
            [ null, 'Exit', '%1' ],
        ];
        expect(evaluate(analyze(input))).toBe(11);
        expect(count_cfg_nodes(input)).toBe(1);
        expect(table_of_contents(input).size).toBe(1);
    });
});

describe('arithmetic operations', () => {
    it('must evaluate integer addition', () => {
        // block @entry:
        // %0 = constant 11
        // %1 = constant 22
        // %2 = add %0, %1
        // exit %2

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%1', 'Const', 22 ],
            [ '%2', 'Add',  '%0', '%1' ],
            [ null, 'Exit', '%2' ],
        ];
        expect(evaluate(analyze(input))).toBe(33);
        expect(count_cfg_nodes(input)).toBe(1);
        expect(table_of_contents(input).size).toBe(1);
    });
});

describe('labels, jump, and branch', () => {
    it('must report an error if a block falls through into the next label', () => {
        // block @entry:
        // %0 = constant 11
        // (missing terminator)
        //
        // block @first:
        // %1 = constant 22
        // exit %2
        
        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            // the missing Terminator statement here, should cause an error

            [ null, 'Block', '@first' ],
            [ '%1', 'Const', 22 ],
            [ null, 'Exit',  '%2' ],
        ];
        expect(() => {evaluate(analyze(input))}).toThrow();
        expect(count_cfg_nodes(input)).toBeGreaterThanOrEqual(1);
        expect(table_of_contents(input).size).toBeGreaterThanOrEqual(1);
    });

    it('must execute the correct line of code after an unconditional jump', () => {
        // block @entry:
        // jump @second
        //
        // block @first:
        // %1 = constant 11
        // exit %1
        //
        // block @second:
        // %2 = constant 22
        // exit %2

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ null, 'Jump',  '@second' ],

            [ null, 'Block', '@first' ],
            [ '%1', 'Const', 11 ],
            [ null, 'Exit',  '%1' ],
            
            [ null, 'Block', '@second' ],
            [ '%2', 'Const', 22 ],
            [ null, 'Exit',  '%2' ],
        ];
        expect(evaluate(analyze(input))).toBe(22);
        expect(count_cfg_nodes(input)).toBe(3);
        expect(table_of_contents(input).size).toBe(3);
    });

    it('must execute first branch if the condition is true', () => {
        // block @entry:
        // %0 = constant true
        // %1 = constant 11
        // %2 = constant 22
        // %3 = constant 44
        // branch %0 @then @else
        //
        // block @then:
        // %4 = add %1, %2
        // jump @end
        //
        // block @else:
        // %5 = add %2, %3
        // jump @end
        //
        // block @end:
        // exit %4

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', true ],
            [ '%1', 'Const', 11 ],
            [ '%2', 'Const', 22 ],
            [ '%3', 'Const', 44 ],
            [ null, 'Branch', '%0', ['@then', '@else'] ],

            [ null, 'Block', '@then' ],
            [ '%4', 'Add',   '%1', '%2' ],
            [ null, 'Jump',  '@end' ],

            [ null, 'Block', '@else' ],
            [ '%5', 'Add',   '%2', '%3' ],
            [ null, 'Jump',  '@end' ],

            [ null, 'Block', '@end' ],
            [ null, 'Exit',  '%4' ],
        ];
        expect(evaluate(analyze(input))).toBe(33);
        expect(count_cfg_nodes(input)).toBe(4);
        expect(table_of_contents(input).size).toBe(4);
    });

    it('must execute the second branch when condition is false', () => {
        // block @entry:
        // %0 = constant false
        // %1 = constant 11
        // %2 = constant 22
        // %3 = constant 44
        // branch %0 @then @else
        //
        // block @then:
        // %4 = add %1, %2
        // jump @end
        //
        // block @else:
        // %5 = add %2, %3
        // jump @end
        //
        // block @end:
        // exit %5

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', false ],
            [ '%1', 'Const', 11 ],
            [ '%2', 'Const', 22 ],
            [ '%3', 'Const', 44 ],
            [ null, 'Branch', '%0', ['@then', '@else'] ],
            
            [ null, 'Block', '@then' ],
            [ '%4', 'Add',   '%1', '%2' ],
            [ null, 'Jump',  '@end' ],
            
            [ null, 'Block', '@else' ],
            [ '%5', 'Add',   '%2', '%3' ],
            [ null, 'Jump',  '@end' ],
            
            [ null, 'Block', '@end' ],
            [ null, 'Exit',  '%5' ],
        ];
        expect(evaluate(analyze(input))).toBe(66);
        expect(count_cfg_nodes(input)).toBe(4);
        expect(table_of_contents(input).size).toBe(4);
    });
});

describe('function call', () => {
    it('must support calling the identity function', () => {
        // block @entry:
        // %0 = constant 11
        // %1 = constant 22
        // %2 = call @identity [%1]
        // exit %2
        //
        // function @identity [%a]:
        // block @entry:
        // return %a

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%1', 'Const', 22 ],
            [ '%2', 'Call', '@identity', ['%1'] ],
            [ null, 'Exit', '%2' ],

            [ null, 'Function', '@identity', ['%a'] ],
            // [ null, 'Block', '@entry' ], // TODO: this needs to work
            [ null, 'Return', '%a' ],
        ];
        expect(evaluate(analyze(input))).toBe(22);
        expect(count_cfg_nodes(input)).toBe(2);
        expect(table_of_contents(input).size).toBe(2);
    });

    it('must support calling a binary function', () => {
        // block @entry:
        // %0 = constant 11
        // %1 = constant 22
        // %2 = call @first [%0, %1]
        // exit %2
        //
        // function @first [%a, %b]:
        // block @entry:
        // return %a

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%1', 'Const', 22 ],
            [ '%2', 'Call', '@first', ['%0', '%1'] ],
            [ null, 'Exit', '%2' ],

            [ null, 'Function', '@first', ['%a', '%b'] ],
            // [ null, 'Block', '@entry' ], // TODO: this needs to work
            [ null, 'Return', '%a' ],
        ];
        expect(evaluate(analyze(input))).toBe(11);
        expect(count_cfg_nodes(input)).toBe(2);
        expect(table_of_contents(input).size).toBe(2);
    });

    it('must evaluate tail-recursive functions', () => {
        // C-style:
        //
        // return factorial(5)
        // function factorial(n, acc = 1):
        //     return n == 1 ? acc : factorial(n-1, n*acc);
        //
        //
        // IR code:
        //
        // block @entry:
        // %0 = constant 5
        // %1 = constant 1
        // %2 = call @factorial [%0, %1]
        // exit %2
        //
        // function @factorial [%n, %acc]:
        // block @entry:
        // %3 = constant 1
        // %6 = equal %n, %3
        // branch %6 @termination @body
        //
        // block @body:
        // %7 = subtract %n, %3
        // %8 = multiply %n, %acc
        // %9 = call @factorial [%7, %8]
        // jump @termination
        //
        // block @termination:
        // %10 = phi [[@body, %9], [@factorial, %acc]]
        // return %10

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 5 ],
            [ '%1', 'Const', 1 ],
            [ '%2', 'Call', '@factorial', ['%0', '%1'] ],
            [ null, 'Exit', '%2' ],

            [ null, 'Function', '@factorial', ['%n', '%acc'] ],
            // [ null, 'Block', '@entry' ], // TODO: this needs to work
            [ '%3', 'Const', 1 ],
            [ '%6', 'Equal', '%n', '%3' ],
            [ null, 'Branch', '%6', ['@termination', '@body'] ],
            
            [ null, 'Block', '@body' ],
            [ '%7', 'Subtract', '%n', '%3' ],
            [ '%8', 'Multiply', '%n', '%acc' ],
            [ '%9', 'Call', '@factorial', ['%7', '%8'] ],
            [ null, 'Jump', '@termination' ],
            
            [ null, 'Block', '@termination' ],
            [ '%10', 'Phi', [['@body', '%9'], ['@factorial', '%acc']] ],
            [ null, 'Return', '%10' ],
        ];
        expect(evaluate(analyze(input))).toBe(120);
        expect(count_cfg_nodes(input)).toBe(4);
        expect(table_of_contents(input).size).toBe(4);
    });
});

describe('static single assignment', () => {
    it('must throw an error when re-assigning to a register', () => {
        // block @entry:
        // %0 = constant 11
        // %0 = constant 22
        // exit %1

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%0', 'Const', 22 ], // attempt to reassign register 0
            [ null, 'Exit', '%1' ],
        ];
        expect(() => {evaluate(analyze(input))}).toThrow();
        expect(count_cfg_nodes(input)).toBe(1);
        expect(table_of_contents(input).size).toBe(1);
    });

    it('must throw an error when function parameters have the same name', () => {
        // block @entry:
        // %0 = constant 11
        // %1 = constant 22
        // %2 = call @first [%0, %1]
        // exit %2
        //
        // function @first [%a, %a]:
        // block @entry:
        // return %a

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%1', 'Const', 22 ],
            [ '%2', 'Call', '@first', ['%0', '%1'] ],
            [ null, 'Exit', '%2' ],

            [ null, 'Function', '@first', ['%a', '%a'] ],
            // [ null, 'Block', '@entry' ], // TODO: this needs to work
            [ null, 'Return', '%a' ],
        ];
        expect(() => {evaluate(analyze(input))}).toThrow();
        expect(count_cfg_nodes(input)).toBe(2);
        expect(table_of_contents(input).size).toBe(2);
    });

    it('must throw an error when function parameter registers are not unique', () => {
        // block @entry:
        // %0 = constant 11
        // %1 = constant 22
        // %2 = call @identity [%1]
        // exit %2

        // function @identity [%a]:
        // block @entry:
        // return %a

        // function @identity2 [%a]:
        // block @entry:
        // return %a

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 11 ],
            [ '%1', 'Const', 22 ],
            [ '%2', 'Call', '@identity', ['%1'] ],
            [ null, 'Exit', '%2' ],

            [ null, 'Function', '@identity', ['%a'] ],
            // [ null, 'Block', '@entry' ], // TODO: this needs to work
            [ null, 'Return', '%a' ],

            [ null, 'Function', '@identity2', ['%a'] ],
            // [ null, 'Block', '@entry' ], // TODO: this needs to work
            [ null, 'Return', '%a' ],
        ];
        expect(() => {evaluate(analyze(input))}).toThrow();
        expect(count_cfg_nodes(input)).toBe(3);
        expect(table_of_contents(input).size).toBe(3);
    });

    it('phi node must assign from the correct register after an unconditional jump', () => {
        // block @entry:
        // jump @second
        //
        // block @first:
        // %1 = constant 11
        // jump @end
        //
        // block @second:
        // %2 = constant 22
        // jump @end
        //
        // block @end:
        // %3 = phi [[@first, %1], [@second, %2]]
        // exit %3

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ null, 'Jump',  '@second' ],

            [ null, 'Block', '@first' ],
            [ '%1', 'Const', 11 ],
            [ null, 'Jump',  '@end' ],

            [ null, 'Block', '@second' ],
            [ '%2', 'Const', 22 ],
            [ null, 'Jump',  '@end' ],

            [ null, 'Block', '@end' ],
            [ '%3', 'Phi', [['@first', '%1'], ['@second', '%2']] ],
            [ null, 'Exit', '%3' ],
        ];
        expect(evaluate(analyze(input))).toBe(22);
        expect(count_cfg_nodes(input)).toBe(4);
        expect(table_of_contents(input).size).toBe(4);
    });

    it('phi node must assign from the correct register when executing a loop', () => {
        // C-style:
        //
        // int i = 0;
        // while (i != 3) {
        //     i++;
        // }
        // return i;
        //
        //
        // IR-code:
        //
        // block @entry:
        // %0 = constant 0
        // %1 = constant 1
        // %2 = constant 3
        // jump @loop
        //
        // block @loop:
        // %3 = phi [[@entry, %0], [@loop, %4]]
        // %4 = add %1, %3
        // %5 = unequal %3, %2
        // branch %5 @loop @end
        //
        // block @end:
        // exit %3

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 0 ],
            [ '%1', 'Const', 1 ],
            [ '%2', 'Const', 3 ],
            [ null, 'Jump',  '@loop' ],
            
            [ null, 'Block', '@loop' ],
            [ '%3', 'Phi', [['@entry', '%0'], ['@loop', '%4']] ],
            [ '%4', 'Add',   '%1', '%3' ],
            [ '%5', 'Unequal', '%3', '%2' ],
            [ null, 'Branch', '%5', ['@loop', '@end'] ],
            
            [ null, 'Block', '@end' ],
            [ null, 'Exit',  '%3' ],
        ];
        expect(evaluate(analyze(input))).toBe(3);
        expect(count_cfg_nodes(input)).toBe(3);
        expect(table_of_contents(input).size).toBe(3);
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
        //
        // block @entry:
        // %condition = constant false
        // branch %condition @a @b
        //
        // block @a:
        // %alpha = constant 10
        // jump @d
        //
        // block @b:
        // %bravo = constant 20
        // jump @c
        //
        // block @c:
        // %charlie = constant 21
        // jump @d
        //
        // block @d:
        // %grandparent = phi [[@a, %alpha], [@c, %bravo]]
        // %parent = phi [[@a, %alpha], [@c, %charlie]]
        // %total = add %grandparent, %parent
        // exit %total

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%condition', 'Const', false ],
            [ null, 'Branch', '%condition', ['@a', '@b'] ], // hard-code that we take the else-branch to block B

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
            [ '%grandparent', 'Phi', [['@a', '%alpha'], ['@c', '%bravo']] ], // this currently fails, only the immediate predecessor block is available in the interpreter and 'B' comes from a grandparent
            [ '%parent',      'Phi', [['@a', '%alpha'], ['@c', '%charlie']] ],
            [ '%total', 'Add', '%grandparent', '%parent'],
            [ null, 'Exit',  '%total' ],
        ];
        expect(evaluate(analyze(input))).toBe(41);
        expect(count_cfg_nodes(input)).toBe(5);
        expect(table_of_contents(input).size).toBe(5);
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
        //
        // block @entry:
        // jump @a
        // 
        // block @a:
        // %alpha = constant 10
        // %condition = constant true
        // branch %condition @b @c
        // 
        // block @b:
        // %bravo = constant 20
        // jump @c
        //
        // block @c:
        // %result = phi [[@a, %alpha], [@b, %bravo]]
        // exit %result

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ null, 'Jump', '@a' ],
            
            [ null, 'Block', '@a' ],
            [ '%alpha', 'Const', 10 ],
            [ '%condition', 'Const', true ],
            [ null, 'Branch', '%condition', ['@b', '@c'] ], // branch to B
            
            [ null, 'Block', '@b' ],
            [ '%bravo', 'Const', 20 ],
            [ null, 'Jump', '@c' ],
            
            [ null, 'Block', '@c' ],
            [ '%result', 'Phi', [['@a', '%alpha'], ['@b', '%bravo']] ],
            [ null, 'Exit',  '%result' ],
        ];
        expect(evaluate(analyze(input))).toBe(20);
        expect(count_cfg_nodes(input)).toBe(4);
        expect(table_of_contents(input).size).toBe(4);
    });

    it('must allow assignment when three inputs are available', () => {
        //
        //        Entry
        //        |   |
        //        A   |
        //      / |   |
        //     B  |  /
        //      \ | /
        //        C
        //
        //
        // block @entry:
        // %echo = constant false
        // branch %echo @a @c
        // 
        // block @a:
        // %alpha = constant true
        // branch %alpha @b @c
        // 
        // block @b:
        // %bravo = constant true
        // jump @c
        //
        // block @c:
        // %result = phi [[@entry, %echo], [@a, %alpha], [@b, %bravo]]
        // exit %result

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%echo', 'Const', false ],
            [ null, 'Branch','%echo', [ '@a', '@c']],
            
            [ null, 'Block', '@a' ],
            [ '%alpha', 'Const', true ],
            [ null, 'Branch', '%alpha', ['@b', '@c'] ], // branch to B
            
            [ null, 'Block', '@b' ],
            [ '%bravo', 'Const', true ],
            [ null, 'Jump', '@c' ],
            
            [ null, 'Block', '@c' ],
            [ '%result', 'Phi', [['@entry', '%echo'], ['@a', '%alpha'], ['@b', '%bravo']] ],
            [ null, 'Exit',  '%result' ],
        ];
        expect(evaluate(analyze(input))).toBe(false);
        expect(count_cfg_nodes(input)).toBe(4);
        expect(table_of_contents(input).size).toBe(4);
    });

    it('must throw an error when a phi node is non-exhaustive', () => {
        //
        //        Entry
        //        |   |
        //        A   |
        //      / |   |
        //     B  |  /
        //      \ | /
        //        C
        //
        //
        // block @entry:
        // %echo = constant false
        // branch %echo @a @c
        // 
        // block @a:
        // %alpha = constant true
        // branch %alpha @b @c
        // 
        // block @b:
        // %bravo = constant true
        // jump @c
        //
        // block @c:
        // %result = phi [[@a, %alpha], [@b, %bravo]]  // this phi-node does NOT cover all incoming edges
        // exit %result

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%echo', 'Const', false ],
            [ null, 'Branch', '%echo', ['@a', '@c'] ],
            
            [ null, 'Block', '@a' ],
            [ '%alpha', 'Const', true ],
            [ null, 'Branch', '%alpha', ['@b', '@c'] ], // branch to B
            
            [ null, 'Block', '@b' ],
            [ '%bravo', 'Const', true ],
            [ null, 'Jump', '@c' ],
            
            [ null, 'Block', '@c' ],
            [ '%result', 'Phi', [['@a', '%alpha'], ['@b', '%bravo']] ], // this phi-node does NOT cover all incoming edges
            [ null, 'Exit',  '%result' ],
        ];
        // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
        expect(() => {evaluate(input)}).toThrow(); // runtime must flag this as an error
        expect(count_cfg_nodes(input)).toBe(4);
        expect(table_of_contents(input).size).toBe(4);
    });
});

describe('memory and ownership', () => {
    it('must reference and dereference a register', () => {
        // block @entry:
        // %x = constant 42
        // %r = ref %x
        // %t = deref %r
        // exit %t

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%x', 'Const', 42 ],
            [ '%r', 'Ref', '%x' ],
            [ '%t', 'Deref', '%r' ],
            [ null, 'Exit', '%t' ],
        ];
        expect(evaluate(analyze(input))).toBe(42);
        expect(count_cfg_nodes(input)).toBe(1);
        expect(table_of_contents(input).size).toBe(1);
    });

    it('must detect a use-after-drop', () => {
        // block @entry:
        // %0 = constant 0
        // drop %0
        // exit %0

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 0 ],
            [ null, 'Drop', '%0' ],
            [ null, 'Exit', '%0' ],
        ];
        // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
        expect(() => {evaluate(input)}).toThrow(); // runtime must flag this as an error
        expect(count_cfg_nodes(input)).toBe(1);
        expect(table_of_contents(input).size).toBe(1);
    });

    it('must detect a double-drop', () => {
        // block @entry:
        // %0 = constant 0
        // %1 = constant 0
        // drop %0
        // drop %0
        // exit %1

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 0 ],
            [ '%1', 'Const', 0 ],
            [ null, 'Drop', '%0' ],
            [ null, 'Drop', '%0' ],
            [ null, 'Exit', '%1' ],
        ];
        // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
        expect(() => {evaluate(input)}).toThrow(); // runtime must flag this as an error
        expect(count_cfg_nodes(input)).toBe(1);
        expect(table_of_contents(input).size).toBe(1);
    });

    it('must detect a use-after-move', () => {
        // block @entry:
        // %0 = constant 0
        // %1 = move %0
        // exit %0

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%0', 'Const', 0 ],
            [ '%1', 'Move', '%0' ],
            [ null, 'Exit', '%0' ],
        ];
        // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
        expect(() => {evaluate(input)}).toThrow(); // runtime must flag this as an error
        expect(count_cfg_nodes(input)).toBe(1);
        expect(table_of_contents(input).size).toBe(1);
    });

    it('must detect a dangling reference when the source register is dropped', () => {
        // block @entry:
        // %x = constant 42
        // %r = ref %x
        // drop %x
        // %t = deref %r
        // exit %t

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%x', 'Const', 42 ],
            [ '%r', 'Ref', '%x' ],
            [ null, 'Drop', '%x' ],
            [ '%t', 'Deref', '%r' ],
            [ null, 'Exit', '%t' ],
        ];
        // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
        expect(() => {evaluate(input)}).toThrow(); // runtime must flag this as an error
        expect(count_cfg_nodes(input)).toBe(1);
        expect(table_of_contents(input).size).toBe(1);
    });

    it('must detect a dangling reference when the source register is moved', () => {
        // block @entry:
        // %x = constant 42
        // %r = ref %x
        // %y = move %x
        // %t = deref %r
        // exit %t

        const input: Program = [
            [ null, 'Block', '@entry' ],
            [ '%x', 'Const', 42 ],
            [ '%r', 'Ref', '%x' ],
            [ '%y', 'Move', '%x' ],
            [ '%t', 'Deref', '%r' ],
            [ null, 'Exit', '%t' ],
        ];
        // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
        expect(() => {evaluate(input)}).toThrow(); // runtime must flag this as an error
        expect(count_cfg_nodes(input)).toBe(1);
        expect(table_of_contents(input).size).toBe(1);
    });
});
