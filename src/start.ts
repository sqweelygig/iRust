import * as moment from "moment";
import * as gd from "node-gd";
import { Display, DisplayDimensions, PixelGrid } from "./display";

interface TextStyle {
	colour: number;
	fontPath: string;
	size: number;
	lineDrop: number; // The space to allocate below the baseLine
	lineHeight: number; // The space to allocate above the baseLine
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

	public write(text: string) {
		this.baseLine += Math.ceil(this.defaultStyle.size * this.defaultStyle.lineHeight);
		this.stage.stringFT(
			this.defaultStyle.colour,
			this.defaultStyle.fontPath,
			this.defaultStyle.size,
			0,
			0,
			this.baseLine,
			text,
		);
		this.baseLine += Math.ceil(this.defaultStyle.size * this.defaultStyle.lineDrop);
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
				lineHeight: 1.5,
				size: 64,
			},
			0xffffff,
		);
		const now = moment();
		page.write(now.format("dddd MMMM Do, YYYY"));
		page.write(now.format("hh:mm"));
		await display.update(page);
	}
}

Display.build().then(startClock);
