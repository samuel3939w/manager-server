const router = require("koa-router")();
const util = require("../utils/util");
const Menu = require("../models/menuSchema");

router.prefix("/menu");

router.get("/list", async (ctx) => {
  const { menuName, menuState } = ctx.request.query;
  const params = {};
  if (menuName) params.menuName = menuName;
  if (menuState) params.menuState = menuState;
  let rootList = (await Menu.find(params)) || [];

  const permissionList = util.getTreeMenu(rootList, null, []);
  ctx.body = util.success(permissionList);
});


router.post("/operate", async (ctx) => {
  const { _id, action, ...params } = ctx.request.body;
  let res, info;
  try {
    if (action == "add") {
      res = await Menu.create(params);
      if (!res) throw new Error("創建失敗");
      info = "創建成功";
    } else if (action == "edit") {
      params.updateTime = new Date();
      res = await Menu.findByIdAndUpdate(_id, params);
      if (!res) throw new Error("編輯失敗");
      info = "編輯成功";
    } else {
      res = await Menu.findByIdAndRemove(_id);
      if (!res) throw new Error("刪除失敗");
      await Menu.deleteMany({ parentId: { $all: [_id] } });
      info = "刪除成功";
    }
    ctx.body = util.success("", info);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
});

module.exports = router;
