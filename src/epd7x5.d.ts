interface ImageBuffer {
	height: number;
}

declare module "epd7x5" {
	function init(): void;
	function getImageBuffer(): ImageBuffer;
	function displayImageBuffer(frame: ImageBuffer): void;
}
