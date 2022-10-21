/**
 * 通用工具函數
 */
const CODE = {
  SUCCESS: 200,
  ERROR:400,
  PARAM_ERROR: 10001, // 參數錯誤
  USER_ACCOUNT_ERROR: 20001, // 帳號或密碼錯誤
  USER_LOGIN_ERROR: 30001, // 用戶未登入
  BUSINESS_ERROR: 40001, // 業務請求失敗
  AUTH_ERROR: 50001, //認證失敗或TOKEN過期
};
const jwt = require("jsonwebtoken");
const log4js = require("./log4j");

module.exports = {
  /**
   * 分頁結構封裝
   * @param {number} pageNum
   * @param {number} pageSize
   */
  pager({ pageNum = 1, pageSize = 10 }) {
    pageNum *= 1;
    pageSize *= 1;
    const skipIndex = (pageNum - 1) * pageSize;
    return {
      page: {
        pageNum,
        pageSize,
      },
      skipIndex,
    };
  },
  success(data = "", msg = "", code = CODE.SUCCESS) {
    log4js.debug(data);
    return {
      code,
      data,
      msg,
    };
  },
  fail(msg = "", code = CODE.BUSINESS_ERROR, data = "") {
    log4js.error(msg);
    return {
      code,
      msg,
      data,
    };
  },
  CODE,
  decoded(authorization) {
    if (authorization) {
      const token = authorization.split(" ")[1];
      return jwt.verify(token, "pro-partner");
    }
    return;
  },
  // 遞歸拼接樹型列表
  getTreeMenu(rootList, id, list) {
    for (let i = 0; i < rootList.length; i++) {
      let item = rootList[i];
      if (String(item.parentId.slice().pop()) == String(id)) {
        list.push(item._doc);
      }
    }
    list.map((item) => {
      item.children = [];
      this.getTreeMenu(rootList, item._id, item.children);
      if (item.children.length == 0) {
        delete item.children;
      } else if (item.children.length > 0 && item.children[0].menuType == 2) {
        // 快速區分按鈕和菜單,用於後期做菜單按鈕權限控制
        item.action = item.children;
      }
    });

    return list;
  },
  formateDate(date, rule) {
    let fmt = rule || "yyyy-MM-dd hh:mm:ss";
    if (/(y+)/.test(fmt)) {
      const y = /(y+)/.exec(fmt);
      fmt = fmt.replace(y[0], date.getFullYear());
    }
    const o = {
      "M+": date.getMonth() + 1,
      "d+": date.getDate(),
      "h+": date.getHours(),
      "m+": date.getMinutes(),
      "s+": date.getSeconds(),
    };
    for (const k in o) {
      if (new RegExp(`(${k})`).test(fmt)) {
        const y = new RegExp(`(${k})`).exec(fmt);
        const val = o[k] + "";
        fmt = fmt.replace(
          y[0],
          // 處理 2021-2-20 前面補0的狀況 ->2021-02-20
          y[0].length == 1 ? val : ("00" + val).substring(val.length)
        );
      }
    }
    return fmt;
  },
};
