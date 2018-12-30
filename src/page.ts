import * as gd from "node-gd";
import { DisplayDimensions, PixelGrid } from "./display";

interface TextStyle {
	colour: number;
	font: string;
	size: number;
}

export class Page implements PixelGrid {
	public static build(
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
						reject(new Error("Huh? Should have either error or stage?"));
					}
				},
			);
		});
	}

	private stage: Stage;
	private defaultStyle: TextStyle;

	constructor(stage: Stage, defaultStyle: TextStyle) {
		this.stage = stage;
		this.defaultStyle = defaultStyle;
	}

	public getPixel(x: number, y: number): number {
		return this.stage.getPixel(x, y);
	}

	public write(text: string): void {
		this.stage.stringFT(
			this.defaultStyle.colour,
			this.defaultStyle.font,
			this.defaultStyle.size,
			Math.PI / 2,
			0,
			0,
			text,
		);
	}
}
