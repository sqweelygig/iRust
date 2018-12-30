import * as moment from "moment";
import { Display } from "./display";
import { Page } from "./page";

async function startClock(display: Display) {
	const dimensions = display.getDimensions();
	// noinspection InfiniteLoopJS
	while (true) {
		const page = await Page.build(
			dimensions,
			{
				colour: 0x000000,
				font: "/usr/src/imuse/lib/seven-segment.ttf",
				size: 64,
			},
			0xffffff,
		);
		const now = moment();
		console.log("here");
		page.write(now.format("hh:mm"));
		await display.update(page);
	}
}

Display.build().then(startClock);
