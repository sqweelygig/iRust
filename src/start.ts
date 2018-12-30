import * as moment from "moment";
import * as gd from "node-gd";
import { Display, DisplayDimensions, PixelGrid } from "./display";

class Page implements PixelGrid {
	public static async build(dimensions: DisplayDimensions, fill?: number): Promise<Page> {
		return await Page.createStage(dimensions, fill);
	}

	private static async createStage(
		dimensions: DisplayDimensions,
		fill?: number,
	): Promise<Page> {
		return new Promise<Page>((resolve, reject) => {
			gd.createTrueColor(
				dimensions.width,
				dimensions.height,
				(error, stage) => {
					if (error) {
						reject(error);
					} else if (stage) {
						if (fill) {
							stage.fill(0, 0, fill);
						}
						resolve(new Page(stage));
					} else {
						reject(new Error("Huh? Empty callback!"));
					}
				},
			);
		});
	}

	private stage: Stage;

	constructor(stage: Stage) {
		this.stage = stage;
	}

	public getPixel(x: number, y: number): number {
		return this.stage.getPixel(x, y);
	}

	public stringFT(colour: number, font: string, size: number, rotation: number, x: number, y: number, text: string) {
		this.stage.stringFT(colour, font, size, rotation, x, y, text);
	}
}

async function startClock(display: Display) {
	const dimensions = display.getDimensions();
	// noinspection InfiniteLoopJS
	while (true) {
		const page = await Page.build(dimensions, 0xffffff);
		const now = moment();
		page.stringFT(
			0x000000,
			"/usr/src/imuse/lib/seven-segment.ttf",
			64,
			Math.PI / 2,
			100,
			400,
			now.format("hh:mm"),
		);
		await display.update(page);
	}
}

Display.build().then(startClock);
