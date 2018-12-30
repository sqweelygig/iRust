import * as Path from "path";
import { DataRepository } from "./data-repository";
import { Display } from "./display";
import { Page, TextStyle } from "./page";

async function start(defaultTextStyle: TextStyle) {
	let previousContent: string | null = null;
	const onUpdate = async () => {
		console.log("Data Repository Updated.");
		const content = await data.get(
			Path.join("content", `${process.env.PAGE}.md`),
		);
		if (previousContent !== content) {
			previousContent = content;
			const page = await Page.build(
				display.getDimensions(),
				defaultTextStyle,
				0xffffff,
			);
			content.split(/[\r\n]+/g).forEach((line) => {
				if (line.trim().length > 0) {
					page.write(line);
				}
			});
			await display.update(page);
			console.log("Content Updated.");
		}
	};
	const repo = process.env.REPO || "localhost";
	const data = new DataRepository(repo, onUpdate);
	console.log("Data Repository Initialised.");
	await data.clone();
	console.log("Data Repository Populated.");
	const display = await Display.build();
	console.log("Display Panel Initialised.");
	await onUpdate();
	console.log("Initial Content Displayed.");
}

start({
	colour: 0x000000,
	fontPath: "/usr/src/imuse/lib/sassoon-primary.otf",
	lineDrop: 0.2,
	lineHeight: 1.16,
	size: 32,
	spacing: 10,
})
	.then(() => {
		console.log("Application Initialised.");
	})
	.catch((error) => {
		console.error("Initialisation Failed.");
		console.error(error);
	});
