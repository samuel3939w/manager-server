/**
 * 用戶管理模塊
 */
const router = require("koa-router")();
const User = require("./../models/userSchema");
const util = require("./../utils/util");
const jwt = require("jsonwebtoken");
router.prefix("/users");

router.post("/login", async (ctx) => {
  try {
    const { userName, password } = ctx.request.body;
    const res = await User.findOne({
      userName,
      password,
    },'userId userName userEmail state role deptId roleList');
    const data = res._doc;
    const token = jwt.sign(
      {
        data,
      },
      "pro-partner",
      { expiresIn: '1h' }
    );
    if (res) {
      data.token = token;
      ctx.body = util.success(data);
    } else {
      ctx.body = util.fail("帳號或密碼不正確");
    }
  } catch (error) {
    ctx.body = util.fail(error.msg);
  }
});

module.exports = router;
