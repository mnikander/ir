export { emit_linear_lir } from "./emit_linear_lir.gen.ts";
export { expand_consumes } from "./expand_consumes.gen.ts";
export { number_slots, number_slots_in_function } from "./number_slots.gen.ts";
export {
  reserve_temporaries,
  reserve_temporaries_in_function,
} from "./reserve_temporaries.gen.ts";
export { resolve_labels } from "./resolve_labels.gen.ts";
export {
  rewrite_named_to_numbered,
  rewrite_named_to_numbered_in_function,
} from "./rewrite_named_to_numbered.gen.ts";
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
  ReservedProgram,
  SlotAssignment,
  SlottedFunction,
  SlottedProgram,
  UnresolvedBranch,
  UnresolvedCall,
  UnresolvedInstruction,
  UnresolvedJump,
  UnresolvedProgram,
} from "./types.gen.ts";
