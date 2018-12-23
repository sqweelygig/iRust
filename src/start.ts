import * as Express from "express";
// Just a file.
const express = Express();
express.listen(process.env.PORT || 80);
