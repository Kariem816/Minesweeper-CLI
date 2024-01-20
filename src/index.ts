import readline from "readline";

// import { Game } from "./game.js";
import { KeyHandler } from "./keyhandlers.js";
import { Game } from "./game.js";
import { V2 } from "./math.js";

const MAX_FPS = 60;

const { stdout, stdin } = process;

readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY) process.stdin.setRawMode(true);
else throw new Error("stdin is not a TTY");

// const game = new Game("easy");
const keyHandler = new KeyHandler();
let game: Game;
let size = new V2(stdout.columns, stdout.rows);

function handleResize() {
	size = new V2(stdout.columns, stdout.rows);
}

function main() {
	stdout.on("resize", handleResize);
	stdin.on("keypress", keyHandler.eventHandler.bind(keyHandler));
	game = new Game("easy");

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
		game = new Game("easy");
	});

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
	stdout.write("Game -_-\n\n");
	stdout.write(game.render(size));
	stdout.write(
		"\n\nArrow keys - move\nA - flag\nS - reveal\nR - reset\nQ - exit\n\n"
	);
	stdout.write(`\n\nFPS: ${Math.round(1 / dt)}`);

	// finalize render loop
	await new Promise((resolve) => setTimeout(resolve, 1000 / MAX_FPS - dt));
	render(Date.now());
}

main();