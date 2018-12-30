import * as rpio from "rpio";

interface Pins {
	reset: number;
	ready: number;
}

export interface DisplayDimensions {
	width: number;
	height: number;
}

export interface PixelGrid {
	getPixel(x: number, y: number): number;
}

export class Display {
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
		dataFormat: [0x00, 0x00, 0x01, 0x31],
		getInfo: [0x60, 0x00, 0x03, 0x02],
		longEdge: [0x00, 0x00, 0x04, 0xb0],
		origin: [0x00, 0x00, 0x00, 0x00],
		receiveData: [0x10, 0x00],
		sendData: [0x00, 0x00],
		shortEdge: [0x00, 0x00, 0x03, 0x39],
		transmitArea: [0x60, 0x00, 0x00, 0x21],
		transmitScreen: [0x60, 0x00, 0x00, 0x20],
		updateArea: [0x60, 0x00, 0x00, 0x34],
		updateRisingEdge: [0x00, 0x00, 0x00, 0x01],
		updateSomehow: [0x00, 0x00, 0x00, 0x04],
		updateToWhite: [0x00, 0x00, 0x00, 0x00],
		updateUsingAnti: [0x00, 0x00, 0x00, 0x02],
		updateViaWhite: [0x00, 0x00, 0x00, 0x03],
	};

	private pins: Pins;

	private dimensions: DisplayDimensions;

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
		return this.dimensions;
	}

	public async update(grid: PixelGrid): Promise<void> {
		if (this.inUpdate) {
			return Promise.reject(new Error("Still processing previous update!"));
		}
		this.inUpdate = true;
		await this.write(Display.COMMANDS.transmitScreen);
		await this.write(Display.COMMANDS.dataFormat);
		const data = [];
		for (let y = 0; y < this.dimensions.height; y++) {
			for (let x = 0; x < this.dimensions.width; x++) {
				const pixel = grid.getPixel(x, y);
				data.push(pixel);
			}
		}
		// TODO: Speed the data transfer up, it currently takes about 3s
		await this.write(Display.COMMANDS.sendData.concat(data));
		await this.write(Display.COMMANDS.completeTransmit);
		await this.write(Display.COMMANDS.updateArea);
		await this.write(Display.COMMANDS.origin);
		await this.write(Display.COMMANDS.origin);
		await this.write(Display.COMMANDS.shortEdge);
		await this.write(Display.COMMANDS.shortEdge);
		await this.write(Display.COMMANDS.updateViaWhite);
		this.inUpdate = false;
	}

	private async reset(): Promise<void> {
		rpio.write(this.pins.reset, rpio.LOW);
		return new Promise<void>((resolve) => {
			setTimeout(async () => {
				rpio.write(this.pins.reset, rpio.HIGH);
				await this.write(Display.COMMANDS.updateArea);
				await this.write(Display.COMMANDS.origin);
				await this.write(Display.COMMANDS.origin);
				await this.write(Display.COMMANDS.longEdge);
				await this.write(Display.COMMANDS.shortEdge);
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
		this.dimensions = {
			height: rxBuffer.readInt16BE(4),
			width: rxBuffer.readInt16BE(6),
		};
	}
}
