import { JSDOM } from "jsdom";
import { merge } from "lodash";
import { Dictionary } from "lodash";
import * as marked from "marked";
import * as gd from "node-gd";
import { DisplayDimensions, PixelGrid } from "./display";

export interface TextStyle {
	colour: number;
	fontPath: string;
	size: number;
	lineDrop: number; // The space to allocate below the baseLine
	lineHeight: number; // The space to allocate above the baseLine
	spacing: number;
}

export class TextPanel implements PixelGrid {
	public static async build(
		dimensions: DisplayDimensions,
		defaultStyle: TextStyle,
		textStyles: Dictionary<Partial<TextStyle>>,
		onUpdate: () => void,
		fill?: number,
	): Promise<TextPanel> {
		const panel = new TextPanel(
			defaultStyle,
			textStyles,
			dimensions,
			onUpdate,
			fill,
		);
		await panel.clear();
		return panel;
	}

	private stage: Stage;

	private readonly defaultStyle: TextStyle;

	private readonly textStyles: Dictionary<Partial<TextStyle>>;

	private readonly dimensions: DisplayDimensions;

	private baseLine: number = 0;

	private readonly fill: number;

	private readonly onUpdate: Array<() => void>;

	private constructor(
		defaultStyle: TextStyle,
		textStyles: Dictionary<Partial<TextStyle>>,
		dimensions: DisplayDimensions,
		onUpdate: () => void,
		fill: number = 0xffffff,
	) {
		this.defaultStyle = defaultStyle;
		this.textStyles = textStyles;
		this.dimensions = dimensions;
		this.onUpdate = [onUpdate];
		this.fill = fill;
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
						stage.fill(0, 0, this.fill);
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
		this.onUpdate.forEach((onUpdate) => {
			onUpdate();
		});
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
				mergedStyle.size,
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
		lines.forEach((line) => {
			this.baseLine +=
				Math.ceil(mergedStyle.size * mergedStyle.lineHeight) +
				mergedStyle.spacing;
			this.stage.stringFT(
				mergedStyle.colour,
				mergedStyle.fontPath,
				mergedStyle.size,
				0,
				mergedStyle.spacing,
				this.baseLine,
				line,
			);
			this.baseLine += Math.ceil(mergedStyle.size * mergedStyle.lineDrop);
		});
	}
}
