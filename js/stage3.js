/* ステージ3 ランサムウェア：委託先から全社停止まで（アスクル・アサヒ・イセトーの事件の型）。
   攻撃の手口の解説ではなく、「防御側の監視画面」から、事故がどう広がり、どの対策で止まるかを見る教材。 */
window.LT = window.LT || {};
LT.routes = LT.routes || {};
LT.STAGE_IMPL = LT.STAGE_IMPL || {};

LT.S3 = {
  entries: {
    vendor: { icon: "🪪", title: "委託先のアカウントでログイン", desc: "システムの保守を任せている委託先のアカウントが悪用され、社外からの入口にログインされた。この1つだけ、多要素認証が「例外」で設定されていなかった。", cutBy: "mfa", cutMsg: "例外なく多要素認証を設定していれば、IDとパスワードだけでは入れない。", edges: ["vendor", "vpn"] },
    vpn: { icon: "🚪", title: "古い機器の弱点を悪用", desc: "社外から社内につなぐ機器（VPN機器）に、公表済みの弱点が残っていた。更新（パッチ）が後回しにされていた。", cutBy: "patch", cutMsg: "機器を更新していれば、この弱点はふさがっている。", edges: ["vpnhole"] }
  },
  chain: [
    { id: "lateral", icon: "🧭", title: "社内に広がる", desc: "入口の1台から、社内のほかのサーバーへ次々とつながりが広がる。監視ソフトも無効にされる。", cutBy: "segment", cutMsg: "ネットワークが分けられていれば、入った場所からほかのサーバーが見えず、広がらない。", edge: "lateral" },
    { id: "priv", icon: "🔑", title: "強い権限が奪われる", desc: "弱い設定のアカウントから、すべてのサーバーを操作できる管理者の権限が奪われる。", cutBy: "least", cutMsg: "最小権限で、強い権限を持つアカウントが限られていれば、奪われても影響が小さい。", edge: "priv" },
    { id: "steal", icon: "📤", title: "顧客データが社外へ出る", desc: "顧客データベースの数十万件分が、社外へ送り出される。", cutBy: "monitor", cutMsg: "ログを監視していれば、深夜の大量通信に気づいて止められる。", edge: "dbget", leak: true },
    { id: "encrypt", icon: "🔒", title: "暗号化され、使えなくなる", desc: "バックアップが消されたうえで、社内のデータが暗号化されて開けなくなる。そして「公開されたくなければ支払え」と脅される（二重恐喝）。", cutBy: "offline", cutMsg: "ネットワークから切り離したバックアップがあれば、消されずに残り、データを戻せる。", edge: "exfil", stop: true }
  ],
  defenses: {
    mfa: { label: "全アカウントに多要素認証（例外なし）", short: "多要素認証", icon: "📱" },
    patch: { label: "機器をすぐ更新する（パッチ）", short: "更新", icon: "🩹" },
    segment: { label: "ネットワークを分ける", short: "分離", icon: "🧱" },
    least: { label: "権限を必要最小限に", short: "最小権限", icon: "🗝️" },
    monitor: { label: "ログを監視する", short: "監視", icon: "👀" },
    offline: { label: "切り離したバックアップ", short: "バックアップ", icon: "💾" }
  },
  /* 監視画面の再現で使う社内ネットワーク図 */
  net: {
    nodes: {
      att:    { x: 60,  y: 150, label: "社外", kind: "ext" },
      vpn:    { x: 215, y: 150, label: "入口の機器", kind: "sys" },
      pc1:    { x: 370, y: 70,  label: "業務PC", kind: "pc" },
      pc2:    { x: 370, y: 150, label: "業務PC", kind: "pc" },
      edr:    { x: 370, y: 232, label: "監視ソフト", kind: "guard" },
      fs:     { x: 545, y: 70,  label: "ファイル\nサーバー", kind: "data" },
      db:     { x: 545, y: 150, label: "顧客DB\n74万件", kind: "data" },
      bk:     { x: 545, y: 232, label: "バック\nアップ", kind: "backup" }
    },
    links: [["att","vpn"],["vpn","pc1"],["vpn","pc2"],["pc1","fs"],["pc2","db"],["pc2","edr"],["fs","bk"],["db","bk"]],
    /* 段階ごとに「汚染された」ノードと監視ログの行 */
    steps: [
      { key: "entry",   t: "02:13", nodes: ["att","vpn"],    log: "社外から入口の機器へログイン成功（委託先のアカウント）", level: "warn" },
      { key: "lateral", t: "02:41", nodes: ["pc1","pc2"],    log: "入口から複数の業務PCへ接続が拡大", level: "warn", kill: "edr" },
      { key: "priv",    t: "03:20", nodes: [],               log: "管理者権限の使用を検知（通常はない時間帯）", level: "warn" },
      { key: "steal",   t: "03:55", nodes: ["db"],           log: "顧客DBから社外へ 約74万件・38GBの送信", level: "bad", flag: "db" },
      { key: "encrypt", t: "04:30", nodes: ["fs","db","bk"], log: "バックアップ削除後、全サーバーのファイルを暗号化", level: "bad", flag: "all" }
    ]
  }
};

/* ① 見る：監視画面から見た「事故の2時間」 */
LT.S3.see = function (el) {
  el.innerHTML = `<div class="card">
    <h2>1つのアカウントから、会社全体が止まるまで</h2>
    <p>${LT.T("ランサムウェア")}の被害は1回では終わりません。最近は、本体の会社ではなく${LT.T("委託先")}が入口になる例が増えています（${LT.T("サプライチェーン攻撃")}）。ここでは、架空の会社「ソラ商事」の<b>情報システム担当が見ていた監視画面</b>で、事故がどう広がったかを再現します。</p>
    <div class="replay" id="replay"></div>
  </div>`;
  LT.S3.replay(el.querySelector("#replay"));

  LT.prediction(el, "s3.see.pred", "この連鎖を止めるには、どうするのが効果的だと思う？",
    [{ text: "最後の「暗号化」だけを全力で防ぐ" }, { text: "連鎖のどこか1か所でも断ち切れれば、その先には進めない", correct: true }, { text: "完全に防ぐのは不可能なので、身代金を用意しておく" }],
    "対策は「連鎖のどこかを断ち切るもの」です。手前で止めるほど被害は小さくなります。ただし1か所だけに頼ると、そこが破られたときに全部進まれてしまうため、いくつかを重ねます（多層防御）。");
  el.insertAdjacentHTML("beforeend", LT.deeper("被害は、会社の外にまで広がる", `<p>実際の事件では、被害は情報の流出だけでは終わりませんでした。</p>
    <ul><li><b>取引先や利用者への影響</b>：アスクルでは物流センターの出荷が全面停止し、同社の物流を使うほかの会社の通販も注文を止めることになった</li>
    <li><b>お金の損失</b>：アスクルは特別損失として52億1,600万円を計上し、決算の発表も延期した</li>
    <li><b>復旧の手間</b>：汚染されたかもしれない環境を部分的に直すのではなく、安全を確かめた新しい環境をゼロから作り直した</li>
    <li><b>委託元への広がり</b>：イセトーの事件では、1つの委託先の被害が、仕事を頼んでいた複数の自治体や企業の情報漏えいにつながった</li></ul>
    <p class="mb0">また、アスクルは攻撃者と接触せず、身代金の支払いなどの交渉もしていないと発表しました。支払っても、データが戻る保証や、盗まれたデータが公開されない保証はないためです。</p>`));
};

/* 監視画面の再現：ネットワーク図＋監視ログの表＋被害メーターが連動して進む */
LT.S3.replay = function (box) {
  const N = LT.S3.net, steps = N.steps;
  let idx = -1, timer = null;
  box.innerHTML = `
    <div class="replay-head">
      <div class="replay-clock"><span class="rc-dot"></span><span id="rpClock">02:00</span><span class="small">ソラ商事 監視センター</span></div>
      <div class="replay-ctrl"><button class="btn primary sm" id="rpPlay">▶ 再生</button><button class="btn sm" id="rpStep">1ステップ進む</button><button class="btn ghost sm" id="rpReset">最初へ</button></div>
    </div>
    <div class="replay-grid">
      <div class="replay-net"><div class="rp-label">社内ネットワーク</div><svg viewBox="0 0 620 300" class="chart" id="rpNet" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif"></svg></div>
      <div class="replay-side">
        <div class="rp-label">監視ログ</div>
        <div class="replay-log" id="rpLog"><div class="rl-empty">再生すると、記録が1行ずつ流れます。</div></div>
        <div class="rp-label mt">被害の広がり</div>
        <div class="replay-meters" id="rpMeters"></div>
      </div>
    </div>
    <div id="rpResult"></div>`;

  const clock = box.querySelector("#rpClock"), logEl = box.querySelector("#rpLog");
  const hit = new Set();

  function drawNet() {
    let g = "";
    N.links.forEach(([a, b]) => {
      const p = N.nodes[a], q = N.nodes[b];
      const on = hit.has(a) && hit.has(b);
      g += `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="${on ? "#b83a32" : "#d7dce5"}" stroke-width="${on ? 3 : 1.5}" ${on ? "" : 'stroke-dasharray="3 4"'}/>`;
      if (on) g += `<circle r="4" fill="#b83a32"><animateMotion dur="1.1s" repeatCount="indefinite" path="M${p.x},${p.y} L${q.x},${q.y}"/></circle>`;
    });
    Object.keys(N.nodes).forEach(k => {
      const n = N.nodes[k], on = hit.has(k);
      const killed = k === "edr" && idx >= 1;
      const base = { ext: "#eef0f4", sys: "#fff", pc: "#fff", guard: "#edf6f0", data: "#f4f7fd", backup: "#fbf5e9" }[n.kind];
      const bstroke = { ext: "#a0a8b5", sys: "#9aa6b8", pc: "#9aa6b8", guard: "#2b7a47", data: "#2c5ec9", backup: "#8a5a00" }[n.kind];
      const fill = on ? "#fbe9e7" : base, stroke = on ? "#b83a32" : bstroke;
      const lines = n.label.split("\n");
      g += `<g class="${on ? "rp-node-hit" : ""}"><rect x="${n.x - 46}" y="${n.y - 24}" width="92" height="48" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="${on ? 2.5 : 1.5}"/>`;
      lines.forEach((t, i) => g += `<text x="${n.x}" y="${n.y + (i - (lines.length - 1) / 2) * 13 + 4}" font-size="11" font-weight="600" text-anchor="middle" fill="${killed ? "#b0b8c6" : "#1d2433"}" ${killed ? 'text-decoration="line-through"' : ""}>${t}</text>`);
      if (killed) g += `<text x="${n.x}" y="${n.y - 30}" font-size="9" text-anchor="middle" fill="#b83a32">停止させられた</text>`;
      g += `</g>`;
    });
    box.querySelector("#rpNet").innerHTML = g;
  }
  function drawMeters() {
    const leaked = idx >= 3, enc = idx >= 4;
    const pcs = Math.min(idx + 1, 2) >= 2 || idx >= 1 ? (idx >= 1 ? 2 : 0) : 0;
    const m = [
      { k: "侵入された範囲", v: idx < 0 ? "なし" : idx === 0 ? "入口のみ" : "社内全体", bad: idx >= 1, pct: idx < 0 ? 0 : idx === 0 ? 25 : 100 },
      { k: "社外に出た個人情報", v: leaked ? "約74万件" : "0件", bad: leaked, pct: leaked ? 100 : 0 },
      { k: "使えなくなったシステム", v: enc ? "全サーバー" : "なし", bad: enc, pct: enc ? 100 : 0 }
    ];
    box.querySelector("#rpMeters").innerHTML = m.map(x => `<div class="rp-meter"><div class="rpm-top"><span>${x.k}</span><b class="${x.bad ? "ng" : ""}">${x.v}</b></div><div class="rpm-bar"><div style="width:${x.pct}%;background:${x.bad ? "#b83a32" : "#2b7a47"}"></div></div></div>`).join("");
  }
  function render() {
    clock.textContent = idx < 0 ? "02:00" : steps[idx].t;
    drawNet(); drawMeters();
    if (idx < 0) { logEl.innerHTML = `<div class="rl-empty">再生すると、記録が1行ずつ流れます。</div>`; }
    box.querySelector("#rpResult").innerHTML = idx >= steps.length - 1 ? LT.S3.impactHTML({ leak: true, stop: true, recover: false }) + `<div class="feedback ng mb0 mt">入口の1アカウントから、約2時間で会社全体が止まりました。次の「②破る」「③なぜ守れるか」で、どこで断ち切れるかを自分で確かめます。</div>` : "";
  }
  function pushLog(s) {
    const q = logEl.querySelector(".rl-empty"); if (q) q.remove();
    const row = document.createElement("div");
    row.className = "rl-row rl-" + s.level;
    row.innerHTML = `<span class="rl-t">${s.t}</span><span class="rl-lv">${s.level === "bad" ? "重大" : "警告"}</span><span class="rl-msg">${s.log}</span>`;
    logEl.appendChild(row); logEl.scrollTop = logEl.scrollHeight;
  }
  function advance() {
    if (idx >= steps.length - 1) { stop(); return; }
    idx++;
    const s = steps[idx];
    s.nodes.forEach(n => hit.add(n));
    if (idx === 0) hit.add("att").add("vpn");
    pushLog(s);
    render();
    LT.log("s3", "see", "replay_step", s.key);
    if (idx === steps.length - 1) { LT.addMapEdge("exfil"); ["vendor","vpn","lateral","priv","dbget"].forEach(LT.addMapEdge); stop(); }
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } box.querySelector("#rpPlay").textContent = "▶ 再生"; }
  box.querySelector("#rpPlay").onclick = () => {
    if (timer) { stop(); return; }
    if (idx >= steps.length - 1) { idx = -1; hit.clear(); render(); }
    box.querySelector("#rpPlay").textContent = "■ 一時停止";
    advance();
    timer = setInterval(advance, LT.mapReduceMotion() ? 700 : 1800);
  };
  box.querySelector("#rpStep").onclick = () => { stop(); advance(); };
  box.querySelector("#rpReset").onclick = () => { stop(); idx = -1; hit.clear(); render(); };
  window.addEventListener("hashchange", stop, { once: true });
  render();
};

/* 被害の表示 */
LT.S3.impactHTML = function (r) {
  return `<div class="impact fade-in">
    <div class="impact-item ${r.leak ? "bad" : "good"}"><span>👥</span><div><b>個人情報</b><br>${r.leak ? "約74万件が流出" : "流出なし"}</div></div>
    <div class="impact-item ${r.stop ? (r.recover ? "warn" : "bad") : "good"}"><span>🚚</span><div><b>商品の出荷</b><br>${r.stop ? (r.recover ? "数日止まるが、バックアップから復旧" : "長期間の全面停止") : "通常どおり"}</div></div>
    <div class="impact-item ${r.stop || r.leak ? "bad" : "good"}"><span>💴</span><div><b>会社の損失</b><br>${r.stop && !r.recover ? "数十億円規模" : r.leak || r.stop ? "調査・おわび・復旧の費用" : "小さい"}</div></div>
  </div>
  ${r.leak || r.stop ? `<p class="small mt mb0">損なわれたもの：${r.leak ? `${LT.T("機密性")}（情報が漏れた）` : ""}${r.leak && r.stop ? "と" : ""}${r.stop ? `${LT.T("可用性")}（システムが使えない）` : ""}</p>` : ""}`;
};

/* ② 破る：防御側の視点で、対策なしだとどこまで進むかを1段ずつ確認 */
LT.S3.break = function (el) {
  el.innerHTML = `<div class="card attack">
    <h2><span class="badge attack">攻撃者の視点</span> 対策が何もないと、どこまで進むか</h2>
    <p>入口を選んで、「次へ」で1段ずつ進めてみましょう。今のソラ商事には、どの対策も入っていません。右側の監視ログが、その都度どう変わるかを見てください。</p>
    <div class="grid2" id="entry">${Object.keys(LT.S3.entries).map(k => { const e = LT.S3.entries[k]; return `<button class="choice-card" data-e="${k}"><span class="chain-icon">${e.icon}</span><b>${e.title}</b><span class="small">${e.desc}</span></button>`; }).join("")}</div>
    <div class="replay-grid mt" id="brk" hidden>
      <div id="steps"></div>
      <div class="replay-side"><div class="rp-label">監視ログ</div><div class="replay-log" id="xray"><div class="rl-empty">入口を選ぶと記録が始まります。</div></div></div>
    </div>
    <div id="done"></div>
  </div>`;
  const stepsEl = el.querySelector("#steps"), xray = el.querySelector("#xray");
  let entry = null, reached = 0;
  const logs = [];
  const pushLog = (t, msg, level) => {
    logs.push({ t, msg, level });
    const q = xray.querySelector(".rl-empty"); if (q) q.remove();
    const row = document.createElement("div");
    row.className = "rl-row rl-" + level;
    row.innerHTML = `<span class="rl-t">${t}</span><span class="rl-lv">${level === "bad" ? "重大" : "警告"}</span><span class="rl-msg">${msg}</span>`;
    xray.appendChild(row); xray.scrollTop = xray.scrollHeight;
  };
  el.querySelectorAll("[data-e]").forEach(b => b.onclick = () => {
    entry = b.dataset.e;
    el.querySelectorAll("[data-e]").forEach(x => { x.disabled = true; x.classList.toggle("picked", x === b); });
    el.querySelector("#brk").hidden = false;
    LT.S3.entries[entry].edges.forEach(LT.addMapEdge);
    pushLog("02:13", `入口：${LT.S3.entries[entry].title}`, "warn");
    LT.log("s3", "break", "entry", entry);
    render();
  });
  const times = ["02:41", "03:20", "03:55", "04:30"];
  const levels = ["warn", "warn", "bad", "bad"];
  const render = () => {
    stepsEl.innerHTML = `<div class="rp-label">攻撃の進み方</div>` + LT.S3.chain.map((c, i) => `<div class="chain-step ${i < reached ? "hit" : ""}">
      <span class="chain-icon">${c.icon}</span><div class="grow"><b>${c.title}</b><div class="small">${c.desc}</div></div>
      ${i < reached ? '<span class="badge attack">発生</span>' : i === reached ? `<button class="btn sm attack" id="go">次へ ›</button>` : '<span class="badge gray">未発生</span>'}</div>`).join('<div class="chain-arrow">↓</div>');
    const go = stepsEl.querySelector("#go");
    if (go) go.onclick = () => {
      const c = LT.S3.chain[reached];
      reached++;
      LT.addMapEdge(c.edge);
      if (c.id === "priv") LT.addMapEdge("dbget");
      pushLog(times[reached - 1], c.title + (c.id === "lateral" ? "（監視ソフトも停止させられ、以降は記録が残りにくい）" : ""), levels[reached - 1]);
      LT.log("s3", "break", "advance", reached);
      render();
      if (reached === LT.S3.chain.length) done();
    };
  };
  const done = () => {
    el.querySelector("#done").innerHTML = `<div class="ransom fade-in"><div class="ransom-hd">⚠ あなたのファイルは暗号化されました（教材の再現画面）</div>
      <p>ソラ商事の社員のパソコンに、このような画面が表示されます。顧客データは流出し、社内のデータは暗号化され、バックアップは消されています。</p></div>
      ${LT.S3.impactHTML({ leak: true, stop: true, recover: false })}
      <div class="feedback ok mt mb0">どの入口から入られても、対策がなければ同じ結末にたどり着きます。次の「③なぜ守れるか」で、どこで断ち切れるかを確かめます。</div>`;
    LT.setAnswer("s3.break.entry", entry);
  };
};

/* ③ なぜ守れるか：対策を置いて、連鎖と被害を比べる */
LT.S3.defend = function (el) {
  const budget = 3;
  const active = {};
  Object.keys(LT.S3.defenses).forEach(k => active[k] = false);
  let entry = "vendor";
  el.innerHTML = `<div class="card defend">
    <h2><span class="badge defend">防御者</span> どこで断ち切るか</h2>
    <p><b>予算が限られています。対策は${budget}つまで</b>選べます。対策を選ぶと、攻撃がどこで止まり、被害がどう変わるかが表示されます。</p>
    <div class="row"><span class="small"><b>攻撃者の入口：</b></span>${Object.keys(LT.S3.entries).map(k => `<label class="toggle ${k === entry ? "on" : ""}" data-entry="${k}"><input type="radio" name="ent" ${k === entry ? "checked" : ""}> ${LT.S3.entries[k].title}</label>`).join("")}</div>
    <div class="def-grid mt" id="defs"></div>
    <div class="small" id="budget"></div>
    <div class="grid2 mt"><div id="chain"></div><div><h3>被害</h3><div id="impact"></div><div id="verdict"></div></div></div>
  </div>
  <div class="card"><h3>委託先も「自分の会社の一部」として守る</h3>
    <p>実際の事件では、委託先のアカウントだけ多要素認証が「例外」になっていたり、仕事が終わった後に消したはずのデータが委託先に残っていたりしました。個人情報の取り扱いを任せた会社には、委託先を監督する責任があります。</p>
    <ul class="mb0"><li>委託先のアカウントにも例外なく同じ対策をする</li><li>委託先に渡すデータと権限は、必要な分・必要な期間だけにする</li><li>仕事が終わったら、データが本当に消されたかを確かめる</li></ul></div>`;
  const defsEl = el.querySelector("#defs");
  const draw = () => {
    const n = Object.values(active).filter(Boolean).length;
    defsEl.innerHTML = Object.keys(LT.S3.defenses).map(k => { const d = LT.S3.defenses[k]; return `<button class="def ${active[k] ? "on" : ""}" data-d="${k}" ${!active[k] && n >= budget ? "disabled" : ""}><span>${d.icon}</span>${d.label}</button>`; }).join("");
    el.querySelector("#budget").textContent = `選んだ対策：${n} / ${budget}`;
    defsEl.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { active[b.dataset.d] = !active[b.dataset.d]; LT.log("s3", "defend", "toggle", { def: b.dataset.d, on: active[b.dataset.d] }); draw(); });
    const steps = [LT.S3.entries[entry]].concat(LT.S3.chain);
    let stopAt = -1;
    steps.forEach((c, i) => { if (stopAt < 0 && active[c.cutBy] && !c.stop) stopAt = i; });
    const reachedEncrypt = stopAt < 0;
    const leak = stopAt < 0 || stopAt > 3;
    const recover = reachedEncrypt && active.offline;
    el.querySelector("#chain").innerHTML = `<h3>攻撃の進み方</h3>` + steps.map((c, i) => {
      let cls = "", badge;
      const isOfflineSave = c.stop && reachedEncrypt && active.offline;
      if (stopAt === i) { cls = "cut"; badge = '<span class="badge defend">ここで遮断</span>'; }
      else if (stopAt >= 0 && i > stopAt) { cls = "safe"; badge = '<span class="badge ok">守られる</span>'; }
      else if (isOfflineSave) { cls = "hit"; badge = '<span class="badge warn">暗号化されるが復旧できる</span>'; }
      else { cls = "hit"; badge = '<span class="badge attack">突破される</span>'; }
      return `<div class="chain-step ${cls}"><span class="chain-icon">${c.icon}</span><div class="grow"><b>${c.title}</b>${stopAt === i || isOfflineSave ? `<div class="small" style="color:var(--defend)">${c.cutMsg}</div>` : ""}</div>${badge}</div>`;
    }).join('<div class="chain-arrow">↓</div>');
    el.querySelector("#impact").innerHTML = LT.S3.impactHTML({ leak, stop: reachedEncrypt, recover });
    el.querySelector("#verdict").innerHTML = stopAt === 0 ? `<div class="feedback ok mt mb0">入口で止まりました。最も被害が小さい形です。</div>` :
      stopAt > 0 ? `<div class="feedback ok mt mb0">${stopAt + 1}段階目で止まりました。${leak ? "" : "個人情報は守られています。"}</div>` :
      recover ? `<div class="feedback ng mt mb0">最後まで進まれましたが、バックアップのおかげで事業は戻せます。ただし盗まれた情報は戻りません。</div>` :
      `<div class="feedback ng mt mb0">最後まで進まれ、事業も止まりました。対策を選んでみましょう。</div>`;
    LT.measure("s3", "defense_result", { entry, defenses: Object.keys(active).filter(k => active[k]) }, { stopAt, leak, stop: reachedEncrypt, recover });
    ["mfa", "patch", "segment", "least", "monitor"].forEach(k => LT.setMapDefense(k, !!active[k]));
  };
  el.querySelectorAll("[data-entry]").forEach(l => l.querySelector("input").onchange = () => {
    entry = l.dataset.entry;
    el.querySelectorAll("[data-entry]").forEach(x => x.classList.toggle("on", x === l));
    draw();
  });
  draw();

  LT.writingTask(el, "s3.defend.explain", {
    intro: { title: "ふり返り", text: "「対策は連鎖のどこかを断ち切るもの」という言葉を、自分のことばで言いかえてみよう。" },
    practice: { title: "説明課題", text: "対策を3つ選ぶとしたら、あなたはどれを選びますか。どちらの入口から来られても困らないように、理由を説明してください。" },
    inquiry: { title: "設計課題", text: "予算3つで対策を選び、その組み合わせの根拠を「入口で止める」「途中で止める」「被害を小さくする」の3つの観点から説明してください。委託先の管理にも触れること。" }
  });
};

LT.STAGE_IMPL["3"] = { see: LT.S3.see, break: LT.S3.break, defend: LT.S3.defend };
