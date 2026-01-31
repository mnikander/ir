// Copyright (c) 2025 Marco Nikander

import { Function, Get, Instruction, Label, Register } from "./instructions.ts";
import { valid } from "./type_assertions.ts";

export type Interval = { begin: number, end: number };
export type Edge     = { from: Label, to: Label, availability?: Set<Register> };
export type CFG      = { label: Label, predecessors: Label[], successors: Label[] };

export function verify_single_assignment(instructions: readonly Instruction[]): readonly Instruction[] {
    const assigned_registers = new Set<Register>();

    for (let line: number = 0; line < instructions.length; ++line) {
        const destination: null | Register = instructions[line][Get.Dest];
        if(destination !== null) {
            assign(destination, assigned_registers, line);
        }
        else if (instructions[line][Get.Tag] === 'Function') {
            const args: Register[] = (instructions[line] as Function)[Get.Right];
            args.forEach((arg: Register) => { assign(arg, assigned_registers, line)});
        }
    }
    return instructions;
}

function assign(register: Register, assigned_registers: Set<Register>, line: number): Set<Register> {
    if (assigned_registers.has(register)) {
        throw Error(`Line ${line}: Register ${register} is already assigned`);
    }
    else {
        assigned_registers.add(register);
    }
    return assigned_registers;
}

export function node_list(program: readonly Instruction[]): Label[] {
    const list: Label[] = [];
    const set: Set<Label> = new Set();
    program.forEach(append_label);
    if (list.length !== set.size) throw Error(`Expected all functions and blocks to have unique names`);
    return list;
    
    function append_label(line: Instruction) {
        if (line[Get.Tag] === 'Block' || line[Get.Tag] === 'Function') {
            list.push(line[Get.First]);
            set.add(line[Get.First]);
        }
    };
}

// for each block and function label, find the first and last line in the code
export function table_of_contents(program: readonly Instruction[]): Map<Label, Interval> {
    if (program[0][Get.Left] !== '@entry') throw Error(`Expected valid '@entry' block at start of program`);
    
    const blocks: Map<Label, Interval> = new Map();
    let block: Label = '@entry';
    let first: number = 0;

    for (let index: number = 1; index < program.length; index++) {
        const line: Instruction = program[index];

        if (line[Get.Tag] === 'Block' || line[Get.Tag] === 'Function') {
            // store the current block
            const interval: Interval = { begin: first, end: index };
            blocks.set(block, interval);
            
            // start next block
            block = line[Get.First];
            first = index;
        }
    }
    const interval: Interval = { begin: first, end: program.length };
    blocks.set(block, interval);

    return blocks;
}

export function adjacency_list(program: readonly Instruction[]): Edge[] {
    const edges: Edge[] = [];
    let block: Label = '@';
    for (let index: number = 0; index < program.length; index++) {
        const line: Instruction = program[index];
        if (line[Get.Tag] === 'Block' || line[Get.Tag] === 'Function') {
            block = line[Get.First];
        }
        else if (line[Get.Tag] === 'Jump') {
            const edge: Edge = { from: block, to: line[Get.Left]};
            edges.push(edge);
        }
        else if (line[Get.Tag] === 'Branch') {
            const left_edge: Edge = { from: block, to: line[Get.Left]};
            const right_edge: Edge = { from: block, to: line[Get.Right]};
            edges.push(left_edge);
            edges.push(right_edge);
        }
    }
    return edges;
}

export function control_flow_graph(nodes: Label[], adjacency_list: Edge[]): CFG[] {
    let cfg: CFG[] = [];
    nodes.forEach((label : Label) => { cfg = insert_node(label, cfg) });
    adjacency_list.forEach((edge: Edge) => { cfg = insert_edge(edge, cfg) });
    return cfg;

    function insert_node(block: Label, cfg: CFG[]): CFG[] {
        cfg.push({ label: block, predecessors: [], successors: [] })
        return cfg;
    }
    
    function insert_edge(edge: Edge, cfg: CFG[]): CFG[] {
        const from: CFG = valid(cfg.find((block: CFG) => { return block.label === edge.from; } ));
        const to: CFG   = valid(cfg.find((block: CFG) => { return block.label === edge.to; } ));
        from.successors.push(to.label);
        to.predecessors.push(from.label);
        return cfg;
    }
}
