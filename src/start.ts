import * as moment from "moment";
import * as gd from "node-gd";
import { Display, DisplayDimensions } from "./display";

async function createStage(
	dimensions: DisplayDimensions,
	fill?: number,
): Promise<Stage> {
	return new Promise<Stage>((resolve, reject) => {
		gd.createTrueColor(dimensions.width, dimensions.height, (error, stage) => {
			if (error) {
				reject(error);
			} else if (stage) {
				if (fill) {
					stage.fill(0, 0, fill);
				}
				resolve(stage);
			} else {
				reject();
			}
		});
	});
}

async function startClock(display: Display) {
	const dimensions = display.getDimensions();
	// noinspection InfiniteLoopJS
	while (true) {
		const stage = await createStage(dimensions, 0xffffff);
		const now = moment();
		stage.stringFT(
			0x000000,
			"/usr/src/imuse/lib/seven-segment.ttf",
			64,
			Math.PI / 2,
			1000,
			400,
			now.format("hh:mm"),
		);
		await display.update(stage);
	}
}

Display.build().then(startClock);
