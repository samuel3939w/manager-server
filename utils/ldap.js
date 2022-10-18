var ldap = require("ldapjs");

const ldapAuth = {
  /**
   * userId: 用户名
   * userPassword: 用户输入的密码
   *
   *
   */
  loginAuth: function (userId, password) {
    // 创建客户端
    var client = ldap.createClient({
      url: "ldap://192.168.10.1:389",
    });

    var opts = {
      filter: `(cn=${userId})`, //查询条件过滤器，查找uid= xxx 的用户节点
      scope: "sub", //查询范围
      timeLimit: 500, //查询超时
    };

    return new Promise(function (resolve, reject) {
      // 绑定查询帐户
      client.bind(
        `${userId}@pro-partner.com`,
        password,
        function (err, res1) {
          // 处理查询到文档的事件
          client.search("dc=Pro-partner,dc=com", opts, function (err, res2) {
            //标志位
            var SearchSuccess = false;

            //得到文档
            res2.on("searchEntry", function (entry) {
              SearchSuccess = true;

              // 解析文档
              let user = entry.object;
              console.log("查詢成功");
              console.log(user.description);
              resolve(user)
            });

            //查询错误事件
            res2.on("error", function (err) {
              SearchSuccess = false;
              console.log("登入失敗");
              client.unbind();
              resolve()
            });

            //查询结束
            res2.on("end", function (result) {
              client.unbind();
              if (false == SearchSuccess) {
                // 返回查询失败的通知
                console.log("查詢失敗");
                resolve()
              }
            });
          });
        }
      );
    });
  },
};

module.exports = ldapAuth;
