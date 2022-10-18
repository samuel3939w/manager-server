var nodemailer = require("nodemailer");
var xoauth2 = require("xoauth2");

module.exports = function (credentials) {
  var mailTransport = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    auth: {
        user: credentials.outlook.user,
        pass: credentials.outlook.pass,
    },
    secure:false,
  });
  //var from = '"Meadowlark Travel" <cythilya@gmail.com>';
  var errorRecipient = "samuelchen@pro-partner.com.tw";
  return {
    send: function (to, subj, body) {
      mailTransport.sendMail(
        {
          from: credentials.outlook.user,
          to: to,
          subject: subj,
          html: body,
        },
        function (err) {
          if (err) {
            console.log("Unable to send email: " + err);
          }
        }
      );
    },
    emailError: function (message, filename, exception) {
      var body =
        "<h1>Meadowlark Travel Site Error</h1>" +
        "message:<br><pre>" +
        message +
        "</pre><br>";
      if (exception) body += "exception:<br><pre>" + exception + "</pre><br>";
      if (filename) body += "filename:<br><pre>" + filename + "</pre><br>";
      mailTransport.sendMail(
        {
          from: credentials.outlook.user,
          to: errorRecipient,
          subject: "Meadowlark Travel Site Error",
          html: body,
          generateTextFromHtml: true,
        },
        function (err) {
          if (err) {
            console.log("Unable to send email: " + err);
          }
        }
      );
    },
  };
};
