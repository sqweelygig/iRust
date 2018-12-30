import * as moment from "moment";
import * as gd from "node-gd";
import { Display, DisplayDimensions, PixelGrid } from "./display";
import { merge } from "lodash";

interface TextStyle {
	colour: number;
	fontPath: string;
	size: number;
	lineDrop: number; // The space to allocate below the baseLine
	lineHeight: number; // The space to allocate above the baseLine
	spacing: number;
}

class Page implements PixelGrid {
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
						resolve(new Page(stage, defaultStyle));
					} else {
						reject(new Error("Huh? Empty callback!"));
					}
				},
			);
		});
	}

	private stage: Stage;

	private defaultStyle: TextStyle;

	private baseLine: number = 0;

	constructor(stage: Stage, defaultStyle: TextStyle) {
		this.stage = stage;
		this.defaultStyle = defaultStyle;
	}

	public getPixel(x: number, y: number): number {
		return this.stage.getPixel(x, y);
	}

	public write(text: string, style?: Partial<TextStyle>) {
		const mergedStyle = merge(this.defaultStyle, style);
		this.baseLine +=
			Math.ceil(mergedStyle.size * mergedStyle.lineHeight) +
			mergedStyle.spacing;
		console.log(this.stage.stringFTBBox(
				mergedStyle.colour,
				mergedStyle.fontPath,
				mergedStyle.size,
				0,
				mergedStyle.spacing,
				this.baseLine,
				text,
			)
		);
		this.stage.stringFT(
			mergedStyle.colour,
			mergedStyle.fontPath,
			mergedStyle.size,
			0,
			mergedStyle.spacing,
			this.baseLine,
			text,
		);
		this.baseLine += Math.ceil(mergedStyle.size * mergedStyle.lineDrop);
	}
}

async function startClock(display: Display) {
	const dimensions = display.getDimensions();
	// noinspection InfiniteLoopJS
	while (true) {
		const page = await Page.build(
			dimensions,
			{
				colour: 0x000000,
				fontPath: "/usr/src/imuse/lib/sassoon-primary.otf",
				lineDrop: 0.2,
				lineHeight: 1.16,
				size: 64,
				spacing: 40,
			},
			0xffffff,
		);
		const now = moment();
		page.write(now.format("dddd MMMM Do, YYYY"));
		page.write(now.format("hh:mm").toUpperCase(), { size: 128 });
		await display.update(page);
	}
}

Display.build().then(startClock);
