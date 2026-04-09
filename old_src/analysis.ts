// Copyright (c) 2025 Marco Nikander

import {
  Function,
  Get,
  Instruction,
  Label,
  Program,
  Register,
} from "./old_grammar.ts";
import { valid } from "./utility.ts";

export type Interval = { begin: number; end: number };
export type Edge = { from: Label; to: Label; availability?: Set<Register> };
export type CFG = {
  label: Label;
  predecessors: number[];
  successors: number[];
};

export function analyze(program: Program): Program {
  program = verify_single_assignment(program);
  if (program[0][Get.Tag] !== "Function" || program[0][Get.Left] !== "@main") {
    throw Error(`Expected valid '@main' function at start of program`);
  }
  if (
    program[1][Get.Tag] !== "Block" || program[1][Get.Left] !== "@main.entry"
  ) throw Error(`Expected valid '@main.entry' block after '@main' function`);

  const nodes: Label[] = node_list(program);
  const edges: Edge[] = adjacency_list(program);
  const cfg: CFG[] = control_flow_graph(nodes, edges);
  const _reach: Map<Label, Set<Label>> = reachability(nodes, edges);
  if (cfg.length < 1) {
    throw Error(`Expected control flow graph to contain at least one block`);
  }

  return program;
}

function verify_single_assignment(instructions: Program): Program {
  const assigned_registers = new Set<Register>();

  for (let line: number = 0; line < instructions.length; ++line) {
    const destination: null | Register = instructions[line][Get.Dest];
    if (destination !== null) {
      assign_register(destination, assigned_registers, line);
    } else if (instructions[line][Get.Tag] === "Function") {
      const args: Register[] = (instructions[line] as Function)[Get.Right];
      args.forEach((arg: Register) => {
        assign_register(arg, assigned_registers, line);
      });
    }
  }
  return instructions;
}

function assign_register(
  register: Register,
  assigned_registers: Set<Register>,
  line: number,
): Set<Register> {
  if (assigned_registers.has(register)) {
    throw Error(`Line ${line}: Register ${register} is already assigned`);
  } else {
    assigned_registers.add(register);
  }
  return assigned_registers;
}

export function node_list(program: Program): Label[] {
  const list: Label[] = [];
  const set: Set<Label> = new Set();
  program.forEach(append_label);
  if (list.length !== set.size) {
    throw Error(`Expected all blocks to have unique names`);
  }
  return list;

  function append_label(line: Instruction) {
    if (line[Get.Tag] === "Block") {
      list.push(line[Get.Left]);
      set.add(line[Get.Left]);
    }
  }
}

export function adjacency_list(program: Program): Edge[] {
  const edges: Edge[] = [];
  let block: Label = "@";
  for (let index: number = 0; index < program.length; index++) {
    const line: Instruction = program[index];
    if (line[Get.Tag] === "Block") {
      block = line[Get.Left];
    } else if (line[Get.Tag] === "Jump") {
      const edge: Edge = { from: block, to: line[Get.Left] };
      edges.push(edge);
    } else if (line[Get.Tag] === "Branch") {
      const left_edge: Edge = { from: block, to: line[Get.Right][0] };
      const right_edge: Edge = { from: block, to: line[Get.Right][1] };
      edges.push(left_edge);
      edges.push(right_edge);
    }
  }
  return edges;
}

// for each block and function label, find the first and last line in the code
export function table_of_contents(program: Program): Map<Label, Interval> {
  if (program[0][Get.Tag] !== "Function" || program[0][Get.Left] !== "@main") {
    throw Error(`Expected valid '@main' function at start of program`);
  }
  if (
    program[1][Get.Tag] !== "Block" || program[1][Get.Left] !== "@main.entry"
  ) throw Error(`Expected valid '@main.entry' block after '@main' function`);

  const toc: Map<Label, Interval> = new Map();

  // pass 1: function intervals
  for (let index = 0; index < program.length; index++) {
    const line: Instruction = program[index];
    if (line[Get.Tag] === "Function") {
      let end: number = program.length;
      for (
        let next = index + 1;
        next < program.length && end === program.length;
        next++
      ) {
        if (program[next][Get.Tag] === "Function") {
          end = next;
        }
      }
      toc.set(line[Get.Left], { begin: index, end });
    }
  }

  // pass 2: block intervals
  let block: Label = "@main.entry";
  let first: number = 1;
  for (let index = 2; index < program.length; index++) {
    const line: Instruction = program[index];

    if (line[Get.Tag] === "Function" || line[Get.Tag] === "Block") {
      toc.set(block, { begin: first, end: index });
      if (line[Get.Tag] === "Function") {
        block = (valid(program[index + 1]) as Instruction)[Get.Left] as Label;
        first = index + 1;
      } else {
        block = line[Get.Left];
        first = index;
      }
    }
  }
  toc.set(block, { begin: first, end: program.length });

  return toc;
}

export function control_flow_graph(
  nodes: Label[],
  adjacency_list: Edge[],
): CFG[] {
  let cfg: CFG[] = [];
  nodes.forEach((label: Label) => {
    cfg = insert_node(label, cfg);
  });
  adjacency_list.forEach((edge: Edge) => {
    cfg = insert_edge(edge, cfg);
  });
  return cfg;

  function insert_node(block: Label, cfg: CFG[]): CFG[] {
    cfg.push({ label: block, predecessors: [], successors: [] });
    return cfg;
  }

  function insert_edge(edge: Edge, cfg: CFG[]): CFG[] {
    const from: number = cfg.findIndex((block: CFG) => {
      return block.label === edge.from;
    });
    const to: number = cfg.findIndex((block: CFG) => {
      return block.label === edge.to;
    });
    if (from === -1 || to === -1) {
      throw Error(
        `The CFG edge '(${edge.from}, ${edge.to})' contains an unknown block label`,
      );
    }
    cfg[from].successors.push(to);
    cfg[to].predecessors.push(from);
    return cfg;
  }
}

export function reachability(
  nodes: Label[],
  edges: Edge[],
): Map<Label, Set<Label>> {
  const reach: Map<Label, Set<Label>> = new Map();
  const discovered: Set<Label> = new Set();
  nodes.forEach(initialize_set);
  edges.forEach(add_edge);
  nodes.forEach(dfs);
  return reach;

  function initialize_set(label: Label) {
    reach.set(label, new Set());
  }

  function add_edge(edge: Edge) {
    valid(reach.get(edge.from)).add(edge.to);
  }

  function dfs(current: Label) {
    const root: Label = current;
    dfs_impl(current);

    function dfs_impl(current: Label) {
      discovered.add(current);

      const neighbors: Set<Label> = valid(reach.get(current));
      neighbors.forEach((neighbor: Label) => {
        if (!discovered.has(neighbor)) {
          valid(reach.get(root)).add(neighbor); // add Edge(root, current)
          dfs_impl(neighbor);
        }
      });
    }
  }
}
