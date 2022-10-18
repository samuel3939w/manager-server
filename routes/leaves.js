/**
 * 角色管理模塊
 */
const router = require("koa-router")();
const Leave = require("../models/leaveSchema");
const Dept = require("../models/deptSchema");
const util = require("../utils/util");
const jwt = require("jsonwebtoken");
const md5 = require("md5");
router.prefix("/leave");

// 查詢申請列表
router.get("/list", async (ctx) => {
  const { applyState, type } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query);
  const authorization = ctx.request.headers.authorization;
  const { data } = util.decoded(authorization);
  try {
    let params = {};
    if (type == "approve") {
      if (applyState == 1 || applyState == 2) {
        params.curAuditUserName = data.userName;
        params.$or = [{ applyState: 1 }, { applyState: 2 }];
      } else if (applyState > 2) {
        params = {
          "auditFlows.userId": data.userId,
          applyState,
        };
      } else {
        params = {
          "auditFlows.userId": data.userId,
        };
      }
    } else {
      params = {
        "applyUser.userId": data.userId,
      };
      if (applyState) params.applyState = applyState;
    }

    const query = Leave.find(params);
    const list = await query.skip(skipIndex).limit(page.pageSize);
    const total = await Leave.countDocuments(params);
    ctx.body = util.success({
      page: {
        ...page,
        total,
      },
      list,
    });
  } catch (error) {
    ctx.body = util.fail(`查詢失敗:${error.stack}`);
  }
});

router.post("/operate", async (ctx) => {
  const { _id, action, ...params } = ctx.request.body;
  const authorization = ctx.request.headers.authorization;
  const { data } = util.decoded(authorization);

  if (action == "create") {
    // 生成申請單號
    let orderNo = "XJ";
    // XJ20220727
    orderNo += util.formateDate(new Date(), "yyyyMMdd");
    const total = await Leave.countDocuments();
    params.orderNo = orderNo + total;

    // 獲取用戶上級部門負責人信息
    const id = data.deptId.pop();
    // 查找負責人信息
    const dept = await Dept.findById(id);
    // 獲取人事部門和財務部門負責人信息
    const userList = await Dept.find({
      deptName: { $in: ["人事部門", "財會部"] },
    });

    let auditUsers = dept.userName;
    const auditFlows = [
      {
        userId: dept.userId,
        userName: dept.userName,
        userEmail: dept.userEmail,
      },
    ];
    userList.map((item) => {
      auditFlows.push({
        userId: item.userId,
        userName: item.userName,
        userEmail: item.userEmail,
      });
      auditUsers += "," + item.userName;
    });

    params.auditUsers = auditUsers;
    params.curAuditUserName = dept.userName;
    params.auditFlows = auditFlows;
    params.auditLogs = [];
    params.applyUser = {
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
    };

    const res = await Leave.create(params);
    ctx.body = util.success("", "創建成功");
  } else {
    const res = await Leave.findByIdAndUpdate(_id, { applyState: 5 });
    ctx.body = util.success("", "操作成功");
  }
});

router.post("/approve", async (ctx) => {
  const { action, remark, _id } = ctx.request.body;
  let authorization = ctx.request.headers.authorization;
  const { data } = util.decoded(authorization);
  let params = {};
  try {
    let doc = await Leave.findById(_id);
    let auditLogs = doc.auditLogs || [];
    if (action == "refuse") {
      //  1:待審核 2:審核中 3:審核拒絕 4:審核通過 5:作廢
      params.applyState = 3;
    } else {
      // 審核通過
      if (doc.auditFlows.length == doc.auditLogs.length) {
        ctx.body = util.success("當前申請單已處理, 請勿重複提交");
        return;
      } else if (doc.auditFlows.length == doc.auditLogs.length + 1) {
        params.applyState = 4;
      } else if (doc.auditFlows.length > doc.auditLogs.length) {
        params.applyState = 2;
        params.curAuditUserName =
          doc.auditFlows[doc.auditLogs.length + 1].userName;
      }
    }
    auditLogs.push({
      userId: data.userId,
      userName: data.userName,
      createTime: new Date(),
      remark,
      action: action == "refuse" ? "審核拒絕" : "審核通過",
    });
    params.auditLogs = auditLogs;
    const res = await Leave.findByIdAndUpdate(_id, params);
    ctx.body = util.success("", "處理成功");
  } catch (error) {
    ctx.body = util.fail(`查詢異常: ${error.message}`);
  }
});

module.exports = router;
