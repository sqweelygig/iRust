import { Dictionary, merge } from "lodash";
import * as Path from "path";
import { DataRepository } from "./data-repository";
import { Display, DisplayDimensions, PixelGrid } from "./display";
import { DrawingArea, TextStyle } from "./drawingArea";

// TODO [REFACTOR] Export interface StyleSheet and typescript the themes files.

export interface StyleGuide {
	background: number;
	textStyles: {
		default: TextStyle;
		title?: Partial<TextStyle>;
		abstract?: Partial<TextStyle>;
		summary?: Partial<TextStyle>;
		header?: Partial<TextStyle>;
		content?: Partial<TextStyle>;
	};
}

const themes: Dictionary<StyleGuide> = {
	benvolio: {
		background: 0xffffff,
		textStyles: {
			default: {
				aboveEachBaseline: 1.13,
				aboveEachParagraph: 0.5,
				belowEachBaseline: 0.35,
				belowEachParagraph: 0,
				besideEachParagraph: 10,
				colour: 0x000000,
				fontPath: "/usr/src/imuse/lib/sassoon-primary.otf",
				fontSize: 32,
			},
		},
	},
};

class Article implements PixelGrid {
	public static async build(
		dimensions: DisplayDimensions,
		styleGuide: StyleGuide,
		onUpdate: () => void,
	): Promise<Article> {
		const drawingArea = await DrawingArea.build(
			dimensions,
			styleGuide.background,
		);
		return new Article(drawingArea, styleGuide, onUpdate);
	}

	private readonly drawingArea: DrawingArea;

	private readonly onUpdate: Array<() => void>;

	private readonly styleGuide: StyleGuide;

	private article: Array<{
		title: string;
		body: string;
	}>;

	private constructor(
		drawingArea: DrawingArea,
		styleGuide: StyleGuide,
		onUpdate: () => void,
	) {
		this.styleGuide = styleGuide;
		this.drawingArea = drawingArea;
		this.onUpdate = [onUpdate];
	}

	// public async writeMD(content: string): Promise<void> {
	// 	const contentDOM = new JSDOM(
	// 		marked(content, {
	// 			gfm: true,
	// 		}),
	// 	);
	// 	const topLevelChildren = contentDOM.window.document.body.children;
	// 	await this.clear();
	// 	for (const child of topLevelChildren) {
	// 		const textContent = child.textContent
	// 			? child.textContent.replace(/\s+/g, " ")
	// 			: "";
	// 		this.writeText(textContent, child.tagName.toLowerCase());
	// 	}
	// }

	public async writeMD(content: string): Promise<void> {
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
		this.drawingArea.writeText({
			style: merge(
				{},
				this.styleGuide.textStyles.default,
				this.styleGuide.textStyles.title,
			),
			text: this.article[0].title,
		});
		this.drawingArea.writeText({
			style: merge(
				{},
				this.styleGuide.textStyles.default,
				this.styleGuide.textStyles.abstract,
			),
			text: this.article[0].body,
		});
		const dimensions = this.drawingArea.dimensions;
		const summaryWidth =
			Math.max(dimensions.width, dimensions.height) -
			Math.min(dimensions.width, dimensions.height);
		const resetTop = this.drawingArea.getCursor().top;
		this.drawingArea.setCursor({ right: summaryWidth, top: resetTop });
		for (let i = 1; i < this.article.length; i++) {
			this.drawingArea.writeText({
				style: merge(
					{},
					this.styleGuide.textStyles.default,
					this.styleGuide.textStyles.summary,
				),
				text: this.article[i].title,
			});
		}
		this.drawingArea.setCursor({ top: resetTop, left: summaryWidth });
		for (let i = 1; i < this.article.length; i++) {
			this.drawingArea.writeText({
				style: merge(
					{},
					this.styleGuide.textStyles.default,
					this.styleGuide.textStyles.header,
				),
				text: this.article[i].title,
			});
			this.drawingArea.writeText({
				style: merge(
					{},
					this.styleGuide.textStyles.default,
					this.styleGuide.textStyles.content,
				),
				text: this.article[i].body,
			});
		}
		this.onUpdate.forEach((onUpdate) => {
			onUpdate();
		});
	}

	public getPixel(x: number, y: number): number {
		return this.drawingArea.getPixel(x, y);
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
	const display = await Display.build();
	console.log("Display Initialised.");
	const article = await Article.build(
		display.getDimensions(),
		themes[config.theme],
		onArticleUpdate,
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
