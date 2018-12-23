import * as NodeGD from "node-gd";

declare module "epd7x5" {
	function init(): void;
	function getImageBuffer(): NodeGD.ImageBuffer;
	function displayImageBuffer(frame: NodeGD.ImageBuffer): void;
}
