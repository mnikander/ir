// Copyright (c) 2026 Marco Nikander

// To try out this grammar, visit: https://langium.org/playground/

grammar IR

entry Model:
    (lines+=Line)*;

Line: 
    (Block | Assign | Jump | Branch | Return)? NEWLINE;

Block:
    'block' name=BLK ':';

Assign:
    name=VAR '=' value=(Call | Const | Unary | Binary | Phi);

Call:
    'call' fn=ID (args+=VAR)+;

Const:
    'const' value=('true' | 'false' | INT | FLOAT | STRING);

Unary:
    op=('not' | 'negate') value=VAR;

Binary:
    op=('add' | 'subtract' | 'multiply' | 'divide' | 'remainder' | 'and' | 'or' | 'equal' | 'unequal' | 'less' | 'less_equal' | 'greater' | 'greater_equal') left=VAR right=VAR;

Phi:
    'phi' (blocks+=BLK values+=VAR)+;

Jump:
    'jump' target=BLK;

Branch:
    'branch' condition=VAR left=BLK right=BLK;

Return:
    'return' value=VAR;

hidden terminal WS: ' '+;
terminal NEWLINE: /\n/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal BLK: /\@[_a-zA-Z][\w_]*/;
terminal VAR: /\%[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal FLOAT returns number: /[-+]?((\d+\.\d*)|(\d*\.\d+))/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

/*
block @entry:
%a = const true
%b = not %a
%c = const 1
%d = negate %c
%e = add %c %d
branch %a @left @right

block @left:
%l = const 1
jump @end

block @right:
%r = const 2
jump @end

block @end:
%z = phi @left %l @right %r
return %z


*/
