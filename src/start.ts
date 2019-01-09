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
		const shortEdge = Math.min(dimensions.width, dimensions.height);
		const longEdge = Math.max(dimensions.width, dimensions.height);
		const contentPanel = await TextPanel.build(
			{
				height: shortEdge,
				width: shortEdge,
			},
			defaultStyle,
			textStyles,
			background,
		);
		const summaryPanel = await TextPanel.build(
			{
				height: shortEdge,
				width: longEdge - shortEdge,
			},
			defaultStyle,
			textStyles,
			background,
		);
		return new Article(
			onUpdate,
			contentPanel,
			summaryPanel,
			longEdge - shortEdge,
		);
	}

	private readonly contentPanel: TextPanel;

	private readonly summaryPanel: TextPanel;

	private readonly onUpdate: Array<() => void>;

	private readonly panelBoundary: number;

	private article: Array<{
		title: string;
		body: string;
	}>;

	private constructor(
		onUpdate: () => void,
		contentPanel: TextPanel,
		summaryPanel: TextPanel,
		panelBoundary: number,
	) {
		this.contentPanel = contentPanel;
		this.summaryPanel = summaryPanel;
		this.panelBoundary = panelBoundary;
		this.onUpdate = [onUpdate];
	}

	public async writeMD(content: string): Promise<void> {
		await this.contentPanel.writeMD(content);
		let currentSection: string[] = [];
		let currentTitle = "";
		this.article = [];
		content.split(/\r?\n/g).forEach((line) => {
			if (line.match(/^#+/)) {
				if (currentSection.length > 0 || currentTitle !== "") {
					this.article.push({
						body: currentSection.join("\n").trim(),
						title: currentTitle,
					});
				}
				currentTitle = line.replace(/^#+/, "").trim();
				currentSection = [];
			} else {
				currentSection.push(line.trim());
			}
		});
		if (currentSection.length > 0 || currentTitle !== "") {
			this.article.push({
				body: currentSection.join("\n").trim(),
				title: currentTitle,
			});
		}
		for (const i = 0; i < this.article.length; i++) {
			if (i > 0) {
				this.summaryPanel.writeParagraph(this.article[i].title);
			}
		}
		this.onUpdate.forEach((onUpdate) => {
			onUpdate();
		});
	}

	public getPixel(x: number, y: number): number {
		if (x < this.panelBoundary) {
			return this.summaryPanel.getPixel(x, y);
		} else if (x > this.panelBoundary) {
			return this.contentPanel.getPixel(x - this.panelBoundary, y);
		} else {
			return 0x000000;
		}
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
}

start(process.env.REPO || "localhost", process.env.PAGE || "home")
	.then(() => {
		console.log("Application Initialised.");
	})
	.catch((error: Error) => {
		console.error("Initialisation Failed.");
		console.error(error);
	});
