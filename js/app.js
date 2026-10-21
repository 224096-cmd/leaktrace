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
  { id: "s0", tags: ["統計","個人情報とは","3つの要素"], no: 0, icon: "📊", color: "#455a64", title: "漏えいはなぜ起きる？", sub: "統計・個人情報とは・3つの要素", desc: "最近の漏えい事故の数字を読み、何が「個人情報」なのか、守るべき3つの要素は何かを確かめる。", route: "#/stage/0", min: 8,
    steps: [{ label: "数字で見る", hint: "最近の事故の統計" }, { label: "仕分ける", hint: "これは個人情報？" }, { label: "3つの要素", hint: "何が損なわれる？" }] },
  { id: "s1", tags: ["使い回し","多要素認証"], no: 1, icon: "🔑", color: "#c62828", title: "不正ログイン", sub: "パスワードの使い回し", desc: "1か所から漏れたパスワードで、別のサービスに次々と入られる。多要素認証で止まる様子を確かめる。", route: "#/stage/1", min: 12 },
  { id: "s2", tags: ["偽サイト","SMS","パスキー"], no: 2, icon: "🎣", color: "#e65100", title: "フィッシング", sub: "偽サイトと口座の乗っ取り", desc: "2025年の証券口座乗っ取りと同じ型。偽サイトは確認コードまで中継する。見分け方と、だまされても守れる認証を学ぶ。", route: "#/stage/2", min: 15 },
  { id: "s3", tags: ["委託先","バックアップ","多層防御"], no: 3, icon: "⛓️", color: "#6a1b9a", title: "ランサムウェア", sub: "委託先から全社停止まで", desc: "委託先のアカウント1つから、権限を奪われ、バックアップまで消されて事業が止まる。どこで断ち切れるかを確かめる。", route: "#/stage/3", min: 12 },
  { id: "s4", tags: ["誤添付","BCC","共有設定"], no: 4, icon: "✉️", color: "#00695c", title: "人為ミス", sub: "誤添付と誤送信", desc: "攻撃者がいなくても起きる漏えい。名簿の誤添付やCCの誤用を体験し、確認の手順でミスが減るかを自分で測る。", route: "#/stage/4", min: 12 },
  { id: "final", tags: ["通知への対応","ふり返り"], no: "★", icon: "🧭", color: "#2b5fd9", title: "漏えいの後に", sub: "通知が届いたら・自分の行動", desc: "漏えいの通知が届いたときの正しい行動と、普段の自分の行動をふり返る。", route: "#/final", min: 8 }
];
LT.stageLabel = (stage) => stage.no === 0 ? "導入" : stage.no === "★" ? "まとめ" : `Stage ${stage.no}`;
LT.tagsHTML = (tags) => `<div class="tags">${(tags || []).map(t => `<span class="tag">${t}</span>`).join("")}</div>`;

LT.layer = () => LT.state.layer;
/* 学習層は廃止し、全員が同じ内容を学ぶ（発展内容は「もっと深く」で開く） */
LT.isIntro = () => false;
LT.isInquiry = () => false;

/* 「もっと深く」：大学生や、興味のある人向けの発展内容（開くと読める） */
LT.deeper = function (title, html) {
  return `<details class="deeper"><summary>もっと深く：${title}</summary><div class="deeper-body">${html}</div></details>`;
};

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

  const navKey = parts[0] === "stage" ? "s" + parts[1] : parts[0];
  LT.$$("[data-nav]").forEach(a => a.classList.toggle("active", a.dataset.nav === navKey));
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
  head.innerHTML = `<div class="kicker">${LT.stageLabel(stage)}</div>
    <h1>${stage.title}<span class="h-sub"> — ${stage.sub}</span></h1>${LT.tagsHTML(stage.tags)}`;
  const DEF = LT.STEP_DEF.map((d, k) => Object.assign({}, d, stage.steps ? stage.steps[k] : {}));
  app.appendChild(head);

  // 3段階のタブ
  const steps = document.createElement("nav");
  steps.className = "tabs";
  steps.innerHTML = DEF.map((d, k) => `<a href="${stage.route}/${d.key}" class="tab${k === i ? " active" : ""}${st.steps[d.key] ? " done" : ""}">
      <span class="tab-n">${"①②③"[k]}</span><span class="tab-l">${d.label}</span><span class="tab-h">${d.hint}</span>${st.steps[d.key] ? '<span class="tab-ok">✓</span>' : ""}</a>`).join("");
  app.appendChild(steps);

  const body = document.createElement("div");
  body.className = "stage-body";
  app.appendChild(body);
  LT.log(stage.id, stepKey, "view");
  if (stepKey === "see" && LT.CASES[stage.id]) {
    body.insertAdjacentHTML("beforeend", LT.caseCard(stage.id));
    const det = body.querySelector("details.case");
    det.addEventListener("toggle", () => { LT.state.ui.caseOpen = LT.state.ui.caseOpen || {}; LT.state.ui.caseOpen[stage.id] = det.open; LT.save(); });
  }
  const inner = document.createElement("div");
  body.appendChild(inner);
  renderers[stepKey](inner);

  // 画面下に固定するナビ（タブレットで親指が届く位置）
  const nextIdx = LT.STAGES.findIndex(s => s.id === stage.id) + 1;
  const prevHref = i > 0 ? `${stage.route}/${order[i - 1]}` : "#/home";
  const prevLabel = i > 0 ? DEF[i - 1].label : "ホーム";
  let nextHref, nextLabel;
  if (i < 2) { nextHref = `${stage.route}/${order[i + 1]}`; nextLabel = `次：${DEF[i + 1].label}`; }
  else if (nextIdx < LT.STAGES.length) { nextHref = LT.STAGES[nextIdx].route; nextLabel = `次のステージ：${LT.STAGES[nextIdx].title}`; }
  else { nextHref = "#/map"; nextLabel = "攻撃経路マップへ"; }

  const bar = document.getElementById("bottombar");
  bar.hidden = false;
  document.body.classList.add("has-bottombar");
  bar.innerHTML = `
    <div class="bb-inner">
      <a class="btn ghost" href="${prevHref}">‹ ${prevLabel}</a>
      <div class="bb-pos">${LT.stageLabel(stage)}　${"①②③"[i]} ${DEF[i].label}</div>
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
  LT.toast(`${LT.stageLabel(stage)}「${stage.title}」を終えました`);
};

/* 「予想してから答え合わせ」部品 */
LT.prediction = function (container, key, question, choices, explain, onDone) {
  const saved = LT.state.answers[key];
  const box = document.createElement("div");
  box.className = "card predict";
  box.innerHTML = `<div class="card-label">予想してみよう</div><p class="q">${question}</p>`;
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
  const p = prompts.practice || prompts.intro;
  const hint = prompts.intro && prompts.intro.text !== p.text ? prompts.intro.text : "";
  const deep = prompts.inquiry && prompts.inquiry.text !== p.text ? prompts.inquiry.text : "";
  const saved = LT.state.answers[key];
  const box = document.createElement("div");
  box.className = "card write";
  box.innerHTML = `<div class="card-label">${p.title}</div><p class="q">${p.text}</p>
    ${hint ? `<p class="small">書き出しのヒント：${hint}</p>` : ""}
    <textarea placeholder="ここに書く">${saved ? LT.esc(saved.value) : ""}</textarea>
    ${deep ? `<details class="deeper mt"><summary>もっと深く考えたい人へ</summary><div class="deeper-body">${deep}</div></details>` : ""}
    <div class="spread mt"><span class="small count">0 文字</span><button class="btn primary sm">保存する</button></div>`;
  const ta = box.querySelector("textarea"), count = box.querySelector(".count");
  count.textContent = ta.value.length + " 文字" + (saved ? "（保存済み）" : "");
  ta.oninput = () => { count.textContent = ta.value.length + " 文字"; };
  box.querySelector("button.primary").onclick = () => {
    const v = ta.value.trim();
    if (!v) { LT.toast("まだ何も書かれていません"); return; }
    LT.setAnswer(key, v); LT.toast("保存しました"); count.textContent = v.length + " 文字（保存済み）";
  };
  container.appendChild(box);
};

/* ---------- ホーム ---------- */
/* 学習の流れ（順番に並べ、次にやることを示す） */
LT.flow = function () {
  const sum = LT.summary();
  const st = (id) => sum.find(x => x.id === id) || {};
  const items = [];
  LT.STAGES.forEach(s => {
    const x = st(s.id);
    const n = s.id === "final" ? (x.completed ? 1 : 0) : (x.see ? 1 : 0) + (x.break ? 1 : 0) + (x.defend ? 1 : 0);
    items.push({ key: s.id, icon: s.icon, title: s.title, href: s.route, done: !!x.completed, part: n, total: s.id === "final" ? 1 : 3, stage: s });
  });
  const next = items.find(it => !it.done);
  return { items, next };
};

LT.routes.home = function (app) {
  const prog = LT.progress();
  const { items, next } = LT.flow();
  const resume = LT.state.lastRoute;
  const nextStage = next && next.stage;
  const resumeOk = resume && nextStage && resume.indexOf(nextStage.route) === 0;
  const cta = !next ? { href: "#/map", label: "攻撃経路マップでふり返る" } :
    resumeOk ? { href: resume, label: `続きから（${LT.stageLabel(nextStage)}　${nextStage.title}）` } : { href: next.href, label: prog.done ? `${LT.stageLabel(nextStage)}　${nextStage.title} へ進む` : "はじめる" };

  app.innerHTML = `
  <section class="hero">
    <div class="kicker">個人情報漏えいを、攻撃と防御の体験から学ぶ</div>
    <h1>なぜ個人情報は漏れるのか。<br>なぜその対策が効くのか。</h1>
    <p class="lead">最近の実際の漏えい事件と同じ「型」の出来事を、架空の会社で再現します。攻撃者と防御者の両方の立場で、各ステージを「①見る → ②破る → ③なぜ守れるか」の順に進みます。</p>
    <div class="row"><a class="btn primary lg" href="${cta.href}">${cta.label}</a><span class="small">進み具合 ${prog.done} / ${prog.total}</span></div>
  </section>

  <div class="stats">
    <div class="stat-card"><div class="stat-v">180<small>件</small></div><div class="stat-k">2025年に上場企業が公表した<br>個人情報の漏えい・紛失事故</div></div>
    <div class="stat-card"><div class="stat-v">3,063<small>万人分</small></div><div class="stat-k">漏えい・紛失した人数<br>（前年の約1.9倍）</div></div>
    <div class="stat-card"><div class="stat-v">約3<small>割</small></div><div class="stat-k">攻撃者がいなくても起きた<br>誤送信・紛失などの事故</div></div>
  </div>
  <p class="small center">出典：東京商工リサーチ調べ（導入ステージの「実際の事件」に詳細）</p>

  <h2 class="sec">ステージ</h2>
  <div class="stage-grid" id="stageGrid"></div>

  <h2 class="sec">そのほか</h2>
  <div class="link-list">
    <a href="#/map"><b>攻撃経路マップ</b><span>通った経路が1枚の図に描き足されていきます（${LT.state.map.edges.length} / ${LT.MAP.edges.length}）</span></a>
    <a href="#/glossary"><b>用語集</b><span>出てきた言葉の意味</span></a>
    <a href="#/guide"><b>授業での使い方</b><span>先生向け：対象・時間配分・注意点</span></a>
    <a href="#/records"><b>学習記録</b><span>進み具合や回答を CSV / JSON / Markdown で書き出す</span></a>
  </div>

  <details class="research-box"><summary>研究・授業評価で使う場合（はじめ／おわりのテスト・アンケート）</summary>
    <p class="small">学習の前後で理解の変化を測るときに使います。授業で使うだけなら受けなくてもかまいません。</p>
    <div class="link-list">
      <a href="#/test/pre"><b>はじめのテスト</b><span>${LT.state.tests.pre ? "受験済み" : "学習の前に受ける"}</span></a>
      <a href="#/test/post"><b>おわりのテスト</b><span>${LT.state.tests.post ? "受験済み" : "学習の後に受ける"}</span></a>
      <a href="#/survey"><b>使いやすさアンケート</b><span>${LT.state.scores["survey.sus"] ? "回答済み" : "最後に答える"}</span></a>
    </div></details>`;

  const grid = app.querySelector("#stageGrid");
  items.forEach(it => {
    const s = it.stage, isNext = next && next.key === it.key;
    const a = document.createElement("a");
    a.className = "stage-card" + (it.done ? " done" : "") + (isNext ? " next" : "");
    a.href = it.href;
    const prog = s.id === "final" ? (it.done ? "完了" : "") : ["見る", "破る", "守る"].map((l, k) => `<span class="${k < it.part ? "on" : ""}">${l}</span>`).join("");
    a.innerHTML = `<div class="sc-top"><span class="sc-no">${s.no === 0 ? "0" : s.no === "★" ? "★" : s.no}</span>${isNext ? '<span class="sc-next">次はここ</span>' : it.done ? '<span class="sc-done">完了</span>' : ""}</div>
      <h3>${s.title}</h3><p>${s.desc}</p>${LT.tagsHTML(s.tags)}<div class="sc-prog">${prog}<span class="sc-min">約${s.min}分</span></div>`;
    grid.appendChild(a);
  });
};

/* ---------- 用語集 ---------- */
LT.routes.glossary = function (app) {
  const keys = Object.keys(LT.GLOSSARY).sort((a, b) => a.localeCompare(b, "ja"));
  app.innerHTML = `<h1>用語集</h1><p class="muted">教材に出てくる言葉の意味です。本文中の <span class="term" data-term="用語集">点線の言葉</span> をタップしても表示されます。</p>
    <input type="text" id="q" placeholder="言葉をさがす（例：パスキー）" class="mb0">
    <div class="card mt"><dl class="gloss" id="gl"></dl></div>`;
  const gl = app.querySelector("#gl");
  const draw = (q) => {
    gl.innerHTML = keys.filter(k => !q || k.includes(q) || LT.GLOSSARY[k].includes(q)).map(k => `<dt>${k}</dt><dd>${LT.GLOSSARY[k]}</dd>`).join("") || '<p class="muted">見つかりませんでした</p>';
  };
  app.querySelector("#q").oninput = (e) => draw(e.target.value.trim());
  draw("");
};

/* ---------- 授業での使い方（先生向け） ---------- */
LT.routes.guide = function (app) {
  app.innerHTML = `<h1>授業での使い方</h1>
  <div class="card"><h2>対象と関連する学習内容</h2>
    <p>中学生から大学生まで、同じ画面で学べるように作っています。基本の説明は中学生にも分かる言葉で書き、専門的な内容は「🔎 もっと深く」を開くと読めるようにしています。</p>
    <div class="table-wrap"><table><tr><th>対象</th><th>関連する学習内容</th><th>使い方の例</th></tr>
      <tr><td>中学生</td><td>技術・家庭（技術分野）「D 情報の技術」：情報セキュリティ、情報モラル</td><td>各ステージの体験と「見る」を中心に</td></tr>
      <tr><td>高校生</td><td>情報Ⅰ「(1) 情報社会の問題解決」：個人情報の保護、情報セキュリティ、関係する法規</td><td>体験に加えて、記述課題で根拠を説明させる</td></tr>
      <tr><td>大学生</td><td>情報倫理、情報セキュリティ概論（教養科目など）</td><td>「もっと深く」と、ステージ3の対策設計を議論に使う</td></tr></table></div></div>
  <div class="card"><h2>時間配分の例（50分×2回）</h2>
    <div class="table-wrap"><table><tr><th>回</th><th>内容</th><th>目安</th></tr>
      <tr><td rowspan="4">1回目</td><td>導入「漏えいはなぜ起きる？」</td><td>10分</td></tr>
      <tr><td>（研究で使う場合は、最初に「はじめのテスト」10分）</td><td>—</td></tr>
      <tr><td>ステージ1 不正ログイン</td><td>12分</td></tr>
      <tr><td>ステージ2 フィッシング</td><td>15分（ステージ1は「見る」「破る」まででも可）</td></tr>
      <tr><td rowspan="4">2回目</td><td>ステージ3 ランサムウェア</td><td>12分</td></tr>
      <tr><td>ステージ4 人為ミス</td><td>12分</td></tr>
      <tr><td>まとめ「漏えいの後に」</td><td>8分</td></tr>
      <tr><td>攻撃経路マップでふり返り（研究で使う場合は、おわりのテスト・アンケート）</td><td>10〜15分</td></tr></table></div>
    <p class="small mt">1回（50分）で行う場合は、導入とステージ2・4を中心にし、ほかは「見る」だけにする方法があります。</p></div>
  <div class="card"><h2>準備と注意</h2><ul>
    <li>端末：タブレットまたはPCのブラウザ。一度開けば、授業中にネットが切れても動きます。</li>
    <li>はじめに「はじめに：守るために学ぶ」の画面で、不正アクセス禁止法と、教材の外で試さないことを確認させてください。</li>
    <li>記録は各端末に保存されます。授業の最後に「学習記録」から書き出して回収してください（端末を共有する場合は書き出し後に消去）。</li>
    <li>実験で使う場合は、「学習記録」→「実験の設定」で参加者IDを設定してください。</li></ul></div>`;
};

/* ---------- 倫理と法律の説明 ---------- */
LT.routes.ethics = function (app) {
  app.innerHTML = `
  <div class="card narrow">
    <div class="center"><div class="kicker">はじめに</div><h1>守るために学ぶ</h1>
    <p class="muted">この教材には、攻撃者の立場で「個人情報を盗み出す」体験が含まれます。始める前に、4つの約束を確認してください。</p></div>
    <ol class="promise">
      <li><b>ここで扱うものはすべて架空です。</b><br>登場する企業・サービス・人物・パスワード・メールはすべて架空です。本物のパスワードや、自分や他人の個人情報は入力しないでください。</li>
      <li><b>教材の外で試すと犯罪になります。</b><br>他人のIDやパスワードで無断でログインすることは${LT.T("不正アクセス禁止法")}で禁じられています（3年以下の拘禁刑または100万円以下の罰金）。偽メールで情報をだまし取る行為は詐欺罪などにもあたります。この教材の操作は模擬環境の中だけで成り立つように簡略化してあり、現実のシステムに使える手順は含まれていません。</li>
      <li><b>学んだことは守るために使います。</b><br>攻撃の仕組みを知るのは、対策が効く理由を理解して、自分と周りの人を守るためです。</li>
      <li><b>入力した内容は外部に送信されません。</b><br>この教材はブラウザの中だけで動き、学習記録もこの端末にだけ保存されます。</li>
    </ol>
    <label class="choice agree"><input type="checkbox" id="agree"><span>上の内容を理解し、学んだ知識を守るために使うことに同意します</span></label>
    <button class="btn primary block lg mt" id="go" disabled>はじめる ›</button>
  </div>`;
  const cb = app.querySelector("#agree"), go = app.querySelector("#go");
  cb.onchange = () => go.disabled = !cb.checked;
  go.onclick = () => { LT.state.ethicsAccepted = true; LT.save(); LT.log("", "", "ethics_accepted"); location.hash = "#/home"; };
};

/* ---------- 学習層の選択（廃止。古いリンクはホームへ） ---------- */
LT.routes.layer = function () { location.hash = "#/home"; };

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
      <button class="btn" id="exMd">まとめ<br><small>Markdown</small></button>
      <button class="btn" id="exCsv">操作ログ<br><small>CSV</small></button>
      <button class="btn" id="exMeas">実測値<br><small>CSV</small></button>
      <button class="btn" id="exTest">テスト・アンケート<br><small>CSV</small></button>
      <button class="btn" id="exJson">全データ<br><small>JSON</small></button>
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
  const map = { "s0.sort": "S0 個人情報の仕分け", "s0.cia": "S0 3要素の判別", "s2.auth": "S2 認証方式の比較", "s4.attach": "S4 添付ファイルの選択", "final.notice": "最終 通知への対応", "s1.listattack": "S1 リスト型攻撃の成功数", "s2.phish_quiz": "S2 フィッシング判別", "s4.send": "S4 一斉送信（②）", "s4.trial.none": "S4 確認なしの試行", "s4.trial.check": "S4 確認ありの試行", "test.pre": "はじめのテスト", "test.post": "おわりのテスト", "survey.sus": "SUS（使いやすさ）" };
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
  document.getElementById("fontBtn").onclick = () => { LT.state.ui.fontLarge = !LT.state.ui.fontLarge; LT.save(); LT.applyFont(); };
  window.addEventListener("hashchange", LT.render);
  window.addEventListener("beforeunload", () => { if (LT.current.stage) LT.addSeconds(LT.current.stage, (Date.now() - LT.current.enteredAt) / 1000); });
  LT.render();
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
});
