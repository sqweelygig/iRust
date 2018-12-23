interface ImageBuffer {
	height: number;
	filledRectangle(bottom: number, left: number, top: number, right: number, colour: number): void;
}

declare module "epd7x5" {
	const white: number;
	function init(): void;
	function getImageBuffer(): ImageBuffer;
	function displayImageBuffer(frame: ImageBuffer): void;
}
