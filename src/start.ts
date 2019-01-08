import { promises as FS } from "fs";
import * as Yaml from "js-yaml";
import * as Path from "path";
import { PullResult } from "simple-git/promise";
import { DataRepository } from "./data-repository";
import { Display } from "./display";
import { TextPanel } from "./textPanel";

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
		await panel.clear();
		panel.writeMD(content);
		await display.update(panel);
	};
	const data = await DataRepository.build(repo, catchUpdate);
	console.log("Data Repository Initialised.");
	const config = await data.getConfig();
	console.log("Config File Loaded.");
	const themeText = await FS.readFile(
		Path.join(__dirname, "..", "themes", `${config.theme}.yml`),
		"utf8",
	);
	const theme = Yaml.safeLoad(themeText);
	console.log("Theme File Loaded.");
	const display = await Display.build();
	console.log("Display Panel Initialised.");
	const panel = await TextPanel.build(
		display.getDimensions(),
		theme.default,
		theme.overrides,
		theme.background,
	);
	console.log("Text Article Initialised.");
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
