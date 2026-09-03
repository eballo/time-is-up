/*
 * "Time is up" — rotating stand-up timer.
 *
 * Translations are not in this file. Each language is registered from
 * src/i18n/<code>.js into window.TimeIsUpI18n (see src/i18n/registry.js).
 * This script reads whatever languages are registered and builds the
 * picker from them.
 */
(function () {
  "use strict";

  var I18N = window.TimeIsUpI18n;

  /* Preferred fallback language; if it isn't registered, use the first one. */
  var FALLBACK = I18N.has("en") ? "en" : I18N.fallback();

  function t(key) {
    var d = I18N.dict(state.lang);
    if (d && d[key] != null) return d[key];
    var f = I18N.dict(FALLBACK);
    return (f && f[key] != null) ? f[key] : key;
  }

  function fill(str, params) {
    return String(str).replace(/\{(\w+)\}/g, function (_, k) {
      return (params && params[k] != null) ? params[k] : "";
    });
  }

  function peopleCount(n) {
    return n + " " + (n === 1 ? t("personOne") : t("personOther"));
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* Touching localStorage throws in Safari private browsing and whenever the
     browser blocks site data, so every access goes through these. Losing the
     saved preferences is fine; taking the whole app down with it is not. */
  function lsGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function lsSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* not persisted */ }
  }

  /* ============ state ============ */

  var LS_NAMES = "tiu.names";
  var LS_MINUTES = "tiu.minutes";
  var LS_ORDER = "tiu.order";
  var LS_MODE = "tiu.mode";
  var LS_LANG = "tiu.lang";
  var LS_THEME = "tiu.theme";

  var PREROLL_SECONDS = 5;

  var $ = function (id) { return document.getElementById(id); };

  var el = {
    setup: $("setup"), running: $("running"), done: $("done"),
    theme: $("theme"), lang: $("lang"), tagline: $("tagline"),
    help: $("help"), helpTitle: $("help-title"), helpText: $("help-text"),
    lblPeople: $("lbl-people"), lblPeopleHint: $("lbl-people-hint"),
    lblMinutes: $("lbl-minutes"), lblOrder: $("lbl-order"), lblMode: $("lbl-mode"),
    names: $("names"), minutes: $("minutes"),
    orderAlpha: $("order-alpha"), orderRandom: $("order-random"),
    modeAuto: $("mode-auto"), modeManual: $("mode-manual"),
    start: $("start"), estimate: $("estimate"),
    eyebrow: $("eyebrow"), speaker: $("speaker"), clock: $("clock"),
    overtimeNote: $("overtime-note"),
    turnbar: $("turnbar"), turnbarFill: $("turnbar").querySelector("i"),
    turnCount: $("turn-count"), nextUp: $("next-up"), queue: $("queue"),
    preroll: $("preroll"), prerollLabel: $("preroll-label"),
    prerollNum: $("preroll-num"), prerollSkip: $("preroll-skip"),
    pause: $("pause"), next: $("next"), reset: $("reset"),
    doneTitle: $("done-title"), doneSub: $("done-sub"), summary: $("summary"),
    again: $("again"), fireworks: $("fireworks")
  };

  var state = {
    lang: FALLBACK,
    order: "random",       // "random" | "alpha"
    mode: "auto",          // "auto" | "manual"
    list: [],              // ordered names for this run
    index: 0,              // current speaker index
    perTurn: 90,           // seconds per person (target)
    remaining: 90,         // seconds left in current turn (can go negative)
    deadline: null,        // wall-clock ms when this turn hits 0 (null = paused)
    beeped: false,         // time's-up alert already sounded for this turn
    running: false,        // timer ticking
    ticker: null,
    spent: [],             // [{ name, seconds }] actual time per person
    preroll: false,        // pre-roll countdown active
    prerollIv: null
  };

  /* ============ helpers ============ */

  function parseNames(text) {
    return text.split("\n")
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function orderedList() {
    var names = parseNames(el.names.value);
    if (state.order === "alpha") {
      return names.slice().sort(function (a, b) {
        return a.localeCompare(b, state.lang, { sensitivity: "base" });
      });
    }
    return shuffle(names);
  }

  function clampMinutes(v) {
    var n = parseFloat(v);
    if (isNaN(n) || n <= 0) n = 1.5;
    return Math.min(10, Math.max(0.5, n));
  }

  // "M:SS" with a leading "+" when negative (overtime)
  function clock(sec) {
    var neg = sec < 0;
    var s = Math.abs(sec);
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (neg ? "+" : "") + m + ":" + (r < 10 ? "0" : "") + r;
  }

  // "M:SS", never negative — for totals / summaries
  function mmss(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60);
    var r = sec % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  function fmtMinutesTotal(totalSec) {
    return Math.round(totalSec / 60) + " min";
  }

  function fmtMinLabel(min) {
    var v = Math.round(min * 100) / 100;
    try { return v.toLocaleString(state.lang) + " min"; }
    catch (e) { return v + " min"; }
  }

  /* ============ beeps (WebAudio, no assets) ============ */

  var audioCtx = null;
  function beep(times, freq) {
    freq = freq || 880;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var when = audioCtx.currentTime;
      for (var i = 0; i < times; i++) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = 0.0001;
        osc.connect(gain).connect(audioCtx.destination);
        var t0 = when + i * 0.28;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
        osc.start(t0);
        osc.stop(t0 + 0.24);
      }
    } catch (e) { /* audio not available — ignore */ }
  }

  /* ============ theme ============ */

  function storedTheme() {
    var v = lsGet(LS_THEME);
    return (v === "light" || v === "dark") ? v : null; // null = follow system
  }

  function effectiveTheme() {
    var s = storedTheme();
    if (s) return s;
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark" : "light";
  }

  function applyTheme() {
    var s = storedTheme();
    if (s) document.documentElement.setAttribute("data-theme", s);
    else document.documentElement.removeAttribute("data-theme");
    updateThemeButton();
  }

  function updateThemeButton() {
    var eff = effectiveTheme();
    el.theme.textContent = eff === "dark" ? "☀️" : "🌙";
    el.theme.title = t("themeToggle");
    el.theme.setAttribute("aria-label", t("themeToggle"));
  }

  /* ============ language ============ */

  function buildLangPicker() {
    el.lang.innerHTML = "";
    I18N.languages().forEach(function (l) {
      var o = document.createElement("option");
      o.value = l.code;
      o.textContent = l.label;
      el.lang.appendChild(o);
    });
  }

  function setLang(lang) {
    state.lang = I18N.has(lang) ? lang : FALLBACK;
    lsSet(LS_LANG, state.lang);
    el.lang.value = state.lang;
    document.documentElement.lang = state.lang;
    applyStaticI18n();
    if (!el.running.hidden) renderTurn();
    if (!el.done.hidden) renderSummary();
    refreshEstimate();
  }

  function applyStaticI18n() {
    el.tagline.textContent = t("tagline");
    el.names.placeholder = t("namesPlaceholder");
    el.lblPeople.textContent = t("people");
    el.lblPeopleHint.textContent = t("peopleHint");
    el.lblMinutes.textContent = t("minutesLabel");
    el.lblOrder.textContent = t("order");
    el.orderAlpha.textContent = t("orderAlpha");
    el.orderRandom.textContent = t("orderRandom");
    el.lblMode.textContent = t("changeMode");
    el.modeAuto.textContent = t("modeAuto");
    el.modeManual.textContent = t("modeManual");
    el.start.textContent = t("start");
    el.overtimeNote.textContent = t("overtimeNote");
    el.prerollLabel.textContent = t("getReady");
    el.prerollSkip.textContent = t("prerollSkip");
    el.next.textContent = t("next");
    el.reset.textContent = t("reset");
    el.pause.textContent = (!el.running.hidden && !state.running) ? t("resume") : t("pause");
    el.doneTitle.textContent = t("standupDone");
    el.again.textContent = t("restart");

    el.helpTitle.textContent = t("helpTitle");
    el.helpText.textContent = "";
    String(t("helpText")).split("\n").forEach(function (line) {
      var p = document.createElement("p");
      p.textContent = line;
      el.helpText.appendChild(p);
    });

    updateThemeButton();
  }

  /* ============ setup view ============ */

  function refreshEstimate() {
    var n = parseNames(el.names.value).length;
    var min = clampMinutes(el.minutes.value);
    el.start.disabled = n === 0;
    if (n === 0) {
      el.estimate.textContent = t("addPeople");
      return;
    }
    var txt = fill(t("estimate"), {
      people: peopleCount(n),
      min: fmtMinLabel(min),
      total: fmtMinutesTotal(n * min * 60)
    });
    if (state.mode === "manual") txt += t("estimateManualSuffix");
    el.estimate.textContent = txt;
  }

  function setOrder(order) {
    state.order = order;
    el.orderAlpha.setAttribute("aria-pressed", String(order === "alpha"));
    el.orderRandom.setAttribute("aria-pressed", String(order === "random"));
    lsSet(LS_ORDER, order);
  }

  function setMode(mode) {
    state.mode = mode;
    el.modeAuto.setAttribute("aria-pressed", String(mode === "auto"));
    el.modeManual.setAttribute("aria-pressed", String(mode === "manual"));
    lsSet(LS_MODE, mode);
    refreshEstimate();
  }

  /* ============ views ============ */

  function show(view) {
    el.setup.hidden = view !== "setup";
    el.running.hidden = view !== "running";
    el.done.hidden = view !== "done";
  }

  /* ============ pre-roll countdown ============ */

  function cancelPreroll() {
    if (state.prerollIv) { clearInterval(state.prerollIv); state.prerollIv = null; }
    state.preroll = false;
    el.preroll.hidden = true;
  }

  function runPreroll(done) {
    cancelPreroll();
    var n = PREROLL_SECONDS;
    state.preroll = true;
    el.preroll.hidden = false;
    showNum(n);

    state.prerollIv = setInterval(function () {
      n -= 1;
      if (n <= 0) {
        cancelPreroll();
        beep(2, 920);
        done();
      } else {
        showNum(n);
      }
    }, 1000);

    function showNum(v) {
      el.prerollNum.textContent = v;
      if (!reducedMotion()) {
        el.prerollNum.classList.remove("pop");
        void el.prerollNum.offsetWidth; // restart the animation
        el.prerollNum.classList.add("pop");
      }
      beep(1, 620);
    }

    // expose a skip that jumps straight to the run
    state.skipPreroll = function () {
      cancelPreroll();
      beep(2, 920);
      done();
    };
  }

  /* ============ fireworks ============ */

  var fw = { raf: null, ctx: null, particles: [], onresize: null };

  function launchFireworks() {
    stopFireworks();
    if (reducedMotion()) return;

    var c = el.fireworks;
    c.hidden = false;
    var ctx = c.getContext("2d");
    var dpr = window.devicePixelRatio || 1;

    function resize() {
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
      c.style.width = window.innerWidth + "px";
      c.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    fw.ctx = ctx;
    fw.particles = [];
    fw.onresize = resize;
    window.addEventListener("resize", resize);

    var start = performance.now();
    var lastBurst = 0;
    var W = function () { return window.innerWidth; };
    var H = function () { return window.innerHeight; };
    var DURATION = 4200;

    function spawnBurst(x, y) {
      var hue = Math.floor(Math.random() * 360);
      var count = 60 + Math.floor(Math.random() * 34);
      for (var i = 0; i < count; i++) {
        var ang = (Math.PI * 2) * (i / count) + Math.random() * 0.25;
        var spd = 2.4 + Math.random() * 4.4;
        fw.particles.push({
          x: x, y: y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          r: 1.8 + Math.random() * 2.6,
          life: 1 + Math.random() * 0.6,
          color: "hsl(" + (hue + (Math.random() * 40 - 20)) + ",90%," + (58 + Math.random() * 18) + "%)"
        });
      }
    }

    function frame(now) {
      var elapsed = now - start;
      ctx.clearRect(0, 0, W(), H());

      if (elapsed < 2800 && now - lastBurst > 380) {
        lastBurst = now;
        spawnBurst((0.12 + Math.random() * 0.76) * W(), (0.12 + Math.random() * 0.5) * H());
        if (Math.random() < 0.5) {
          spawnBurst((0.12 + Math.random() * 0.76) * W(), (0.12 + Math.random() * 0.5) * H());
        }
      }

      var alive = false;
      for (var i = 0; i < fw.particles.length; i++) {
        var p = fw.particles[i];
        p.vy += 0.03;           // gravity
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.012;
        if (p.life > 0) {
          alive = true;
          ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (elapsed < DURATION || alive) {
        fw.raf = requestAnimationFrame(frame);
      } else {
        stopFireworks();
      }
    }

    fw.raf = requestAnimationFrame(frame);
  }

  function stopFireworks() {
    if (fw.raf) { cancelAnimationFrame(fw.raf); fw.raf = null; }
    if (fw.onresize) { window.removeEventListener("resize", fw.onresize); fw.onresize = null; }
    if (fw.ctx) fw.ctx.clearRect(0, 0, el.fireworks.width, el.fireworks.height);
    fw.particles = [];
    el.fireworks.hidden = true;
  }

  /* ============ running ============ */

  function startRun() {
    state.list = orderedList();
    if (state.list.length === 0) return;
    state.perTurn = Math.round(clampMinutes(el.minutes.value) * 60);
    state.index = 0;
    state.spent = [];
    lsSet(LS_NAMES, el.names.value);
    lsSet(LS_MINUTES, String(clampMinutes(el.minutes.value)));

    show("running");
    // prime the stage so it looks right behind the countdown overlay
    el.speaker.textContent = state.list[0];
    el.clock.textContent = clock(state.perTurn);
    el.clock.className = "clock";
    renderQueue();

    runPreroll(function () { beginTurn(0); });
  }

  function beginTurn(i) {
    state.index = i;
    state.remaining = state.perTurn;
    state.beeped = false;
    state.running = true;
    startTicker();
    renderTurn();
  }

  /*
   * The countdown is derived from a wall-clock deadline rather than counted
   * down a second at a time: browsers throttle timers in hidden tabs (and
   * stop them while the machine sleeps), which would otherwise silently
   * freeze the clock the moment someone switches away mid stand-up.
   */
  function syncRemaining() {
    if (state.running && state.deadline != null) {
      state.remaining = Math.ceil((state.deadline - Date.now()) / 1000);
    }
    return state.remaining;
  }

  function startTicker() {
    stopTicker();
    state.deadline = Date.now() + state.remaining * 1000;
    // Sub-second polling so the display lands on each new second promptly;
    // tick() itself is cheap and redraws only when the second actually changes.
    state.ticker = setInterval(tick, 250);
    el.pause.textContent = t("pause");
  }

  function stopTicker() {
    if (state.ticker) { clearInterval(state.ticker); state.ticker = null; }
  }

  function tick() {
    var prev = state.remaining;
    var now = syncRemaining();
    if (now === prev) return;

    if (now <= 0 && !state.beeped) {
      state.beeped = true;
      beep(3);
    }
    renderClock();
    // Only ever one step per tick: the next turn gets a fresh full deadline,
    // so returning from a long absence never stampedes through the queue.
    if (state.mode === "auto" && now <= -1) advance();
  }

  function recordCurrent() {
    var elapsed = state.perTurn - syncRemaining();
    if (elapsed < 0) elapsed = 0;
    state.spent.push({ name: state.list[state.index], seconds: elapsed });
  }

  function advance() {
    recordCurrent();
    if (state.index + 1 >= state.list.length) {
      finishRun();
    } else {
      beginTurn(state.index + 1);
    }
  }

  function finishRun() {
    stopTicker();
    state.running = false;
    renderSummary();
    beep(2);
    show("done");
    launchFireworks();
  }

  function togglePause() {
    if (state.running) {
      syncRemaining();        // freeze the exact value before the clock stops
      state.running = false;
      state.deadline = null;
      stopTicker();
      el.pause.textContent = t("resume");
      renderClock();
    } else {
      state.running = true;
      startTicker();          // rebuilds the deadline from state.remaining
    }
  }

  function renderClock() {
    var r = state.remaining;
    el.clock.textContent = clock(r);
    var frac = r / state.perTurn; // 1 -> 0
    var cls = "";
    if (r < 0) cls = "over";
    else if (frac <= 0.15) cls = "danger";
    else if (frac <= 0.4) cls = "warn";
    el.clock.className = "clock" + (cls ? " " + cls : "");

    el.overtimeNote.hidden = !(r < 0 && state.mode === "manual");

    var pct = Math.max(0, Math.min(100, (1 - frac) * 100));
    el.turnbarFill.style.width = pct + "%";
    var barCls = "progress";
    if (r < 0 || frac <= 0.15) barCls += " danger";
    else if (frac <= 0.4) barCls += " warn";
    el.turnbar.className = barCls;
  }

  function renderTurn() {
    var i = state.index, list = state.list;
    el.speaker.textContent = list[i];
    el.eyebrow.textContent = state.mode === "manual"
      ? t("nowSpeaking") + " · " + t("manualTag")
      : t("nowSpeaking");
    el.turnCount.textContent = fill(t("personXofY"), { i: i + 1, n: list.length });
    el.nextUp.textContent = (i + 1 < list.length)
      ? fill(t("nextIs"), { name: list[i + 1] })
      : t("lastPerson");
    renderClock();
    renderQueue();
  }

  function renderQueue() {
    var frag = document.createDocumentFragment();
    state.list.forEach(function (name, idx) {
      var li = document.createElement("li");
      if (idx < state.index) li.className = "done";
      else if (idx === state.index) li.className = "current";

      var num = document.createElement("span");
      num.className = "num";
      num.textContent = (idx + 1);

      var nm = document.createElement("span");
      nm.className = "name";
      nm.textContent = name;

      li.appendChild(num);
      li.appendChild(nm);

      if (idx === state.index) {
        var tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = t("tagNow");
        li.appendChild(tag);
      } else if (idx < state.index) {
        var tagDone = document.createElement("span");
        tagDone.className = "tag";
        tagDone.textContent = t("tagDone");
        li.appendChild(tagDone);
      }
      frag.appendChild(li);
    });
    el.queue.innerHTML = "";
    el.queue.appendChild(frag);
  }

  function renderSummary() {
    var total = state.spent.reduce(function (s, p) { return s + p.seconds; }, 0);
    var n = state.spent.length;
    el.doneSub.textContent = fill(t("doneSub"), {
      people: peopleCount(n),
      total: mmss(total),
      target: fmtMinLabel(state.perTurn / 60)
    });

    var frag = document.createDocumentFragment();
    state.spent.forEach(function (p, idx) {
      var li = document.createElement("li");

      var num = document.createElement("span");
      num.className = "num";
      num.textContent = (idx + 1);

      var nm = document.createElement("span");
      nm.className = "name";
      nm.textContent = p.name;

      var tm = document.createElement("span");
      tm.className = "time";
      tm.textContent = mmss(p.seconds);

      var d = p.seconds - state.perTurn;
      var delta = document.createElement("span");
      delta.className = "delta" + (d > 1 ? " over" : (d < -1 ? " under" : ""));
      delta.textContent = (Math.abs(d) <= 1) ? "±0:00" : (d > 0 ? "+" : "−") + mmss(Math.abs(d));

      li.appendChild(num);
      li.appendChild(nm);
      li.appendChild(tm);
      li.appendChild(delta);
      frag.appendChild(li);
    });

    var totalLi = document.createElement("li");
    totalLi.className = "total";
    var tnum = document.createElement("span"); tnum.className = "num"; tnum.textContent = "";
    var tname = document.createElement("span"); tname.className = "name"; tname.textContent = t("total");
    var ttime = document.createElement("span"); ttime.className = "time"; ttime.textContent = mmss(total);
    var tdelta = document.createElement("span"); tdelta.className = "delta"; tdelta.textContent = "";
    totalLi.appendChild(tnum);
    totalLi.appendChild(tname);
    totalLi.appendChild(ttime);
    totalLi.appendChild(tdelta);
    frag.appendChild(totalLi);

    el.summary.innerHTML = "";
    el.summary.appendChild(frag);
  }

  function resetToSetup() {
    cancelPreroll();
    stopFireworks();
    stopTicker();
    state.running = false;
    show("setup");
    refreshEstimate();
  }

  /* ============ events ============ */

  el.theme.addEventListener("click", function () {
    var next = effectiveTheme() === "dark" ? "light" : "dark";
    lsSet(LS_THEME, next);
    applyTheme();
  });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onMq = function () { if (!storedTheme()) updateThemeButton(); };
    if (mq.addEventListener) mq.addEventListener("change", onMq);
    else if (mq.addListener) mq.addListener(onMq);
  }

  // Coming back to a throttled tab: catch the clock up immediately instead of
  // waiting for the next (possibly long-delayed) interval callback.
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && state.running && !el.running.hidden) tick();
  });

  el.lang.addEventListener("change", function () { setLang(el.lang.value); });
  el.names.addEventListener("input", refreshEstimate);
  el.minutes.addEventListener("input", refreshEstimate);
  el.minutes.addEventListener("change", function () {
    el.minutes.value = clampMinutes(el.minutes.value);
    refreshEstimate();
  });
  el.orderAlpha.addEventListener("click", function () { setOrder("alpha"); });
  el.orderRandom.addEventListener("click", function () { setOrder("random"); });
  el.modeAuto.addEventListener("click", function () { setMode("auto"); });
  el.modeManual.addEventListener("click", function () { setMode("manual"); });
  el.start.addEventListener("click", startRun);
  el.preroll.addEventListener("click", function () {
    if (state.preroll && state.skipPreroll) state.skipPreroll();
  });
  el.pause.addEventListener("click", togglePause);
  el.next.addEventListener("click", advance);
  el.reset.addEventListener("click", resetToSetup);
  el.again.addEventListener("click", resetToSetup);

  document.addEventListener("keydown", function (e) {
    var tag = e.target && e.target.tagName;
    if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || tag === "SUMMARY") return;
    // A focused button already activates on Space/Enter by itself; acting here
    // too would fire the shortcut and the button's own click for one keypress.
    if (tag === "BUTTON" && (e.code === "Space" || e.code === "Enter")) return;

    if (el.running.hidden) {
      if (e.code === "Space" && !el.start.disabled && !el.setup.hidden) { e.preventDefault(); startRun(); }
      return;
    }

    if (state.preroll) {
      if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowRight" || e.code === "Escape") {
        e.preventDefault();
        if (state.skipPreroll) state.skipPreroll();
      }
      return;
    }

    if (e.code === "Space") { e.preventDefault(); togglePause(); }
    else if (e.code === "ArrowRight") { e.preventDefault(); advance(); }
    else if (e.key === "r" || e.key === "R") { resetToSetup(); }
  });

  /* ============ init ============ */

  (function init() {
    buildLangPicker();
    applyTheme();

    var savedNames = lsGet(LS_NAMES);
    if (savedNames) el.names.value = savedNames;
    var savedMinutes = lsGet(LS_MINUTES);
    if (savedMinutes) el.minutes.value = clampMinutes(savedMinutes);
    setOrder(lsGet(LS_ORDER) === "alpha" ? "alpha" : "random");
    setMode(lsGet(LS_MODE) === "manual" ? "manual" : "auto");

    var savedLang = lsGet(LS_LANG);
    var navLang = (navigator.language || "").slice(0, 2).toLowerCase();
    setLang(savedLang || (I18N.has(navLang) ? navLang : FALLBACK));

    refreshEstimate();
  })();
})();
