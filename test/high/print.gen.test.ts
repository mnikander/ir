import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as HIGH from "../../src/high/high_grammar.ts";
import { print } from "../../src/high/print.gen.ts";

describe("HIR printer", () => {
  it("prints a constant-returning function", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [["%0", "Constant", { value: 11 }]],
            terminator: [null, "Return", ["%0"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main []:\n" +
        "\n" +
        "  block @entry:\n" +
        "    %0 = constant 11\n" +
        "    return %0\n",
    );
  });

  it("prints function params and call arguments", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 11 }],
              ["%1", "Call", "@identity", [["%0"], ["consume", "%0"]]],
            ],
            terminator: [null, "Return", ["%1"]],
          },
        ],
      },
      {
        name: "@identity",
        params: [["%value"], ["consume", "%owned"]],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%value"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main []:\n" +
        "\n" +
        "  block @entry:\n" +
        "    %0 = constant 11\n" +
        "    %1 = call @identity [%0 (consume %0)]\n" +
        "    return %1\n" +
        "\n" +
        "function @identity [%value (consume %owned)]:\n" +
        "\n" +
        "  block @entry:\n" +
        "    return %value\n",
    );
  });

  it("prints branches and jumps with blank lines between blocks", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [["%condition", "Constant", { value: 1 }]],
            terminator: [null, "Branch", ["%condition"], ["@then", "@else"]],
          },
          {
            name: "@then",
            joins: [],
            lines: [],
            terminator: [null, "Jump", "@end"],
          },
          {
            name: "@else",
            joins: [],
            lines: [],
            terminator: [null, "Jump", "@end"],
          },
          {
            name: "@end",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%condition"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main []:\n" +
        "\n" +
        "  block @entry:\n" +
        "    %condition = constant 1\n" +
        "    branch %condition @then @else\n" +
        "\n" +
        "  block @then:\n" +
        "    jump @end\n" +
        "\n" +
        "  block @else:\n" +
        "    jump @end\n" +
        "\n" +
        "  block @end:\n" +
        "    return %condition\n",
    );
  });

  it("prints phi joins before block lines", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@join",
            joins: [
              ["%x", "Phi", [["@left", ["%a"]], ["@right", ["consume", "%b"]]]],
              ["%y", "Phi", [["@left", ["%c"]], ["@right", ["%d"]]]],
            ],
            lines: [["%sum", "Add", ["%x"], ["%y"]]],
            terminator: [null, "Return", ["%sum"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main []:\n" +
        "\n" +
        "  block @join:\n" +
        "    %x = phi [[@left %a] [@right (consume %b)]]\n" +
        "    %y = phi [[@left %c] [@right %d]]\n" +
        "    %sum = add %x %y\n" +
        "    return %sum\n",
    );
  });

  it("prints consumed inputs in lines and terminators", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%x", "Constant", { value: 11 }],
              ["%y", "Constant", { value: 13 }],
              ["%copy", "Assign", ["consume", "%x"]],
              ["%sum", "Add", ["consume", "%copy"], ["%y"]],
            ],
            terminator: [null, "Branch", ["consume", "%sum"], [
              "@then",
              "@else",
            ]],
          },
          {
            name: "@then",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["consume", "%y"]],
          },
          {
            name: "@else",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%y"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main []:\n" +
        "\n" +
        "  block @entry:\n" +
        "    %x = constant 11\n" +
        "    %y = constant 13\n" +
        "    %copy = assign (consume %x)\n" +
        "    %sum = add (consume %copy) %y\n" +
        "    branch (consume %sum) @then @else\n" +
        "\n" +
        "  block @then:\n" +
        "    return (consume %y)\n" +
        "\n" +
        "  block @else:\n" +
        "    return %y\n",
    );
  });

  it("prints memory operations", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%x", "Constant", { value: 42 }],
              ["%owned", "Own", ["%x"]],
              ["%borrowed", "Borrow", "%x"],
              ["%loaded", "Load", "%borrowed"],
              ["%owned", "Drop"],
            ],
            terminator: [null, "Return", ["%loaded"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main []:\n" +
        "\n" +
        "  block @entry:\n" +
        "    %x = constant 42\n" +
        "    %owned = own %x\n" +
        "    %borrowed = borrow %x\n" +
        "    %loaded = load %borrowed\n" +
        "    %owned = drop\n" +
        "    return %loaded\n",
    );
  });

  it("prints arithmetic, comparison, and unary operations", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%a", "Constant", { value: 11 }],
              ["%b", "Constant", { value: 13 }],
              ["%sub", "Subtract", ["%a"], ["%b"]],
              ["%mul", "Multiply", ["%a"], ["%b"]],
              ["%div", "Divide", ["%mul"], ["%a"]],
              ["%rem", "Remainder", ["%mul"], ["%b"]],
              ["%min", "Minimum", ["%a"], ["%b"]],
              ["%max", "Maximum", ["%a"], ["%b"]],
              ["%neg", "Negate", ["%a"]],
              ["%eq", "Equal", ["%a"], ["%b"]],
              ["%ne", "Unequal", ["%a"], ["%b"]],
              ["%lt", "Less", ["%a"], ["%b"]],
              ["%le", "LessEqual", ["%a"], ["%b"]],
              ["%gt", "Greater", ["%a"], ["%b"]],
              ["%ge", "GreaterEqual", ["%a"], ["%b"]],
            ],
            terminator: [null, "Return", ["%ge"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main []:\n" +
        "\n" +
        "  block @entry:\n" +
        "    %a = constant 11\n" +
        "    %b = constant 13\n" +
        "    %sub = subtract %a %b\n" +
        "    %mul = multiply %a %b\n" +
        "    %div = divide %mul %a\n" +
        "    %rem = remainder %mul %b\n" +
        "    %min = minimum %a %b\n" +
        "    %max = maximum %a %b\n" +
        "    %neg = negate %a\n" +
        "    %eq = equal %a %b\n" +
        "    %ne = unequal %a %b\n" +
        "    %lt = less %a %b\n" +
        "    %le = lessequal %a %b\n" +
        "    %gt = greater %a %b\n" +
        "    %ge = greaterequal %a %b\n" +
        "    return %ge\n",
    );
  });
});
