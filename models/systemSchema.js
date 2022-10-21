const mongoose = require("mongoose");

const systemSchema = mongoose.Schema({
  orderNo: String,
  deptName: String,
  evaluatePersonId: String,
  evaluatePersonName: String,
  urgentLevel: String,
  type: String,
  reasons: String,
  evaluateResult: {
    type: String,
    default: "",
  },
  evaluateInstruction: {
    type: String,
    default: "",
  },
  workhours: {
    type: Number,
    default: 0,
  },
  applyUser: {
    userId: String,
    userName: String,
    userEmail: String,
  },
  auditUsers: String,
  curAuditUserName: String,
  curAuditUserId: String,
  auditFlows: [
    {
      userId: String,
      userName: String,
      userEmail: String,
    },
  ],
  auditLogs: [
    {
      userId: String,
      userName: String,
      createTime: Date,
      remark: String,
      action: String,
    },
  ],
  applyState: {
    type: Number,
    default: 1,
  },
  fileList:Array,
  deadline:{
    type: Date,
  },
  updateTime: {
    type: Date,
    default: Date.now(),
  },
  createTime: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("systems", systemSchema, "systems");
