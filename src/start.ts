import * as moment from "moment";
import { Display } from "./display";

async function startClock(display: Display) {
	const spec = display.getDimensions();
	const radius = Math.floor(Math.min(spec.width, spec.height) / 2);
	// noinspection InfiniteLoopJS
	while (true) {
		const stage = await display.createStage(0xffffff);
		const now = moment();
		stage.setThickness(3);
		stage.filledEllipse(radius, radius, radius * 2, radius * 2, 0x000000);
		stage.filledEllipse(
			radius,
			radius,
			radius * 2 - 5,
			radius * 2 - 5,
			0xffffff,
		);
		stage.line(
			radius,
			radius,
			radius - Math.round(radius * Math.sin((now.seconds() * Math.PI) / 30)),
			radius + Math.round(radius * Math.cos((now.seconds() * Math.PI) / 30)),
			0x666666,
		);
		stage.line(
			radius,
			radius,
			radius - Math.round(radius * Math.sin((now.minutes() * Math.PI) / 30)),
			radius + Math.round(radius * Math.cos((now.minutes() * Math.PI) / 30)),
			0x000000,
		);
		stage.line(
			radius,
			radius,
			radius - Math.round(0.7 * radius * Math.sin((now.hour() * Math.PI) / 6)),
			radius + Math.round(0.7 * radius * Math.cos((now.hour() * Math.PI) / 6)),
			0x000000,
		);
		stage.stringFT(
			0x000000,
			"/usr/src/imuse/lib/seven-segment.ttf",
			64,
			Math.PI / 2,
			800,
			800,
			now.format("hh:mm"),
		);
		await display.update(stage);
	}
}

Display.build().then(startClock);
