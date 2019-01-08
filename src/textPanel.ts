import { JSDOM } from "jsdom";
import { Dictionary, merge } from "lodash";
import * as marked from "marked";
import * as gd from "node-gd";
import { DisplayDimensions, PixelGrid } from "./display";

export interface TextStyle {
	colour: number;
	fontPath: string;
	fontSize: number;
	belowEachBaseline: number;
	aboveEachBaseline: number;
	spacing: number;
	aboveEachParagraph: number;
	belowEachParagraph: number;
}

export class TextPanel implements PixelGrid {
	public static async build(
		dimensions: DisplayDimensions,
		defaultStyle: TextStyle,
		textStyles: Dictionary<Partial<TextStyle>>,
		background?: number,
	): Promise<TextPanel> {
		const panel = new TextPanel(
			defaultStyle,
			textStyles,
			dimensions,
			background,
		);
		await panel.clear();
		return panel;
	}

	private stage: Stage;

	private readonly defaultStyle: TextStyle;

	private readonly textStyles: Dictionary<Partial<TextStyle>>;

	private readonly dimensions: DisplayDimensions;

	private baseLine: number = 0;

	private readonly background: number;

	private constructor(
		defaultStyle: TextStyle,
		textStyles: Dictionary<Partial<TextStyle>>,
		dimensions: DisplayDimensions,
		background: number = 0xffffff,
	) {
		this.defaultStyle = defaultStyle;
		this.textStyles = textStyles;
		this.dimensions = dimensions;
		this.background = background;
	}

	public clear(): Promise<void> {
		this.baseLine = 0;
		return new Promise<void>((resolve, reject) => {
			gd.createTrueColor(
				this.dimensions.width,
				this.dimensions.height,
				(error, stage) => {
					if (error) {
						reject(error);
					} else if (stage) {
						this.stage = stage;
						stage.fill(0, 0, this.background);
						resolve();
					} else {
						reject(new Error("Huh? Empty callback!"));
					}
				},
			);
		});
	}

	public getPixel(x: number, y: number): number {
		return this.stage.getPixel(x, y);
	}

	public async writeMD(content: string): Promise<void> {
		const contentDOM = new JSDOM(
			marked(content, {
				gfm: true,
			}),
		);
		const topLevelChildren = contentDOM.window.document.body.children;
		await this.clear();
		for (const child of topLevelChildren) {
			const textContent = child.textContent
				? child.textContent.replace(/\s+/g, " ")
				: "";
			this.writeParagraph(textContent, child.tagName.toLowerCase());
		}
	}

	private writeParagraph(text: string, style?: string) {
		const lines = [""];
		const words = text.split(/ /g);
		const mergedStyle = merge(
			{},
			this.defaultStyle,
			style ? this.textStyles[style] : {},
		);
		words.forEach((word) => {
			const appendedLine = `${lines[lines.length - 1]} ${word}`.trim();
			const box = this.stage.stringFTBBox(
				mergedStyle.colour,
				mergedStyle.fontPath,
				mergedStyle.fontSize,
				0,
				mergedStyle.spacing,
				this.baseLine,
				appendedLine,
			);
			if (box[2] + mergedStyle.spacing <= this.dimensions.width) {
				lines[lines.length - 1] = appendedLine;
			} else {
				lines.push(word);
			}
		});
		this.baseLine += Math.ceil(
			mergedStyle.fontSize * mergedStyle.aboveEachParagraph,
		);
		lines.forEach((line) => {
			this.baseLine += Math.ceil(mergedStyle.fontSize * mergedStyle.aboveEachBaseline);
			this.stage.stringFT(
				mergedStyle.colour,
				mergedStyle.fontPath,
				mergedStyle.fontSize,
				0,
				mergedStyle.spacing,
				this.baseLine,
				line,
			);
			this.baseLine += Math.ceil(mergedStyle.fontSize * mergedStyle.belowEachBaseline);
		});
		this.baseLine += Math.ceil(mergedStyle.fontSize * mergedStyle.belowEachParagraph);
	}
}
