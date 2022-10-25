const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  userId: String, //用戶ID, 自增長
  userName: String, //用戶名稱
  userEmail: String, //用戶信箱
  mobile: String, //手機號碼
  sex: Number, //性別 0:男  1:女
  deptId: [], //部門
  job: String, //職位
  state: {
    type: Number,
    default: 1,
  }, // 1:在職 2:離職 3:試用期
  role: {
    type: Number,
    default: 1,
  }, // 用戶腳色 0:系統管理員 1:普通用戶
  roleList: [], //系統角色
  createTime: {
    type: Date,
    default: () => Date.now(),
  }, //創建時間
  lastLoginTime: {
    type: Date,
    default: () => Date.now(),
  }, //更新時間
  remark: String,
});

module.exports = mongoose.model("users", userSchema, "users");
