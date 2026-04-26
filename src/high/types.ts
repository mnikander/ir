// Copyright (c) 2026 Marco Nikander

export type Type = Int | Owned | Borrowed;
export type Int = ["Int"];
export type Owned = ["Owned", Type];
export type Borrowed = ["Borrowed", Type];
