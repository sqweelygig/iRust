import * as moment from "moment";
import * as gd from "node-gd";
import * as rpio from "rpio";

interface Pins {
	reset: number;
	ready: number;
}

interface DisplayDimensions {
	width: number;
	height: number;
}

class Display {
	public static async build(): Promise<Display> {
		const display = new Display();
		await display.reset();
		await display.readHardwareInformation();
		return display;
	}

	private static PINS = {
		ready: 18,
		reset: 11,
	};

	private static COMMANDS = {
		completeTransmit: [0x60, 0x00, 0x00, 0x22],
		dataFormat: [0x00, 0x00, 0x00, 0x30],
		fullHeight: [0x00, 0x00, 0x03, 0x39],
		fullWidth: [0x00, 0x00, 0x04, 0xb0],
		getInfo: [0x60, 0x00, 0x03, 0x02],
		origin: [0x00, 0x00, 0x00, 0x00],
		receiveData: [0x10, 0x00],
		refreshScreen: [0x60, 0x00, 0x00, 0x34],
		sendData: [0x00, 0x00],
		transmitArea: [0x60, 0x00, 0x00, 0x21],
		transmitScreen: [0x60, 0x00, 0x00, 0x20],
		updateRisingEdge: [0x00, 0x00, 0x00, 0x01],
		updateSomehow: [0x00, 0x00, 0x00, 0x04],
		updateToWhite: [0x00, 0x00, 0x00, 0x00],
		updateUsingAnti: [0x00, 0x00, 0x00, 0x02],
		updateViaWhite: [0x00, 0x00, 0x00, 0x03],
	};

	private pins: Pins;

	private spec: DisplayDimensions;

	private inUpdate: boolean;

	private constructor(pins = Display.PINS) {
		this.pins = pins;
		rpio.init({
			gpiomem: false,
		});
		rpio.open(this.pins.reset, rpio.OUTPUT, rpio.HIGH);
		rpio.open(this.pins.ready, rpio.INPUT);
		rpio.spiBegin();
		rpio.spiSetClockDivider(32);
	}

	public destructor(): void {
		rpio.spiEnd();
		rpio.close(this.pins.ready);
		rpio.close(this.pins.reset);
	}

	public getDimensions(): DisplayDimensions {
		return this.spec;
	}

	public async createStage(fill?: number): Promise<Stage> {
		return new Promise<Stage>((resolve, reject) => {
			gd.createTrueColor(this.spec.width, this.spec.height, (error, stage) => {
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

	public async sendStage(stage: Stage): Promise<void> {
		if (this.inUpdate) {
			return Promise.reject(new Error("Still processing previous update!"));
		}
		this.inUpdate = true;
		await this.write(Display.COMMANDS.transmitScreen);
		await this.write(Display.COMMANDS.dataFormat);
		const data = [];
		for (let y = 0; y < this.spec.height; y++) {
			for (let x = 0; x < this.spec.width; x++) {
				const pixel = stage.getPixel(x, y);
				data.push(pixel);
			}
		}
		// TODO: Speed the data transfer up, it currently takes about 3s
		await this.write(Display.COMMANDS.sendData.concat(data));
		await this.write(Display.COMMANDS.completeTransmit);
		await this.write(Display.COMMANDS.refreshScreen);
		await this.write(Display.COMMANDS.origin);
		await this.write(Display.COMMANDS.origin);
		await this.write(Display.COMMANDS.fullWidth);
		await this.write(Display.COMMANDS.fullHeight);
		await this.write(Display.COMMANDS.updateViaWhite);
		this.inUpdate = false;
	}

	private async reset(): Promise<void> {
		rpio.write(this.pins.reset, rpio.LOW);
		return new Promise<void>((resolve) => {
			setTimeout(async () => {
				rpio.write(this.pins.reset, rpio.HIGH);
				await this.write(Display.COMMANDS.refreshScreen);
				await this.write(Display.COMMANDS.origin);
				await this.write(Display.COMMANDS.origin);
				await this.write(Display.COMMANDS.fullWidth);
				await this.write(Display.COMMANDS.fullHeight);
				await this.write(Display.COMMANDS.updateToWhite);
				resolve();
			}, 100);
		});
	}

	private async displayReady(): Promise<void> {
		return new Promise((resolve) => {
			const interval = setInterval(() => {
				if (rpio.read(this.pins.ready) === rpio.HIGH) {
					clearInterval(interval);
					resolve();
				}
			}, 1);
		});
	}

	private async write(data: number[]): Promise<void> {
		await this.displayReady();
		const buffer = Buffer.from(data);
		rpio.spiWrite(buffer, buffer.length);
		await this.displayReady();
	}

	private async readHardwareInformation(): Promise<void> {
		await this.write(Display.COMMANDS.getInfo);
		const size = 42;
		const rxBuffer = Buffer.alloc(size);
		rpio.spiTransfer(Buffer.from(Display.COMMANDS.receiveData), rxBuffer, size);
		this.spec = {
			height: rxBuffer.readInt16BE(6),
			width: rxBuffer.readInt16BE(4),
		};
	}
}

async function startClock(display: Display) {
	const spec = display.getDimensions();
	const radius = Math.floor(Math.min(spec.width, spec.height) / 2);
	// noinspection InfiniteLoopJS
	while (true) {
		const stage = await display.createStage(0xffffff);
		const now = moment();
		stage.setThickness(3);
		stage.filledEllipse(10, 30, 20, 60, 0x000000);
		stage.filledEllipse(radius, radius, radius * 2, radius * 2, 0x000000);
		stage.filledEllipse(
			radius,
			radius,
			radius * 2 - 3,
			radius * 2 - 3,
			0xffffff,
		);
		stage.line(
			radius,
			radius,
			radius - Math.round(radius * Math.sin((now.seconds() * Math.PI) / 30)),
			radius + Math.round(radius * Math.cos((now.seconds() * Math.PI) / 30)),
			0x666666,
		);
		stage.line(
			radius,
			radius,
			radius - Math.round(radius * Math.sin((now.minutes() * Math.PI) / 30)),
			radius + Math.round(radius * Math.cos((now.minutes() * Math.PI) / 30)),
			0x000000,
		);
		stage.line(
			radius,
			radius,
			radius - Math.round(0.7 * radius * Math.sin((now.hour() * Math.PI) / 6)),
			radius + Math.round(0.7 * radius * Math.cos((now.hour() * Math.PI) / 6)),
			0x000000,
		);
		stage.stringFT(
			0x000000,
			"/usr/src/imuse/lib/sassoon-primary.ttf",
			32,
			Math.PI / 4,
			300,
			300,
			"Hello world!",
		);
		await display.sendStage(stage);
	}
}

Display.build().then(startClock);
