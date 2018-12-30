import * as gd from "node-gd";
import { DisplayDimensions } from "./display";

export class Page extends Stage {
	public static build(dimensions: DisplayDimensions, fill?: number): Promise<Page> {
		return new Promise<Stage>((resolve, reject) => {
			gd.createTrueColor(dimensions.width, dimensions.height, (error, stage) => {
				if (error) {
					reject(error);
				} else if (stage) {
					if (fill) {
						stage.fill(0, 0, fill);
					}
					resolve(stage);
				} else {
					reject();
				}
			});
		});
	}
}
