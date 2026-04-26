// Copyright (c) 2026 Marco Nikander

// Documentation grammar for the pretty-printed HIR text form.
// There is no parser in the implementation; JSON/TypeScript tuples are the
// source format.
// To try out this grammar, visit: https://langium.org/playground/

grammar IR

entry Model:
    (items+=Item)*;

Item:
    Function_ | Block | Assign | Jump | Branch | Return;

Function_:
    'function' name=BLK '[' params+=Input* ']' '->' type=Type;

Block:
    'block' name=BLK ':';

Assign:
    name=VAR '=' value=(Call | Constant | Unary | Binary | Phi | Memory);

Call:
    'call' type=Type fn=BLK '[' args+=Input* ']';

Constant:
    'constant' type=Type value=INT;

Memory:
    Copy | Own | Borrow | Load | 'drop';

Copy:
    'copy' type=Type value=Input;

Own:
    'own' type=Type value=Input;

Borrow:
    'borrow' type=Type value=VAR;

Load:
    'load' type=Type value=VAR;

Unary:
    op='negate' type=Type value=Input;

Binary:
    op=('add' | 'subtract' | 'multiply' | 'divide' | 'remainder' | 'minimum' | 'maximum' | 'equal' | 'unequal' | 'less' | 'less_equal' | 'greater' | 'greater_equal') type=Type left=Input right=Input;

Phi:
    'phi' type=Type '[' inputs+=PhiInput* ']';

PhiInput:
    '[' block=BLK value=Input ']';

Jump:
    'jump' target=BLK;

Branch:
    'branch' condition=Input left=BLK right=BLK;

Return:
    'return' type=Type value=Input;

Input:
    ConsumeInput | RegisterInput;

ConsumeInput:
    '(' 'consume' value=VAR ')';

RegisterInput:
    value=VAR;

Type:
    IntType | OwnedType | BorrowedType;

IntType:
    inner='Int';

OwnedType:
    '(' 'Owned' inner=Type ')';

BorrowedType:
    '(' 'Borrowed' inner=Type ')';

hidden terminal WS: /\s+/;
terminal BLK: /\@[_a-zA-Z][\w_]*/;
terminal VAR: /\%[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

// Code Example:
/*

function @main [] -> Int

block @entry:
%a = constant Int 1
%b = negate Int %a
%c = add Int %a %b
branch %c @left @right

block @left:
%l = constant Int 1
jump @end

block @right:
%r = constant Int 2
jump @end

block @end:
%z = phi Int [[@left, %l], [@right, %r]]
return Int %z

*/
