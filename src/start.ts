import * as epd from "epd7x5";

epd.init();

const frame = epd.getImageBuffer();

epd.displayImageBuffer(frame);
