// Copyright (c) 2026 Marco Nikander

export type Type = Int | Owned | Borrowed;
export type Int = ["Int"];
export type Owned = ["Owned", Type];
export type Borrowed = ["Borrowed", Type];

export function is_integer(t: Type): t is Int {
  return t.length === 1 && t[0] === "Int";
}

export function is_owned(t: Type): t is Owned {
  return t.length === 2 && t[0] === "Owned";
}

export function is_borrowed(t: Type): t is Borrowed {
  return t.length === 2 && t[0] === "Borrowed";
}

export function is_pointer(t: Type): t is Owned | Borrowed {
  return is_owned(t) || is_borrowed(t);
}
