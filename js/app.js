/* 画面遷移・共通部品 */
window.LT = window.LT || {};

LT.LAYERS = {
  intro:    { name: "導入", who: "中学生〜", desc: "短い説明と、ボタン操作中心の体験。仕組みをアニメーションで理解する。" },
  practice: { name: "体験", who: "高校生〜", desc: "攻撃の要素を自分で選んで組み立て、対策の効き目を自分で確かめる。" },
  inquiry:  { name: "探究", who: "大学生〜", desc: "条件を変えて測定し、根拠を説明する。測定値をCSVで書き出せる。" }
};
LT.RESEARCH_HASH = "b9ca61ae9d7b56d65901aaaa2bbeb2539a9a93c8231390c84a4c26ff2851360f";

LT.STAGES = [
  { id: "s1", no: 1, title: "パスワード", sub: "使い回しの連鎖と総当たり", desc: "ハッシュ化の仕組みを見て、流出リストで別サービスに侵入し、多要素認証で止まる様子を確かめる。", route: "#/stage/1" },
  { id: "s2", no: 2, title: "フィッシング", sub: "偽メールと偽ログイン画面", desc: "URLの構造を学び、偽メールを組み立て、本物と偽物を見分ける課題に挑む。", route: "#/stage/2" },
  { id: "s3", no: 3, title: "侵入の連鎖", sub: "入口から大規模漏えいまで", desc: "古い機器からの侵入が、権限の拡大、データ持ち出し、脅迫につながる流れを見て、どこで断ち切れるかを確かめる。", route: "#/stage/3" },
  { id: "s4", no: 4, title: "人為ミス", sub: "誤送信と共有設定", desc: "攻撃者がいなくても起きる漏えい。CC/BCCと共有リンクの違いを体験し、確認手順でミスがどう減るかを測る。", route: "#/stage/4" },
  { id: "final", no: "★", title: "最終課題", sub: "自分の行動をふり返る", desc: "普段の行動を選ぶと、架空のシナリオで何が起こるかが攻撃経路マップに表示される。", route: "#/final" }
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
  if (sec < 0.001) return "一瞬（1ミリ秒未満）";
  if (sec < 1) return (sec * 1000).toFixed(0) + " ミリ秒";
  if (sec < 60) return sec.toFixed(1) + " 秒";
  if (sec < 3600) return (sec / 60).toFixed(1) + " 分";
  if (sec < 86400) return (sec / 3600).toFixed(1) + " 時間";
  if (sec < 86400 * 365) return (sec / 86400).toFixed(1) + " 日";
  const y = sec / (86400 * 365.25);
  if (y < 1e4) return y.toFixed(1) + " 年";
  if (y < 1e8) return (y / 1e4).toFixed(1) + " 万年";
  if (y < 1e12) return (y / 1e8).toFixed(1) + " 億年";
  return y.toExponential(2) + " 年";
};

/* ---------- 画面遷移 ---------- */
LT.routes = LT.routes || {};
LT.current = { stage: null, enteredAt: 0 };

LT.render = function () {
  const hash = location.hash || "#/home";
  const parts = hash.replace(/^#\//, "").split("/");
  const app = document.getElementById("app");

  // 直前のステージの滞在時間を加算
  if (LT.current.stage && LT.current.enteredAt) {
    LT.addSeconds(LT.current.stage, (Date.now() - LT.current.enteredAt) / 1000);
  }
  LT.current = { stage: null, enteredAt: Date.now() };

  // 倫理説明を読む前はホーム以外に行けない
  if (!LT.state.ethicsAccepted && parts[0] !== "ethics") { location.hash = "#/ethics"; return; }

  LT.$$("#topnav a").forEach(a => a.classList.toggle("active", a.dataset.nav === parts[0]));
  document.getElementById("layerPill").textContent = LT.LAYERS[LT.state.layer].name + "層";
  app.innerHTML = "";
  app.className = "app fade-in";
  window.scrollTo(0, 0);

  const handler = LT.routes[parts[0]];
  if (handler) handler(app, parts.slice(1));
  else LT.routes.home(app, []);
};

/* ---------- ステージ共通の外枠 ---------- */
LT.STEP_DEF = [
  { key: "see", cls: "s1", label: "① 見る（仕組み）" },
  { key: "break", cls: "s2", label: "② 破る（体験）" },
  { key: "defend", cls: "s3", label: "③ なぜ守れるか" }
];

LT.stageShell = function (app, stage, stepKey, renderers) {
  LT.startStage(stage.id);
  LT.current.stage = stage.id;
  const st = LT.stageState(stage.id);
  stepKey = ["see", "break", "defend"].includes(stepKey) ? stepKey : "see";

  const head = document.createElement("div");
  head.className = "stage-head";
  head.innerHTML = `<span class="stage-no">${stage.no}</span><div><h1 style="margin:0">${stage.title}</h1><div class="muted">${stage.sub}</div></div>`;
  app.appendChild(head);

  const steps = document.createElement("div");
  steps.className = "steps";
  LT.STEP_DEF.forEach(d => {
    const b = document.createElement("button");
    b.className = `${d.cls}${d.key === stepKey ? " active" : ""}${st.steps[d.key] ? " done" : ""}`;
    b.textContent = d.label;
    b.onclick = () => { location.hash = `${stage.route}/${d.key}`; };
    steps.appendChild(b);
  });
  app.appendChild(steps);

  const body = document.createElement("div");
  app.appendChild(body);
  LT.log(stage.id, stepKey, "view");
  renderers[stepKey](body);

  // 次へ
  const nav = document.createElement("div");
  nav.className = "spread mt";
  const order = ["see", "break", "defend"];
  const i = order.indexOf(stepKey);
  const prev = i > 0 ? `<a class="btn" href="${stage.route}/${order[i - 1]}">← ${LT.STEP_DEF[i - 1].label}</a>` : `<a class="btn" href="#/home">← ホーム</a>`;
  const nextIdx = LT.STAGES.findIndex(s => s.id === stage.id) + 1;
  const next = i < 2 ? `<a class="btn primary" href="${stage.route}/${order[i + 1]}">${LT.STEP_DEF[i + 1].label} →</a>` :
    (nextIdx < LT.STAGES.length ? `<a class="btn primary" href="${LT.STAGES[nextIdx].route}">次：${LT.STAGES[nextIdx].title} →</a>` : `<a class="btn primary" href="#/map">攻撃経路マップを見る →</a>`);
  nav.innerHTML = prev + next;
  app.appendChild(nav);
};

/* 「予想してから答え合わせ」部品。choices: [{text, correct}]; onDone(correct) */
LT.prediction = function (container, key, question, choices, explain, onDone) {
  const saved = LT.state.answers[key];
  const box = document.createElement("div");
  box.className = "card note";
  box.innerHTML = `<h3>予想してみよう</h3><p>${question}</p>`;
  const list = document.createElement("div");
  choices.forEach((c, i) => {
    const l = document.createElement("label");
    l.className = "choice";
    l.innerHTML = `<input type="radio" name="${key}" value="${i}"> ${c.text}`;
    list.appendChild(l);
  });
  box.appendChild(list);
  const res = document.createElement("div");
  box.appendChild(res);
  const reveal = (idx) => {
    LT.$$("label.choice", list).forEach((l, i) => {
      l.classList.toggle("correct", choices[i].correct);
      l.classList.toggle("wrong", i === idx && !choices[i].correct);
      l.querySelector("input").disabled = true;
      if (i === idx) l.querySelector("input").checked = true;
    });
    res.innerHTML = `<p class="mt"><span class="badge ${choices[idx].correct ? "ok" : "ng"}">${choices[idx].correct ? "正解" : "ちがう"}</span> ${explain}</p>`;
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

/* 記述課題（層によって問いを変える）。保存のみ、採点はしない */
LT.writingTask = function (container, key, prompts) {
  const p = prompts[LT.layer()] || prompts.practice;
  const saved = LT.state.answers[key];
  const box = document.createElement("div");
  box.className = "card";
  box.innerHTML = `<h3>${p.title}</h3><p>${p.text}</p><textarea placeholder="ここに書く">${saved ? LT.esc(saved.value) : ""}</textarea><div class="row mt"><button class="btn primary">保存する</button><span class="small">保存した内容は「学習記録」から書き出せます。</span></div>`;
  box.querySelector("button").onclick = () => {
    const v = box.querySelector("textarea").value.trim();
    if (!v) { LT.toast("まだ何も書かれていません"); return; }
    LT.setAnswer(key, v); LT.toast("保存しました");
  };
  container.appendChild(box);
};

/* ---------- ホーム ---------- */
LT.routes.home = function (app) {
  const sum = LT.summary();
  const doneCount = sum.filter(s => s.completed).length;
  app.innerHTML = `
  <div class="card">
    <h1>なぜ個人情報は漏れるのか。<br>そして、なぜその対策が効くのか。</h1>
    <p>LeakTrace は、あなたが<span class="badge attack">攻撃者</span>と<span class="badge defend">防御者</span>の両方になって、個人情報が漏えいする仕組みを体験し、対策が効く理由を自分の目で確かめる教材です。各ステージは「①見る → ②破る → ③なぜ守れるか」の順に進みます。</p>
    <div class="row">
      <span class="small">現在の学習層：<b>${LT.LAYERS[LT.state.layer].name}（${LT.LAYERS[LT.state.layer].who}）</b></span>
      <a class="btn sm" href="#/layer">学習層を変える</a>
      <span class="small">参加者ID：<code>${LT.state.learnerId}</code></span>
    </div>
  </div>
  <div class="card">
    <div class="spread"><h2 class="mb0">ステージ</h2><span class="small">${doneCount} / ${sum.length} 完了</span></div>
    <div class="stage-list mt" id="stageList"></div>
  </div>
  <div class="grid2">
    <a class="card stage-tile" href="#/map"><h3>攻撃経路マップ</h3><p class="small mb0">あなたが通った攻撃経路が1枚の図に描き足されていきます。</p></a>
    <a class="card stage-tile" href="#/records"><h3>学習記録</h3><p class="small mb0">進捗・回答・得点を CSV / JSON / Markdown で書き出せます。</p></a>
  </div>`;
  const list = app.querySelector("#stageList");
  LT.STAGES.forEach(s => {
    const ss = sum.find(x => x.id === s.id);
    const a = document.createElement("a");
    a.className = "stage-tile" + (ss.completed ? " done" : "");
    a.href = s.route;
    const prog = s.id === "final" ? (ss.completed ? "完了" : "未着手") : `見る ${ss.see ? "✓" : "–"} ／ 破る ${ss.break ? "✓" : "–"} ／ 守る ${ss.defend ? "✓" : "–"}`;
    a.innerHTML = `<div class="row"><span class="stage-no">${s.no}</span><h3 style="margin:0">${s.title}</h3></div><p class="small" style="margin:8px 0">${s.desc}</p><div class="prog">${prog}</div>`;
    list.appendChild(a);
  });
};

/* ---------- 倫理と法律の説明 ---------- */
LT.routes.ethics = function (app) {
  app.innerHTML = `
  <div class="card">
    <h1>はじめに：守るために学ぶ</h1>
    <p>この教材には、攻撃者の立場で「個人情報を盗み出す」体験が含まれます。始める前に、次のことを確認してください。</p>
    <h3>1. ここで扱うものはすべて架空です</h3>
    <p>登場する企業・サービス・人物・パスワード・メールはすべて架空のものです。本物のパスワードや、あなたや他人の個人情報を入力しないでください。</p>
    <h3>2. 教材の外で試すと犯罪になります</h3>
    <p>他人のIDやパスワードでログインすること、他人のシステムに無断で侵入することは、${LT.T("不正アクセス禁止法")}で禁じられています（3年以下の懲役または100万円以下の罰金）。偽メールで情報を盗む行為は詐欺罪などにもあたります。この教材の操作は、模擬環境の中だけで成り立つように簡略化されており、現実のシステムに使える手順は含まれていません。</p>
    <h3>3. 学んだことは守るために使います</h3>
    <p>攻撃の仕組みを知る目的は、「なぜその対策が効くのか」を自分の頭で理解し、自分と周りの人を守るためです。</p>
    <h3>4. 入力した内容は外部に送信されません</h3>
    <p>この教材はブラウザの中だけで動きます。学習記録もこの端末の中にだけ保存されます（学習記録の画面から自分で書き出せます）。</p>
    <label class="choice"><input type="checkbox" id="agree"> 上の内容を理解し、学んだ知識を守るために使うことに同意します</label>
    <button class="btn primary block mt" id="go" disabled>学習層を選んで始める →</button>
  </div>`;
  const cb = app.querySelector("#agree"), go = app.querySelector("#go");
  cb.onchange = () => go.disabled = !cb.checked;
  go.onclick = () => { LT.state.ethicsAccepted = true; LT.save(); LT.log("", "", "ethics_accepted"); location.hash = "#/layer"; };
};

/* ---------- 学習層の選択 ---------- */
LT.routes.layer = function (app) {
  app.innerHTML = `<div class="card"><h1>学習の深さを選ぶ</h1><p>同じ教材の中で、説明の深さと操作の難しさを切り替えます。途中でいつでも変えられます（右上の「○層」をタップ）。</p><div class="grid3" id="layers"></div></div>`;
  const g = app.querySelector("#layers");
  Object.keys(LT.LAYERS).forEach(k => {
    const l = LT.LAYERS[k];
    const d = document.createElement("div");
    d.className = "stage-tile" + (LT.state.layer === k ? " done" : "");
    d.style.cursor = "pointer";
    d.innerHTML = `<h3>${l.name}層 <small>${l.who}</small></h3><p class="small">${l.desc}</p>${LT.state.layer === k ? '<span class="badge ok">選択中</span>' : ""}`;
    d.onclick = () => { LT.state.layer = k; LT.save(); LT.log("", "", "layer_select", k); location.hash = "#/home"; };
    g.appendChild(d);
  });
};

/* ---------- 学習記録 ---------- */
LT.routes.records = function (app) {
  const sum = LT.summary();
  const rows = sum.map(s => `<tr><td>${s.name}</td><td>${s.see ? "✓" : "–"}</td><td>${s.break ? "✓" : "–"}</td><td>${s.defend ? "✓" : "–"}</td><td>${s.completed ? "✓" : "–"}</td><td>${s.seconds}</td></tr>`).join("");
  const scores = Object.keys(LT.state.scores).map(k => { const v = LT.state.scores[k]; return `<tr><td>${k}</td><td>${v.correct}/${v.total}</td><td>${v.percent}%</td><td>${v.note || ""}</td></tr>`; }).join("") || `<tr><td colspan="4" class="muted">まだありません</td></tr>`;
  const answers = Object.keys(LT.state.answers).map(k => { const v = LT.state.answers[k]; return `<tr><td>${k}</td><td>${LT.esc(typeof v.value === "object" ? JSON.stringify(v.value) : v.value)}</td></tr>`; }).join("") || `<tr><td colspan="2" class="muted">まだありません</td></tr>`;
  app.innerHTML = `
  <div class="card">
    <div class="spread"><h1 class="mb0">学習記録</h1><span class="small">参加者ID <code>${LT.state.learnerId}</code></span></div>
    <p class="small">この端末のブラウザ内にだけ保存されています。卒業研究のデータとして使うときは、下のボタンで書き出してください。</p>
    <div class="row">
      <button class="btn primary" id="exCsv">イベント CSV</button>
      <button class="btn" id="exJson">全データ JSON</button>
      <button class="btn" id="exMd">まとめ Markdown</button>
      <button class="btn" id="exMeas">実測値 CSV</button>
    </div>
    <div class="row mt">
      <label class="field" style="margin:0;max-width:260px"><span>参加者IDを変更（実験用）</span><input type="text" id="pid" value="${LT.esc(LT.state.learnerId)}"></label>
      <button class="btn sm" id="setPid">変更</button>
      <button class="btn sm" id="reset" style="margin-left:auto;color:var(--ng)">記録をすべて消去</button>
    </div>
  </div>
  <div class="card"><h2>進捗</h2><div class="table-wrap"><table><tr><th>ステージ</th><th>見る</th><th>破る</th><th>守る</th><th>完了</th><th>秒</th></tr>${rows}</table></div></div>
  <div class="card"><h2>得点</h2><div class="table-wrap"><table><tr><th>課題</th><th>正答</th><th>率</th><th>備考</th></tr>${scores}</table></div></div>
  <div class="card"><h2>予想・記述の回答</h2><div class="table-wrap"><table><tr><th>キー</th><th>内容</th></tr>${answers}</table></div></div>
  <div class="card"><h2>イベント（最新20件 / 全${LT.state.events.length}件）</h2><div class="xray">${LT.state.events.slice(-20).reverse().map(e => `<span class="dim">${e.t.slice(11, 19)}</span> ${e.stage}/${e.step} <span class="hl">${e.type}</span> ${LT.esc(typeof e.detail === "object" ? JSON.stringify(e.detail) : e.detail)}`).join("\n") || "（なし）"}</div></div>
  <div class="card">
    <h2>研究モード <span class="badge ${LT.state.research ? "ok" : "gray"}">${LT.state.research ? "解錠中" : "施錠中"}</span></h2>
    <p class="small">授業では使わない測定機能（繰り返し試行・CSV書き出し）を使えるようにします。</p>
    <div class="row"><input type="password" id="rpw" placeholder="研究モードのパスワード" style="max-width:260px"><button class="btn" id="rgo">${LT.state.research ? "施錠する" : "解錠する"}</button></div>
  </div>`;
  app.querySelector("#exCsv").onclick = LT.exportEventsCSV;
  app.querySelector("#exJson").onclick = LT.exportJSON;
  app.querySelector("#exMd").onclick = LT.exportMarkdown;
  app.querySelector("#exMeas").onclick = LT.exportMeasurementsCSV;
  app.querySelector("#setPid").onclick = () => { const v = app.querySelector("#pid").value.trim(); if (v) { LT.state.learnerId = v; LT.save(); LT.toast("参加者IDを変更しました"); LT.render(); } };
  app.querySelector("#reset").onclick = () => { if (confirm("この端末の学習記録をすべて消去します。先に書き出しましたか？")) { LT.reset(); LT.toast("消去しました"); location.hash = "#/ethics"; } };
  app.querySelector("#rgo").onclick = async () => {
    if (LT.state.research) { LT.state.research = false; LT.save(); LT.render(); return; }
    const h = await LT.sha256hex(app.querySelector("#rpw").value);
    if (h === LT.RESEARCH_HASH) { LT.state.research = true; LT.save(); LT.log("", "", "research_unlock"); LT.toast("研究モードを解錠しました"); LT.render(); }
    else LT.toast("パスワードが違います");
  };
};

/* ---------- ステージのルーティング ---------- */
LT.STAGE_IMPL = LT.STAGE_IMPL || {}; // "1": {see, break, defend}

LT.routes.stage = function (app, parts) {
  const no = parts[0];
  const step = parts[1] || "see";
  const stage = LT.STAGES.find(s => String(s.no) === String(no));
  const impl = LT.STAGE_IMPL[no];
  if (!stage || !impl) { LT.routes.home(app); return; }
  LT.stageShell(app, stage, step, impl);
};

/* ---------- 起動 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  LT.load();
  LT.initGlossary();
  document.getElementById("layerPill").onclick = () => { location.hash = "#/layer"; };
  window.addEventListener("hashchange", LT.render);
  window.addEventListener("beforeunload", () => { if (LT.current.stage) LT.addSeconds(LT.current.stage, (Date.now() - LT.current.enteredAt) / 1000); });
  LT.render();
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
});
