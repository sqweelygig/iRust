import * as Path from "path";
import { PullResult } from "simple-git/promise";
import { DataRepository } from "./data-repository";
import { Display } from "./display";
import { Page } from "./page";

async function start(repo: string, articleName: string) {
	const catchUpdate = async (pullResult: PullResult) => {
		const summary = pullResult.summary;
		if (summary.changes + summary.insertions + summary.deletions > 0) {
			console.log("Data Repository Updated.");
			await doUpdate();
			console.log("Display Panel Updated.");
		}
	};
	const doUpdate = async () => {
		const content = await data.get(Path.join("content", `${articleName}.md`));
		const page = await Page.build(
			display.getDimensions(),
			{
				colour: 0x000000,
				fontPath: "/usr/src/imuse/lib/sassoon-primary.otf",
				lineDrop: 0.2,
				lineHeight: 1.16,
				size: 32,
				spacing: 10,
			},
			{
				h1: {
					size: 64,
				},
				h2: {
					lineHeight: 1.8,
					size: 48,
				},
			},
			0xffffff,
		);
		page.writeMD(content);
		await display.update(page);
	};
	const data = await DataRepository.build(repo, catchUpdate);
	console.log("Data Repository Initialised.");
	const display = await Display.build();
	console.log("Display Panel Initialised.");
	await doUpdate();
	console.log("Initial Content Displayed.");
}

start(process.env.REPO || "localhost", process.env.PAGE || "home")
	.then(() => {
		console.log("Application Initialised.");
	})
	.catch((error: Error) => {
		console.error("Initialisation Failed.");
		console.error(error);
	});
