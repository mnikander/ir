export { emit_linear_lir } from "./emit_linear_lir.gen.ts";
export { expand_consumes } from "./expand_consumes.gen.ts";
export {
  lower_phi_moves,
  lower_phi_moves_in_function,
} from "./lower_phi_moves.gen.ts";
export { number_slots, number_slots_in_function } from "./number_slots.gen.ts";
export {
  collect_predecessors,
  collect_successors,
} from "./predecessors.gen.ts";
export {
  reserve_temporaries,
  reserve_temporaries_in_function,
} from "./reserve_temporaries.gen.ts";
export { resolve_labels } from "./resolve_labels.gen.ts";
export {
  rewrite_named_to_numbered,
  rewrite_named_to_numbered_in_function,
} from "./rewrite_named_to_numbered.gen.ts";
export {
  split_phi_edges,
  split_phi_edges_in_function,
} from "./split_phi_edges.gen.ts";
export type {
  BlockTarget,
  ExpandedBlock,
  ExpandedCall,
  ExpandedLine,
  ExpandedProgram,
  ExpandedTerminator,
  NumberedBlock,
  NumberedFunction,
  NumberedInput,
  NumberedProgram,
  PhiEdge,
  ReservedProgram,
  SlotAssignment,
  SlottedFunction,
  SlottedProgram,
  SplitBlock,
  SplitFunction,
  SplitProgram,
  UnresolvedBranch,
  UnresolvedCall,
  UnresolvedInstruction,
  UnresolvedJump,
  UnresolvedProgram,
} from "./types.gen.ts";
