// TODO [REFACTOR] Bundle this entire file into a proper class
// TODO [NOTE_TO_SELF] node-gd

import * as rpio from "rpio";

const PIN = {
	READY: 18,
	RESET: 11,
	SELECT: 24,
};
const PREFIX = {
	COMMAND: Buffer.from([0x60, 0x00]),
	READ: Buffer.from([0x10, 0x00]),
	WRITE: Buffer.from([0x00, 0x00]),
};
const COMMAND = {
	GET_INFO: Buffer.from([0x60, 0x00, 0x03, 0x02]),
};

function awaitDisplayReady() {
	let hardwareReady = rpio.read(PIN.READY);
	while (hardwareReady === rpio.LOW) {
		hardwareReady = rpio.read(PIN.READY);
	}
}

rpio.init({
	gpiomem: false,
});
rpio.open(PIN.RESET, rpio.OUTPUT, rpio.HIGH);
rpio.open(PIN.READY, rpio.INPUT);
rpio.spiBegin();
rpio.spiSetClockDivider(32);

rpio.write(PIN.RESET, rpio.LOW);
rpio.msleep(100);
rpio.write(PIN.RESET, rpio.HIGH);

awaitDisplayReady();
rpio.write(PIN.SELECT, rpio.LOW);
rpio.spiWrite(COMMAND.GET_INFO, COMMAND.GET_INFO.length);
rpio.spiEnd();
rpio.write(PIN.SELECT, rpio.HIGH);
awaitDisplayReady();
rpio.write(PIN.SELECT, rpio.LOW);
rpio.spiBegin();
rpio.spiSetClockDivider(32);
rpio.spiWrite(PREFIX.READ, PREFIX.READ.length);
awaitDisplayReady();
const size = 42;
const rxBuffer = Buffer.alloc(size);
rpio.spiTransfer(Buffer.alloc(size, 0x00), rxBuffer, size);
rpio.spiEnd();
rpio.write(PIN.SELECT, rpio.HIGH);
console.log(rxBuffer);
//
// const START_UPDATE = Buffer.from([0x60, 0x00, 0x00, 0x20]);
// const END_UPDATE = Buffer.from([0x60, 0x00, 0x00, 0x22]);
// const UPDATE_DISPLAY = Buffer.from([0x60, 0x00, 0x00, 0x34]);
// const DEFINE_AREA = Buffer.from([
// 	0x00,
// 	0x00,
// 	0x00,
// 	0x00,
// 	Math.floor(WIDTH / 256),
// 	WIDTH % 256,
// 	Math.floor(HEIGHT / 256),
// 	HEIGHT % 256,
// 	0x00,
// 	2,
// ]);
//
// function write(data: number[]) {
// 	const byteDigestedData = [0x00, 0x00];
// 	data.forEach((datum) => {
// 		byteDigestedData.push(Math.floor(datum / 256));
// 		byteDigestedData.push(datum % 256);
// 	});
// 	const payload = Buffer.from(byteDigestedData);
// 	rpio.spiBegin();
// 	rpio.spiSetClockDivider(32);
// 	rpio.open(24, rpio.OUTPUT, rpio.HIGH);
// 	rpio.write(24, rpio.HIGH);
// 	rpio.msleep(500);
// 	rpio.write(24, rpio.LOW);
// 	rpio.spiWrite(START_UPDATE, START_UPDATE.length);
// 	rpio.write(24, rpio.HIGH);
// 	rpio.msleep(500);
// 	rpio.write(24, rpio.LOW);
// 	rpio.spiWrite(payload, payload.length);
// 	rpio.write(24, rpio.HIGH);
// 	rpio.msleep(500);
// 	rpio.write(24, rpio.LOW);
// 	rpio.spiWrite(END_UPDATE, START_UPDATE.length);
// 	rpio.write(24, rpio.HIGH);
// 	rpio.msleep(500);
// 	rpio.write(24, rpio.LOW);
// 	rpio.spiWrite(UPDATE_DISPLAY, UPDATE_DISPLAY.length);
// 	rpio.write(24, rpio.HIGH);
// 	rpio.msleep(500);
// 	rpio.write(24, rpio.LOW);
// 	rpio.spiWrite(DEFINE_AREA, DEFINE_AREA.length);
// 	rpio.write(24, rpio.HIGH);
// 	rpio.spiEnd();
// }
//
// write(new Array<number>(WIDTH * HEIGHT).fill(0x00000000));
//
// rpio.sleep(300);
