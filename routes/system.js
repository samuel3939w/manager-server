const router = require("koa-router")();
const System = require("../models/systemSchema");
const Dept = require("../models/deptSchema");
const util = require("../utils/util");
router.prefix("/system");

router.get("/list", async (ctx) => {
  const { applyState, type } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query);
  const authorization = ctx.request.headers.authorization;
  const { data } = util.decoded(authorization);
  try {
    let params = {};
    if (type == "approve") {
      if (applyState == 1 || applyState == 2) {
        //params.curAuditUserName = data.userName;
        params.curAuditUserId = data.userId;
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

    const query = System.find(params);
    const list = await query.skip(skipIndex).limit(page.pageSize);
    const total = await System.countDocuments(params);
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
  const { _id, action, userId, userName, userEmail, ...params } =
    ctx.request.body;
  const authorization = ctx.request.headers.authorization;
  const { data } = util.decoded(authorization);
  if (action == "create") {
    // 生成申請單號
    let orderNo = "PS";
    // XJ20220727
    orderNo += util.formateDate(new Date(), "yyyyMMdd");
    const total = await System.countDocuments();
    params.orderNo = orderNo + total;

    // 獲取用戶上級部門負責人信息
    const id = data.deptId.pop();
    // 查找負責人信息
    const dept = await Dept.findById(id);

    // 查找所有上級部門負責人
    let deptgroupTemp = await Dept.find({
      _id: { $in: dept.parentId.toString().split(",") },
    });

    const deptgroup = [];
    for (let i = 0; i < 20; i++) {
      deptgroupTemp.map((item) => {
        if (item.parentId.length === i) {
          deptgroup.unshift(item);
        }
      });
    }

    // 填入申請單位
    params.deptName = dept.deptName;
    // 查找資訊單位主管
    const itLeader = await Dept.findOne({ deptName: "資訊部門" });

    let auditUsers = dept.userName;
    const auditFlows = [
      {
        userId: dept.userId,
        userName: dept.userName,
        userEmail: dept.userEmail,
      },
    ];

    // 將所有找出的部門負責人加入審批流
    deptgroup.map((item) => {
      auditFlows.push({
        userId: item.userId,
        userName: item.userName,
        userEmail: item.userEmail,
      });
      auditUsers += "," + item.userName;
    });

    // 把資訊主管的資訊推入審批流
    auditFlows.push({
      userId: itLeader.userId,
      userName: itLeader.userName,
      userEmail: itLeader.userEmail,
    });
    auditUsers += "," + itLeader.userName;

    params.auditUsers = auditUsers;
    params.curAuditUserId = dept.userId;
    params.curAuditUserName = dept.userName;
    params.auditFlows = auditFlows;
    params.auditLogs = [];
    params.applyUser = {
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
    };

    const res = await System.create(params);
    ctx.body = util.success("", "創建成功");
  } else if (action == "edit") {
    await System.findByIdAndUpdate(_id, {
      evaluateResult: params.evaluateResult,
      evaluateInstruction: params.evaluateInstruction,
      workhours: params.workhours,
    });
    ctx.body = util.success("", "編輯成功");
  } else {
    const res = await System.findByIdAndUpdate(_id, { applyState: 5 });
    ctx.body = util.success("", "操作成功");
  }
});

router.post("/approve", async (ctx) => {
  const { action, remark, _id } = ctx.request.body;
  let authorization = ctx.request.headers.authorization;
  const { data } = util.decoded(authorization);
  let params = {};
  try {
    let doc = await System.findById(_id);
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
        params.curAuditUserId = doc.auditFlows[doc.auditLogs.length + 1].userId;
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
    const res = await System.findByIdAndUpdate(_id, params);
    ctx.body = util.success("", "處理成功");
  } catch (error) {
    ctx.body = util.fail(`處理異常: ${error.message}`);
  }
});

// 加簽接口
router.post("/addSignature", async (ctx) => {
  const { _id, userId, userName, userEmail } = ctx.request.body;
  let params = {};
  try {
    let doc = await System.findById(_id);
    if (doc.auditFlows.length == doc.auditLogs.length) {
      ctx.body = util.success("當前申請單已處理, 請勿重複操作");
      return;
    }
    // 在 auditFlows 中找出與 curAuditUserId 相同的人並在後面加上加簽的 使用者資訊 
    doc.auditFlows.map((item, index) => {
      if (item.userId == doc.curAuditUserId) {
        doc.auditFlows.splice(index + 1, 0, {
          userId: userId,
          userName: userName,
          userEmail: userEmail,
        });
      }
    });
    // 在 auditUsers 中找出與 curAuditUserName 相同的人並在後面加上加簽的 userName 
    let newAuditUsers = doc.auditUsers.split(",");
    newAuditUsers.map((item, index) => {
      if (item == doc.curAuditUserName) {
        newAuditUsers.splice(index + 1, 0, userName);
      }
    });
    newAuditUsers = newAuditUsers.toString();
    params.auditFlows = doc.auditFlows;
    params.auditUsers = newAuditUsers;
    const res = await System.findByIdAndUpdate(_id, params);
    ctx.body = util.success("", "處理成功");
  } catch (error) {
    ctx.body = util.fail(`處理異常: ${error.message}`);
  }
});
module.exports = router;
