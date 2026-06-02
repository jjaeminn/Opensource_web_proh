require("dotenv").config();

var express = require("express");
var Anthropic = require("@anthropic-ai/sdk");
var Activity = require("../models/Activity.js");

var router = express.Router();
var ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 모임 전체목록  (SELECT * FROM activities)
router.get("/", function(req, res) {
  Activity.find().then(function(list) {
    res.json(list);
  });
});

// 모임 하나  (SELECT * FROM activities WHERE _id = ?)
router.get("/:id", function(req, res) {
  Activity.findById(req.params.id).then(function(item) {
    if (!item) return res.json({ success: false, message: "없는 모임이에요" });
    res.json(item);
  });
});

// 모임 등록
router.post("/", function(req, res) {
  var b = req.body;

  if (!b.title || !b.category || !b.location || !b.date || !b.time || !b.maxParticipants) {
    return res.json({ success: false, message: "필수 항목을 입력해주세요" });
  }

  var newAct = new Activity({
    title: b.title, category: b.category, description: b.description,
    location: b.location, address: b.address, date: b.date, time: b.time,
    duration: b.duration, maxParticipants: b.maxParticipants,
    image: b.image, organizer: b.organizer
  });

  // INSERT INTO activities (...) VALUES (...)
  newAct.save().then(function() {
    res.json({ success: true, message: "모임 등록 완료", data: newAct });
  });
});

// AI 자동완성 - 한줄 힌트 주면 모임 내용 만들어줌
router.post("/ai-suggest", function(req, res) {
  var hint = req.body.hint || "";
  if (!hint.trim()) {
    return res.json({ success: false, message: "힌트를 입력해주세요" });
  }

  var ask = "You help international students organize meetups. Based on this hint, generate a complete activity listing.\n\n"
    + "Hint: \"" + hint + "\"\n\n"
    + "Categories (pick exactly one): Study Together, Eat Together, Exercise, Language Exchange, Travel, Hobbies, Social Events, Other\n\n"
    + "Rules:\n"
    + "- title: catchy, under 60 chars\n"
    + "- description: 2-3 sentences\n"
    + "- location: a neighborhood/landmark name\n"
    + "- duration: like \"2 hours\"\n"
    + "- maxParticipants: a number between 4 and 20\n\n"
    + "Reply with JSON only, no markdown:\n"
    + "{\"title\":\"...\",\"category\":\"...\",\"description\":\"...\",\"location\":\"...\",\"duration\":\"...\",\"maxParticipants\":8}";

  ai.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 768,
    messages: [{ role: "user", content: ask }]
  }).then(function(resp) {
    var obj = JSON.parse(resp.content[0].text);
    res.json({ success: true, data: obj });
  }).catch(function(err) {
    console.log("ai-suggest error:", err);
    res.json({ success: false, message: "자동완성 실패" });
  });
});

module.exports = router;
