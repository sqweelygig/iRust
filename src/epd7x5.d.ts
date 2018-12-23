interface NodeGD {
	getGDVersion(): string;
}

declare module "epd7x5" {
	function init(): void;
	function getImageBuffer(): NodeGD;
	function displayImageBuffer(frame: NodeGD): void;
}
