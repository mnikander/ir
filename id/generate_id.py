#!/usr/bin/env python3

import argparse
from pathlib import Path
import secrets
import sys


ALPHABET = "0123456789abcdef"
CODE_LENGTH = 3
COLORS_FILE = Path(__file__).with_name("id.txt")
MAX_PERMUTATIONS = len(ALPHABET) ** CODE_LENGTH


def generate_code() -> str:
    return "#" + "".join(secrets.choice(ALPHABET) for _ in range(CODE_LENGTH))


def load_existing_colors() -> set[str]:
    if not COLORS_FILE.exists():
        return set()

    with COLORS_FILE.open("r", encoding="ascii") as file:
        return {line.strip() for line in file if line.strip()}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate unique IDs which are 3-digit HTML color codes and append them to id.txt."
    )
    parser.add_argument(
        "count",
        nargs="?",
        type=int,
        default=1,
        help="number of codes to generate (default: 1)",
    )
    args = parser.parse_args()

    if args.count < 1:
        parser.error("count must be a positive integer")

    existing_colors = load_existing_colors()
    remaining_colors = MAX_PERMUTATIONS - len(existing_colors)

    if args.count > remaining_colors:
        print(
            f"error: requested {args.count} new colors, but only {remaining_colors} remain available",
            file=sys.stderr,
        )
        raise SystemExit(1)

    new_colors: list[str] = []

    while len(new_colors) < args.count:
        color = generate_code()
        if color in existing_colors:
            continue
        existing_colors.add(color)
        new_colors.append(color)

    with COLORS_FILE.open("a", encoding="ascii") as file:
        for color in new_colors:
            file.write(color + "\n")
            print(color)


if __name__ == "__main__":
    main()
