/* 画面遷移・共通部品 */
window.LT = window.LT || {};
LT.routes = LT.routes || {};
LT.STAGE_IMPL = LT.STAGE_IMPL || {};

LT.LAYERS = {
  intro:    { name: "導入", who: "中学生〜", icon: "🌱", desc: "短い説明と、ボタン操作中心の体験。仕組みをアニメーションで理解する。" },
  practice: { name: "体験", who: "高校生〜", icon: "🔧", desc: "攻撃の要素を自分で選んで組み立て、対策の効き目を自分で確かめる。" },
  inquiry:  { name: "探究", who: "大学生〜", icon: "🔬", desc: "条件を変えて測定し、根拠を説明する。測定値をCSVで書き出せる。" }
};
LT.RESEARCH_HASH = "b9ca61ae9d7b56d65901aaaa2bbeb2539a9a93c8231390c84a4c26ff2851360f";

LT.STAGES = [
  { id: "s1", no: 1, icon: "🔑", color: "#c62828", title: "パスワード", sub: "使い回しの連鎖と総当たり", desc: "流出リストで別サービスに侵入し、多要素認証で止まる様子を確かめる。", route: "#/stage/1", min: 12 },
  { id: "s2", no: 2, icon: "🎣", color: "#e65100", title: "フィッシング", sub: "偽メールと偽ログイン画面", desc: "URLの読み方を学び、偽メールを組み立て、本物と偽物を見分ける。", route: "#/stage/2", min: 12 },
  { id: "s3", no: 3, icon: "⛓️", color: "#6a1b9a", title: "侵入の連鎖", sub: "入口から大規模漏えいまで", desc: "1つの侵入が大量流出につながる流れを見て、どこで断ち切れるかを確かめる。", route: "#/stage/3", min: 8 },
  { id: "s4", no: 4, icon: "✉️", color: "#00695c", title: "人為ミス", sub: "誤送信と共有設定", desc: "攻撃者がいなくても起きる漏えい。確認の手順でミスが減るかを自分で測る。", route: "#/stage/4", min: 10 },
  { id: "final", no: "★", icon: "🧭", color: "#2b5fd9", title: "最終課題", sub: "自分の行動をふり返る", desc: "普段の行動を選ぶと、架空のシナリオで何が起こるかが攻撃経路マップに表示される。", route: "#/final", min: 5 }
];

LT.layer = () => LT.state.layer;
LT.isIntro = () => LT.state.layer === "intro";
LT.isInquiry = () => LT.state.layer === "inquiry";

LT.$ = (sel, root) => (root || document).querySelector(sel);
LT.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
LT.esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
LT.sleep = (ms) => new Promise(r => setTimeout(r, ms));
LT.rand = (n) => Math.floor(Math.random() * n);
LT.shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = LT.rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
LT.fmtNum = (n) => n.toLocaleString("ja-JP");

LT.toast = function (msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(LT._toastTimer);
  LT._toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
};

LT.sha256hex = async function (text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
};

/* 秒を読みやすく */
LT.fmtDuration = function (sec) {
  if (!isFinite(sec)) return "計算不能";
  if (sec < 0.001) return "一瞬";
  if (sec < 1) return (sec * 1000).toFixed(0) + " ミリ秒";
  if (sec < 60) return sec.toFixed(1) + " 秒";
  if (sec < 3600) return (sec / 60).toFixed(1) + " 分";
  if (sec < 86400) return (sec / 3600).toFixed(1) + " 時間";
  if (sec < 86400 * 365) return (sec / 86400).toFixed(1) + " 日";
  const y = sec / (86400 * 365.25);
  if (y < 1e4) return y.toFixed(1) + " 年";
  if (y < 1e8) return (y / 1e4).toFixed(1) + " 万年";
  if (y < 1e12) return (y / 1e8).toFixed(1) + " 億年";
  return y.toExponential(1) + " 年";
};

/* 進捗（0〜1）。各ステージ3段階＋最終課題で数える */
LT.progress = function () {
  const sum = LT.summary();
  let done = 0, total = 0;
  sum.forEach(s => {
    if (s.id === "final") { total += 1; done += s.completed ? 1 : 0; }
    else { total += 3; done += (s.see ? 1 : 0) + (s.break ? 1 : 0) + (s.defend ? 1 : 0); }
  });
  return { done, total, ratio: total ? done / total : 0 };
};

/* 進捗リング（SVG） */
LT.ring = function (ratio, size, color, label) {
  const r = size / 2 - 6, c = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="ring" aria-label="${Math.round(ratio * 100)}%">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="7"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - ratio)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${size / 4.6}" font-weight="800" fill="var(--text)">${label !== undefined ? label : Math.round(ratio * 100) + "%"}</text>
  </svg>`;
};

/* ---------- 画面遷移 ---------- */
LT.current = { stage: null, enteredAt: 0 };

LT.render = function () {
  const hash = location.hash || "#/home";
  const parts = hash.replace(/^#\//, "").split("/");
  const app = document.getElementById("app");

  if (LT.current.stage && LT.current.enteredAt) {
    LT.addSeconds(LT.current.stage, (Date.now() - LT.current.enteredAt) / 1000);
  }
  LT.current = { stage: null, enteredAt: Date.now() };

  if (!LT.state.ethicsAccepted && parts[0] !== "ethics") { location.hash = "#/ethics"; return; }

  if (parts[0] === "stage" || parts[0] === "final") { LT.state.lastRoute = hash; LT.save(); }

  LT.$$("[data-nav]").forEach(a => a.classList.toggle("active", a.dataset.nav === (parts[0] === "stage" || parts[0] === "final" ? "home" : parts[0])));
  const L = LT.LAYERS[LT.state.layer];
  document.getElementById("layerPill").innerHTML = `${L.icon} ${L.name}層`;
  const bar = document.getElementById("bottombar");
  bar.hidden = true; bar.innerHTML = "";
  document.body.classList.remove("has-bottombar");
  app.innerHTML = "";
  app.className = "app fade-in";
  window.scrollTo(0, 0);

  const handler = LT.routes[parts[0]];
  if (handler) handler(app, parts.slice(1));
  else LT.routes.home(app, []);
};

/* ---------- ステージ共通の外枠 ---------- */
LT.STEP_DEF = [
  { key: "see", cls: "s1", short: "見る", label: "見る", hint: "仕組みを知る" },
  { key: "break", cls: "s2", short: "破る", label: "破る", hint: "攻撃者になる" },
  { key: "defend", cls: "s3", short: "守る", label: "なぜ守れるか", hint: "対策を確かめる" }
];

LT.stageShell = function (app, stage, stepKey, renderers) {
  LT.startStage(stage.id);
  LT.current.stage = stage.id;
  const st = LT.stageState(stage.id);
  const order = ["see", "break", "defend"];
  stepKey = order.includes(stepKey) ? stepKey : "see";
  const i = order.indexOf(stepKey);

  const head = document.createElement("div");
  head.className = "stage-head";
  head.style.setProperty("--stage", stage.color);
  head.innerHTML = `
    <a href="#/home" class="back" aria-label="ホームへ戻る">‹</a>
    <span class="stage-icon">${stage.icon}</span>
    <div class="grow"><div class="eyebrow">ステージ ${stage.no} / 4</div><h1>${stage.title}</h1></div>`;
  app.appendChild(head);

  // ステッパー（番号つきの丸と線）
  const steps = document.createElement("nav");
  steps.className = "stepper";
  steps.innerHTML = LT.STEP_DEF.map((d, k) => `
    <a href="${stage.route}/${d.key}" class="step ${d.cls}${k === i ? " active" : ""}${st.steps[d.key] ? " done" : ""}">
      <span class="dot">${st.steps[d.key] && k !== i ? "✓" : k + 1}</span>
      <span class="lbl"><b>${d.label}</b><small>${d.hint}</small></span>
    </a>${k < 2 ? '<span class="line"></span>' : ""}`).join("");
  app.appendChild(steps);

  const body = document.createElement("div");
  body.className = "stage-body";
  app.appendChild(body);
  LT.log(stage.id, stepKey, "view");
  renderers[stepKey](body);

  // 画面下に固定するナビ（タブレットで親指が届く位置）
  const nextIdx = LT.STAGES.findIndex(s => s.id === stage.id) + 1;
  const prevHref = i > 0 ? `${stage.route}/${order[i - 1]}` : "#/home";
  const prevLabel = i > 0 ? LT.STEP_DEF[i - 1].short : "ホーム";
  let nextHref, nextLabel;
  if (i < 2) { nextHref = `${stage.route}/${order[i + 1]}`; nextLabel = `次：${LT.STEP_DEF[i + 1].label}`; }
  else if (nextIdx < LT.STAGES.length) { nextHref = LT.STAGES[nextIdx].route; nextLabel = `次のステージ：${LT.STAGES[nextIdx].title}`; }
  else { nextHref = "#/map"; nextLabel = "攻撃経路マップへ"; }

  const bar = document.getElementById("bottombar");
  bar.hidden = false;
  document.body.classList.add("has-bottombar");
  bar.innerHTML = `
    <div class="bb-inner">
      <a class="btn ghost" href="${prevHref}">‹ ${prevLabel}</a>
      <div class="bb-dots">${order.map((k, n) => `<span class="${n === i ? "on" : ""}${st.steps[k] ? " done" : ""}"></span>`).join("")}</div>
      <button class="btn primary" id="nextBtn">${nextLabel} ›</button>
    </div>`;
  bar.querySelector("#nextBtn").onclick = () => {
    LT.markStep(stage.id, stepKey);
    if (i === 2 && LT.stageState(stage.id).completedAt) LT.celebrate(stage);
    location.hash = nextHref;
  };
};

/* ステージ完了のお祝い（短く） */
LT.celebrate = function (stage) {
  LT.toast(`${stage.icon} ステージ${stage.no}「${stage.title}」クリア！`);
};

/* 「予想してから答え合わせ」部品 */
LT.prediction = function (container, key, question, choices, explain, onDone) {
  const saved = LT.state.answers[key];
  const box = document.createElement("div");
  box.className = "card predict";
  box.innerHTML = `<div class="card-label">🤔 予想してみよう</div><p class="q">${question}</p>`;
  const list = document.createElement("div");
  list.className = "choices";
  choices.forEach((c, i) => {
    const l = document.createElement("label");
    l.className = "choice";
    l.innerHTML = `<input type="radio" name="${key}" value="${i}"><span class="mark">${"ABCD"[i]}</span><span>${c.text}</span>`;
    list.appendChild(l);
  });
  box.appendChild(list);
  const res = document.createElement("div");
  box.appendChild(res);
  const reveal = (idx) => {
    LT.$$("label.choice", list).forEach((l, i) => {
      l.classList.toggle("correct", !!choices[i].correct);
      l.classList.toggle("wrong", i === idx && !choices[i].correct);
      l.querySelector("input").disabled = true;
      if (i === idx) l.querySelector("input").checked = true;
    });
    const ok = !!choices[idx].correct;
    res.innerHTML = `<div class="feedback ${ok ? "ok" : "ng"} fade-in"><b>${ok ? "正解！" : "おしい！"}</b> ${explain}</div>`;
  };
  list.addEventListener("change", (e) => {
    const idx = Number(e.target.value);
    LT.setAnswer(key, { choice: idx, text: choices[idx].text, correct: !!choices[idx].correct });
    reveal(idx);
    if (onDone) onDone(!!choices[idx].correct);
  });
  if (saved && saved.value && typeof saved.value.choice === "number") reveal(saved.value.choice);
  container.appendChild(box);
  return box;
};

/* 記述課題（層によって問いを変える） */
LT.writingTask = function (container, key, prompts) {
  const p = prompts[LT.layer()] || prompts.practice;
  const saved = LT.state.answers[key];
  const box = document.createElement("div");
  box.className = "card write";
  box.innerHTML = `<div class="card-label">✏️ ${p.title}</div><p class="q">${p.text}</p>
    <textarea placeholder="ここに書く">${saved ? LT.esc(saved.value) : ""}</textarea>
    <div class="spread mt"><span class="small count">0 文字</span><button class="btn primary sm">保存する</button></div>`;
  const ta = box.querySelector("textarea"), count = box.querySelector(".count");
  const upd = () => { count.textContent = ta.value.length + " 文字" + (saved ? "（保存済み）" : ""); };
  ta.oninput = () => { count.textContent = ta.value.length + " 文字"; };
  upd();
  box.querySelector("button").onclick = () => {
    const v = ta.value.trim();
    if (!v) { LT.toast("まだ何も書かれていません"); return; }
    LT.setAnswer(key, v); LT.toast("保存しました"); count.textContent = v.length + " 文字（保存済み）";
  };
  container.appendChild(box);
};

/* ---------- ホーム ---------- */
LT.routes.home = function (app) {
  const sum = LT.summary();
  const prog = LT.progress();
  const L = LT.LAYERS[LT.state.layer];
  const pre = LT.state.scores["test.pre"], post = LT.state.scores["test.post"];
  const resume = LT.state.lastRoute;
  const nextStage = LT.STAGES.find(s => !(sum.find(x => x.id === s.id) || {}).completed);

  app.innerHTML = `
  <section class="hero">
    <div class="hero-text">
      <div class="eyebrow">${L.icon} ${L.name}層（${L.who}）・ID ${LT.esc(LT.state.learnerId)}</div>
      <h1>なぜ個人情報は漏れるのか。<br>なぜその対策が効くのか。</h1>
      <p>あなたが<span class="badge attack">攻撃者</span>と<span class="badge defend">防御者</span>の両方になって、漏えいの仕組みを体験し、対策が効く理由を自分の目で確かめます。</p>
      <div class="row">
        ${resume && prog.done > 0 ? `<a class="btn primary lg" href="${resume}">▶ 続きから</a>` : `<a class="btn primary lg" href="${pre ? "#/stage/1" : "#/test/pre"}">▶ ${pre ? "ステージ1から始める" : "はじめのテストから始める"}</a>`}
        <a class="btn ghost" href="#/layer">学習層を変える</a>
      </div>
    </div>
    <div class="hero-ring">${LT.ring(prog.ratio, 132, "var(--accent)")}<div class="small center">${prog.done} / ${prog.total} 段階</div></div>
  </section>

  <section>
    <h2 class="section-title">ステージ</h2>
    <div class="stage-list" id="stageList"></div>
  </section>

  <section>
    <h2 class="section-title">テストとふり返り</h2>
    <div class="tile-row">
      <a class="tile" href="#/test/pre"><span class="tile-icon">📝</span><div><b>はじめのテスト</b><small>${pre ? `受験済み：${pre.correct}/${pre.total}` : "学習前に受ける（約5分）"}</small></div>${pre ? '<span class="badge ok">済</span>' : '<span class="badge warn">まず受ける</span>'}</a>
      <a class="tile" href="#/test/post"><span class="tile-icon">🏁</span><div><b>おわりのテスト</b><small>${post ? `受験済み：${post.correct}/${post.total}` : "全ステージの後に受ける"}</small></div>${post ? '<span class="badge ok">済</span>' : ""}</a>
      <a class="tile" href="#/survey"><span class="tile-icon">💬</span><div><b>使いやすさアンケート</b><small>${LT.state.scores["survey.sus"] ? "回答済み" : "最後に答える（10問）"}</small></div>${LT.state.scores["survey.sus"] ? '<span class="badge ok">済</span>' : ""}</a>
      <a class="tile" href="#/map"><span class="tile-icon">🗺️</span><div><b>攻撃経路マップ</b><small>通った経路 ${LT.state.map.edges.length} / ${LT.MAP.edges.length}</small></div></a>
    </div>
  </section>`;

  const list = app.querySelector("#stageList");
  LT.STAGES.forEach(s => {
    const ss = sum.find(x => x.id === s.id);
    const steps = s.id === "final" ? (ss.completed ? 1 : 0) : (ss.see ? 1 : 0) + (ss.break ? 1 : 0) + (ss.defend ? 1 : 0);
    const total = s.id === "final" ? 1 : 3;
    const isNext = nextStage && nextStage.id === s.id;
    const a = document.createElement("a");
    a.className = "stage-tile" + (ss.completed ? " done" : "") + (isNext ? " next" : "");
    a.href = s.route;
    a.style.setProperty("--stage", s.color);
    a.innerHTML = `
      <div class="st-top"><span class="stage-icon">${s.icon}</span>
        <div class="grow"><div class="eyebrow">${s.id === "final" ? "まとめ" : "ステージ " + s.no}・約${s.min}分</div><h3>${s.title}</h3></div>
        ${ss.completed ? '<span class="badge ok">クリア</span>' : isNext ? '<span class="badge accent">次はここ</span>' : ""}</div>
      <p class="small">${s.desc}</p>
      <div class="st-prog"><div class="bar"><div style="width:${steps / total * 100}%"></div></div><span class="small">${steps}/${total}</span></div>`;
    list.appendChild(a);
  });
};

/* ---------- 倫理と法律の説明 ---------- */
LT.routes.ethics = function (app) {
  app.innerHTML = `
  <div class="card narrow">
    <div class="center"><div style="font-size:3rem">🛡️</div><h1>はじめに：守るために学ぶ</h1>
    <p class="muted">この教材には、攻撃者の立場で「個人情報を盗み出す」体験が含まれます。始める前に、4つの約束を確認してください。</p></div>
    <ol class="promise">
      <li><b>ここで扱うものはすべて架空です。</b><br>登場する企業・サービス・人物・パスワード・メールはすべて架空です。本物のパスワードや、自分や他人の個人情報は入力しないでください。</li>
      <li><b>教材の外で試すと犯罪になります。</b><br>他人のIDやパスワードで無断でログインすることは${LT.T("不正アクセス禁止法")}で禁じられています（3年以下の拘禁刑または100万円以下の罰金）。偽メールで情報をだまし取る行為は詐欺罪などにもあたります。この教材の操作は模擬環境の中だけで成り立つように簡略化してあり、現実のシステムに使える手順は含まれていません。</li>
      <li><b>学んだことは守るために使います。</b><br>攻撃の仕組みを知るのは、対策が効く理由を理解して、自分と周りの人を守るためです。</li>
      <li><b>入力した内容は外部に送信されません。</b><br>この教材はブラウザの中だけで動き、学習記録もこの端末にだけ保存されます。</li>
    </ol>
    <label class="choice agree"><input type="checkbox" id="agree"><span>上の内容を理解し、学んだ知識を守るために使うことに同意します</span></label>
    <button class="btn primary block lg mt" id="go" disabled>学習層を選んで始める ›</button>
  </div>`;
  const cb = app.querySelector("#agree"), go = app.querySelector("#go");
  cb.onchange = () => go.disabled = !cb.checked;
  go.onclick = () => { LT.state.ethicsAccepted = true; LT.save(); LT.log("", "", "ethics_accepted"); location.hash = "#/layer"; };
};

/* ---------- 学習層の選択 ---------- */
LT.routes.layer = function (app) {
  app.innerHTML = `<div class="narrow"><h1 class="center">学習の深さを選ぶ</h1><p class="center muted">同じ教材の中で、説明の深さと課題の難しさが変わります。途中でいつでも変えられます（右上のボタン）。</p><div class="layer-list" id="layers"></div></div>`;
  const g = app.querySelector("#layers");
  Object.keys(LT.LAYERS).forEach(k => {
    const l = LT.LAYERS[k];
    const d = document.createElement("button");
    d.className = "layer-card" + (LT.state.layer === k ? " selected" : "");
    d.innerHTML = `<span class="layer-icon">${l.icon}</span><span class="grow"><b>${l.name}層</b> <small>${l.who}</small><br><span class="small">${l.desc}</span></span>${LT.state.layer === k ? '<span class="badge ok">選択中</span>' : '<span class="chev">›</span>'}`;
    d.onclick = () => { LT.state.layer = k; LT.save(); LT.log("", "", "layer_select", k); location.hash = "#/home"; };
    g.appendChild(d);
  });
};

/* ---------- 学習記録 ---------- */
LT.routes.records = function (app) {
  const sum = LT.summary();
  const c = v => v ? '<span class="ok-mark">✓</span>' : '<span class="muted">–</span>';
  const rows = sum.map(s => `<tr><td>${s.name}</td><td>${c(s.see)}</td><td>${c(s.break)}</td><td>${c(s.defend)}</td><td>${c(s.completed)}</td><td>${Math.round(s.seconds / 60 * 10) / 10}</td></tr>`).join("");
  const scores = Object.keys(LT.state.scores).map(k => { const v = LT.state.scores[k]; return `<tr><td>${LT.scoreName(k)}</td><td>${v.correct}/${v.total}</td><td>${v.percent}%</td><td class="small">${v.note || ""}</td></tr>`; }).join("") || `<tr><td colspan="4" class="muted">まだありません</td></tr>`;
  const answers = Object.keys(LT.state.answers).map(k => { const v = LT.state.answers[k]; return `<tr><td class="mono small">${k}</td><td>${LT.esc(typeof v.value === "object" ? (v.value.text || JSON.stringify(v.value)) : v.value)}</td></tr>`; }).join("") || `<tr><td colspan="2" class="muted">まだありません</td></tr>`;
  const pre = LT.state.scores["test.pre"], post = LT.state.scores["test.post"];
  app.innerHTML = `
  <h1>学習記録</h1>
  <div class="card">
    <div class="spread"><h2 class="mb0">書き出し</h2><span class="small">参加者ID <code>${LT.esc(LT.state.learnerId)}</code></span></div>
    <p class="small">記録はこの端末のブラウザ内にだけ保存されています。卒業研究のデータとして使うときは書き出してください。</p>
    <div class="export-grid">
      <button class="btn" id="exMd"><span>📄</span>まとめ<br><small>Markdown</small></button>
      <button class="btn" id="exCsv"><span>📊</span>操作ログ<br><small>CSV</small></button>
      <button class="btn" id="exMeas"><span>📈</span>実測値<br><small>CSV</small></button>
      <button class="btn" id="exTest"><span>📝</span>テスト・アンケート<br><small>CSV</small></button>
      <button class="btn" id="exJson"><span>🗂️</span>全データ<br><small>JSON</small></button>
    </div>
  </div>
  ${pre || post ? `<div class="card"><h2>テストの変化</h2>${LT.prePostView()}</div>` : ""}
  <div class="card"><h2>進捗</h2><div class="table-wrap"><table><tr><th>ステージ</th><th>見る</th><th>破る</th><th>守る</th><th>完了</th><th>分</th></tr>${rows}</table></div></div>
  <div class="card"><h2>得点</h2><div class="table-wrap"><table><tr><th>課題</th><th>正答</th><th>率</th><th>備考</th></tr>${scores}</table></div></div>
  <details class="card"><summary><h2 class="inline">予想・記述の回答</h2></summary><div class="table-wrap mt"><table><tr><th>キー</th><th>内容</th></tr>${answers}</table></div></details>
  <details class="card"><summary><h2 class="inline">操作ログ（最新20件 / 全${LT.state.events.length}件）</h2></summary><div class="xray mt">${LT.state.events.slice(-20).reverse().map(e => `<span class="dim">${e.t.slice(11, 19)}</span> ${e.stage}/${e.step} <span class="hl">${e.type}</span> ${LT.esc(typeof e.detail === "object" ? JSON.stringify(e.detail) : e.detail)}`).join("\n") || "（なし）"}</div></details>
  <details class="card"><summary><h2 class="inline">実験の設定（研究者用）</h2></summary>
    <div class="mt">
      <label class="field"><span>参加者ID</span><div class="row"><input type="text" id="pid" value="${LT.esc(LT.state.learnerId)}" style="max-width:260px"><button class="btn sm" id="setPid">変更</button></div></label>
      <label class="field"><span>研究モード <span class="badge ${LT.state.research ? "ok" : "gray"}">${LT.state.research ? "解錠中" : "施錠中"}</span></span>
        <div class="row"><input type="password" id="rpw" placeholder="パスワード" style="max-width:260px"><button class="btn sm" id="rgo">${LT.state.research ? "施錠する" : "解錠する"}</button></div>
        <small>研究モードでは、各ステージで条件を変えた測定値の一覧と、テストの正解表示が使えます。</small></label>
      <hr><button class="btn sm danger" id="reset">この端末の記録をすべて消去</button>
    </div>
  </details>`;
  app.querySelector("#exCsv").onclick = LT.exportEventsCSV;
  app.querySelector("#exJson").onclick = LT.exportJSON;
  app.querySelector("#exMd").onclick = LT.exportMarkdown;
  app.querySelector("#exMeas").onclick = LT.exportMeasurementsCSV;
  app.querySelector("#exTest").onclick = LT.exportTestCSV;
  app.querySelector("#setPid").onclick = () => { const v = app.querySelector("#pid").value.trim(); if (v) { LT.state.learnerId = v; LT.save(); LT.toast("参加者IDを変更しました"); LT.render(); } };
  app.querySelector("#reset").onclick = () => { if (confirm("この端末の学習記録をすべて消去します。先に書き出しましたか？")) { LT.reset(); LT.toast("消去しました"); location.hash = "#/ethics"; } };
  app.querySelector("#rgo").onclick = async () => {
    if (LT.state.research) { LT.state.research = false; LT.save(); LT.render(); return; }
    const h = await LT.sha256hex(app.querySelector("#rpw").value);
    if (h === LT.RESEARCH_HASH) { LT.state.research = true; LT.save(); LT.log("", "", "research_unlock"); LT.toast("研究モードを解錠しました"); LT.render(); }
    else LT.toast("パスワードが違います");
  };
};

LT.scoreName = function (k) {
  const map = { "s1.listattack": "S1 リスト型攻撃の成功数", "s2.phish_quiz": "S2 フィッシング判別", "s4.send": "S4 一斉送信（②）", "s4.trial.none": "S4 確認なしの試行", "s4.trial.check": "S4 確認ありの試行", "test.pre": "はじめのテスト", "test.post": "おわりのテスト", "survey.sus": "SUS（使いやすさ）" };
  return map[k] || k;
};

/* ---------- ステージのルーティング ---------- */
LT.routes.stage = function (app, parts) {
  const no = parts[0];
  const step = parts[1] || "see";
  const stage = LT.STAGES.find(s => String(s.no) === String(no));
  const impl = LT.STAGE_IMPL[no];
  if (!stage || !impl) { LT.routes.home(app); return; }
  LT.stageShell(app, stage, step, impl);
};

/* ---------- 文字サイズ ---------- */
LT.applyFont = function () {
  document.documentElement.classList.toggle("font-lg", !!(LT.state.ui && LT.state.ui.fontLarge));
  const b = document.getElementById("fontBtn");
  if (b) b.setAttribute("aria-pressed", LT.state.ui && LT.state.ui.fontLarge ? "true" : "false");
};

/* ---------- 起動 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  LT.load();
  LT.state.ui = LT.state.ui || {};
  LT.initGlossary();
  LT.applyFont();
  document.getElementById("layerPill").onclick = () => { location.hash = "#/layer"; };
  document.getElementById("fontBtn").onclick = () => { LT.state.ui.fontLarge = !LT.state.ui.fontLarge; LT.save(); LT.applyFont(); };
  window.addEventListener("hashchange", LT.render);
  window.addEventListener("beforeunload", () => { if (LT.current.stage) LT.addSeconds(LT.current.stage, (Date.now() - LT.current.enteredAt) / 1000); });
  LT.render();
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
});
