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
            phis: [],
            lines: [["%0", "constant", { value: 11 }]],
            terminator: [null, "return", ["%0"]],
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
            phis: [],
            lines: [
              ["%0", "constant", { value: 11 }],
              ["%1", "call", "@identity", [["%0"], ["consume", "%0"]]],
            ],
            terminator: [null, "return", ["%1"]],
          },
        ],
      },
      {
        name: "@identity",
        params: [["%value"], ["consume", "%owned"]],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "return", ["%value"]],
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
            phis: [],
            lines: [["%condition", "constant", { value: 1 }]],
            terminator: [null, "branch", ["%condition"], ["@then", "@else"]],
          },
          {
            name: "@then",
            phis: [],
            lines: [],
            terminator: [null, "jump", "@end"],
          },
          {
            name: "@else",
            phis: [],
            lines: [],
            terminator: [null, "jump", "@end"],
          },
          {
            name: "@end",
            phis: [],
            lines: [],
            terminator: [null, "return", ["%condition"]],
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

  it("prints phis before block lines", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@join",
            phis: [
              ["%x", "phi", [["@left", ["%a"]], ["@right", ["consume", "%b"]]]],
              ["%y", "phi", [["@left", ["%c"]], ["@right", ["%d"]]]],
            ],
            lines: [["%sum", "add", ["%x"], ["%y"]]],
            terminator: [null, "return", ["%sum"]],
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
            phis: [],
            lines: [
              ["%x", "constant", { value: 11 }],
              ["%y", "constant", { value: 13 }],
              ["%copy", "copy", ["consume", "%x"]],
              ["%sum", "add", ["consume", "%copy"], ["%y"]],
            ],
            terminator: [null, "branch", ["consume", "%sum"], [
              "@then",
              "@else",
            ]],
          },
          {
            name: "@then",
            phis: [],
            lines: [],
            terminator: [null, "return", ["consume", "%y"]],
          },
          {
            name: "@else",
            phis: [],
            lines: [],
            terminator: [null, "return", ["%y"]],
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
        "    %copy = copy (consume %x)\n" +
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
            phis: [],
            lines: [
              ["%x", "constant", { value: 42 }],
              ["%owned", "own", ["%x"]],
              ["%borrowed", "borrow", "%x"],
              ["%loaded", "load", "%borrowed"],
              ["%owned", "drop"],
            ],
            terminator: [null, "return", ["%loaded"]],
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
            phis: [],
            lines: [
              ["%a", "constant", { value: 11 }],
              ["%b", "constant", { value: 13 }],
              ["%sub", "subtract", ["%a"], ["%b"]],
              ["%mul", "multiply", ["%a"], ["%b"]],
              ["%div", "divide", ["%mul"], ["%a"]],
              ["%rem", "remainder", ["%mul"], ["%b"]],
              ["%min", "minimum", ["%a"], ["%b"]],
              ["%max", "maximum", ["%a"], ["%b"]],
              ["%neg", "negate", ["%a"]],
              ["%eq", "equal", ["%a"], ["%b"]],
              ["%ne", "unequal", ["%a"], ["%b"]],
              ["%lt", "less", ["%a"], ["%b"]],
              ["%le", "less_equal", ["%a"], ["%b"]],
              ["%gt", "greater", ["%a"], ["%b"]],
              ["%ge", "greater_equal", ["%a"], ["%b"]],
            ],
            terminator: [null, "return", ["%ge"]],
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
        "    %le = less_equal %a %b\n" +
        "    %gt = greater %a %b\n" +
        "    %ge = greater_equal %a %b\n" +
        "    return %ge\n",
    );
  });
});
