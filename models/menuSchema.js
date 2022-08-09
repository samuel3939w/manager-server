const mongoose = require("mongoose");

const menuSchema = mongoose.Schema({
  menuType: Number, //菜單類型
  menuName: String, //菜單名稱
  menuCode: String, //權限標示
  path: String, //路由地址
  icon: String, //圖標
  component: String, //組件地址
  menuState: Number, //菜單狀態
  parentId: [mongoose.Types.ObjectId],
  createTime: {
    type: Date,
    default: Date.now(),
  }, //創建時間
  upadateTime: {
    type: Date,
    default: Date.now(),
  }, //更新時間
});

module.exports = mongoose.model("menu", menuSchema);
