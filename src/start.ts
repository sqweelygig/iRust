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
		getInfo: Buffer.from([0x60, 0x00, 0x03, 0x02]),
		receiveData: Buffer.from([0x10, 0x00]),
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

Display.build().then((d: Display) => {
	console.log(d.getDisplaySpecification());
	d.destructor();
});
