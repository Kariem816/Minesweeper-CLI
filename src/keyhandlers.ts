type Handler = {
	key: string;
	handler: () => void;
	options: HandlerOptions;
};

type EventKey = {
	sequence: string;
	name: string;
	ctrl: boolean;
	meta: boolean;
	shift: boolean;
};

type HandlerOptions = {
	ctrl?: boolean;
	meta?: boolean;
	shift?: boolean;
};

export class KeyHandler {
	private _handlers: Handler[];

	constructor() {
		this._handlers = [];
	}

	public handleKey(
		key: string,
		handler: () => void,
		options: HandlerOptions = {}
	): void {
		this._handlers.push({ key, handler, options });
	}

	public eventHandler(str: string, key: EventKey): void {
		const handler = this._handlers.find(
			(handler) => handler.key === key.name
		);

		if (!handler) return;

		if (handler.options.ctrl && !key.ctrl) return;
		if (handler.options.meta && !key.meta) return;
		if (handler.options.shift && !key.shift) return;
		handler.handler();
	}
}
