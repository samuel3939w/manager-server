/**
 * 角色管理模塊
 */
const router = require("koa-router")();
const Role = require("./../models/roleSchema");
const util = require("./../utils/util");
const jwt = require("jsonwebtoken");
const md5 = require("md5");
router.prefix("/roles");

// 查詢所有角色列表
router.get("/allList", async (ctx) => {
  try {
    const list = await Role.find({}, "_id roleName");
    ctx.body = util.success(list);
  } catch (error) {
    ctx.body = util.fail(`查詢失敗:${error.stack}`);
  }
});

// 按頁獲取角色列表
router.get("/list", async (ctx) => {
  const { roleName } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query);
  try {
    const params = {};
    if (roleName) params.roleName = roleName;
    const query = Role.find(params);
    const list = await query.skip(skipIndex).limit(page.pageSize);
    const total = await Role.countDocuments(params);
    ctx.body = util.success({
      list,
      page: {
        ...page,
        total,
      },
    });
  } catch (error) {
    ctx.body = util.fail(`查詢失敗:${error.stack}`);
  }
});

// 角色操作: 創建,編輯和刪除
router.post("/operate", async (ctx) => {
  const { _id, roleName, remark, action } = ctx.request.body;
  let res, info;
  try {
    if (action == "create") {
      res = await Role.create({ roleName, remark });
      info = "創建成功";
    } else if (action == "edit") {
      if (_id) {
        let params = { roleName, remark };
        params.updateTime = new Date();
        res = await Role.findByIdAndUpdate(_id, params);
        info = "編輯成功";
      } else {
        ctx.body = util.fail("缺少參數params: _id");
        return;
      }
    } else {
      if (_id) {
        await Role.findByIdAndRemove(_id);
        info = "刪除成功";
      } else {
        ctx.body = util.fail("缺少參數params: _id");
        return;
      }
    }
    ctx.body = util.success(res, info);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
});

// 權限設置
router.post("/update/permission", async (ctx) => {
  const { _id, permissionList } = ctx.request.body;
  try {
    const params = { permissionList, updateTime: new Date() };
    await Role.findByIdAndUpdate(_id, params);
    ctx.body = util.success("", "權限設置成功");
  } catch (error) {
    ctx.body = util.fail(`權限設置失敗: ${error.stack}`);
  }
});

module.exports = router;
