/**
 * 日誌儲存
 */
const log4js = require("log4js");

const levels = {
  trace: log4js.levels.TRACE,
  debug: log4js.levels.DEBUG,
  info: log4js.levels.INFO,
  warn: log4js.levels.WARN,
  error: log4js.levels.ERROR,
  fatal: log4js.levels.FATAL,
};

log4js.configure({
  appenders: {
    console: { type: "console" },
    info: {
      type: "file",
      filename: "logs/all-logs.log",
    },
    error: {
      type: "dateFile",
      filename: "logs/log",
      pattern: "yyyy-MM-dd.log",
      alwaysIncludePattern: true, // 設置文件名稱為 filename + pattern
    },
  },
  categories: {
    default: { appenders: ["console"], level: "debug" },
    info: { appenders: ["console", "info"], level: "info" },
    error: { appenders: ["console", "error"], level: "error" },
  },
});

/**
 * 日誌輸出,level為debug
 * @param {string} content
 */
exports.debug = (content) => {
  let logger = log4js.getLogger();
  logger.level = levels.debug;
  logger.debug(content);
};

/**
 * 日誌輸出,level為error
 * @param {string} content
 */
exports.error = (content) => {
  let logger = log4js.getLogger('error');
  logger.level = levels.error;
  logger.error(content);
};

/**
 * 日誌輸出,level為info
 * @param {string} content
 */
exports.info = (content) => {
  let logger = log4js.getLogger('info');
  logger.level = levels.info;
  logger.info(content);
};
