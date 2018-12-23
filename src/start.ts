import * as epd from "epd7x5";

epd.init();

const image = epd.getImageBuffer();

console.log(image.height);

image.filledRectangle(0, 220, 640, 310, epd.white);

epd.displayImageBuffer(image);
