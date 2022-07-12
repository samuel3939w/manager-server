/**
 * 數據庫連接
 */
const mongoose = require("mongoose");
const config = require("./index");
const log4js = require("../utils/log4j");

mongoose.connect(config.URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", () => {
  log4js.error("***數據庫連接失敗***");
});

db.on("open", () => {
  log4js.info("***數據庫連接成功***");
});
