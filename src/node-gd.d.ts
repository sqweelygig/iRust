interface Stage {
	ellipse(centreX: number, centreY: number, width: number, height: number, colour: number): void;
	fill(x: number, y: number, colour: number): void;
	getPixel(x: number, y: number): number;
}

declare module "node-gd" {
	function createTrueColor(
		width: number,
		height: number,
		callback: (error?: Error, stage?: Stage) => void,
	): void;
}
