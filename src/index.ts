import readline from "readline";
import { parseArgs } from "util";

import { KeyHandler } from "./keyhandlers.js";
import { Game } from "./game.js";
import { V2 } from "./math.js";

const MAX_FPS = 60;

const { stdout, stdin } = process;

readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY) process.stdin.setRawMode(true);
else throw new Error("stdin is not a TTY");

// Global variables
const keyHandler = new KeyHandler();
let game: Game;
let size = new V2(stdout.columns, stdout.rows);

// Config
let debug: boolean;
let diff: string;
let noColor: boolean;

function handleResize() {
	size = new V2(stdout.columns, stdout.rows);
}

function main() {
	try {
		const { values } = parseArgs({
			options: {
				debug: { type: "boolean", short: "d", default: false },
				"no-color": {
					type: "boolean",
					short: "c",
					default: false,
				},
				diff: {
					type: "string",
					short: "D",
					default: "easy",
				},
			},
		});
		debug = values.debug!;
		noColor = values["no-color"]!;
		diff = values.diff!;
	} catch (e: any) {
		console.log("\n%s\n", e.message);
		process.exit(1);
	}

	stdout.on("resize", handleResize);
	stdin.on("keypress", keyHandler.eventHandler.bind(keyHandler));
	game = new Game(diff, noColor, debug);

	{
		// keybindings
		keyHandler.handleKey(
			"c",
			() => {
				console.clear();
				stdout.write("Exiting...\n");
				process.exit(0);
			},
			{
				ctrl: true,
			}
		);

		keyHandler.handleKey("q", () => {
			console.clear();
			stdout.write("Exiting...\n");
			process.exit(0);
		});

		keyHandler.handleKey("up", () => {
			game.move("up");
		});

		keyHandler.handleKey("down", () => {
			game.move("down");
		});

		keyHandler.handleKey("left", () => {
			game.move("left");
		});

		keyHandler.handleKey("right", () => {
			game.move("right");
		});

		keyHandler.handleKey("a", () => {
			game.flag();
		});

		keyHandler.handleKey("s", () => {
			game.reveal();
		});

		keyHandler.handleKey("d", () => {
			game.question();
		});

		keyHandler.handleKey("r", () => {
			game.restart();
		});

		keyHandler.handleKey("1", () => {
			game.restart("easy");
		});

		keyHandler.handleKey("2", () => {
			game.restart("medium");
		});

		keyHandler.handleKey("3", () => {
			game.restart("hard");
		});
	}

	console.clear();
	render(Date.now());
}

let start: number;

async function render(ts: number) {
	// Initialize render loop
	if (start === undefined) {
		start = ts;
	}
	const dt = (ts - start) * 0.001;
	start = ts;

	// render
	// clear screen
	stdout.cursorTo(0, 0);
	stdout.clearScreenDown();

	// draw frame
	stdout.write("Minesweeper\n\n");
	stdout.write(game.render(size));
	stdout.write(
		"\n\nControls:\n\tArrow keys - move\n\tA - flag\n\tS - reveal\n\tR - reset\n\tQ - exit"
	);
	stdout.write(
		`\n\nChange Difficulity:\n\t1 - easy\n\t2 - medium\n\t3 - hard\n\n`
	);
	if (debug) stdout.write(`\n\nFPS: ${Math.round(1 / dt)}`);

	// finalize render loop
	await new Promise((resolve) => setTimeout(resolve, 1000 / MAX_FPS - dt));
	render(Date.now());
}

main();
