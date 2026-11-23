(function () {
  "use strict";

  var BN = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  function bn(n) {
    return String(n).replace(/\d/g, function (d) { return BN[+d]; });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme + colour scheme ---------- */

  var root = document.documentElement;
  var themeBtn = document.getElementById("themeBtn");
  var themePanel = document.getElementById("themePanel");
  var modeButtons = Array.prototype.slice.call(document.querySelectorAll("[data-theme-mode]"));
  var paletteButtons = Array.prototype.slice.call(document.querySelectorAll(".palette-btn[data-palette]"));
  var STORE_THEME = "jp-theme";
  var PALETTES = ["ai", "sumi", "sakura", "matcha"];
  var PALETTE_LABEL = { ai: "আই", sumi: "সুমি", sakura: "সাকুরা", matcha: "মাতচা" };
  var themeState = { mode: "auto", palette: "ai" };

  // The inline boot script in index.html parses localStorage before first paint
  // (to avoid a theme flash) and exposes the result here — don't duplicate that parsing.
  var bootTheme = window.__JP_THEME__;
  if (bootTheme) {
    if (bootTheme.mode === "auto" || bootTheme.mode === "light" || bootTheme.mode === "dark") {
      themeState.mode = bootTheme.mode;
    }
    if (PALETTES.indexOf(bootTheme.palette) > -1) {
      themeState.palette = bootTheme.palette;
    }
  }

  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  function applyTheme(save) {
    var dark = themeState.mode === "dark" ||
      (themeState.mode === "auto" && systemDark.matches);
    root.setAttribute("data-theme", dark ? "dark" : "light");
    root.setAttribute("data-palette", themeState.palette);

    modeButtons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-theme-mode") === themeState.mode));
    });
    paletteButtons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-palette") === themeState.palette));
    });
    themeBtn.setAttribute("aria-label", "থিম ও রঙের স্কিম: " + PALETTE_LABEL[themeState.palette]);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var paper = getComputedStyle(root).getPropertyValue("--paper").trim();
      if (paper) meta.setAttribute("content", paper);
    }

    if (save) {
      try { localStorage.setItem(STORE_THEME, JSON.stringify(themeState)); } catch (e) {}
    }
  }

  function setThemePanel(open) {
    themePanel.hidden = !open;
    themeBtn.setAttribute("aria-expanded", String(open));
  }

  themeBtn.addEventListener("click", function () {
    setThemePanel(themePanel.hidden);
  });

  document.addEventListener("click", function (e) {
    if (themePanel.hidden) return;
    if (themePanel.contains(e.target) || themeBtn.contains(e.target)) return;
    setThemePanel(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !themePanel.hidden) {
      setThemePanel(false);
      themeBtn.focus();
    }
  });

  modeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      themeState.mode = btn.getAttribute("data-theme-mode");
      applyTheme(true);
    });
  });

  paletteButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      themeState.palette = btn.getAttribute("data-palette");
      applyTheme(true);
    });
  });

  function onSystemTheme() {
    if (themeState.mode === "auto") applyTheme(false);
  }
  if (systemDark.addEventListener) systemDark.addEventListener("change", onSystemTheme);
  else if (systemDark.addListener) systemDark.addListener(onSystemTheme);

  applyTheme(false);

  /* ---------- furigana switch ---------- */

  var furiSwitch = document.getElementById("furiSwitch");
  var STORE_FURI = "jp-furi";

  function setFuri(on, save) {
    document.body.classList.toggle("no-furi", !on);
    furiSwitch.setAttribute("aria-checked", String(on));
    furiSwitch.setAttribute("title", on ? "ফুরিগানা লুকান" : "ফুরিগানা দেখান");
    if (save) {
      try { localStorage.setItem(STORE_FURI, on ? "1" : "0"); } catch (e) {}
    }
  }

  var furiOn = true;
  try {
    var savedFuri = localStorage.getItem(STORE_FURI);
    if (savedFuri === "0") furiOn = false;
  } catch (e) {}
  setFuri(furiOn, false);

  furiSwitch.addEventListener("click", function () {
    var on = furiSwitch.getAttribute("aria-checked") !== "true";
    setFuri(on, true);
  });

  /* ---------- mobile chapter drawer ---------- */

  var menuBtn = document.getElementById("menuBtn");
  var scrim = document.getElementById("navScrim");
  var rail = document.getElementById("siteNav");
  var mqMobile = window.matchMedia("(max-width: 1099px)");

  function syncRail() {
    var closed = mqMobile.matches && !document.body.classList.contains("nav-open");
    if ("inert" in rail) rail.inert = closed;
  }

  function setNav(open, returnFocus) {
    if (open && !themePanel.hidden) setThemePanel(false);
    document.body.classList.toggle("nav-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    scrim.hidden = !open;
    syncRail();
    if (open) {
      var first = rail.querySelector(".nav-item");
      if (first) first.focus({ preventScroll: true });
    } else if (returnFocus) {
      menuBtn.focus();
    }
  }

  menuBtn.addEventListener("click", function () {
    setNav(!document.body.classList.contains("nav-open"), false);
  });
  scrim.addEventListener("click", function () { setNav(false, true); });
  document.addEventListener("keydown", function (e) {
    var open = document.body.classList.contains("nav-open");
    if (!open) return;
    if (e.key === "Escape") {
      setNav(false, true);
      return;
    }
    if (e.key === "Tab") {
      var links = Array.prototype.slice.call(rail.querySelectorAll("a"));
      var focusables = [menuBtn].concat(links);
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });
  rail.addEventListener("click", function (e) {
    if (e.target.closest("a") && mqMobile.matches) setNav(false, false);
  });
  mqMobile.addEventListener("change", syncRail);
  syncRail();

  /* ---------- chapter progress ---------- */

  var STORE_READ = "jp-read";
  var read = new Set();
  try {
    var rawRead = localStorage.getItem(STORE_READ);
    if (rawRead) JSON.parse(rawRead).forEach(function (id) { read.add(id); });
  } catch (e) {}

  var buttons = Array.prototype.slice.call(document.querySelectorAll(".read-toggle"));
  var totalChapters = buttons.length;
  var railRead = document.getElementById("railRead");

  function persistRead() {
    try { localStorage.setItem(STORE_READ, JSON.stringify(Array.from(read))); } catch (e) {}
  }

  function paintProgress() {
    var count = 0;
    buttons.forEach(function (btn) {
      var id = btn.getAttribute("data-read");
      var isRead = read.has(id);
      if (isRead) count++;
      btn.setAttribute("aria-pressed", String(isRead));
      btn.querySelector(".read-text").textContent = isRead
        ? "অধ্যায়টি পড়া হয়েছে"
        : "অধ্যায়টি পড়া শেষ";
      var link = document.querySelector('.nav-item[data-nav="' + id + '"]');
      if (link) link.classList.toggle("is-read", isRead);
    });
    count = Array.from(read).filter(function (id) {
      return document.querySelector('.read-toggle[data-read="' + id + '"]');
    }).length;
    if (railRead) railRead.textContent = bn(count);
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-read");
      if (read.has(id)) read.delete(id); else read.add(id);
      persistRead();
      paintProgress();
    });
  });
  paintProgress();

  /* ---------- homework answer reveals ---------- */

  Array.prototype.forEach.call(document.querySelectorAll(".homework"), function (hw) {
    var answers = Array.prototype.slice.call(hw.querySelectorAll(".hw-ans"));
    var revealBtn = hw.querySelector("[data-hw-reveal]");

    function syncReveal() {
      var open = answers.filter(function (d) { return d.open; }).length;
      var all = answers.length > 0 && open === answers.length;
      if (!revealBtn) return;
      revealBtn.setAttribute("aria-pressed", String(all));
      revealBtn.textContent = all ? "সব উত্তর লুকান" : "সব উত্তর দেখুন";
    }

    if (revealBtn) {
      revealBtn.addEventListener("click", function () {
        var open = revealBtn.getAttribute("aria-pressed") !== "true";
        answers.forEach(function (d) { d.open = open; });
        syncReveal();
      });
    }
    answers.forEach(function (d) { d.addEventListener("toggle", syncReveal); });
    syncReveal();
  });

  /* ---------- homework vocabulary help (Japanese meanings) ---------- */

  var STORE_HINT = "jp-hint";
  var hintButtons = Array.prototype.slice.call(document.querySelectorAll("[data-hw-hint]"));

  function setHints(on, save) {
    root.classList.toggle("no-hint", !on);
    hintButtons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(on));
      btn.textContent = on ? "শব্দার্থ লুকান" : "শব্দার্থ দেখান";
      btn.setAttribute("title", on ? "জাপানি শব্দার্থ লুকান" : "জাপানি শব্দার্থ দেখান");
    });
    if (save) {
      try { localStorage.setItem(STORE_HINT, on ? "1" : "0"); } catch (e) {}
    }
  }

  var hintsOn = false;
  try { hintsOn = localStorage.getItem(STORE_HINT) === "1"; } catch (e) {}
  setHints(hintsOn, false);

  hintButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setHints(btn.getAttribute("aria-pressed") !== "true", true);
    });
  });


  /* ---------- toolkit: audio + kana quiz ---------- */

  var jaVoice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    var vs = window.speechSynthesis.getVoices();
    jaVoice = null;
    for (var i = 0; i < vs.length; i++) {
      if (/^ja/i.test(vs[i].lang)) { jaVoice = vs[i]; break; }
    }
  }
  if (window.speechSynthesis) {
    pickVoice();
    if (window.speechSynthesis.addEventListener) window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
  }

  var speakNote = null;
  var STORE_RATE = "jp-rate";
  var ttsRate = 0.8;
  try { var sr = parseFloat(localStorage.getItem(STORE_RATE)); if (sr >= 0.4 && sr <= 1.2) ttsRate = sr; } catch (e) {}
  var rateSel = document.getElementById("ttsRate");
  if (rateSel) {
    rateSel.value = String(ttsRate);
    if (rateSel.value !== String(ttsRate)) rateSel.value = "0.8";
    rateSel.addEventListener("change", function () {
      ttsRate = parseFloat(rateSel.value) || 0.8;
      try { localStorage.setItem(STORE_RATE, String(ttsRate)); } catch (e) {}
    });
  }

  /* Android app: Capacitor TextToSpeech plugin = Android native TTS engine */
  var nativeTts = null;
  function getNativeTts() {
    var C = window.Capacitor;
    if (!C || !C.isNativePlatform || !C.isNativePlatform()) return null;
    if (nativeTts) return nativeTts;
    try {
      nativeTts = C.registerPlugin ? C.registerPlugin("TextToSpeech") : (C.Plugins || {}).TextToSpeech;
    } catch (e) { nativeTts = (C.Plugins || {}).TextToSpeech || null; }
    return nativeTts;
  }
  function mark(el, on) { if (el) el.classList.toggle("is-playing", on); }

  function speak(text, el) {
    var n = getNativeTts();
    if (n) {
      mark(el, true);
      Promise.resolve().then(function () { return n.stop(); }).catch(function () {})
        .then(function () {
          return n.speak({ text: text, lang: "ja-JP", rate: ttsRate, pitch: 1, volume: 1, category: "ambient" });
        })
        .catch(function () {
          showSpeakNote("অডিও চালানো যায়নি। Android সেটিংস → Text-to-speech-এ Google Speech Services ও জাপানি ভয়েস ইনস্টল করুন।");
        })
        .then(function () { mark(el, false); });
      return;
    }
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      showSpeakNote("এই ব্রাউজারে অডিও সাপোর্ট নেই। Chrome, Edge বা Safari ব্যবহার করে দেখুন।");
      return;
    }
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = ttsRate;
    if (jaVoice) u.voice = jaVoice;
    else showSpeakNote("আপনার ডিভাইসে জাপানি ভয়েস পাওয়া যায়নি। Japanese text-to-speech ভয়েস ইনস্টল করুন।");
    if (el) {
      mark(el, true);
      var done = function () { mark(el, false); };
      u.onend = done; u.onerror = done;
    }
    window.speechSynthesis.speak(u);
  }
  function showSpeakNote(msg) {
    if (!speakNote) {
      speakNote = document.createElement("p");
      speakNote.className = "para quiz-msg";
      speakNote.setAttribute("role", "status");
      var host = document.querySelector("#toolkit .blockquote-note");
      if (host) host.appendChild(speakNote);
    }
    speakNote.textContent = msg;
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-speak]");
    if (t) speak(t.getAttribute("data-speak"), t);
  });

  var quizBox = document.getElementById("kanaQuiz");
  if (quizBox) {
    var HIRA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわを".split("");
    var ROMA = "a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa o".split(" ");
    HIRA.push("ん"); ROMA.push("n");
    var KATA = HIRA.map(function (c) { return String.fromCharCode(c.charCodeAt(0) + 0x60); });
    var qSet = "h", qStats = { right: 0, total: 0, streak: 0 }, qCur = null, qLocked = false;
    var elChar = document.getElementById("quizChar"), elOpts = document.getElementById("quizOpts");
    var elMsg = document.getElementById("quizMsg"), elNext = document.getElementById("quizNext");

    function rnd(n) { return Math.floor(Math.random() * n); }
    function pool() {
      var out = [];
      for (var i = 0; i < HIRA.length; i++) {
        if (qSet !== "k") out.push({ ch: HIRA[i], ro: ROMA[i] });
        if (qSet !== "h") out.push({ ch: KATA[i], ro: ROMA[i] });
      }
      return out;
    }
    function paintStats() {
      document.getElementById("quizRight").textContent = bn(qStats.right);
      document.getElementById("quizTotal").textContent = bn(qStats.total);
      document.getElementById("quizStreak").textContent = bn(qStats.streak);
    }
    function nextQ() {
      var p = pool(), q;
      do { q = p[rnd(p.length)]; } while (qCur && q.ch === qCur.ch && p.length > 1);
      qCur = q; qLocked = false;
      var opts = [q.ro];
      while (opts.length < 4) {
        var r = ROMA[rnd(ROMA.length)];
        if (opts.indexOf(r) < 0) opts.push(r);
      }
      for (var i = opts.length - 1; i > 0; i--) {
        var j = rnd(i + 1), tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp;
      }
      elChar.textContent = q.ch;
      elOpts.innerHTML = "";
      opts.forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = o; b.setAttribute("data-opt", o);
        elOpts.appendChild(b);
      });
      elMsg.textContent = "একটি উত্তর বেছে নিন।";
      elNext.hidden = true;
    }
    elOpts.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || qLocked) return;
      qLocked = true;
      var ok = b.getAttribute("data-opt") === qCur.ro;
      qStats.total++;
      if (ok) { qStats.right++; qStats.streak++; } else { qStats.streak = 0; }
      Array.prototype.forEach.call(elOpts.children, function (x) {
        x.disabled = true;
        if (x.getAttribute("data-opt") === qCur.ro) x.classList.add("is-right");
      });
      if (!ok) b.classList.add("is-wrong");
      elMsg.textContent = ok ? "সঠিক!" : "ভুল। সঠিক উত্তর: " + qCur.ro;
      paintStats();
      elNext.hidden = false;
      elNext.focus({ preventScroll: true });
      speak(qCur.ch, null);
    });
    elNext.addEventListener("click", nextQ);
    Array.prototype.forEach.call(quizBox.querySelectorAll("[data-quiz-set]"), function (b) {
      b.addEventListener("click", function () {
        qSet = b.getAttribute("data-quiz-set");
        Array.prototype.forEach.call(quizBox.querySelectorAll("[data-quiz-set]"), function (x) {
          x.setAttribute("aria-pressed", String(x === b));
        });
        qCur = null; nextQ();
      });
    });
    nextQ();
  }


  /* ---------- audio button on every example sentence and dialogue line ---------- */

  function readingOf(el) {
    var c = el.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll("ruby"), function (r) {
      var rt = r.querySelector("rt");
      r.replaceWith(document.createTextNode(rt ? rt.textContent : r.textContent));
    });
    Array.prototype.forEach.call(c.querySelectorAll("rt,rp,button"), function (x) { x.remove(); });
    return c.textContent.replace(/[〜~]/g, "").replace(/\s+/g, " ").trim();
  }
  function addSay(el) {
    if (el.getAttribute("data-say") || el.closest("#toolkit, #ai-lab")) return;
    var text = readingOf(el);
    if (!text || !/[\u3040-\u30ff\u4e00-\u9fff]/.test(text)) return;
    el.setAttribute("data-say", "1");
    var b = document.createElement("button");
    b.type = "button";
    b.className = "say-btn";
    b.setAttribute("data-speak", text);
    b.setAttribute("aria-label", "শুনুন: " + text);
    b.innerHTML = '<span aria-hidden="true">▶</span>';
    el.appendChild(b);
  }
  Array.prototype.forEach.call(document.querySelectorAll(".line .ja"), addSay);
  Array.prototype.forEach.call(document.querySelectorAll(".ja-inline"), function (el) {
    var t = el.textContent;
    if (/[。？！?!]/.test(t) && t.replace(/\s/g, "").length >= 5) addSay(el);
  });

  /* ---------- Gemini practice lab (user supplies own API key) ---------- */

  var lab = document.getElementById("aiLab");
  if (lab) {
    var STORE_AI = "jp-gemini";
    var DEFAULT_MODEL = "gemini-3.5-flash-lite";
    var ai = { key: "", model: DEFAULT_MODEL };
    try {
      var rawAi = JSON.parse(localStorage.getItem(STORE_AI) || "{}");
      if (rawAi.key) ai.key = String(rawAi.key);
      // Older installs saved the previous default; move them to the current one.
      if (rawAi.model && String(rawAi.model) !== "gemini-2.5-flash") ai.model = String(rawAi.model);
    } catch (e) {}
    var $ = function (id) { return document.getElementById(id); };
    var fKey = $("aiKey"), fModel = $("aiModel"), fCh = $("aiChapter"), fLevel = $("aiLevel"),
        fMode = $("aiMode"), fCount = $("aiCount"), fInput = $("aiInput"), fLabel = $("aiInputLabel"),
        btnGo = $("aiGo"), stat = $("aiStatus"), out = $("aiOut"), keyBox = $("aiKeyBox");
    fKey.value = ai.key; fModel.value = ai.model;
    if (ai.key) keyBox.open = false;

    Array.prototype.forEach.call(document.querySelectorAll('.chapter[id^="ch-"]'), function (a) {
      var t = a.querySelector(".chapter-title");
      var o = document.createElement("option");
      o.value = t ? t.textContent : a.id;
      o.textContent = bn(a.id.replace("ch-", "")) + ". " + o.value;
      fCh.appendChild(o);
    });

    function saveAi() {
      ai.key = fKey.value.trim(); ai.model = fModel.value.trim() || DEFAULT_MODEL;
      try { localStorage.setItem(STORE_AI, JSON.stringify(ai)); } catch (e) {}
    }
    $("aiSave").addEventListener("click", function () { saveAi(); setStat("সংরক্ষিত হয়েছে।", false); });
    $("aiClear").addEventListener("click", function () {
      fKey.value = ""; ai.key = "";
      try { localStorage.removeItem(STORE_AI); } catch (e) {}
      keyBox.open = true; setStat("key মুছে ফেলা হয়েছে।", false);
    });
    function setStat(msg, err) { stat.textContent = msg; stat.classList.toggle("is-error", !!err); }

    var HINTS = {
      mcq: ["বিশেষ অনুরোধ (ঐচ্ছিক)", "যেমন: শুধু পার্টিকেল নিয়ে প্রশ্ন দিন"],
      translate: ["বিশেষ অনুরোধ (ঐচ্ছিক)", "যেমন: দৈনন্দিন জীবনের বাক্য দিন"],
      dialogue: ["পরিস্থিতি (ঐচ্ছিক)", "যেমন: রেস্তোরাঁয় অর্ডার দেওয়া"],
      check: ["আপনার জাপানি বাক্য (আবশ্যক)", "যেমন: 私は昨日学校へ行きます。"],
      ask: ["আপনার প্রশ্ন (আবশ্যক)", "যেমন: は আর が-এর পার্থক্য সহজ উদাহরণে বুঝিয়ে দিন"]
    };
    function syncMode() {
      var m = fMode.value;
      fLabel.textContent = HINTS[m][0]; fInput.placeholder = HINTS[m][1];
      $("aiCountRow").hidden = (m === "dialogue" || m === "check" || m === "ask");
    }
    fMode.addEventListener("change", syncMode); syncMode();

    function prompt(mode) {
      var n = fCount.value, extra = fInput.value.trim();
      var base = "You are a patient Japanese teacher for a Bengali-speaking beginner. Chapter topic: \"" + fCh.value +
        "\". JLPT level: " + fLevel.value + ". Use only vocabulary and grammar suited to this chapter and level. " +
        "Write all explanations in Bengali. Japanese must be natural and correct. Reply with the requested content only, no preface. ";
      if (mode === "mcq") return base + "Create " + n + " multiple-choice questions testing this chapter. Return a JSON array of objects: " +
        "{\"q\": question text, \"options\": array of exactly 4 strings, \"answer\": index 0-3 of the correct option, \"why\": short Bengali explanation}. " +
        "Exactly one option must be correct. " + (extra ? "Extra request: " + extra : "");
      if (mode === "translate") return base + "Create " + n + " Bengali sentences to translate into Japanese. Return a JSON array of objects: " +
        "{\"bn\": Bengali sentence, \"ja\": Japanese answer with kanji, \"reading\": full hiragana reading of the answer, \"note\": one short Bengali grammar note}. " +
        (extra ? "Extra request: " + extra : "");
      if (mode === "dialogue") return base + "Write a realistic 6-8 line dialogue between A and B" + (extra ? " about: " + extra : "") +
        ". Return a JSON object: {\"title\": Bengali title, \"turns\": array of {\"who\": \"A\" or \"B\", \"ja\": Japanese line, \"reading\": full hiragana reading, \"romaji\": romaji, \"bn\": Bengali meaning}}.";
      if (mode === "check") return base + "The learner wrote this Japanese: \"" + extra + "\". Say whether it is correct, show the corrected sentence with hiragana reading, " +
        "and explain each mistake in simple Bengali. Plain text, no markdown symbols.";
      return base + "Answer this question in simple Bengali with 2-3 Japanese examples (each with hiragana reading and Bengali meaning). Plain text, no markdown symbols. Question: " + extra;
    }

    function callGemini(text, json) {
      var body = { contents: [{ role: "user", parts: [{ text: text }] }], generationConfig: { temperature: 0.8 } };
      if (json) body.generationConfig.responseMimeType = "application/json";
      var url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(ai.model) + ":generateContent";
      return fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": ai.key }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { r: r, d: d }; }); })
        .then(function (x) {
          if (!x.r.ok) {
            var st = x.r.status, m = (x.d.error && x.d.error.message) || "";
            if (st === 400 || st === 403) throw new Error("key সঠিক নয়, বা এই মডেল/API ব্যবহারের অনুমতি নেই। " + m);
            if (st === 404) throw new Error("মডেলের নাম ভুল। মডেল ঘরে সঠিক নাম দিন (যেমন " + DEFAULT_MODEL + ")।");
            if (st === 429) throw new Error("বিনামূল্যের সীমা পেরিয়ে গেছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।");
            throw new Error("Gemini ত্রুটি (" + st + "). " + m);
          }
          var c = x.d.candidates && x.d.candidates[0];
          var parts = (c && c.content && c.content.parts) || [];
          var t = parts.map(function (p) { return p.text || ""; }).join("").trim();
          if (!t) throw new Error("AI কোনো উত্তর দেয়নি (নিরাপত্তা ফিল্টার হতে পারে)। অনুরোধ বদলে আবার চেষ্টা করুন।");
          return t;
        });
    }
    function parseJson(t) {
      t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      try { return JSON.parse(t); } catch (e) { throw new Error("উত্তর পড়া যায়নি। আবার চেষ্টা করুন।"); }
    }

    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }
    function sayBtn(text) {
      var b = el("button", "say-btn"); b.type = "button";
      b.setAttribute("data-speak", text); b.setAttribute("aria-label", "শুনুন: " + text);
      b.innerHTML = '<span aria-hidden="true">▶</span>';
      return b;
    }
    function renderMcq(list) {
      list.forEach(function (it, i) {
        if (!it || !Array.isArray(it.options) || it.options.length < 2) return;
        var box = el("div", "lab-item");
        box.appendChild(el("p", "lab-q", bn(i + 1) + ". " + it.q));
        var opts = el("div", "lab-opts"), why = el("p", "lab-why"); why.hidden = true;
        var locked = false;
        it.options.forEach(function (o, k) {
          var b = el("button", null, String(o)); b.type = "button";
          b.addEventListener("click", function () {
            if (locked) return; locked = true;
            Array.prototype.forEach.call(opts.children, function (x, j) {
              x.disabled = true; if (j === +it.answer) x.classList.add("is-right");
            });
            if (k !== +it.answer) b.classList.add("is-wrong");
            why.textContent = (k === +it.answer ? "সঠিক! " : "ভুল। ") + (it.why || ""); why.hidden = false;
          });
          opts.appendChild(b);
        });
        box.appendChild(opts); box.appendChild(why); out.appendChild(box);
      });
    }
    function renderTranslate(list) {
      list.forEach(function (it, i) {
        if (!it || !it.bn) return;
        var box = el("div", "lab-item");
        box.appendChild(el("p", "lab-q", bn(i + 1) + ". " + it.bn));
        var d = el("details", "lab-reveal");
        d.appendChild(el("summary", null, "উত্তর দেখুন"));
        var p = el("p", "lab-ja"); p.setAttribute("lang", "ja"); p.textContent = it.ja || "";
        if (it.reading) p.appendChild(sayBtn(it.reading));
        d.appendChild(p);
        if (it.reading) d.appendChild(el("p", "muted-note", it.reading));
        if (it.note) d.appendChild(el("p", "lab-why", it.note));
        box.appendChild(d); out.appendChild(box);
      });
    }
    function renderDialogue(o) {
      if (!o || !Array.isArray(o.turns)) throw new Error("উত্তর পড়া যায়নি। আবার চেষ্টা করুন।");
      if (o.title) out.appendChild(el("h4", "sub-head", o.title));
      var dlg = el("div", "dialogue");
      o.turns.forEach(function (t) {
        var turn = el("div", "turn");
        turn.appendChild(el("span", "who", t.who || ""));
        var say = el("div", "say"), line = el("span", "line line-triple");
        var ja = el("span", "ja", t.ja || ""); ja.setAttribute("lang", "ja");
        ja.appendChild(sayBtn(t.reading || t.ja || ""));
        line.appendChild(ja);
        line.appendChild(el("span", "romaji", t.romaji || ""));
        line.appendChild(el("span", "bn", t.bn || ""));
        say.appendChild(line); turn.appendChild(say); dlg.appendChild(turn);
      });
      out.appendChild(dlg);
    }

    btnGo.addEventListener("click", function () {
      saveAi();
      var mode = fMode.value;
      if (!ai.key) { keyBox.open = true; setStat("আগে Gemini API key দিয়ে ‘সংরক্ষণ করুন’ চাপুন।", true); fKey.focus(); return; }
      if ((mode === "check" || mode === "ask") && !fInput.value.trim()) { setStat("ঘরটি পূরণ করুন।", true); fInput.focus(); return; }
      btnGo.disabled = true; setStat("AI তৈরি করছে…", false); out.textContent = "";
      var json = mode === "mcq" || mode === "translate" || mode === "dialogue";
      callGemini(prompt(mode), json).then(function (t) {
        if (mode === "mcq") renderMcq(parseJson(t));
        else if (mode === "translate") renderTranslate(parseJson(t));
        else if (mode === "dialogue") renderDialogue(parseJson(t));
        else out.appendChild(el("div", "lab-text", t));
        setStat("তৈরি হয়েছে।", false);
      }).catch(function (err) {
        setStat(err && err.message === "Failed to fetch" ? "ইন্টারনেট সংযোগ নেই, বা সংযোগ আটকে গেছে।" : (err.message || "কিছু ভুল হয়েছে।"), true);
      }).then(function () { btnGo.disabled = false; });
    });
  }

  /* ---------- scroll spy ---------- */

  var articles = Array.prototype.slice.call(document.querySelectorAll(".chapter"));
  var navItems = Array.prototype.slice.call(document.querySelectorAll(".nav-item"));
  var activeId = null;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    navItems.forEach(function (item) {
      var on = item.getAttribute("data-nav") === id;
      item.classList.toggle("is-active", on);
      if (on) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    });
  }

  var spyTick = false;
  function spy() {
    spyTick = false;
    var line = window.innerHeight * 0.28;
    var current = articles[0] ? articles[0].id : null;
    for (var i = 0; i < articles.length; i++) {
      var top = articles[i].getBoundingClientRect().top;
      if (top - line <= 0) current = articles[i].id;
      else break;
    }
    if (current) setActive(current);
  }

  /* ---------- scroll progress + back to top ---------- */

  var bar = document.getElementById("readProgress");
  var backTop = document.getElementById("backTop");

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = pct.toFixed(2) + "%";
    backTop.classList.toggle("is-visible", window.scrollY > 900);
    if (!spyTick) {
      spyTick = true;
      window.requestAnimationFrame(spy);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  backTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  onScroll();
  spy();

  /* keep the fragment chapter highlighted after in-page navigation */
  window.addEventListener("hashchange", function () {
    var id = window.location.hash.replace("#", "");
    var target = document.getElementById(id);
    if (!target) return;
    var article = target.closest(".chapter");
    if (article) setActive(article.id);
  });
})();
