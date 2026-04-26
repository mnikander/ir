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
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [["%0", "constant", ["Int"], { value: 11 }]],
            terminator: [null, "return", ["Int"], ["%0"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main [] -> Int\n" +
        "\n" +
        "  block @entry:\n" +
        "    %0 = constant Int 11\n" +
        "    return Int %0\n",
    );
  });

  it("prints function params and call arguments", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 11 }],
              ["%1", "call", ["Int"], "@identity", [["%0"], [
                "consume",
                "%0",
              ]]],
            ],
            terminator: [null, "return", ["Int"], ["%1"]],
          },
        ],
      },
      {
        name: "@identity",
        params: [[["%value"], ["Int"]], [
          ["consume", "%owned"],
          ["Owned", ["Int"]],
        ]],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%value"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main [] -> Int\n" +
        "\n" +
        "  block @entry:\n" +
        "    %0 = constant Int 11\n" +
        "    %1 = call Int @identity [%0, (consume %0)]\n" +
        "    return Int %1\n" +
        "\n" +
        "function @identity [%value : Int, (consume %owned) : (Owned Int)] -> Int\n" +
        "\n" +
        "  block @entry:\n" +
        "    return Int %value\n",
    );
  });

  it("prints branches and jumps with blank lines between blocks", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [["%condition", "constant", ["Int"], { value: 1 }]],
            terminator: [null, "branch", null, ["%condition"], [
              "@then",
              "@else",
            ]],
          },
          {
            name: "@then",
            phis: [],
            lines: [],
            terminator: [null, "jump", null, "@end"],
          },
          {
            name: "@else",
            phis: [],
            lines: [],
            terminator: [null, "jump", null, "@end"],
          },
          {
            name: "@end",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%condition"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main [] -> Int\n" +
        "\n" +
        "  block @entry:\n" +
        "    %condition = constant Int 1\n" +
        "    branch %condition @then @else\n" +
        "\n" +
        "  block @then:\n" +
        "    jump @end\n" +
        "\n" +
        "  block @else:\n" +
        "    jump @end\n" +
        "\n" +
        "  block @end:\n" +
        "    return Int %condition\n",
    );
  });

  it("prints phis before block lines", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@join",
            phis: [
              ["%x", "phi", ["Int"], [["@left", ["%a"]], [
                "@right",
                ["consume", "%b"],
              ]]],
              ["%y", "phi", ["Int"], [["@left", ["%c"]], [
                "@right",
                ["%d"],
              ]]],
            ],
            lines: [["%sum", "add", ["Int"], ["%x"], ["%y"]]],
            terminator: [null, "return", ["Int"], ["%sum"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main [] -> Int\n" +
        "\n" +
        "  block @join:\n" +
        "    %x = phi Int [[@left, %a], [@right, (consume %b)]]\n" +
        "    %y = phi Int [[@left, %c], [@right, %d]]\n" +
        "    %sum = add Int %x %y\n" +
        "    return Int %sum\n",
    );
  });

  it("prints consumed inputs in lines and terminators", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: 11 }],
              ["%y", "constant", ["Int"], { value: 13 }],
              ["%copy", "copy", ["Int"], ["consume", "%x"]],
              ["%sum", "add", ["Int"], ["consume", "%copy"], ["%y"]],
            ],
            terminator: [null, "branch", null, ["consume", "%sum"], [
              "@then",
              "@else",
            ]],
          },
          {
            name: "@then",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["consume", "%y"]],
          },
          {
            name: "@else",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%y"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main [] -> Int\n" +
        "\n" +
        "  block @entry:\n" +
        "    %x = constant Int 11\n" +
        "    %y = constant Int 13\n" +
        "    %copy = copy Int (consume %x)\n" +
        "    %sum = add Int (consume %copy) %y\n" +
        "    branch (consume %sum) @then @else\n" +
        "\n" +
        "  block @then:\n" +
        "    return Int (consume %y)\n" +
        "\n" +
        "  block @else:\n" +
        "    return Int %y\n",
    );
  });

  it("prints memory operations", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: 42 }],
              ["%owned", "own", ["Owned", ["Int"]], ["%x"]],
              ["%borrowed", "borrow", ["Borrowed", ["Int"]], "%x"],
              ["%loaded", "load", ["Int"], "%borrowed"],
              ["%owned", "drop", null],
            ],
            terminator: [null, "return", ["Int"], ["%loaded"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main [] -> Int\n" +
        "\n" +
        "  block @entry:\n" +
        "    %x = constant Int 42\n" +
        "    %owned = own (Owned Int) %x\n" +
        "    %borrowed = borrow (Borrowed Int) %x\n" +
        "    %loaded = load Int %borrowed\n" +
        "    %owned = drop\n" +
        "    return Int %loaded\n",
    );
  });

  it("prints arithmetic, comparison, and unary operations", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%a", "constant", ["Int"], { value: 11 }],
              ["%b", "constant", ["Int"], { value: 13 }],
              ["%sub", "subtract", ["Int"], ["%a"], ["%b"]],
              ["%mul", "multiply", ["Int"], ["%a"], ["%b"]],
              ["%div", "divide", ["Int"], ["%mul"], ["%a"]],
              ["%rem", "remainder", ["Int"], ["%mul"], ["%b"]],
              ["%min", "minimum", ["Int"], ["%a"], ["%b"]],
              ["%max", "maximum", ["Int"], ["%a"], ["%b"]],
              ["%neg", "negate", ["Int"], ["%a"]],
              ["%eq", "equal", ["Int"], ["%a"], ["%b"]],
              ["%ne", "unequal", ["Int"], ["%a"], ["%b"]],
              ["%lt", "less", ["Int"], ["%a"], ["%b"]],
              ["%le", "less_equal", ["Int"], ["%a"], ["%b"]],
              ["%gt", "greater", ["Int"], ["%a"], ["%b"]],
              ["%ge", "greater_equal", ["Int"], ["%a"], ["%b"]],
            ],
            terminator: [null, "return", ["Int"], ["%ge"]],
          },
        ],
      },
    ];

    expect(print(input)).toBe(
      "\n" +
        "function @main [] -> Int\n" +
        "\n" +
        "  block @entry:\n" +
        "    %a = constant Int 11\n" +
        "    %b = constant Int 13\n" +
        "    %sub = subtract Int %a %b\n" +
        "    %mul = multiply Int %a %b\n" +
        "    %div = divide Int %mul %a\n" +
        "    %rem = remainder Int %mul %b\n" +
        "    %min = minimum Int %a %b\n" +
        "    %max = maximum Int %a %b\n" +
        "    %neg = negate Int %a\n" +
        "    %eq = equal Int %a %b\n" +
        "    %ne = unequal Int %a %b\n" +
        "    %lt = less Int %a %b\n" +
        "    %le = less_equal Int %a %b\n" +
        "    %gt = greater Int %a %b\n" +
        "    %ge = greater_equal Int %a %b\n" +
        "    return Int %ge\n",
    );
  });
});
