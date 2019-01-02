import { JSDOM } from "jsdom";
import { Dictionary } from "lodash";
import * as marked from "marked";
import * as Path from "path";
import { PullResult } from "simple-git/promise";
import { DataRepository } from "./data-repository";
import { Display } from "./display";
import { Page, TextStyle } from "./page";

async function start(repo: string, article: string) {
	const defaultTextStyle = {
		colour: 0x000000,
		fontPath: "/usr/src/imuse/lib/sassoon-primary.otf",
		lineDrop: 0.2,
		lineHeight: 1.16,
		size: 32,
		spacing: 10,
	};
	const textStyles: Dictionary<Partial<TextStyle>> = {
		h1: {
			size: 64,
		},
		h2: {
			lineHeight: 1.8,
			size: 48,
		},
	};
	let previousContent: string | null = null;
	const onUpdate = async () => {
		console.log("Data Repository Updated.");
		const content = await data.get(Path.join("content", `${article}.md`));
		if (previousContent !== content) {
			previousContent = content;
			const page = await Page.build(
				display.getDimensions(),
				defaultTextStyle,
				0xffffff,
			);
			const contentDOM = new JSDOM(
				marked(content, {
					gfm: true,
				}),
			);
			const topLevelChildren = contentDOM.window.document.body.children;
			for (const child of topLevelChildren) {
				const textContent = child.textContent
					? child.textContent.replace(/\s+/g, " ")
					: "";
				page.write(textContent, textStyles[child.tagName.toLowerCase()]);
			}
			await display.update(page);
			console.log("Content Updated.");
		}
	};
	const data = await DataRepository.build(repo, onUpdate);
	console.log("Data Repository Initialised.");
	const display = await Display.build();
	console.log("Display Panel Initialised.");
	await onUpdate();
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
