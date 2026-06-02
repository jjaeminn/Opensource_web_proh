require("dotenv").config();

var express = require("express");
var Anthropic = require("@anthropic-ai/sdk");
var Chat = require("../models/Chat.js");

var router = express.Router();
var ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 메시지 보내기
router.post("/send", function(req, res) {
  var msg = new Chat({
    chat_room: req.body.chat_room,
    sender_name: req.body.sender_name,
    message_text: req.body.message_text
  });

  // INSERT INTO chats (...) VALUES (...)
  msg.save().then(function() {
    res.json({ success: true });
  });
});

// 메시지 가져오기 (그 방에서 마지막으로 본거 이후만)
router.get("/messages", function(req, res) {
  var room = req.query.room;
  var lastId = req.query.lastId;

  var cond = { chat_room: room };
  if (lastId) {
    cond._id = { $gt: lastId };  // _id 가 lastId 보다 큰거 = 그 이후 새 메시지만
  }

  // SELECT * FROM chats WHERE chat_room=? [AND _id>?] ORDER BY created_at ASC
  Chat.find(cond).sort({ created_at: 1 }).then(function(arr) {
    res.json(arr);
  });
});

// AI 번역 - 영어로 번역 + 문화설명. 한번 번역하면 db 에 저장해서 다음엔 그냥 꺼내씀
router.post("/translate", function(req, res) {
  var mid = req.body.messageId;

  Chat.findById(mid).then(function(msg) {
    if (!msg) return res.json({ success: false, message: "메시지를 찾을 수 없어요" });

    // 이미 번역해둔거 있으면 ai 안부르고 바로 보내줌
    if (msg.translation) {
      return res.json({ success: true, translation: msg.translation, cultural_notes: msg.cultural_notes });
    }

    var ask = "Translate this chat message to English. If there is Korean slang, idioms, or cultural expressions, add short cultural notes (max 2). If the message is already English or trivial, cultural_notes can be empty.\n\n"
      + "Message: \"" + msg.message_text + "\"\n\n"
      + "Reply with JSON only, no markdown:\n"
      + "{\"translation\":\"...\",\"cultural_notes\":[\"...\"]}";

    ai.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: ask }]
    }).then(function(resp) {
      var obj = JSON.parse(resp.content[0].text);
      msg.translation = obj.translation || "";
      msg.cultural_notes = obj.cultural_notes || [];

      // UPDATE chats SET translation=?, cultural_notes=? WHERE _id=?
      msg.save().then(function() {
        res.json({ success: true, translation: msg.translation, cultural_notes: msg.cultural_notes });
      });
    }).catch(function(err) {
      console.log("translate error:", err);
      res.json({ success: false, message: "번역 실패" });
    });
  });
});

module.exports = router;
