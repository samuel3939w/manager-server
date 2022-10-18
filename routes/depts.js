const router = require("koa-router")();
const util = require("./../utils/util");
const Dept = require("./../models/deptSchema");

router.prefix("/dept");

// 部門樹型列表
router.get("/list", async (ctx) => {
  try {
    const { deptName } = ctx.request.query;
    const params = {};
    if (deptName) params.deptName = deptName;
    const rootList = await Dept.find(params);
    if (deptName) {
      ctx.body = util.success(rootList);
    } else {
      const treeDeptList = getTreeDept(rootList, null, []);
      ctx.body = util.success(treeDeptList);
    }
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
});

// 遞歸拼接樹型列表
function getTreeDept(rootList, id, list) {
  for (let i = 0; i < rootList.length; i++) {
    let item = rootList[i];
    if (String(item.parentId.slice().pop()) == String(id)) {
      list.push(item._doc);
    }
  }
  list.map((item) => {
    item.children = [];
    getTreeDept(rootList, item._id, item.children);
    if (item.children.length == 0) {
      delete item.children;
    }
  });
  return list;
}

// 部門操作 : 創建,編輯,刪除
router.post("/operate", async (ctx) => {
  const { _id, action, ...params } = ctx.request.body;
  let res, info;
  try {
    if (action == "create") {
      await Dept.create(params);
      info = "創建成功";
    } else if (action == "edit") {
      params.updateTime = new Date();
      await Dept.findByIdAndUpdate(_id, params);
      info = "編輯成功";
    } else {
      await Dept.findByIdAndDelete(_id);
      await Dept.deleteMany({ parentId: { $all: [_id] } });
      info = "刪除成功";
    }
    ctx.body = util.success("", info);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
});

// 所有部門名稱
router.get("/all/list", async (ctx) => {
  try {
    const list = await Dept.find()
    ctx.body = util.success(list);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
});

module.exports = router;
