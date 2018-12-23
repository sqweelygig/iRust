import * as epd from "epd7x5";

epd.init();

const image = epd.getImageBuffer();

console.log(image.height);
