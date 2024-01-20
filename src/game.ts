import chalk from "chalk";
import { V2 } from "./math.js";
import fs from "fs";

export type Difficulty = "easy" | "medium" | "hard";
export type Cell = "empty" | "mine";
export type CellState = "hidden" | "revealed" | "flagged" | "questioned";
export type Board = Cell[][];
export type BoardNumber = number[][];
export type BoardState = CellState[][];

const FLAG = "⚑";
const QUESTION = "?";
const MINE = "X";
const HIDDEN = ".";

function log(text: string) {
	fs.appendFileSync("game.log", `${new Date().toLocaleString()}: ${text}\n`);
}

// 8 colors ranging from bright to dark (brightest to darkest) from chalk
const colors = [
	chalk.inverse,
	chalk.cyan,
	chalk.greenBright,
	chalk.yellowBright,
	chalk.blueBright,
	chalk.magentaBright,
	chalk.cyan.dim,
	chalk.magenta,
	chalk.red.dim,
];

const difficulties: {
	[key in Difficulty]: { cols: number; rows: number; mines: number };
} = {
	easy: { cols: 9, rows: 9, mines: 10 },
	medium: { cols: 16, rows: 16, mines: 40 },
	hard: { cols: 30, rows: 16, mines: 99 },
};

function getDiff(diff: string): Difficulty {
	if (diff in difficulties) {
		return diff as Difficulty;
	}

	throw new Error("Invalid difficulty");
}

const hiddenCell = () => HIDDEN;
const revealedEmptyCell = (num: number | string) => num || " ";
const revealedMineCell = () => MINE;
const flaggedCell = () => FLAG;
const questionedCell = () => QUESTION;

function cellToChar(cell: Cell, number: number, state: CellState) {
	switch (state) {
		case "hidden":
			return hiddenCell();
		case "revealed":
			if (cell === "empty") {
				return revealedEmptyCell(number).toString();
			} else {
				return revealedMineCell();
			}
		case "flagged":
			return flaggedCell();
		case "questioned":
			return questionedCell();
	}
}

export class Game {
	public difficulty: Difficulty;
	private cols: number;
	private rows: number;
	private cursor = new V2(0, 0);
	private board: Board;
	private boardNumber: BoardNumber;
	private boardState: BoardState;
	private mines: number;
	private minesLeft: number;
	private minesLocations: V2[];
	private _gameOver: boolean;
	private _gameWon: boolean;
	private startTime: number;
	private endTime: number;

	constructor(
		diff: string,
		private noColor = false,
		public enableLog = false
	) {
		this.difficulty = getDiff(diff);
		this.log("New Game " + this.difficulty);
		this.cols = difficulties[this.difficulty].cols;
		this.rows = difficulties[this.difficulty].rows;
		this.mines = difficulties[this.difficulty].mines;
		this.minesLeft = this.mines;
		this.minesLocations = [];
		this._gameOver = false;
		this._gameWon = false;
		this.startTime = 0;
		this.endTime = 0;
		this.board = [];
		this.boardNumber = [];
		this.boardState = [];
		this.createBoard();
	}

	restart(diff: string = this.difficulty) {
		const difficulty = getDiff(diff);
		this.log("New Game " + difficulty);
		this.cols = difficulties[difficulty].cols;
		this.rows = difficulties[difficulty].rows;
		this.mines = difficulties[difficulty].mines;
		this.minesLeft = this.mines;
		this.minesLocations.length = 0;
		this._gameOver = false;
		this._gameWon = false;
		this.startTime = 0;
		this.endTime = 0;
		this.board.length = 0;
		this.boardNumber.length = 0;
		this.boardState.length = 0;
		this.createBoard();
	}

	private log(text: string) {
		if (this.enableLog) {
			log(text);
		}
	}

	private createBoard() {
		// Initialize board
		this.board = Array(this.rows)
			.fill(0)
			.map(() => Array(this.cols).fill("empty"));
		let minesPlaced = 0;

		// Place mines randomly
		while (minesPlaced < this.mines) {
			const x = Math.floor(Math.random() * this.cols);
			const y = Math.floor(Math.random() * this.rows);
			if (this.board[y][x] === "empty") {
				this.minesLocations.push(new V2(x, y));
				this.board[y][x] = "mine";
				minesPlaced++;
			}
		}

		// Calculate adjacent mines
		this.boardNumber = Array(this.rows)
			.fill(0)
			.map(() => Array(this.cols).fill(0));
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				// For each cell
				if (this.board[row][col] === "empty") {
					// If cell is empty
					// Calculate adjacent mines
					let mines = 0;
					for (let y = row - 1; y <= row + 1; y++) {
						for (let x = col - 1; x <= col + 1; x++) {
							if (
								y >= 0 &&
								y < this.rows &&
								x >= 0 &&
								x < this.cols
							) {
								// If cell is in bounds
								if (this.board[y][x] === "mine") {
									mines++;
								}
							}
						}
					}
					this.boardNumber[row][col] = mines;
				}
			}
		}

		// Initialize boardState
		this.boardState = Array(this.rows)
			.fill(0)
			.map(() => Array(this.cols).fill("hidden"));
	}

	flag() {
		if (this._gameOver) return;
		if (this.startTime === 0) this.startTime = Date.now();

		const { x: col, y: row } = this.cursor;

		if (this.boardState[row][col] === "hidden") {
			this.boardState[row][col] = "flagged";
			this.minesLeft--;
		} else if (this.boardState[row][col] === "flagged") {
			this.boardState[row][col] = "hidden";
			this.minesLeft++;
		}
	}

	reveal(loc: V2 = this.cursor) {
		if (this._gameOver) return;
		if (this.startTime === 0) this.startTime = Date.now();

		const { x: col, y: row } = loc;
		this.log("Revealing " + col + ", " + row);

		if (this.boardState[row][col] === "hidden") {
			this.log("Revealed " + col + ", " + row);
			this.boardState[row][col] = "revealed";
			if (this.board[row][col] === "mine") {
				this._gameOver = true;
				this._gameWon = false;
				this.endTime = Date.now();
			} else {
				if (this.boardNumber[row][col] === 0) {
					for (let y = row - 1; y <= row + 1; y++) {
						for (let x = col - 1; x <= col + 1; x++) {
							if (
								y >= 0 &&
								y < this.rows &&
								x >= 0 &&
								x < this.cols &&
								!(y === row && x === col)
							) {
								// If cell is in bounds
								this.reveal(new V2(x, y));
							}
						}
					}
				}
			}

			this.checkWin();
		} else if (
			this.boardState[row][col] === "revealed" &&
			this.boardNumber[row][col] !== 0
		) {
			let flagged = 0;
			for (let y = row - 1; y <= row + 1; y++) {
				for (let x = col - 1; x <= col + 1; x++) {
					if (
						y >= 0 &&
						y < this.rows &&
						x >= 0 &&
						x < this.cols &&
						!(y === row && x === col)
					) {
						// If cell is in bounds
						if (this.boardState[y][x] === "flagged") {
							flagged++;
						}
					}
				}
			}

			if (flagged === this.boardNumber[row][col]) {
				for (let y = row - 1; y <= row + 1; y++) {
					for (let x = col - 1; x <= col + 1; x++) {
						if (
							y >= 0 &&
							y < this.rows &&
							x >= 0 &&
							x < this.cols &&
							!(y === row && x === col) &&
							this.boardState[y][x] === "hidden"
						) {
							// If cell is in bounds
							this.reveal(new V2(x, y));
						}
					}
				}
			}
		}
	}

	question() {
		if (this._gameOver) return;
		if (this.startTime === 0) this.startTime = Date.now();

		const { x: col, y: row } = this.cursor;
		if (this.boardState[row][col] === "hidden") {
			this.boardState[row][col] = "questioned";
		} else if (this.boardState[row][col] === "questioned") {
			this.boardState[row][col] = "hidden";
		}
	}

	get gameOver() {
		return this._gameOver;
	}

	cell(x: number, y: number) {
		const cell = this.board[y][x];
		const number = this.boardNumber[y][x];
		const state = this.boardState[y][x];
		return cellToChar(
			cell,
			number,
			this.gameOver && !this.gameWon ? "revealed" : state
		);
	}

	renderCell(row: number, col: number) {
		const { x: cursorCol, y: cursorRow } = this.cursor;
		const cell = this.cell(col, row);

		let renderFn: (x: string) => string;

		if (this.noColor) {
			renderFn = (x) => x;
		} else {
			switch (cell) {
				case QUESTION:
					renderFn = chalk.blue;
					break;
				case FLAG:
					renderFn = chalk.red;
					break;
				case MINE:
					renderFn = chalk.white;
					break;
				case HIDDEN:
					renderFn = chalk.gray;
					break;
				case " ": // empty cell (0)
					renderFn = chalk.white;
					break;
				default: // number cell (1-8)
					renderFn = colors[parseInt(cell)];
					break;
			}
		}

		if (!this._gameOver && row === cursorRow && col === cursorCol) {
			return renderFn("[" + cell + "]");
		} else {
			return renderFn(" " + cell + " ");
		}
	}

	render(ttySize: V2): string {
		const { x: cols, y: rows } = ttySize;

		if (this.cols > cols || this.rows > rows) {
			return `Terminal too small!\nTerminal should be at least ${this.cols}x${this.rows}\n`;
		}

		let output = `Mines Left: ${this.minesLeft}\n`;
		// scale is 3 in x and 1 in y
		for (let row = 0; row < this.rows; row++) {
			let curr_line = "";

			for (let col = 0; col < this.cols; col++) {
				curr_line += this.renderCell(row, col);
			}

			output += curr_line + "\n";
		}

		output += "\n";
		output += `Time: ${this.timef}\n`;

		if (this._gameWon) {
			output += "You Won!\n";
		} else if (this._gameOver) {
			output += "Game Over!\n";
		}

		return output;
	}

	get gameWon() {
		return this._gameWon;
	}

	get time() {
		if (this.startTime === 0) return 0;
		if (this.endTime === 0) return Date.now() - this.startTime;
		return this.endTime - this.startTime;
	}

	get timef() {
		const time = this.time;
		const ms = (time % 1000).toString().padStart(3, "0");
		const s = (Math.floor(time / 1000) % 60).toString().padStart(2, "0");
		const m = Math.floor(time / 1000 / 60) % 60;
		if (m > 0) {
			return `${m}:${s}:${ms.toString().padStart(3, "0")}`;
		}

		return `${s}:${ms}`;
	}

	move(dir: "up" | "down" | "left" | "right") {
		if (this._gameOver) return;

		switch (dir) {
			case "up":
				if (this.cursor.y > 0) this.cursor.y--;
				break;
			case "down":
				if (this.cursor.y < this.rows - 1) this.cursor.y++;
				break;
			case "left":
				if (this.cursor.x > 0) this.cursor.x--;
				break;
			case "right":
				if (this.cursor.x < this.cols - 1) this.cursor.x++;
				break;
		}
	}

	private checkWin() {
		if (this._gameOver) return;

		let won = true;

		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				if (
					this.board[row][col] === "empty" &&
					this.boardState[row][col] !== "revealed"
				) {
					won = false;
					break;
				}
			}
		}

		if (won) {
			this._gameOver = true;
			this._gameWon = true;
			this.endTime = Date.now();
		}
	}
}
