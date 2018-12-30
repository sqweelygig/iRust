import * as moment from "moment";
import { Display } from "./display";
import { Page } from "./page";

async function start() {
	const display = await Display.build();
	const dimensions = display.getDimensions();
	// noinspection InfiniteLoopJS
	while (true) {
		const page = await Page.build(
			dimensions,
			{
				colour: 0x000000,
				fontPath: "/usr/src/imuse/lib/sassoon-primary.otf",
				lineDrop: 0.2,
				lineHeight: 1.16,
				size: 64,
				spacing: 10,
			},
			0xffffff,
		);
		const now = moment();
		page.write(now.format("dddd MMMM Do, YYYY"));
		page.write(now.format("hh:mm").toUpperCase(), { size: 128 });
		await display.update(page);
	}
}

start()
.then(() => {
	console.log("Application Initialised.");
})
.catch((error) => {
	console.error("Initialisation Failed.");
	console.error(error);
});
