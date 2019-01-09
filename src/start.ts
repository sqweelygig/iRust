import { Dictionary, merge } from "lodash";
import * as Path from "path";
import { DataRepository } from "./data-repository";
import { Display, DisplayDimensions, PixelGrid } from "./display";
import { DrawingArea, TextStyle } from "./drawingArea";

// TODO [REFACTOR] Export interface StyleSheet and typescript the themes files.

export interface StyleGuide {
	styles: {
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
		styles: {
			default: {
				aboveEachBaseline: 1.13,
				aboveEachParagraph: 0.5,
				background: 0xffffff,
				belowEachBaseline: 0.35,
				belowEachParagraph: 0,
				besideEachParagraph: 10,
				colour: 0x000000,
				fontPath: "/usr/src/imuse/lib/primary-school.otf",
				fontSize: 28,
			},
			header: {
				aboveEachBaseline: 1.4,
				fontPath: "/usr/src/imuse/lib/fancy-script.ttf",
				fontSize: 36,
			},
			summary: {
				aboveEachBaseline: 1.4,
				fontPath: "/usr/src/imuse/lib/fancy-script.ttf",
				fontSize: 32,
			},
			title: {
				aboveEachBaseline: 1.4,
				fontPath: "/usr/src/imuse/lib/fancy-script.ttf",
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
			styleGuide.styles.default.background,
		);
		return new Article(drawingArea, styleGuide, onUpdate);
	}

	private readonly drawingArea: DrawingArea;

	private readonly onUpdate: Array<() => void>;

	private readonly styleGuide: StyleGuide;

	private crossLocation: {
		top: number;
		left: number;
	};

	private article: Array<{
		title: string;
		body: string[];
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

	public async writeMD(content: string): Promise<void> {
		let currentParagraph: string[] = [];
		let currentSection: string[] = [];
		let currentTitle = "";
		this.article = [];
		// For each line
		content.split(/\r?\n/g).forEach((line) => {
			if (line.match(/^#+/)) {
				// If it is a header
				// Put any existing paragraph into the section
				if (currentParagraph.join(" ").trim().length > 0) {
					currentSection.push(currentParagraph.join(" ").trim());
					currentParagraph = [];
				}
				// Put any existing section & title into the article
				if (currentSection.length > 0 || currentTitle !== "") {
					this.article.push({
						body: currentSection,
						title: currentTitle,
					});
					currentSection = [];
				}
				// Reset the existing title
				currentTitle = line.replace(/^#+/, "").trim();
			} else if (line.trim().length === 0) {
				// If it is an explicit line break
				// Put any existing paragraph into the section
				if (currentParagraph.join(" ").trim().length > 0) {
					currentSection.push(currentParagraph.join(" ").trim());
					currentParagraph = [];
				}
			} else {
				// Accumulate each line
				currentParagraph.push(line.trim());
			}
		});
		// Put any existing paragraph into the section
		if (currentParagraph.join(" ").trim().length > 0) {
			currentSection.push(currentParagraph.join(" ").trim());
			currentParagraph = [];
		}
		// Put any existing section & title into the article
		if (currentSection.length > 0 || currentTitle !== "") {
			this.article.push({
				body: currentSection,
				title: currentTitle,
			});
		}
		// Draw the title
		this.drawingArea.setCursor(this.crossLocation);
		this.drawingArea.drawParagraph({
			style: merge(
				{},
				this.styleGuide.styles.default,
				this.styleGuide.styles.title,
			),
			text: this.article[0].title,
		});
		// Draw the abstract
		this.drawingArea.drawParagraph({
			style: merge(
				{},
				this.styleGuide.styles.default,
				this.styleGuide.styles.abstract,
			),
			text: this.article[0].body[0],
		});
		// Record this vertical position and divide the remaining screen in two
		const dimensions = this.drawingArea.dimensions;
		this.crossLocation = {
			left:
				Math.max(dimensions.width, dimensions.height) -
				Math.min(dimensions.width, dimensions.height),
			top: this.drawingArea.getCursor().top,
		};
		// Draw each of the headers as a summary, in the summary area
		this.drawingArea.setCursor({
			right: this.crossLocation.left,
			top: this.crossLocation.top,
		});
		for (let i = 1; i < this.article.length; i++) {
			this.drawingArea.drawParagraph({
				style: merge(
					{},
					this.styleGuide.styles.default,
					this.styleGuide.styles.summary,
				),
				text: this.article[i].title,
			});
		}
		// Draw each of the sections as the article, in the content area
		this.drawingArea.setCursor(this.crossLocation);
		for (let i = 1; i < this.article.length; i++) {
			this.drawingArea.drawParagraph({
				style: merge(
					{},
					this.styleGuide.styles.default,
					this.styleGuide.styles.header,
				),
				text: this.article[i].title,
			});
			this.article[i].body.forEach((paragraph) => {
				this.drawingArea.drawParagraph({
					style: merge(
						{},
						this.styleGuide.styles.default,
						this.styleGuide.styles.content,
					),
					text: paragraph,
				});
			});
		}
		// Let registered handlers know we've changed
		this.onUpdate.forEach((onUpdate) => {
			onUpdate();
		});
	}

	public getPixel(x: number, y: number): number {
		// TODO Put this in as this.drawingArea.drawLine();
		if (y === this.crossLocation.top) {
			return this.styleGuide.styles.default.colour;
		} else if (y > this.crossLocation.top && x === this.crossLocation.left) {
			return this.styleGuide.styles.default.colour;
		} else {
			return this.drawingArea.getPixel(x, y);
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
