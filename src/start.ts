// TODO [REFACTOR] Bundle this entire file into a proper class
// TODO [NOTE_TO_SELF] node-gd

// import * as rpio from "rpio";
//
// const PIN = {
// 	CHIP_SELECT: 24,
// 	HARDWARE_READY: 18,
// };
//
// const STATE = {
// 	HIGH: 1,
// 	LOW: 0,
// };
//
// const PREFIX = {
// 	COMMAND: 0x6000,
// 	READ: 0x1000,
// 	WRITE: 0x0000,
// };
//
// const COMMAND = {
// 	GET_INFO: 0x0302,
// };

//
// const WIDTH = 1200;
// const HEIGHT = 825;
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
