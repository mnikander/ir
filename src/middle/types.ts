// Copyright (c) 2026 Marco Nikander

export type Type = Int | Borrowed;
export type Int = ["Int"];
export type Borrowed = ["Borrowed", Type];

export function is_integer(t: Type): t is Int {
  return t.length === 1 && t[0] === "Int";
}

export function is_borrowed(t: Type): t is Borrowed {
  return t.length === 2 && t[0] === "Borrowed";
}
