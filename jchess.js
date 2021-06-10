"use strict";

/*
  Inspired by:

  https://github.com/thomasahle/sunfish/blob/master/sunfish.py
  https://github.com/glinscott/Garbochess-JS/blob/master/js/garbochess.js
  http://www.bluefeversoft.com/Chess/index.html
  https://home.hccnet.nl/h.g.muller/max-src2.html

  TODO
  - search
  - zobrist
*/

////////////////////////////////////////////////////
// definitions                                    //
////////////////////////////////////////////////////

const white = 8;
const black = 16;

const pieces = {
    "^" : 32, "_" : 0,
    P :  9, N : 11, K : 12, B : 13, R : 14, Q : 15,
    p : 17, n : 19, k : 20, b : 21, r : 22, q : 23,
};

const squares = [
    91, 92, 93, 94, 95, 96, 97, 98,
    81, 82, 83, 84, 85, 86, 87, 88,
    71, 72, 73, 74, 75, 76, 77, 78,
    61, 62, 63, 64, 65, 66, 67, 68,
    51, 52, 53, 54, 55, 56, 57, 58,
    41, 42, 43, 44, 45, 46, 47, 48,
    31, 32, 33, 34, 35, 36, 37, 38,
    21, 22, 23, 24, 25, 26, 27, 28,
];

const [
    a8, b8, c8, d8, e8, f8, g8, h8,
    a7, b7, c7, d7, e7, f7, g7, h7,
    a6, b6, c6, d6, e6, f6, g6, h6,
    a5, b5, c5, d5, e5, f5, g5, h5,
    a4, b4, c4, d4, e4, f4, g4, h4,
    a3, b3, c3, d3, e3, f3, g3, h3,
    a2, b2, c2, d2, e2, f2, g2, h2,
    a1, b1, c1, d1, e1, f1, g1, h1,
] = squares;


const stringSquares = {
    a8, b8, c8, d8, e8, f8, g8, h8,
    a7, b7, c7, d7, e7, f7, g7, h7,
    a6, b6, c6, d6, e6, f6, g6, h6,
    a5, b5, c5, d5, e5, f5, g5, h5,
    a4, b4, c4, d4, e4, f4, g4, h4,
    a3, b3, c3, d3, e3, f3, g3, h3,
    a2, b2, c2, d2, e2, f2, g2, h2,
    a1, b1, c1, d1, e1, f1, g1, h1,
};

const squareStrings = {};
for (let k in stringSquares) {
    squareStrings[stringSquares[k]] = k;
}

const slideTable = [];
slideTable[3] = [21, 19, 12, 8, -21, -19, -12, -8];
slideTable[5] = [11, 9, -11, -9];
slideTable[6] = [10, 1, -10, -1];
slideTable[7] = [11, 10, 9, 1, -11, -10, -9, -1];

const stepTable = [];
stepTable[3] = [];
stepTable[4] = [];

for (const square of squares) {
    stepTable[3][square] = [];
    stepTable[4][square] = [];

    for (var direction of slideTable[3]) {
	var toSquare = square + direction;
	if (squares.includes(toSquare)) {
	    stepTable[3][square].push(toSquare);
	}
    }

    for (var direction of slideTable[7]) {
	var toSquare = square + direction;
	if (squares.includes(toSquare)) {
	    stepTable[4][square].push(toSquare);
	}
    }
}

const castlingRights = [
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0, 13, 15, 15, 15, 12, 15, 15, 14,  0,
    0, 15, 15, 15, 15, 15, 15, 15, 15,  0,
    0, 15, 15, 15, 15, 15, 15, 15, 15,  0,
    0, 15, 15, 15, 15, 15, 15, 15, 15,  0,
    0, 15, 15, 15, 15, 15, 15, 15, 15,  0,
    0, 15, 15, 15, 15, 15, 15, 15, 15,  0,
    0, 15, 15, 15, 15, 15, 15, 15, 15,  0,
    0,  7, 15, 15, 15,  3, 15, 15, 11,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
];

function randomInt(a, b) {
    return Math.floor(Math.random() * (b - a)) + a;
}

function randomUInt32() {
    return randomInt(0, 256) | randomInt(0, 256) << 8 |
	randomInt(0, 256) << 16 | randomInt(0, 256) << 23;
}

var zobristKeys = [];

// piece zobrist
for (const p in pieces) {
    zobristKeys[pieces[p]] = [];
    for (const square of squares) {
	zobristKeys[pieces[p]][square] = randomUInt32();
    }
}

// empty and offside
for (const square of squares) {
    zobristKeys[0][square] = 0;
    zobristKeys[32][square] = 0;
}

// castling zobrist
zobristKeys[33] = [];
for (var i = 0; i < 16; i++) {
    zobristKeys[33][i] = randomUInt32();
}

// enpassant zobrist
zobristKeys[34] = [];
zobristKeys[34][0] = randomUInt32();
for (const square of squares) {
    zobristKeys[34][square] = randomUInt32();
}

function genZobristKey() {
    // note: zobrist key for color is the color itself
    g_zobrist = g_us;
    for (const square of squares) {
	g_zobrist ^= zobristKeys[g_board[square]][square];
    }
    g_zobrist ^= zobristKeys[33][g_castling];
    g_zobrist ^= zobristKeys[34][g_enpassant];
}

////////////////////////////////////////////////////
// movegen                                        //
////////////////////////////////////////////////////

// based on fen
var g_board;
var g_us;
var g_them;
var g_castling;
var g_enpassant;
var g_halfmove;
var g_fullmove;

// derive direction of pawns?
var g_up;
var g_zobrist;

function genMoves() {
    var moves = [];
    var i, j, p, q, pt, dir, k, sq, d;

    if (g_castling) {
	if (g_us == white) {
	    if ((g_castling & 1) &&
		g_board[f1] == 0 &&
		g_board[g1] == 0 &&
		!isAttacked(e1) &&
		!isAttacked(f1)) {
		moves.push(e1 | g1 << 7 | 1 << 14);
	    }

	    if ((g_castling & 2) &&
		g_board[d1] == 0 &&
		g_board[c1] == 0 &&
		g_board[b1] == 0 &&
		!isAttacked(e1) &&
		!isAttacked(d1)) {
		moves.push(e1 | c1 << 7 | 1 << 14);
	    }
	} else {
	    if ((g_castling & 4) &&
		g_board[f8] == 0 &&
		g_board[g8] == 0 &&
		!isAttacked(e8) &&
		!isAttacked(f8)) {
		moves.push(e8 | g8 << 7 | 1 << 14);
	    }

	    if ((g_castling & 8) &&
		g_board[d8] == 0 &&
		g_board[c8] == 0 &&
		g_board[b8] == 0 &&
		!isAttacked(e8) &&
		!isAttacked(d8)) {
		moves.push(e8 | c8 << 7 | 1 << 14);
	    }
	}
    }

    for (sq = 0; sq < 64; sq++) {
	i = squares[sq];
	p = g_board[i];
	if (p & g_us) {
	    pt = p & 7;
	    if (pt < 3) {
		j = i + g_up;
		if (g_board[j + g_up] == 32) {
		    if (g_board[j] == 0) {
			moves.push(i | j << 7 | 7 << 14);
			moves.push(i | j << 7 | 6 << 14);
			moves.push(i | j << 7 | 5 << 14);
			moves.push(i | j << 7 | 3 << 14);
		    }

		    j = j + 1;
		    if (g_board[j] & g_them) {
			moves.push(i | j << 7 | 7 << 14);
			moves.push(i | j << 7 | 6 << 14);
			moves.push(i | j << 7 | 5 << 14);
			moves.push(i | j << 7 | 3 << 14);
		    }

		    j = j - 2;
		    if (g_board[j] & g_them) {
			moves.push(i | j << 7 | 7 << 14);
			moves.push(i | j << 7 | 6 << 14);
			moves.push(i | j << 7 | 5 << 14);
			moves.push(i | j << 7 | 3 << 14);
		    }
		} else {
		    if (g_board[j] == 0) {
			moves.push(i | j << 7);
			j = j + g_up;
			if (g_board[j] == 0 && g_board[i - g_up - g_up] == 32) {
			    moves.push(i | j << 7 | 8 << 14);
			}
		    }

		    j = i + g_up + 1;
		    if (g_board[j] & g_them) {
			moves.push(i | j << 7);
		    } else if (j == g_enpassant) {
			moves.push(i | j << 7 | 2 << 14);
		    }

		    j = j - 2;
		    if (g_board[j] & g_them) {
			moves.push(i | j << 7);
		    } else if (j == g_enpassant) {
			moves.push(i | j << 7 | 2 << 14);
		    }
		}
	    } else if (pt < 5) {
		dir = stepTable[pt][i];
		for (k = 0; k < dir.length; k++) {
		    j = dir[k];
		    q = g_board[j];
		    if (q == 0 || (q & g_them)) {
			moves.push(i | j << 7);
		    }
		}
	    } else {
		dir = slideTable[pt];
		for (k = 0; k < dir.length; k++) {
		    d = dir[k];
		    j = i + d;
		    q = g_board[j];
		    for (;;) {
			if (q == 0) {
			    moves.push(i | j << 7);
			    j += d;
			    q = g_board[j];
			    continue;
			}
			if (q & g_them) {
			    moves.push(i | j << 7);
			}
			break;
		    }
		}
	    }
	}
    }

    return moves;
}

function isAttacked(i) {
    var j, k, q, dir, d;

    if (g_board[i + g_up + 1] == 1 + g_them) {
	return true;
    }
    if (g_board[i + g_up - 1] == 1 + g_them) {
	return true;
    }

    dir = stepTable[3][i];
    for (k = 0; k < dir.length; k++) {
	if (g_board[dir[k]] == 3 + g_them) {
	    return true;
	}
    }

    dir = stepTable[4][i];
    for (k = 0; k < dir.length; k++) {
	if (g_board[dir[k]] == 4 + g_them) {
	    return true;
	}
    }

    dir = slideTable[5];
    for (k = 0; k < 4; k++) {
	d = dir[k];
	j = i + d;
	for (;;) {
	    q = g_board[j];
	    if (q == 0) {
		j += d;
		continue;
	    }
            if (q == 5 + g_them || q == 7 + g_them) {
		return true;
            }
	    break;
	}
    }

    dir = slideTable[6];
    for (k = 0; k < 4; k++) {
	d = dir[k];
	j = i + d;
	for (;;) {
	    q = g_board[j];
	    if (q == 0) {
		j += d;
		continue;
	    }
            if (q == 6 + g_them || q == 7 + g_them) {
		return true;
            }
	    break;
	}
    }

    return false;
}

function makeMove(i, j, tag) {
    var legal = true;

    g_zobrist ^= 24 ^
	zobristKeys[g_board[i]][i] ^
	zobristKeys[g_board[j]][j] ^
	zobristKeys[33][g_castling] ^
	zobristKeys[34][g_enpassant];

    g_board[j] = g_board[i];
    g_board[i] = 0;

    g_enpassant = 0;

    if (tag) {
	if (tag == 1) {
	    if (g_us == white) {
		if (j == g1) {
		    g_board[h1] = 0;
		    g_board[f1] = 14;
		    g_zobrist ^= zobristKeys[14][h1] ^ zobristKeys[14][f1];
		} else {
		    g_board[a1] = 0;
		    g_board[d1] = 14;
		    g_zobrist ^= zobristKeys[14][a1] ^ zobristKeys[14][d1];
		}
	    } else {
		if (j == g8) {
		    g_board[h8] = 0;
		    g_board[f8] = 22;
		    g_zobrist ^= zobristKeys[22][h8] ^ zobristKeys[22][f8];
		} else {
		    g_board[a8] = 0;
		    g_board[d8] = 22;
		    g_zobrist ^= zobristKeys[22][a8] ^ zobristKeys[22][d8];
		}
	    }
	} else if (tag == 2) {
	    g_zobrist ^= zobristKeys[g_board[j - g_up]][j - g_up];
	    g_board[j - g_up] = 0;
	} else if (tag == 8) {
	    g_enpassant = j - g_up;
	} else {
	    g_board[j] = tag | g_us;
	    g_zobrist ^= zobristKeys[1 | g_us][j] ^ zobristKeys[tag | g_us][j];
	}
    }

    // bit tricky that it depends on `g_us` and `g_them`
    if (isAttacked(g_board.indexOf(4 + g_us))) {
	legal = false;
    }

    g_us ^= 24;
    g_them ^= 24;
    g_castling &= castlingRights[i];
    g_castling &= castlingRights[j];
    g_halfmove++;
    g_fullmove += g_them >> 4;

    g_up = -g_up;

    g_zobrist ^= zobristKeys[g_board[j]][j] ^
	zobristKeys[33][g_castling] ^
	zobristKeys[34][g_enpassant];

    return legal;
}

function takeMove(i, j, tag) {
    g_board[i] = g_board[j];

    g_us ^= 24;
    g_them ^= 24;
    g_halfmove--;
    g_fullmove -= g_us >> 4;

    g_up = -g_up;

    if (tag) {
	if (tag == 1) {
	    if (g_us == white) {
		if (j == g1) {
		    g_board[h1] = 14;
		    g_board[f1] = 0;
		} else {
		    g_board[a1] = 14;
		    g_board[d1] = 0;
		}
	    } else {
		if (j == g8) {
		    g_board[h8] = 22;
		    g_board[f8] = 0;
		} else {
		    g_board[a8] = 22;
		    g_board[d8] = 0;
		}
	    }
	} else if (tag == 2) {
	    g_board[j - g_up] = 1 + g_them;
	} else if (tag < 8) {
	    g_board[i] = 1 + g_us;
	}
    }
}

////////////////////////////////////////////////////
// search                                         //
////////////////////////////////////////////////////

// TODO...
function search(depth, alpha, beta) {
}
function qsearch() {
}
function bestMove(depth) {
}
function evaluate() {
}

////////////////////////////////////////////////////
// FEN                                            //
////////////////////////////////////////////////////

const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const kiwiFen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
const rookEndFen = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -";

function parseFen(fen) {
    var [board, color, castling, enpassant, halfmove, fullmove] = fen.split(" ");

    g_board = parseBoard(board.split("/").reverse().join("/"));
    g_us = color == "w" ? white : black;
    g_them = color == "w" ? black : white;
    g_castling = castling.includes("K") + 2 * castling.includes("Q") +
	4 * castling.includes("k") + 8 * castling.includes("q");
    g_enpassant = stringSquares[enpassant] || 0;
    g_halfmove = parseInt(halfmove) || 0;
    g_fullmove = parseInt(fullmove) || 1;

    g_up = color == "w" ? 10 : -10;

    genZobristKey();
}

function parseBoard(b) {
    var board, i, j, p;

    board = [];

    for (i = 0; i < 21; i++) {
	board.push(32);
    }

    for (p of b) {
	if ("1" <= p && p <= "8") {
	    for (j = 0; j < p; j++) {
		board.push(0);
	    }
	} else if (p == "/") {
	    board.push(32);
	    board.push(32);
	} else {
	    board.push(pieces[p]);
	}
    }

    for (i = 0; i < 21; i++) {
	board.push(32);
    }

    return board;
}

////////////////////////////////////////////////////
// debug                                          //
////////////////////////////////////////////////////

function printBoard() {
    var b = "";

    for (var i of squares) {
	if (i % 10 == 1) {
	    b += (i - 11) / 10 + "  ";
	}

	b += g_board[i] + "\t";

	if (i % 10 == 8) {
	    b += "\n";
	}
    }

    return "\n" + b + "\n   a\tb\tc\td\te\tf\tg\th\n";
}

function perft(depth) {
    if (depth < 1) {
	return 1;
    }

    var count = 0, k;
    var move, i, j, tag, q;

    const castling = g_castling;
    const enpassant = g_enpassant;
    const zobrist = g_zobrist;

    const moves = genMoves();

    for (k = 0; k < moves.length; k++) {
	move = moves[k];

	i = move & 127;
	j = (move >> 7) & 127;
	tag = (move >> 14) & 15;
	q = g_board[j];

	if (makeMove(i, j, tag)) {
	    count += perft(depth - 1);
	}
	takeMove(i, j, tag);

	g_board[j] = q;
	g_castling = castling;
	g_enpassant = enpassant;
	g_zobrist = zobrist;
    }

    return count;
}

function perftTest(fen, depth, count) {
    parseFen(fen);
    var c = perft(depth);
    console.log("fen", fen);
    console.log("depth", depth);
    console.log("expected", count, "actual", c);
    if (c == count) {
	console.log("PASSED");
    } else {
	throw "FAILED " + (c - count);
    }
}

function perftTestSuite() {
    // https://www.chessprogramming.org/Perft_Results
    perftTest(startFen, 1, 20);
    perftTest(startFen, 2, 400);
    perftTest(startFen, 3, 8902);
    perftTest(startFen, 4, 197281);

    perftTest(kiwiFen, 1, 48);
    perftTest(kiwiFen, 2, 2039);
    perftTest(kiwiFen, 3, 97862);

    perftTest(rookEndFen, 1, 14);
    perftTest(rookEndFen, 2, 191);
    perftTest(rookEndFen, 3, 2812);
    perftTest(rookEndFen, 4, 43238);
    perftTest(rookEndFen, 5, 674624);
}

function time(f, n=1) {
    var tick = Date.now();
    for (var i = 0; i < n; i++) {
	f();
    }
    return Date.now() - tick;
}

////////////////////////////////////////////////////
// interface                                      //
////////////////////////////////////////////////////

// load start position and simulate dummy square click
window.onload = () => { parseFen(startFen); clickedSquare(0); };

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const squareSize = 50;
canvas.width = canvas.height = 8 * squareSize;
ctx.font = squareSize + "px Arial";

const unicodes = {};
unicodes[pieces.P] = "♙"; unicodes[pieces.p] = "♟";
unicodes[pieces.N] = "♘"; unicodes[pieces.n] = "♞";
unicodes[pieces.B] = "♗"; unicodes[pieces.b] = "♝";
unicodes[pieces.R] = "♖"; unicodes[pieces.r] = "♜";
unicodes[pieces.Q] = "♕"; unicodes[pieces.q] = "♛";
unicodes[pieces.K] = "♔"; unicodes[pieces.k] = "♚";
unicodes[0] = "";
unicodes[32] = "";

function coordinatesToIndex(x, y) {
    return 21 + x + (7 - y) * 10;
}
function indexToCoordinates(i) {
    return [i % 10 - 1, 9 - (i - i % 10) / 10];
}

function drawSquare(i, fillStyle) {
    const [x, y] = indexToCoordinates(i);
    ctx.fillStyle = fillStyle;
    ctx.fillRect(squareSize * x, squareSize * y, squareSize, squareSize);
}

function drawPiece(i, piece) {
    const [x, y] = indexToCoordinates(i);
    ctx.fillStyle = "black";
    ctx.fillText(unicodes[piece], squareSize * x, squareSize * 0.8 + squareSize * y);
}

function drawGrid() {
    for (var i of squares) {
	const [x, y] = indexToCoordinates(i);
	drawSquare(i, (x + y) % 2 ? "brown" : "yellow");
    }
}

function drawPieces() {
    for (var i of squares) {
	drawPiece(i, g_board[i]);
    }
}

function drawSelectedSquareWithAttacks(selectedSquare) {
    drawSquare(selectedSquare, "grey");
    // idiom for doing something with movegen
    var move, i, j, tag, q;

    const castling = g_castling;
    const enpassant = g_enpassant;
    const zobrist = g_zobrist;

    for (move of genMoves()) {
	i = move & 127;
	j = (move >> 7) & 127;
	tag = (move >> 14) & 127;
	q = g_board[j];

	if (i == selectedSquare) {
	    if (makeMove(i, j, tag)) {
		drawSquare(j, "lightgreen");
	    }
	    takeMove(i, j, tag);

	    g_board[j] = q;
	    g_castling = castling;
	    g_enpassant = enpassant;
	    g_zobrist = zobrist;
	}
    }
}

canvas.oncontextmenu = event => event.preventDefault();
canvas.addEventListener("mousedown", event => {
    const x = Math.floor(event.x / squareSize);
    const y = Math.floor(event.y / squareSize);
    const square = coordinatesToIndex(x, y);
    clickedSquare(square);
});

var selectedSquare = undefined;
function clickedSquare(square) {
    drawGrid();

    if (selectedSquare == undefined && (g_board[square] & g_us)) {
	selectedSquare = square;
	drawSelectedSquareWithAttacks(selectedSquare);
    } else {
	var move, i, j, tag, q;

	const castling = g_castling;
	const enpassant = g_enpassant;
	const zobrist = g_zobrist;

	for (move of genMoves()) {
	    i = move & 127;
	    j = (move >> 7) & 127;
	    tag = (move >> 14) & 15;
	    q = g_board[j];

	    if (i == selectedSquare && j == square) {
		// TODO: promotion prompt

		if (makeMove(i, j, tag)) {
		    break;
		}
		takeMove(i, j, tag);

		g_board[j] = q;
		g_castling = castling;
		g_enpassant = enpassant;
		g_zobrist = zobrist;
	    }
	}

	selectedSquare = undefined;
    }

    drawPieces();
}
