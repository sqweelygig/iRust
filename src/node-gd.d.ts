interface Stage {
	getPixel(x: number, y: number): number;
}

declare module "node-gd" {
	function createTrueColor(
		width: number,
		height: number,
		callback: (error: Error, stage: Stage) => void,
	): void;
}
