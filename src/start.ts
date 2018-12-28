// TODO [REFACTOR] Bundle this entire file into a proper class
// TODO [NOTE_TO_SELF] node-gd?

import * as rpio from "rpio";

interface Pins {
	reset: number;
	ready: number;
	// TODO: [IMPROVEMENT] chipSelect
}

interface DisplaySpecification {
	// TODO [IMPROVEMENT] Firmware version, etc.
	width: number;
	height: number;
}

class Display {
	public static async build(): Promise<Display> {
		const display = new Display();
		await display.reset();
		await display.readDisplaySpecification();
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
		transmitScreen: [0x60, 0x00, 0x00, 0x20],
		viaGray: [0x00, 0x00, 0x00, 0x02],
		viaWhite: [0x00, 0x00, 0x00, 0x00],
	};

	private pins: Pins;

	private spec: DisplaySpecification;

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

	public getDisplaySpecification(): DisplaySpecification {
		return this.spec;
	}

	public async sendPixels(data: number[]): Promise<void> {
		await this.write(Display.COMMANDS.transmitScreen);
		await this.write(Display.COMMANDS.dataFormat);
		await this.write(Display.COMMANDS.sendData.concat(data));
		await this.write(Display.COMMANDS.completeTransmit);
		await this.write(Display.COMMANDS.refreshScreen);
		await this.write(Display.COMMANDS.origin);
		await this.write(Display.COMMANDS.origin);
		await this.write(Display.COMMANDS.fullWidth);
		await this.write(Display.COMMANDS.fullHeight);
		await this.write([0x00, 0x00, 0x00, 0x01]);
	}

	private async reset(): Promise<void> {
		rpio.write(this.pins.reset, rpio.LOW);
		return new Promise<void>((resolve) => {
			setTimeout(() => {
				rpio.write(this.pins.reset, rpio.HIGH);
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
	}

	private async readDisplaySpecification(): Promise<void> {
		await this.write(Display.COMMANDS.getInfo);
		await this.displayReady();
		const size = 42;
		const rxBuffer = Buffer.alloc(size);
		rpio.spiTransfer(Buffer.from(Display.COMMANDS.receiveData), rxBuffer, size);
		this.spec = {
			height: rxBuffer.readInt16BE(6),
			width: rxBuffer.readInt16BE(4),
		};
	}
}

async function test() {
	const d = await Display.build();
	console.log(d.getDisplaySpecification());
	await d.sendPixels(new Array(1200 * 825).fill(0x00));
	d.destructor();
}

test().then(() => {
	console.log("Test cycle complete.");
});
