// TODO [REFACTOR] Bundle this entire file into a proper class
// TODO [NOTE_TO_SELF] node-gd

import * as rpio from "rpio";

// const COMMAND = ;
// const WRITE_DATA = 0x0000;

// const FULL_IMAGE = 0x20;
// const END_IMAGE = 0x22;

const WIDTH = 1200;
const HEIGHT = 825;

// const EMPTY = 0x00;

const START_UPDATE = Buffer.from([0x60, 0x00, 0x00, 0x20]);
const END_UPDATE = Buffer.from([0x60, 0x00, 0x00, 0x22]);

function write(data: number[]) {
	const byteDigestedData = [0x00, 0x00];
	data.forEach((datum) => {
		byteDigestedData.push(Math.floor(datum / 256));
		byteDigestedData.push(datum % 256);
	});
	const payload = Buffer.from(byteDigestedData);
	rpio.spiBegin();
	rpio.spiSetClockDivider(32);
	rpio.open(24, rpio.OUTPUT, rpio.HIGH);
	rpio.msleep(500);
	rpio.write(24, rpio.LOW);
	rpio.spiWrite(START_UPDATE, START_UPDATE.length);
	rpio.write(24, rpio.HIGH);
	rpio.msleep(500);
	rpio.write(24, rpio.LOW);
	rpio.spiWrite(payload, payload.length);
	rpio.write(24, rpio.HIGH);
	rpio.msleep(500);
	rpio.write(24, rpio.LOW);
	rpio.spiWrite(END_UPDATE, START_UPDATE.length);
	rpio.write(24, rpio.HIGH);
	rpio.spiEnd();
}

write(new Array<number>(WIDTH * HEIGHT));

rpio.sleep(300);
