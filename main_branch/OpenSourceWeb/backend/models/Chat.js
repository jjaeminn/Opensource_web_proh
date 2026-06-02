var mongoose = require("mongoose");

// 채팅 메시지 한개
var chatSchema = new mongoose.Schema({
  chat_room: { type: String, required: true },
  sender_name: { type: String, required: true },
  message_text: { type: String, required: true },
  translation: { type: String, default: "" },       // ai 번역결과 (한번 번역하면 여기 저장해두고 재사용)
  cultural_notes: { type: [String], default: [] },   // ai 문화설명
  created_at: { type: Date, default: Date.now }
});

var Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
