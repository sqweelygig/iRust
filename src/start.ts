// TODO [REFACTOR] Bundle this entire file into a proper class
// TODO [NOTE_TO_SELF] node-gd

import * as rpio from "rpio";

const PIN = {
	READY: 18,
	RESET: 11,
};
const COMMAND = {
	GET_INFO: Buffer.from([0x60, 0x00, 0x03, 0x02]),
	RX_DATA: Buffer.from([0x10, 0x00]),
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

rpio.spiWrite(COMMAND.GET_INFO, COMMAND.GET_INFO.length);
awaitDisplayReady();
const size = 42;
const rxBuffer = Buffer.alloc(size);
rpio.spiTransfer(COMMAND.RX_DATA, rxBuffer, size);

rpio.spiEnd();

console.log(rxBuffer);
console.log(rxBuffer.readInt16BE(4));
console.log(rxBuffer.readInt16BE(6));
