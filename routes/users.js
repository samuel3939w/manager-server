/**
 * 用戶管理模塊
 */
const router = require("koa-router")();
const User = require("./../models/userSchema");
const Counter = require("./../models/counterSchema");
const Menu = require("../models/menuSchema");
const Dept = require("../models/deptSchema");
const Role = require("../models/roleSchema");
const util = require("./../utils/util");
const ldapAuth = require("../utils/ldap");
const jwt = require("jsonwebtoken");
const md5 = require("md5");
router.prefix("/users");

// 用戶登入(LDAP)
// router.post("/login", async (ctx) => {
//   try {
//     const { userId, password } = ctx.request.body;
//     let ldapUser = await ldapAuth.loginAuth(userId, password);
//     if (ldapUser) {
//       const res = await User.findOne(
//         {
//           userId,
//         },
//         "userId userName userEmail state role deptId roleList"
//       );
//       // 如果存在直接配發token
//       if (res) {
//         const data = res._doc;
//         const token = jwt.sign(
//           {
//             data,
//           },
//           "pro-partner",
//           { expiresIn: "1h" }
//         );
//         data.token = token;
//         ctx.body = util.success(data);
//         // 如果不存在就在資料庫新增用戶
//       } else {
//         const user = new User({
//           userId: ldapUser.cn,
//           userName: ldapUser.description,
//           userEmail: ldapUser.mail,
//           role: 1, //默認普通用戶
//           roleList: [],
//           job: ldapUser.title,
//           state: 1,
//           deptId: [],
//           mobile: "",
//         });
//         await user.save();
//         // 獲取剛剛新增的用戶
//         // const res = await User.findOne(
//         //   {
//         //     userId:ldapUser.cn,
//         //   },
//         //   "userId userName userEmail state role deptId roleList"
//         // );
//         // 如獲取成功就配發token
//         //if (res) {
//           const data = {
//             userId: ldapUser.cn,
//             userName: ldapUser.description,
//             userEmail: ldapUser.mail,
//             state: 1,
//             role: 1,
//             deptId: [],
//             roleList: [],
//           };
//           const token = jwt.sign(
//             {
//               data,
//             },
//             "pro-partner",
//             { expiresIn: "1h" }
//           );
//           data.token = token;
//           ctx.body = util.success(data);
//         //}
//       }
//     } else {
//       ctx.body = util.fail("用戶名或密碼不正確!");
//     }
//   } catch (error) {
//     ctx.body = util.fail(error.msg);
//   }
// });

// 用戶登入
router.post("/login", async (ctx) => {
  try {
    const { userId, password } = ctx.request.body;
    const res = await User.findOne(
      {
        userName: userId,
        password: md5(password),
      },
      "userId userName userEmail state role deptId roleList"
    );
    if (res) {
      const data = res._doc;
      const token = jwt.sign(
        {
          data,
        },
        "pro-partner",
        { expiresIn: "1h" }
      );
      data.token = token;
      ctx.body = util.success(data);
    } else {
      ctx.body = util.fail("帳號或密碼不正確");
    }
  } catch (error) {
    ctx.body = util.fail(error.msg);
  }
});

// 用戶列表
router.get("/list", async (ctx) => {
  const { userId, userName, state } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query);
  const params = {};
  if (userId) params.userId = userId;
  if (userName) params.userName = userName;
  if (state && state != "0") params.state = state;
  try {
    // 根據條件查詢所有列表
    const list = await User.find(params, { _id: 0, password: 0 })
      .skip(skipIndex)
      .limit(page.pageSize);
    const total = await User.countDocuments(params);

    ctx.body = util.success({
      page: {
        ...page,
        total,
      },
      list,
    });
  } catch (error) {
    ctx.body = util.fail(`查詢異常:${error.stack}`);
  }
});

// 用戶刪除/批量刪除
router.post("/delete", async (ctx) => {
  // 待刪除的用戶Id數組
  const { userIds } = ctx.request.body;
  //User.updateMany({ $or:[{userId:10001},{userId:10002}]})
  const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 });
  if (res.modifiedCount) {
    ctx.body = util.success(res, `共刪除成功${res.modifiedCount}條`);
    return;
  }
  ctx.body = util.fail("刪除失敗");
});

// 用戶新增/編輯
router.post("/operate", async (ctx) => {
  const {
    userId,
    userName,
    userEmail,
    mobile,
    job,
    roleList,
    state,
    deptId,
    action,
  } = ctx.request.body;
  if (action == "add") {
    if (!userName || !userEmail || !deptId) {
      ctx.body = util.fail("參數錯誤", util.CODE.PARAM_ERROR);
      return;
    }
    const res = await User.findOne(
      { $or: [{ userName }, { userEmail }] },
      "_id userName userEmail"
    );
    if (res) {
      ctx.body = util.fail(
        `系統監測到有重複的用戶, 信息如下: ${res.userName} - ${res.userEmail}`
      );
    } else {
      try {
        const user = new User({
          userId,
          userName,
          userEmail,
          role: 1, //默認普通用戶
          roleList,
          job,
          state,
          deptId,
          mobile,
        });
        user.save();
        ctx.body = util.success({}, "用戶創建成功");
      } catch (error) {
        ctx.body = util.fail(error.stack, "用戶創建失敗");
      }
    }
  } else {
    if (!deptId) {
      ctx.body = util.fail("部門不能為空", util.CODE.PARAM_ERROR);
      return;
    }
    try {
      const res = await User.findOneAndUpdate(
        { userId },
        { job, mobile, userName, userEmail, state, roleList, deptId }
      );
      // 查找用戶是否為部門負責人，如果是的話就要更改部門負責人 EMAIL

      await Dept.findOneAndUpdate(
        { userId },
        {
          userEmail,
          userName,
        }
      );

      ctx.body = util.success({}, "更新成功");
    } catch (error) {
      ctx.body = util.fail(error.stack, "更新失敗");
    }
  }
});

// 獲取所有用戶列表
router.get("/all/list", async (ctx) => {
  try {
    const list = await User.find({}, "userId userName userEmail");
    ctx.body = util.success(list);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
});

// 按照部門獲取用戶列表
router.get("/bydept/list", async (ctx) => {
  try {
    const { deptId } = ctx.request.query;
    let list = await User.find({}, "userId userName userEmail deptId");
    list = list.filter((item) => {
      return item.deptId.includes(deptId);
    });
    ctx.body = util.success(list);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
});

// 獲取所有資訊人員列表
router.get("/itall/list", async (ctx) => {
  try {
    let list = await User.find({}, "userId userName userEmail deptId");
    const itDept = await Dept.findOne({ deptName: "資訊部門" });
    list = list.filter((item) => {
      return item.deptId.includes(itDept._id);
    });
    ctx.body = util.success(list);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
});

// 獲取用戶對應的權限菜單
router.get("/getPermissionList", async (ctx) => {
  const authorization = ctx.request.headers.authorization;
  const { data } = util.decoded(authorization);
  const menuList = await getMenuList(data.role, data.roleList);
  const actionList = getActionList(JSON.parse(JSON.stringify(menuList)));
  ctx.body = util.success({ menuList, actionList });
});

async function getMenuList(userRole, roleList) {
  let rootList = [];
  if (userRole == 0) {
    rootList = (await Menu.find({})) || [];
  } else {
    // 根據用戶擁有的腳色,獲取權限列表
    // 先查找用戶對應的角色有哪些
    roleList = await Role.find({ _id: { $in: roleList } });
    let permissionList = [];
    roleList.map((role) => {
      let { checkedKeys, halfCheckedKeys } = role.permissionList;
      permissionList = permissionList.concat([
        ...checkedKeys,
        ...halfCheckedKeys,
      ]);
    });
    permissionList = [...new Set(permissionList)];
    rootList = await Menu.find({ _id: { $in: permissionList } });
  }
  return util.getTreeMenu(rootList, null, []);
}

function getActionList(list) {
  const actionList = [];
  const deep = (arr) => {
    while (arr.length) {
      const item = arr.pop();
      if (item.action) {
        item.action.forEach((action) => {
          actionList.push(action.menuCode);
        });
      } else if (item.children && !item.action) {
        deep(item.children);
      }
    }
  };
  deep(list);
  return actionList;
}

module.exports = router;
