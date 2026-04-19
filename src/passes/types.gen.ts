// Copyright (c) 2026 Marco Nikander

import * as HIR from "../high/high_grammar.ts";
import * as LIR from "../low/low_grammar.ts";

export type PhiEdge = {
  target: HIR.Label;
  predecessor: HIR.Label;
};

export type SplitProgram = readonly SplitFunction[];

export type SplitFunction = {
  name: HIR.Label;
  params: HIR.Input[];
  blocks: SplitBlock[];
};

export type SplitBlock = {
  name: HIR.Label;
  joins: HIR.Phi[];
  lines: HIR.Line[];
  terminator: HIR.Terminator;
  edge?: PhiEdge;
};

// The slot-numbered form still uses named HIR instructions, but every register
// already has a stable stack offset assigned.
export type SlotAssignment = {
  name: HIR.Register;
  offset: LIR.Offset;
};

export type SlottedProgram = readonly SlottedFunction[];

export type SlottedFunction = {
  name: HIR.Label;
  params: NumberedParam[];
  blocks: HIR.Block[];
  slots: SlotAssignment[];
};

// The numbered form removes named registers from instructions, but still keeps
// block structure and consume markers.
export type NumberedProgram = readonly NumberedFunction[];

export type NumberedFunction = {
  name: HIR.Label;
  params: NumberedParam[];
  blocks: NumberedBlock[];
};

export type NumberedParam = {
  name: HIR.Register;
  offset: LIR.Offset;
};

export type NumberedBlock = {
  name: HIR.Label;
  joins: [];
  lines: NumberedLine[];
  terminator: NumberedTerminator;
};

export type NumberedLine =
  | NumberedCall
  | NumberedMemory
  | NumberedArithmetic
  | NumberedComparison;

export type NumberedInput = {
  offset: LIR.Offset;
  consume: boolean;
};

export type NumberedCall = [
  destination: LIR.Offset,
  tag: "Call",
  label: HIR.Label,
  arguments: NumberedInput[],
];

export type NumberedMemory =
  | NumberedConstant
  | NumberedAssign
  | NumberedOwn
  | NumberedBorrow
  | NumberedLoad
  | NumberedDrop;
export type NumberedConstant = [
  destination: LIR.Offset,
  tag: "Constant",
  value: HIR.Primitive,
];
export type NumberedAssign = [
  destination: LIR.Offset,
  tag: "Assign",
  value: NumberedInput,
];
export type NumberedOwn = [
  destination: LIR.Offset,
  tag: "Own",
  value: NumberedInput,
];
export type NumberedBorrow = [
  destination: LIR.Offset,
  tag: "Borrow",
  source: LIR.Offset,
];
export type NumberedLoad = [
  destination: LIR.Offset,
  tag: "Load",
  source: LIR.Offset,
];
export type NumberedDrop = [
  destination: LIR.Offset,
  tag: "Drop",
];

export type NumberedArithmetic =
  | NumberedAdd
  | NumberedSubtract
  | NumberedMultiply
  | NumberedDivide
  | NumberedRemainder
  | NumberedMinimum
  | NumberedMaximum
  | NumberedNegative;
export type NumberedAdd = [
  destination: LIR.Offset,
  tag: "Add",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedSubtract = [
  destination: LIR.Offset,
  tag: "Subtract",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedMultiply = [
  destination: LIR.Offset,
  tag: "Multiply",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedDivide = [
  destination: LIR.Offset,
  tag: "Divide",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedRemainder = [
  destination: LIR.Offset,
  tag: "Remainder",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedMinimum = [
  destination: LIR.Offset,
  tag: "Minimum",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedMaximum = [
  destination: LIR.Offset,
  tag: "Maximum",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedNegative = [
  destination: LIR.Offset,
  tag: "Negate",
  left: NumberedInput,
];

export type NumberedComparison =
  | NumberedEqual
  | NumberedUnequal
  | NumberedLess
  | NumberedLessEqual
  | NumberedGreater
  | NumberedGreaterEqual;
export type NumberedEqual = [
  destination: LIR.Offset,
  tag: "Equal",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedUnequal = [
  destination: LIR.Offset,
  tag: "Unequal",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedLess = [
  destination: LIR.Offset,
  tag: "Less",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedLessEqual = [
  destination: LIR.Offset,
  tag: "LessEqual",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedGreater = [
  destination: LIR.Offset,
  tag: "Greater",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedGreaterEqual = [
  destination: LIR.Offset,
  tag: "GreaterEqual",
  left: NumberedInput,
  right: NumberedInput,
];

export type NumberedTerminator = NumberedJump | NumberedBranch | NumberedReturn;
export type NumberedJump = [destination: null, tag: "Jump", block: HIR.Label];
export type NumberedBranch = [
  destination: null,
  tag: "Branch",
  condition: NumberedInput,
  block: [HIR.Label, HIR.Label],
];
export type NumberedReturn = [
  destination: null,
  tag: "Return",
  source: NumberedInput,
];

export type ReservedProgram = readonly ReservedFunction[];

export type ReservedFunction = NumberedFunction & {
  first_temporary: LIR.Offset;
};

export type ExpandedProgram = readonly ExpandedFunction[];

export type ExpandedFunction = {
  name: HIR.Label;
  params: NumberedParam[];
  blocks: ExpandedBlock[];
};

export type ExpandedBlock = {
  name: HIR.Label;
  lines: ExpandedLine[];
  terminator: ExpandedTerminator;
};

export type ExpandedLine =
  | ExpandedResolvedInstruction
  | ExpandedCall;

export type ExpandedResolvedInstruction =
  | LIR.Constant
  | LIR.Copy
  | LIR.Load
  | LIR.AddressOf
  | LIR.Drop
  | LIR.Add
  | LIR.Subtract
  | LIR.Multiply
  | LIR.Divide
  | LIR.Remainder
  | LIR.Minimum
  | LIR.Maximum
  | LIR.Negative
  | LIR.Equal
  | LIR.Unequal
  | LIR.Less
  | LIR.LessEqual
  | LIR.Greater
  | LIR.GreaterEqual;

export type ExpandedCall = [
  destination: LIR.Offset,
  tag: "Call",
  target: HIR.Label,
  arguments: LIR.Offset[],
];

export type ExpandedTerminator = ExpandedJump | ExpandedBranch | LIR.Return;

export type ExpandedJump = [
  destination: null,
  tag: "Jump",
  target: HIR.Label,
];

export type ExpandedBranch = [
  destination: null,
  tag: "Branch",
  condition: LIR.Offset,
  targets: [HIR.Label, HIR.Label],
];

export type BlockTarget = {
  kind: "block";
  function_name: HIR.Label;
  block_name: HIR.Label;
};

export type FunctionTarget = {
  kind: "function";
  function_name: HIR.Label;
};

export type UnresolvedProgram = readonly UnresolvedInstruction[];

export type UnresolvedJump = [
  destination: null,
  tag: "Jump",
  target: BlockTarget,
];

export type UnresolvedBranch = [
  destination: null,
  tag: "Branch",
  condition: LIR.Offset,
  targets: [BlockTarget, BlockTarget],
];

export type UnresolvedCall = [
  destination: LIR.Offset,
  tag: "Call",
  target: FunctionTarget,
  arguments: LIR.Offset[],
  note: string,
];

export type UnresolvedInstruction =
  | LIR.Noop
  | ExpandedResolvedInstruction
  | LIR.Return
  | UnresolvedJump
  | UnresolvedBranch
  | UnresolvedCall;
