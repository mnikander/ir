// Copyright (c) 2025 Marco Nikander

import { Reference, Value } from "./old_grammar.ts";

export function get_boolean(value: undefined | Reference | Value): boolean {
  if (value === undefined || typeof value.value !== "boolean") {
    throw Error("expected value to contain a boolean");
  } else {
    return value.value;
  }
}

export function get_number(value: undefined | Reference | Value): number {
  if (value === undefined || typeof value.value !== "number") {
    throw Error("expected value to contain a number");
  } else {
    return value.value;
  }
}
