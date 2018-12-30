declare class Stage {
	public ellipse(
		centreX: number,
		centreY: number,
		width: number,
		height: number,
		colour: number,
	): void;
	public filledEllipse(
		centreX: number,
		centreY: number,
		width: number,
		height: number,
		colour: number,
	): void;
	public fill(x: number, y: number, colour: number): void;
	public line(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		colour: number,
	): void;
	public setThickness(width: number): void;
	public stringFT(
		colour: number,
		font: string,
		size: number,
		angle: number,
		x: number,
		y: number,
		text: string,
	): void;
	public getPixel(x: number, y: number): number;
}

declare module "node-gd" {
	function createTrueColor(
		width: number,
		height: number,
		callback: (error?: Error, stage?: Stage) => void,
	): void;
}
