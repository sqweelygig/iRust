// TODO [REFACTOR] Bundle this entire file into a proper class

import * as rpio from "rpio";

rpio.spiBegin();
rpio.spiSetClockDivider(32);
rpio.spiEnd();
