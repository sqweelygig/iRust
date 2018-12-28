// TODO [REFACTOR] Bundle this entire file into a proper class
// TODO [NOTE_TO_SELF] node-gd

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
		completeTransmit: Buffer.from([0x60, 0x00, 0x00, 0x22]),
		dataFormat: Buffer.from([0x00, 0x00, 0x00, 0x30]),
		fullHeight: Buffer.from([0x00, 0x00, 0x03, 0x39]),
		fullWidth: Buffer.from([0x00, 0x00, 0x04, 0xb0]),
		getInfo: Buffer.from([0x60, 0x00, 0x03, 0x02]),
		origin: Buffer.from([0x00, 0x00, 0x00, 0x00]),
		receiveData: Buffer.from([0x10, 0x00]),
		refreshScreen: Buffer.from([0x60, 0x00, 0x00, 0x34]),
		sendData: Buffer.from([0x00, 0x00]),
		transmitScreen: Buffer.from([0x60, 0x00, 0x00, 0x20]),
		viaGray: Buffer.from([0x00, 0x00, 0x00, 0x02]),
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

	public async testTransmit(): Promise<void> {
		await this.displayReady();
		rpio.spiWrite(
			Display.COMMANDS.transmitScreen,
			Display.COMMANDS.transmitScreen.length,
		);
		await this.displayReady();
		rpio.spiWrite(
			Display.COMMANDS.dataFormat,
			Display.COMMANDS.dataFormat.length,
		);
		await this.displayReady();
		const data = new Array(1200 * 825).fill(0x00);
		const payload = Buffer.from([0x00, 0x00].concat(data));
		rpio.spiWrite(payload, payload.length);
		await this.displayReady();
		rpio.spiWrite(
			Display.COMMANDS.completeTransmit,
			Display.COMMANDS.completeTransmit.length,
		);
		await this.displayReady();
		rpio.spiWrite(
			Display.COMMANDS.refreshScreen,
			Display.COMMANDS.refreshScreen.length,
		);
		await this.displayReady();
		rpio.spiWrite(Display.COMMANDS.origin, Display.COMMANDS.origin.length);
		await this.displayReady();
		rpio.spiWrite(Display.COMMANDS.origin, Display.COMMANDS.origin.length);
		await this.displayReady();
		rpio.spiWrite(
			Display.COMMANDS.fullWidth,
			Display.COMMANDS.fullWidth.length,
		);
		await this.displayReady();
		rpio.spiWrite(
			Display.COMMANDS.fullHeight,
			Display.COMMANDS.fullHeight.length,
		);
		await this.displayReady();
		rpio.spiWrite(Display.COMMANDS.viaGray, Display.COMMANDS.viaGray.length);
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

	private async readDisplaySpecification(): Promise<void> {
		await this.displayReady();
		rpio.spiWrite(Display.COMMANDS.getInfo, Display.COMMANDS.getInfo.length);
		await this.displayReady();
		const size = 42;
		const rxBuffer = Buffer.alloc(size);
		rpio.spiTransfer(Display.COMMANDS.receiveData, rxBuffer, size);
		this.spec = {
			height: rxBuffer.readInt16BE(6),
			width: rxBuffer.readInt16BE(4),
		};
	}
}

async function test() {
	const d = await Display.build();
	console.log(d.getDisplaySpecification());
	await d.testTransmit();
	d.destructor();
}

test().then(() => {
	console.log("Test cycle complete.");
});
