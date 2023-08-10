const Koa = require("koa");
const app = new Koa();
const views = require("koa-views");
const json = require("koa-json");
const onerror = require("koa-onerror");
const bodyparser = require("koa-bodyparser");
const logger = require("koa-logger");
const log4js = require("./utils/log4j");
const router = require("koa-router")();
const jwt = require("jsonwebtoken");
const koajwt = require("koa-jwt");
const util = require("./utils/util");
const users = require("./routes/users");
const menus = require("./routes/menus");
const roles = require("./routes/roles");
const depts = require("./routes/depts");
const leaves = require("./routes/leaves");
const system = require("./routes/system");
//const koaBody = require("koa-body");

// error handler
onerror(app);

require("./config/db");

// 檔案上傳
// app.use(
//   koaBody({
//     multipart: true,
//     formidable: {
//       maxFileSize: 200 * 1024 * 1024, // 設定上傳檔案大小最大限制，預設2M
//     },
//   })
// );

// middlewares
app.use(
  bodyparser({
    enableTypes: ["json", "form", "text"],
  })
);
app.use(json());
app.use(logger());
app.use(require("koa-static")(__dirname + "/public"));
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use(
  views(__dirname + "/views", {
    extension: "pug",
  })
);

// logger
app.use(async (ctx, next) => {
  log4js.info(`post params:${JSON.stringify(ctx.request.body)}`);
  log4js.info(`get params:${JSON.stringify(ctx.request.query)}`);
  await next().catch((err) => {
    if (err.status == "401") {
      ctx.status = 200;
      ctx.body = util.fail("Token認證失敗", util.CODE.AUTH_ERROR);
    } else {
      throw err;
    }
  });
});

// 驗證token是否有效
app.use(
  koajwt({ secret: "pro-partner" }).unless({
    path: [/^\/api\/users\/login/],
  })
);

router.prefix("/api");

// routes
router.use(users.routes(), users.allowedMethods());
router.use(menus.routes(), menus.allowedMethods());
router.use(roles.routes(), roles.allowedMethods());
router.use(depts.routes(), depts.allowedMethods());
router.use(leaves.routes(), leaves.allowedMethods());
router.use(system.routes(), system.allowedMethods());

app.use(router.routes(), router.allowedMethods());
// error-handling
app.on("error", (err, ctx) => {
  log4js.error(`${err.stack}`);
});

module.exports = app;
