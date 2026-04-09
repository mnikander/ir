// Copyright (c) 2026 Marco Nikander

export function valid<T>(value: null | undefined | T): T {
  if (value === undefined) {
    throw Error("expected a defined value");
  } else if (value === null) {
    throw Error("expected a non-null value");
  } else {
    return value;
  }
}
