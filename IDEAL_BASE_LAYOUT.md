Some notes on ideal base layout

Extensions -- using a single loop speeds things up by allowing refuelers to use
a predefined path.

bonzAI & o4kapuk design is 13x13 -

https://screepsworld.com/2017/08/e2s7-explained-the-full-history-of-o4kapuks-bunker-design/

Central grid

    p
   n o
  L S t
   s s
    s

s - spawn
S - storage
L - link
l - lab
t - terminal
n - nuke
o - observer
p - power spawn
T - tower
. - extension

This leaves 5 links, 10 labs, and 60 extensions remaining

60 extensions
10 labs

       1234567890123

 1      /-\./-\./-\
 2     | llX...X.. |
 3     |ll/l\./.\..|
 4     \l/ll.-...\./
 5     .|llt/p\...|.
 6     /.\T/  n\./.\
 7     |..|L S T|..|
 8     \./T\s s/T\.|
 9     .|..T\s/T..|.
10     /.\...X.../.\
11     |..\./.\./..|
12     | ..X...X..o|
13      \-/.\-/.\-/

To JS 2D array. Each cell has the structure and RCL to build it:

function s(structureType, roomLevel) {
  return {s: structureType, l: roomLevel};
}

{s: STRUCTURE_ROAD, l: 2}

BASE_LAYOUT = [
/*  1 */  [null],
/*  2 */  [{s: STRUCTURE_ROAD, l:],
/*  3 */  [],
/*  4 */  [],
/*  5 */  [],
/*  6 */  [],
/*  7 */  [],
/*  8 */  [],
/*  9 */  [],
/* 10 */  [],
/* 11 */  [],
/* 12 */  [],
/* 13 */  [],
];
