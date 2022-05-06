"use strict";
/*
TODO
- [X] movegen
    - [X] castling
    - [X] enpassant
    - [X] promotion
- [X] null_move
- [X] parse_fen
- [X] perft
- [ ] evaluate
- [ ] search
- [ ] bestmove
*/

const WHITE = 8;
const BLACK = 16;

const PIECES = {
    empty : 0,
    P :  9, N : 11, K : 12, B : 13, R : 14, Q : 15,
    p : 17, n : 19, k : 20, b : 21, r : 22, q : 23,
    offside : 32,
};

const SQUARES = [
    91, 92, 93, 94, 95, 96, 97, 98,
    81, 82, 83, 84, 85, 86, 87, 88,
    71, 72, 73, 74, 75, 76, 77, 78,
    61, 62, 63, 64, 65, 66, 67, 68,
    51, 52, 53, 54, 55, 56, 57, 58,
    41, 42, 43, 44, 45, 46, 47, 48,
    31, 32, 33, 34, 35, 36, 37, 38,
    21, 22, 23, 24, 25, 26, 27, 28,
];

const N = -10, S = 10, E = 1, W = -1;

const A1 = 91, B1 = 92, C1 = 93, D1 = 94, E1 = 95, F1 = 96, G1 = 97, H1 = 98;
const A2 = 81, B2 = 82, C2 = 83, D2 = 84, E2 = 85, F2 = 86, G2 = 87, H2 = 88;
const A3 = 71, B3 = 72, C3 = 73, D3 = 74, E3 = 75, F3 = 76, G3 = 77, H3 = 78;
const A4 = 61, B4 = 62, C4 = 63, D4 = 64, E4 = 65, F4 = 66, G4 = 67, H4 = 68;
const A5 = 51, B5 = 52, C5 = 53, D5 = 54, E5 = 55, F5 = 56, G5 = 57, H5 = 58;
const A6 = 41, B6 = 42, C6 = 43, D6 = 44, E6 = 45, F6 = 46, G6 = 47, H6 = 48;
const A7 = 31, B7 = 32, C7 = 33, D7 = 34, E7 = 35, F7 = 36, G7 = 37, H7 = 38;
const A8 = 21, B8 = 22, C8 = 23, D8 = 24, E8 = 25, F8 = 26, G8 = 27, H8 = 28;

const DIRECTIONS = {
    1 : [N+E, N+W],
    2 : [S+E, S+W],
    3 : [N+N+E, N+E+E, N+N+W, N+W+W, S+S+E, S+E+E, S+S+W, S+W+W],
    4 : [N, E, S, W, N+E, N+W, S+E, S+W],
    5 :             [N+E, N+W, S+E, S+W],
    6 : [N, E, S, W],
    7 : [N, E, S, W, N+E, N+W, S+E, S+W],
};

const FLAGS = {
    castling : 1,
    enpassant : 2,
    double_pawn : 3,
};

const START_BRD = [
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
    32, 22, 19, 21, 23, 20, 21, 19, 22, 32,
    32, 17, 17, 17, 17, 17, 17, 17, 17, 32,
    32,  0,  0,  0,  0,  0,  0,  0,  0, 32,
    32,  0,  0,  0,  0,  0,  0,  0,  0, 32,
    32,  0,  0,  0,  0,  0,  0,  0,  0, 32,
    32,  0,  0,  0,  0,  0,  0,  0,  0, 32,
    32,  9,  9,  9,  9,  9,  9,  9,  9, 32,
    32, 14, 11, 13, 15, 12, 13, 11, 14, 32,
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
];

const EMPTY_BRD = [
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
    32,  0,  0,  0,  0,  0,  0,  0,  0, 32,
    32,  0,  0,  0,  0,  0,  0,  0,  0, 32,
    32,  0,  0,  0,  0,  0,  0,  0,  0, 32,
    32,  0,  0,  0,  0,  0,  0,  0,  0, 32,
    32,  0,  0,  0,  0,  0,  0,  0,  0, 32,
    32,  0,  0,  0,  0,  0,  0,  0,  0, 32,
    32,  0,  0,  0,  0,  0,  0,  0,  0, 32,
    32,  0,  0,  0,  0,  0,  0,  0,  0, 32,
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
];

const UNICODE = " ????????♙?♘♔♗♖♕?♟?♞♚♝♜♛";
const ASCII   = " ????????P?NKBRQ?p?nkbrq";

const CASTLING_RIGHTS = [
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  7, 15, 15, 15,  3, 15, 15, 11,  0,
    0, 15, 15, 15, 15, 15, 15, 15, 15,  0,
    0, 15, 15, 15, 15, 15, 15, 15, 15,  0,
    0, 15, 15, 15, 15, 15, 15, 15, 15,  0,
    0, 15, 15, 15, 15, 15, 15, 15, 15,  0,
    0, 15, 15, 15, 15, 15, 15, 15, 15,  0,
    0, 15, 15, 15, 15, 15, 15, 15, 15,  0,
    0, 13, 15, 15, 15, 12, 15, 15, 14,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
];

const PIECE_VALUES = [
    0,    0, 0,    0,      0,    0,    0,    0,
    0,  100, 0,  300,  70000,  350,  500,  900,
    0, -100, 0, -300, -70000, -350, -500, -900,
    0,    0, 0,    0,      0,    0,    0,    0,
    0,
];

const INFINITY = 1e100;

// parsing
const FILE_STRING = "abcdefgh";
const RANK_STRING = "12345678";

function parse_square(string) {
    const f = FILE_STRING.indexOf(string[0]);
    const r = RANK_STRING.indexOf(string[1]);
    return 91 + f - r * 10;
}

function unparse_square(square) {
    const f = (square % 10) - 1;
    const r = 9 - Math.floor(square / 10);
    return FILE_STRING[f] + RANK_STRING[r];
}

function parse_move(string) {
    const i = parse_square(string.slice(0, 2));
    const j = parse_square(string.slice(2, 4));
    return i | j << 7;
}

function unparse_move(move) {
    const i = move & 127;
    const j = (move >> 7) & 127;
    return unparse_square(i) + unparse_square(j);
}

function parse_piece(string) {
    return ASCII.indexOf(string);
}

function unparse_piece(piece) {
    return ASCII[piece];
}

function parse_fen(string) {
    let [board, color, castling, enpassant, halfmove, fullmove] = string.split(" ");

    let brd = EMPTY_BRD.slice(), i = A8;

    for (let pc of board) {
        if (pc == "/") {
            i += 2 * E;
        } else if ("12345678".includes(pc)) {
            i += parseInt(pc);
        } else {
            brd[i] = parse_piece(pc);
            i += E;
        }
    }

    let clr = color == "w" ? WHITE : BLACK;
    let ctl = 0;
    for (let pc of castling) {
        if (pc == "K") ctl |= 1;
        if (pc == "Q") ctl |= 2;
        if (pc == "k") ctl |= 4;
        if (pc == "q") ctl |= 8;
    }

    let ep = enpassant == "-" ? 0 : parse_square(enpassant);
    let hlf = parseInt(halfmove);
    let fll = parseInt(fullmove);

    return new Game(brd, clr, ctl, ep, hlf, fll);
}

class Game {
    constructor(brd, clr, ctl, ep, hlf, fll) {
        this.brd = brd;
        this.us = clr;
        this.them = clr ^ 24;
        this.ctl = ctl;
        this.ep = ep;
        this.hlf = hlf;
        this.fll = fll;
        // helpers
        this.up = this.us == WHITE ? N : S;
        // for storing ctl, ep, hlf in order to undo a move
        this.undo_stack = [];
    }

    static start() {
        return new Game(START_BRD.slice(), WHITE, 15, 0, 0, 1);
    }

    gen_moves() {
        let moves = [];
        let sq, i, j, p, q, t, k, d, dir;

        if (this.ctl) {
            if (this.us == 8) {
                if (
                    (this.ctl & 1) &&
                    this.brd[F1] == 0 &&
                    this.brd[G1] == 0 &&
                    !this.is_attacked_by_them(E1) &&
                    !this.is_attacked_by_them(F1)
                ) {
                    moves.push(E1 | G1 << 7 | 1 << 14);
                }
                if (
                    (this.ctl & 2) &&
                    this.brd[B1] == 0 &&
                    this.brd[C1] == 0 &&
                    this.brd[D1] == 0 &&
                    !this.is_attacked_by_them(E1) &&
                    !this.is_attacked_by_them(D1)
                ) {
                    moves.push(E1 | C1 << 7 | 1 << 14);
                }
            } else {
                if (
                    (this.ctl & 4) &&
                    this.brd[F8] == 0 &&
                    this.brd[G8] == 0 &&
                    !this.is_attacked_by_them(E8) &&
                    !this.is_attacked_by_them(F8)
                ) {
                    moves.push(E8 | G8 << 7 | 1 << 14);
                }
                if (
                    (this.ctl & 8) &&
                    this.brd[B8] == 0 &&
                    this.brd[C8] == 0 &&
                    this.brd[D8] == 0 &&
                    !this.is_attacked_by_them(E8) &&
                    !this.is_attacked_by_them(D8)
                ) {
                    moves.push(E8 | C8 << 7 | 1 << 14);
                }
            }
        }

        for (sq = 0; sq < 64; sq++) {
            i = SQUARES[sq];
            p = this.brd[i];
            if (p & this.us) {
                t = p & 7;
                if (t < 3) {
                    if (this.brd[i + this.up + this.up] == 32) {
                        j = i + this.up + 1;
                        q = this.brd[j];
                        if (q & this.them) {
                            moves.push(i | j << 7 | (this.us + 7) << 14);
                            moves.push(i | j << 7 | (this.us + 3) << 14);
                            moves.push(i | j << 7 | (this.us + 5) << 14);
                            moves.push(i | j << 7 | (this.us + 6) << 14);
                        }

                        j = i + this.up - 1;
                        q = this.brd[j];
                        if (q & this.them) {
                            moves.push(i | j << 7 | (this.us + 7) << 14);
                            moves.push(i | j << 7 | (this.us + 3) << 14);
                            moves.push(i | j << 7 | (this.us + 5) << 14);
                            moves.push(i | j << 7 | (this.us + 6) << 14);
                        }

                        j = i + this.up;
                        q = this.brd[j];
                        if (q == 0) {
                            moves.push(i | j << 7 | (this.us + 7) << 14);
                            moves.push(i | j << 7 | (this.us + 3) << 14);
                            moves.push(i | j << 7 | (this.us + 5) << 14);
                            moves.push(i | j << 7 | (this.us + 6) << 14);
                        }
                    } else {
                        j = i + this.up + 1;
                        q = this.brd[j];
                        if (q & this.them) {
                            moves.push(i | j << 7);
                        } else if (j == this.ep) {
                            moves.push(i | j << 7 | 2 << 14);
                        }

                        j = i + this.up - 1;
                        q = this.brd[j];
                        if (q & this.them) {
                            moves.push(i | j << 7);
                        } else if (j == this.ep) {
                            moves.push(i | j << 7 | 2 << 14);
                        }

                        j = i + this.up;
                        q = this.brd[j];
                        if (q == 0) {
                            moves.push(i | j << 7);
                            j = i + this.up + this.up;
                            q = this.brd[j];
                            if (q == 0 && this.brd[i - this.up - this.up] == 32) {
                                moves.push(i | j << 7 | 3 << 14);
                            }
                        }
                    }
                } else if (t < 5) {
                    dir = DIRECTIONS[t];
                    for (k = 0; k < dir.length; k++) {
                        j = i + dir[k];
                        q = this.brd[j];
                        if (q == 0 || (q & this.them)) {
                            moves.push(i | j << 7);
                        }
                    }
                } else {
                    dir = DIRECTIONS[t];
                    for (k = 0; k < dir.length; k++) {
                        d = dir[k];
                        j = i + d;
                        q = this.brd[j];
                        while (1) {
                            if (q == 0) {
                                moves.push(i | j << 7);
                                j += d;
                                q = this.brd[j];
                                continue;
                            }
                            if (q & this.them) {
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

    is_attacked_by_them(i) {
        return this.is_attacked(i, this.them, this.up);
    }

    is_attacked_by_us(i) {
        return this.is_attacked(i, this.us, -this.up);
    }

    is_attacked(i, atr, up) {
        let j, k, q, dir, d;

        if (this.brd[i + up + 1] == 1 + atr) {
            return true;
        }
        if (this.brd[i + up - 1] == 1 + atr) {
            return true;
        }

        dir = DIRECTIONS[3];
        for (k = 0; k < dir.length; k++) {
            if (this.brd[i + dir[k]] == 3 + atr) {
                return true;
            }
        }
        dir = DIRECTIONS[4];
        for (k = 0; k < dir.length; k++) {
            if (this.brd[i + dir[k]] == 4 + atr) {
                return true;
            }
        }

        dir = DIRECTIONS[5];
        for (k = 0; k < dir.length; k++) {
            d = dir[k];
            j = i + d;
            while (1) {
                q = this.brd[j];
                if (q == 0) {
                    j += d;
                    continue;
                }
                if (q == 5 + atr || q == 7 + atr) {
                    return true;
                }
                break;
            }
        }
        dir = DIRECTIONS[6];
        for (k = 0; k < dir.length; k++) {
            d = dir[k];
            j = i + d;
            while (1) {
                q = this.brd[j];
                if (q == 0) {
                    j += d;
                    continue;
                }
                if (q == 6 + atr || q == 7 + atr) {
                    return true;
                }
                break;
            }
        }

        return false;
    }

    is_their_king_attacked() {
        return this.is_attacked_by_us(this.brd.indexOf(this.them + 4));
    }

    is_our_king_attacked() {
        return this.is_attacked_by_them(this.brd.indexOf(this.us + 4));
    }

    gen_legal_moves() {
        let moves = this.gen_moves();
        let legal_moves = [];
        let move, i;
        for (i = 0; i < moves.length; i++) {
            move = moves[i];
            this.do_move(move);
            if (!this.is_their_king_attacked()) {
                legal_moves.push(move);
            }
            this.undo_move(move);
        }
        return legal_moves;
    }

    null_move() {
        this.do_move(0);
    }

    do_move(move) {
        const i = move & 127;
        const j = (move >> 7) & 127;
        const tag = move >> 14;
        const p = this.brd[i];
        const q = this.brd[j];

        // push undo_stack
        this.undo_stack.push([
            move, p, q,
            this.ctl, this.ep, this.hlf
        ])

        // when to update?
        this.ep = 0; // reset enpassant
        this.brd[j] = p; // may be overwritten by promotion

        if (tag) {
            // TODO
            // castling
            if (tag == 1) {
                if (j == C1) {
                    this.brd[A1] = 0;
                    this.brd[D1] = 14;
                } else if (j == G1) {
                    this.brd[H1] = 0;
                    this.brd[F1] = 14;
                } else if (j == C8) {
                    this.brd[A8] = 0;
                    this.brd[D8] = 22;
                } else {
                    this.brd[H8] = 0;
                    this.brd[F8] = 22;
                }
            }
            // enpassant capture
            else if (tag == 2) {
                // clear enpassant capture
                this.brd[j - this.up] = 0;
            }
            // double pawn move
            else if (tag == 3) {
                // set enpassant square
                this.ep = i + this.up;
            }
            // promotion
            else {
                this.brd[j] = tag;
            }
        }

        this.brd[i] = 0;
        this.us ^= 24;
        this.them ^= 24;
        this.up = -this.up;
        // update castling rights
        this.ctl &= CASTLING_RIGHTS[i] & CASTLING_RIGHTS[j];
    }

    undo_move() {
        // pop undo_stack
        const undo = this.undo_stack.pop();
        const move = undo[0];
        const p = undo[1];
        const q = undo[2];
        const ctl = undo[3];
        const ep = undo[4];
        const hlf = undo[5];

        const i = move & 127;
        const j = (move >> 7) & 127;
        const tag = move >> 14;

        if (tag) {
            // put back enpassant capture
            // castling
            if (tag == 1) {
                if (j == C1) {
                    this.brd[A1] = 14;
                    this.brd[D1] = 0;
                } else if (j == G1) {
                    this.brd[H1] = 14;
                    this.brd[F1] = 0;
                } else if (j == C8) {
                    this.brd[A8] = 22;
                    this.brd[D8] = 0;
                } else {
                    this.brd[H8] = 22;
                    this.brd[F8] = 0;
                }
            }
            // enpassant capture
            else if (tag == 2) {
                this.brd[ep + this.up] = this.us + 1;
            }
            // double pawn move
            // else if (tag == 3) {
            // }
            // promotion
            // else {
            // }
        }

        this.brd[i] = p;
        this.brd[j] = q;
        this.us ^= 24;
        this.them ^= 24;
        this.up = -this.up;

        this.ctl = ctl;
        this.ep = ep;
        this.hlf = hlf;
    }

    evaluate() {
        // TODO
        let score, sq, i, pc;

        score = 0;
        for (sq = 0; sq < 64; sq++) {
            i = SQUARES[sq];
            pc = this.brd[i];
            score += PIECE_VALUES[pc];
        }
        return score;
    }

    perft(depth) {
        if (depth < 1) {
            return 1;
        }

        let moves = this.gen_legal_moves();
        let count = 0;
        let i, move;
        for (i = 0; i < moves.length; i++) {
            move = moves[i];
            this.do_move(move);
            count += this.perft(depth - 1);
            this.undo_move(move);
        }

        return count;
    }
}

class Search {
    constructor(game) {
        this.game = game;
        // TODO: ttable
    }

    // https://en.wikipedia.org/wiki/Minimax
    minimax(depth) {
        if (depth < 1) {
            return this.game.evaluate();
        }

        let moves = this.game.gen_legal_moves();

        // check for mate
        // should be before depth check?
        if (moves.length == 0) {
            if (this.game.is_our_king_attacked()) {
                return this.game.us == WHITE ? -INFINITY : INFINITY;
            } else {
                return 0;
            }
        }

        let value, i, move;
        if (this.game.us == WHITE) {
            value = -INFINITY;
            for (i = 0; i < moves.length; i++) {
                move = moves[i];
                this.game.do_move(move);
                value = Math.max(value, this.minimax(depth - 1));
                this.game.undo_move(move);
            }
        } else {
            value = INFINITY;
            for (i = 0; i < moves.length; i++) {
                move = moves[i];
                this.game.do_move(move);
                value = Math.min(value, this.minimax(depth - 1));
                this.game.undo_move(move);
            }
        }

        return value;
    }

    best_move(depth) {
        let moves = this.game.gen_legal_moves();
        let best_move;
        let best_move_value = this.game.us == WHITE ? -INFINITY : INFINITY;
        let move, i, value;

        for (i = 0; i < moves.length; i++) {
            move = moves[i];
            this.game.do_move(move);
            value = this.minimax(depth - 1);
            this.game.undo_move();

            if (this.game.us == WHITE && value > best_move_value) {
                best_move_value = value;
                best_move = move;
            } else if (this.game.us == BLACK && value < best_move_value) {
                best_move_value = value;
                best_move = move;
            }
        }

        return best_move;
    }

    // https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning
    // https://en.wikipedia.org/wiki/Negamax
    // TODO
}

class Gui {
    constructor(game, container = document.body, size = 50) {
        this.game = game;
        this.container = container;
        this.size = size;

        this.offsetX = container.getBoundingClientRect().x;
        this.offsetY = container.getBoundingClientRect().y;

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.canvas.height = size * 8;
        this.old_click = null;
        this.cur_click = null;
        let self = this;
        this.canvas.onclick = function(event) {
            // use self instead of this here
            let f = Math.floor((event.clientX - self.offsetX) / size);
            let r = 7 - Math.floor((event.clientY - self.offsetY) / size);
            self.cur_click = SQUARES[f + r * 8];
            self.draw();
        }
        this.container.appendChild(this.canvas);

        this.undo_button = document.createElement("button");
        this.undo_button.innerHTML = "undo";
        this.undo_button.onclick = function() {
            self.game.undo_move();
            self.draw();
        }
        this.undo_container = document.createElement("div");
        this.undo_container.appendChild(this.undo_button);
        this.container.appendChild(this.undo_container);

        this.ctx = this.canvas.getContext("2d");
        this.ctx.font = size + "px Arial";

        // draw for first time
        this.draw();
    }

    draw() {
        let sq, i, p, r, f;

        let moves = this.game.gen_legal_moves();
        let marked = [];

        if (this.old_click) {
            for (let move of moves) {
                let i = move & 127;
                let j = (move >> 7) & 127;
                if (i == this.old_click && j == this.cur_click) {
                    let tag = move >> 14;
                    // promotion prompt
                    if (tag & 24) {
                        let promotion_pieces = [3, 5, 6, 7].map(p => ASCII[this.game.us + p]);
                        let piece = "";
                        while (!promotion_pieces.includes(piece)) {
                            piece = prompt("Promote to " + promotion_pieces);
                        }
                        move = (move ^ (tag << 14)) | (parse_piece(piece) << 14);
                    }
                    this.game.do_move(move);
                    // DEBUG
                    console.log(this.game.evaluate());
                    console.log(unparse_move(move));
                    break;
                }
            }
            this.old_click = null;
            this.cur_click = null;
        } else {
            for (let move of moves) {
                let i = move & 127;
                let j = (move >> 7) & 127;
                if (i == this.cur_click) {
                    marked.push(j);
                }
            }
            this.old_click = this.cur_click;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (sq = 0; sq < 64; sq++) {
            i = SQUARES[sq];
            p = this.game.brd[i];

            f = sq % 8;
            r = 7 - Math.floor(sq / 8);

            this.ctx.fillStyle = (f + r) & 1 ? "orange" : "white";
            if (marked.includes(i)) {
                this.ctx.fillStyle = "green";
            }
            if (this.cur_click == i) {
                this.ctx.fillStyle = "grey";
            }
            this.ctx.fillRect(f * this.size, r * this.size, this.size, this.size);

            this.ctx.fillStyle = "black";
            this.ctx.fillText(UNICODE[p], f * this.size, r * this.size + this.size * 0.8);
        }
    }
}
