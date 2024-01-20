export class V2 {
	x: number;
	y: number;
	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	static add(v1: V2, v2: V2): V2 {
		return new V2(v1.x + v2.x, v1.y + v2.y);
	}

	add(v: V2): void {
		this.x += v.x;
		this.y += v.y;
	}

	static sub(v1: V2, v2: V2): V2 {
		return new V2(v1.x - v2.x, v1.y - v2.y);
	}

	sub(v: V2): V2 {
		return new V2(this.x - v.x, this.y - v.y);
	}

	eq(v: V2): boolean {
		return this.x === v.x && this.y === v.y;
	}

	toString(): string {
		return `(${this.x}, ${this.y})`;
	}
}
