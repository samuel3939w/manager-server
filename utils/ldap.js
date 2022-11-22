var ldap = require("ldapjs");

const ldapAuth = {
  /**
   * userId: 用戶名
   * userPassword: 用戶輸入的密碼
   *
   *
   */
  loginAuth: function (userId, password) {
    // 創建客戶端
    var client = ldap.createClient({
      url: "ldap://192.168.10.1:389",
    });

    var opts = {
      filter: `(cn=${userId})`, //查詢條件過濾器，查找uid= xxx 的用戶節點
      scope: "sub", //查詢範圍
      timeLimit: 500, //查詢超時
    };

    return new Promise(function (resolve, reject) {
      // 綁定查詢帳戶
      client.bind(`${userId}@pro-partner.com`, password, function (err, res1) {
        // 處理查詢到的文檔事件
        client.search("dc=Pro-partner,dc=com", opts, function (err, res2) {
          //標誌位
          var SearchSuccess = false;

          //得到文檔
          res2.on("searchEntry", function (entry) {
            SearchSuccess = true;

            // 解析文檔
            let user = entry.object;
            console.log("查詢成功");
            console.log(user.description);
            resolve(user);
          });

          //查詢錯誤事件
          res2.on("error", function (err) {
            SearchSuccess = false;
            console.log("登入失敗");
            client.unbind();
            resolve();
          });

          //查詢結束
          res2.on("end", function (result) {
            client.unbind();
            if (false == SearchSuccess) {
              // 返回查詢失敗的通知
              console.log("查詢失敗");
              resolve();
            }
          });
        });
      });
    });
  },
};

module.exports = ldapAuth;
