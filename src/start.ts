// TODO [REFACTOR] Bundle this entire file into a proper class

import * as rpio from "rpio";

// const COMMAND = ;
// const WRITE_DATA = 0x0000;

// const FULL_IMAGE = 0x20;
// const END_IMAGE = 0x22;

// const WIDTH = 1200;
// const HEIGHT = 825;

// const EMPTY = 0x00;

const START_UPDATE = Buffer.from([0x60, 0x00, 0x00, 0x20]);
const END_UPDATE = Buffer.from([0x60, 0x00, 0x00, 0x22]);

const DATA_PREFIX = [0x00, 0x00];

function write(data: number[]) {
	const payload = Buffer.from(DATA_PREFIX.concat(data));
	rpio.spiBegin();
	rpio.spiSetClockDivider(32);
	rpio.spiWrite(START_UPDATE, START_UPDATE.length);
	rpio.spiWrite(payload, payload.length);
	rpio.spiWrite(END_UPDATE, START_UPDATE.length);
	rpio.spiEnd();
}

write([]);
