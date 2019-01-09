import { merge } from "lodash";
import * as gd from "node-gd";
import { DisplayDimensions, PixelGrid } from "./display";

// TODO [IMPROVEMENT] Include text alignment.

export interface TextStyle {
	colour: number;
	fontPath: string;
	fontSize: number;
	belowEachBaseline: number;
	aboveEachBaseline: number;
	besideEachParagraph: number;
	aboveEachParagraph: number;
	belowEachParagraph: number;
}

export interface Cursor {
	top: number;
	left: number;
	right: number;
}

export class DrawingArea implements PixelGrid {
	public static async build(
		dimensions: DisplayDimensions,
		background?: number,
	): Promise<DrawingArea> {
		const panel = new DrawingArea(dimensions, background);
		await panel.clear();
		return panel;
	}

	public readonly dimensions: DisplayDimensions;

	private stage: Stage;

	private cursor: Cursor = {
		left: 0,
		right: 0,
		top: 0,
	};

	private readonly background: number;

	private constructor(
		dimensions: DisplayDimensions,
		background: number = 0xffffff,
	) {
		this.dimensions = dimensions;
		this.background = background;
	}

	public clear(): Promise<void> {
		this.cursor.top = 0;
		this.cursor.left = 0;
		this.cursor.right = this.dimensions.width;
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

	public getCursor(): Cursor {
		return this.cursor;
	}

	public setCursor(cursor: Partial<Cursor>): void {
		merge(
			this.cursor,
			{ top: 0, right: this.dimensions.width, left: 0 },
			cursor,
		);
	}

	public getPixel(x: number, y: number): number {
		return this.stage.getPixel(x, y);
	}

	public writeParagraph(args: { style: TextStyle; text: string }) {
		const lines = [""];
		const words = args.text.split(/\s+/g);
		words.forEach((word) => {
			// Prototype by adding the word to the final line
			const appendedLine = `${lines[lines.length - 1]} ${word}`.trim();
			// Get the bounding box of the prototype final line
			const box = this.stage.stringFTBBox(
				args.style.colour,
				args.style.fontPath,
				args.style.fontSize,
				0,
				args.style.besideEachParagraph + this.cursor.left,
				this.cursor.top,
				appendedLine,
			);
			if (box[2] + args.style.besideEachParagraph <= this.cursor.right) {
				// If the prototype fits then update the final line and repeat
				lines[lines.length - 1] = appendedLine;
			} else {
				// If the prototype doesn't fit then start a new line
				lines.push(word);
			}
		});
		this.cursor.top += Math.ceil(
			args.style.fontSize * args.style.aboveEachParagraph,
		);
		lines.forEach((line) => {
			this.cursor.top += Math.ceil(
				args.style.fontSize * args.style.aboveEachBaseline,
			);
			this.stage.stringFT(
				args.style.colour,
				args.style.fontPath,
				args.style.fontSize,
				0,
				args.style.besideEachParagraph + this.cursor.left,
				this.cursor.top,
				line,
			);
			this.cursor.top += Math.ceil(
				args.style.fontSize * args.style.belowEachBaseline,
			);
		});
		this.cursor.top += Math.ceil(
			args.style.fontSize * args.style.belowEachParagraph,
		);
	}
}
