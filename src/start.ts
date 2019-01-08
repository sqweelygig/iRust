import { promises as FS } from "fs";
import * as Yaml from "js-yaml";
import { Dictionary } from "lodash";
import * as Path from "path";
import { DataRepository } from "./data-repository";
import { Display, DisplayDimensions, PixelGrid } from "./display";
import { TextPanel, TextStyle } from "./textPanel";

class Article implements PixelGrid {
	public static async build(
		dimensions: DisplayDimensions,
		defaultStyle: TextStyle,
		textStyles: Dictionary<Partial<TextStyle>>,
		onUpdate: () => void,
		background?: number,
	): Promise<Article> {
		const contentPanel = await TextPanel.build(
			dimensions,
			defaultStyle,
			textStyles,
			background,
		);
		return new Article(onUpdate, contentPanel);
	}

	private readonly contentPanel: TextPanel;

	private readonly onUpdate: Array<() => void>;

	private constructor(onUpdate: () => void, contentPanel: TextPanel) {
		this.contentPanel = contentPanel;
		this.onUpdate = [onUpdate];
	}

	public async writeMD(content: string): Promise<void> {
		await this.contentPanel.writeMD(content);
		this.onUpdate.forEach((onUpdate) => {
			onUpdate();
		});
	}

	public getPixel(x: number, y: number): number {
		return this.contentPanel.getPixel(x, y);
	}
}

async function start(repo: string, articleName: string) {
	const onRepoUpdate = async () => {
		console.log("Repository Updated.");
		const content = await data.get(Path.join("content", `${articleName}.md`));
		await article.writeMD(content);
		console.log("Article Updated.");
	};
	const onArticleUpdate = async () => {
		await display.update(article);
		console.log("Display Updated.");
	};
	const data = await DataRepository.build(repo, onRepoUpdate);
	console.log("Repository Initialised.");
	const config = await data.getConfig();
	console.log("Config Loaded.");
	const themeText = await FS.readFile(
		Path.join(__dirname, "..", "themes", `${config.theme}.yml`),
		"utf8",
	);
	console.log("Config Parsed.");
	const theme = Yaml.safeLoad(themeText);
	console.log("Theme Loaded.");
	const display = await Display.build();
	console.log("Display Initialised.");
	const article = await Article.build(
		display.getDimensions(),
		theme.default,
		theme.overrides,
		onArticleUpdate,
		theme.background,
	);
	console.log("Article Initialised.");
	await onRepoUpdate();
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
