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
  params: [HIR.Input, HIR.Type][];
  return_type: HIR.Type;
  blocks: SplitBlock[];
};

export type SplitBlock = {
  name: HIR.Label;
  phis: HIR.Phi[];
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
  return_type: HIR.Type;
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
  phis: [];
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
  tag: "call",
  label: HIR.Label,
  arguments: NumberedInput[],
];

export type NumberedMemory =
  | NumberedConstant
  | NumberedCopy
  | NumberedOwn
  | NumberedBorrow
  | NumberedLoad
  | NumberedDrop;
export type NumberedConstant = [
  destination: LIR.Offset,
  tag: "constant",
  value: HIR.Literal,
];
export type NumberedCopy = [
  destination: LIR.Offset,
  tag: "copy",
  value: NumberedInput,
];
export type NumberedOwn = [
  destination: LIR.Offset,
  tag: "own",
  value: NumberedInput,
];
export type NumberedBorrow = [
  destination: LIR.Offset,
  tag: "borrow",
  source: LIR.Offset,
];
export type NumberedLoad = [
  destination: LIR.Offset,
  tag: "load",
  source: LIR.Offset,
];
export type NumberedDrop = [
  destination: LIR.Offset,
  tag: "drop",
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
  tag: "add",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedSubtract = [
  destination: LIR.Offset,
  tag: "subtract",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedMultiply = [
  destination: LIR.Offset,
  tag: "multiply",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedDivide = [
  destination: LIR.Offset,
  tag: "divide",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedRemainder = [
  destination: LIR.Offset,
  tag: "remainder",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedMinimum = [
  destination: LIR.Offset,
  tag: "minimum",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedMaximum = [
  destination: LIR.Offset,
  tag: "maximum",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedNegative = [
  destination: LIR.Offset,
  tag: "negate",
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
  tag: "equal",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedUnequal = [
  destination: LIR.Offset,
  tag: "unequal",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedLess = [
  destination: LIR.Offset,
  tag: "less",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedLessEqual = [
  destination: LIR.Offset,
  tag: "less_equal",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedGreater = [
  destination: LIR.Offset,
  tag: "greater",
  left: NumberedInput,
  right: NumberedInput,
];
export type NumberedGreaterEqual = [
  destination: LIR.Offset,
  tag: "greater_equal",
  left: NumberedInput,
  right: NumberedInput,
];

export type NumberedTerminator = NumberedJump | NumberedBranch | NumberedReturn;
export type NumberedJump = [destination: null, tag: "jump", block: HIR.Label];
export type NumberedBranch = [
  destination: null,
  tag: "branch",
  condition: NumberedInput,
  block: [HIR.Label, HIR.Label],
];
export type NumberedReturn = [
  destination: null,
  tag: "return",
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
  tag: "call",
  target: HIR.Label,
  arguments: LIR.Offset[],
];

export type ExpandedTerminator = ExpandedJump | ExpandedBranch | LIR.Return;

export type ExpandedJump = [
  destination: null,
  tag: "jump",
  target: HIR.Label,
];

export type ExpandedBranch = [
  destination: null,
  tag: "branch",
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
  tag: "jump",
  target: BlockTarget,
];

export type UnresolvedBranch = [
  destination: null,
  tag: "branch",
  condition: LIR.Offset,
  targets: [BlockTarget, BlockTarget],
];

export type UnresolvedCall = [
  destination: LIR.Offset,
  tag: "call",
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
