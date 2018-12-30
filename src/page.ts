import { merge } from "lodash";
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

export class Page implements PixelGrid {
	public static async build(
		dimensions: DisplayDimensions,
		defaultStyle: TextStyle,
		fill?: number,
	): Promise<Page> {
		return new Promise<Page>((resolve, reject) => {
			gd.createTrueColor(
				dimensions.width,
				dimensions.height,
				(error, stage) => {
					if (error) {
						reject(error);
					} else if (stage) {
						if (fill) {
							stage.fill(0, 0, fill);
						}
						resolve(new Page(stage, defaultStyle, dimensions));
					} else {
						reject(new Error("Huh? Empty callback!"));
					}
				},
			);
		});
	}

	private readonly stage: Stage;

	private readonly defaultStyle: TextStyle;

	private readonly dimensions: DisplayDimensions;

	private baseLine: number = 0;

	constructor(
		stage: Stage,
		defaultStyle: TextStyle,
		dimensions: DisplayDimensions,
	) {
		this.stage = stage;
		this.defaultStyle = defaultStyle;
		this.dimensions = dimensions;
	}

	public getPixel(x: number, y: number): number {
		return this.stage.getPixel(x, y);
	}

	public write(text: string, style?: Partial<TextStyle>) {
		const lines = [""];
		const words = text.split(/ /g);
		const mergedStyle = merge(this.defaultStyle, style);
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
