import * as gd from "node-gd";
import { DisplayDimensions } from "./display";

export class Page extends Stage {
	public static build(
		dimensions: DisplayDimensions,
		fill?: number,
	): Promise<Page> {
		return new Promise<Page>((resolve, reject) => {
			gd.createTrueColor(
				dimensions.width,
				dimensions.height,
				(error, page) => {
					if (error) {
						reject(error);
					} else if (page) {
						if (fill) {
							page.fill(0, 0, fill);
						}
						resolve(page);
					} else {
						reject();
					}
				},
			);
		});
	}
}
