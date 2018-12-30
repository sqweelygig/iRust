import * as moment from "moment";
import * as Path from "path";
import { DataRepository } from "./data-repository";
import { Display } from "./display";
import { Page } from "./page";

async function start() {
	const onUpdate = () => {
		console.log("Data Repository Updated.");
	};
	const defaultTextStyle = {
		colour: 0x000000,
		fontPath: "/usr/src/imuse/lib/sassoon-primary.otf",
		lineDrop: 0.2,
		lineHeight: 1.16,
		size: 64,
		spacing: 10,
	};
	const repo = process.env.REPO || "localhost";
	const data = new DataRepository(repo, onUpdate);
	console.log("Data Repository Initialised.");
	await data.clone();
	console.log("Data Repository Populated.");
	const content = await data.get(Path.join("pages", `${process.env.PAGE}.md`));
	console.log(content);
	const display = await Display.build();
	console.log("Display Panel Initialised.");
	// noinspection InfiniteLoopJS
	while (true) {
		const page = await Page.build(
			display.getDimensions(),
			defaultTextStyle,
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
