import * as Express from "express";
import * as rpio from "rpio";

console.log("Creating a Express instance, to keep the process alive.");
const express = Express();
express.listen(process.env.PORT || 80);

console.log("rpio.spiBegin");
rpio.spiBegin();
console.log("rpio.spiEnd");
rpio.spiEnd();
