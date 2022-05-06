N = -10, E = 1, S = 10, W = -1;
A1 = 91, H1 = 98, A8 = 21, H8 = 28;
E1 = 95;

dirs = {
    P: [N, N+N, N+E, N+W],
    N: [N+N+E, N+N+W, N+E+E, N+W+W, S+S+E, S+S+W, S+E+E, S+W+W],
    B: [N+E, N+W, S+E, S+W],
    R: [N, E, S, W],
    Q: [N, E, S, W, N+E, N+W, S+E, S+W],
    K: [N, E, S, W, N+E, N+W, S+E, S+W]
};

brd =
"__________" +
"__________" +
"_rnbqkbnr_" +
"_pppppppp_" +
"_........_" +
"_........_" +
"_........_" +
"_........_" +
"_PPPPPPPP_" +
"_RNBQKBNR_" +
"__________" +
"__________";
clr = "w";
ctl = "KQkq";
ep = 0;

start_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function unparse_fen() {
    return brd.slice(21, 99).replace(/\.+/g, c => c.length).replaceAll("__", "/") + " " + clr + " " + ctl + " " + ep;
}

function parse_fen(fen) {
    [brd, clr, ctl, ep] = fen.split(" ");
    brd = "_".repeat(21) + brd.replace(/\//g, "__").replace(/\d+/g, c => ".".repeat(c)) + "_".repeat(21);
    ep = parse_move(ep);
}

RANKS = "12345678";
FILES = "abcdefgh";

function parse_move(index) {
    return FILES[index % 10 - 1] + RANKS[9 - Math.floor(index / 10)];
}
function parse_move(move) {
    return 21 + FILES.indexOf(move[0]) + (7 - RANKS.indexOf(move[1])) * 10;
}

function gen_moves() {
    let moves = [];
    for (let i = 21; i < 99; i++) {
        let p = brd[i];
        if ("A" < p && p < "Z") {
            for (let d of dirs[p]) {
                let j = i + d;
                let q = brd[j];
                while (true) {
                    if (q == "_") {
                        break;
                    }
                    if ("A" < q && q < "Z") {
                        break;
                    }
                    if (p == "P") {
                        if ((d == N+E || d == N+W) && (q == "." && j != parse_move(ep))) {
                            break;
                        }
                        if (d == N && q != ".") {
                            break;
                        }
                        if (d == N+N && (q != "." || brd[i+N] != "." || i < A1 + N)) {
                            break;
                        }
                    }
                    moves.push([i, j, p, q]);
                    if ("PNK".includes(p)) {
                        break;
                    }
                    j += d;
                    if (p == "R" && i == A1 && j == E1 && brd[j] == "K" && ctl.includes("Q")) {
                        moves.push([i, j, p, q]);
                        break;
                    }
                    if (p == "R" && i == H1 && j == E1 && brd[j] == "K" && ctl.includes("K")) {
                        moves.push([i, j, p, q]);
                        break;
                    }
                }
            }
        }
    }
    return moves;
}

function flip() {
}

function put(move) {
    let [i, j, p, q] = move;
    brd = brd.slice(0, i) + p + brd.slice(i+1);
    brd = brd.slice(0, j) + q + brd.slice(j+1);
}

function do_move(move) {
    let [i, j, p, q] = move;
}