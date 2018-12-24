// TODO [REFACTOR] Bundle this entire file into a proper class

import * as rpio from "rpio";

const COMMAND = 0x6000;
const WRITE_DATA = 0x0000;

const FULL_IMAGE = 0x0020;
const END_IMAGE = 0x0022;

const WIDTH  = 1200;
const HEIGHT = 825;

const START_UPDATE = new Buffer([COMMAND, FULL_IMAGE]);
const END_UPDATE = new Buffer([COMMAND, END_IMAGE]);

rpio.spiBegin();
rpio.spiSetClockDivider(32);
rpio.spiWrite(START_UPDATE, START_UPDATE.length);
rpio.spiWrite(END_UPDATE, START_UPDATE.length);
rpio.spiEnd();
