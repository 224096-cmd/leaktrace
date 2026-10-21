/* ステージ3 侵入の連鎖（旧3〜5を統合） */
window.LT = window.LT || {};
LT.routes = LT.routes || {};
LT.STAGE_IMPL = LT.STAGE_IMPL || {};

LT.S3 = {
  // 連鎖のステップ。cutBy: この対策があると、ここで止まる
  chain: [
    { id: "vpn",     icon: "🚪", title: "古い機器から侵入", desc: "更新されていないVPN機器の穴から社内に入り込む。", cutBy: "patch", cutMsg: "機器が最新なら、この穴はふさがっている。" },
    { id: "lateral", icon: "🧭", title: "社内を探索", desc: "入った1台から、他のPCやサーバーを探して回る。", cutBy: "segment", cutMsg: "ネットワークが分離されていれば、見える範囲が狭く先へ進めない。" },
    { id: "priv",    icon: "🔑", title: "管理者権限を奪う", desc: "弱いアカウントを足がかりに、強い権限を手に入れる。", cutBy: "least", cutMsg: "最小権限なら、奪っても大したことはできない。" },
    { id: "db",      icon: "🗄️", title: "顧客データへ到達", desc: "12万人分の顧客データベースにアクセスする。", cutBy: "least", cutMsg: "権限が絞られていれば、全件は取り出せない。" },
    { id: "exfil",   icon: "📤", title: "持ち出し・暗号化・脅迫", desc: "データを外へ持ち出し、社内のデータを暗号化して身代金を要求する。", cutBy: "backupmon", cutMsg: "ログ監視が異常な大量通信に気づき、バックアップがあれば復旧できる。" }
  ],
  defenses: {
    patch: { label: "機器を更新（パッチ）", term: "パッチ" },
    segment: { label: "ネットワーク分離", term: "ネットワーク分離" },
    least: { label: "最小権限", term: "最小権限" },
    backupmon: { label: "バックアップ・ログ監視", term: "ログ" }
  }
};

/* ---------- ① 見る：連鎖アニメーション ---------- */
LT.S3.see = function (el) {
  el.innerHTML = `
  <div class="card">
    <h2>一つの侵入が、大規模な漏えいになるまで</h2>
    <p>大きな漏えいの約6割は、${LT.T("脆弱性")}を突いた不正アクセスです。侵入は1回で終わりません。入口から入り、社内で足場を広げ、最後に大量のデータへ到達します。再生ボタンで連鎖を見てみましょう。</p>
    <button class="btn primary" id="play">▶ 連鎖を再生</button>
    <div id="chain" class="mt"></div>
  </div>`;
  const chain = el.querySelector("#chain");
  const draw = (active) => {
    chain.innerHTML = LT.S3.chain.map((c, i) => `
      <div class="card ${i <= active ? "attack" : ""}" style="${i <= active ? "" : "opacity:.4"};margin-bottom:10px;transition:opacity .3s">
        <div class="row"><span style="font-size:1.6rem">${c.icon}</span><div><b>${i + 1}. ${c.title}</b><div class="small">${c.desc}</div></div>${i <= active ? '<span class="badge attack" style="margin-left:auto">突破</span>' : ""}</div>
      </div>${i < LT.S3.chain.length - 1 ? '<div class="center" style="color:#c62828">↓</div>' : ""}`).join("");
  };
  draw(-1);
  el.querySelector("#play").onclick = async () => {
    for (let i = 0; i < LT.S3.chain.length; i++) { draw(i); LT.addMapEdge(["vpn", "lateral", "priv", "dbget", "exfil"][i]); await LT.sleep(700); }
    LT.toast("連鎖が完成：12万人分が流出");
  };
  LT.prediction(el, "s3.see.pred", "この5段階の連鎖を止めるには、どうするのが効果的だと思う？",
    [{ text: "最後の『持ち出し』だけを全力で防ぐ" }, { text: "連鎖のどこか1か所でも断ち切れればよい", correct: true }, { text: "完全に防ぐのは不可能なので何もできない" }],
    "対策は「連鎖のどこかを断ち切るもの」です。入口の1か所を止めるだけでも、その先には進めません。次でいくつかの対策を置いて確かめます。");
};

/* ---------- ② 破る：攻撃者として連鎖をたどる ---------- */
LT.S3.break = function (el) {
  el.innerHTML = `
  <div class="card attack">
    <h2><span class="badge attack">攻撃者</span> 連鎖をたどる</h2>
    <p>各段階の「進む」を押して、どこまで到達できるか試します。今は対策が何もない会社です。</p>
    <div id="steps"></div>
    <div class="xray mt" id="xray" hidden></div>
  </div>`;
  const steps = el.querySelector("#steps"), xray = el.querySelector("#xray");
  let reached = 0;
  const render = () => {
    steps.innerHTML = LT.S3.chain.map((c, i) => `
      <div class="card ${i < reached ? "attack" : ""}" style="margin-bottom:8px">
        <div class="row"><span style="font-size:1.4rem">${c.icon}</span><b>${i + 1}. ${c.title}</b>
        ${i < reached ? '<span class="badge attack" style="margin-left:auto">突破済み</span>' : (i === reached ? `<button class="btn sm attack" style="margin-left:auto" id="go">進む →</button>` : '<span class="badge gray" style="margin-left:auto">未到達</span>')}</div>
      </div>`).join("");
    const go = steps.querySelector("#go");
    if (go) go.onclick = () => { reached++; LT.log("s3", "break", "advance", reached); LT.addMapEdge(["vpn", "lateral", "priv", "dbget", "exfil"][reached - 1]); xray.hidden = false; xray.innerHTML = LT.S3.xray(reached); render(); if (reached === LT.S3.chain.length) done(); };
  };
  const done = () => {
    const d = document.createElement("div"); d.className = "card ok fade-in";
    d.innerHTML = `<p>対策が一つもないと、入口から<b>顧客データの持ち出し</b>まで一気に到達しました。次の『なぜ守れるか』で、対策を置いて連鎖を断ち切ります。</p>`;
    el.querySelector(".card.attack").appendChild(d);
  };
  render();
};

LT.S3.xray = function (reached) {
  const names = ["VPN機器", "社内ネットワーク", "管理者権限", "顧客DB(12万件)", "社外へ持ち出し"];
  let s = `<span class="hl">── 透視ビュー：攻撃の進行 ──</span>\n`;
  for (let i = 0; i < 5; i++) s += `${names[i].padEnd(16, "　")} ${i < reached ? '<span class="ng">● 到達</span>' : '<span class="dim">○ 未到達</span>'}\n`;
  return s;
};

/* ---------- ③ なぜ守れるか：対策を置いて連鎖を断つ ---------- */
LT.S3.defend = function (el) {
  el.innerHTML = `
  <div class="card defend">
    <h2><span class="badge defend">防御者</span> どこで断ち切るか</h2>
    <p>対策を切り替えると、連鎖のどこで攻撃が止まるかが変わります。全部そろえなくても、<b>手前の1か所</b>で止まればその先の被害は起きません。</p>
    <div class="pill-list" id="defs"></div>
    <div id="chain" class="mt"></div>
    <div class="card ok mb0" id="verdict"></div>
  </div>`;
  const defsEl = el.querySelector("#defs");
  const active = {};
  Object.keys(LT.S3.defenses).forEach(k => {
    const d = LT.S3.defenses[k];
    active[k] = LT.state.map.defenses.includes(mapDef(k));
    const l = document.createElement("label");
    l.className = "toggle" + (active[k] ? " on" : "");
    l.innerHTML = `<input type="checkbox" ${active[k] ? "checked" : ""}> ${d.label}`;
    l.querySelector("input").onchange = (e) => { active[k] = e.target.checked; l.classList.toggle("on", e.target.checked); LT.setMapDefense(mapDef(k), e.target.checked); LT.log("s3", "defend", "toggle", { def: k, on: e.target.checked }); draw(); };
    defsEl.appendChild(l);
  });
  const chain = el.querySelector("#chain"), verdict = el.querySelector("#verdict");
  function mapDef(k) { return { patch: "patch", segment: "segment", least: "least", backupmon: "backup" }[k]; }
  const draw = () => {
    let stoppedAt = -1;
    chain.innerHTML = LT.S3.chain.map((c, i) => {
      const blocked = stoppedAt < 0 && active[c.cutBy];
      if (blocked) stoppedAt = i;
      const before = stoppedAt < 0 || i < stoppedAt;
      const reachable = stoppedAt < 0 ? true : i < stoppedAt;
      let state, cls;
      if (stoppedAt >= 0 && i === stoppedAt) { state = `<span class="badge defend" style="margin-left:auto">ここで遮断</span>`; cls = "defend"; }
      else if (reachable) { state = `<span class="badge attack" style="margin-left:auto">到達される</span>`; cls = "attack"; }
      else { state = `<span class="badge ok" style="margin-left:auto">守られる</span>`; cls = ""; }
      return `<div class="card ${cls}" style="margin-bottom:8px;${!reachable && stoppedAt >= 0 && i > stoppedAt ? "opacity:.5" : ""}">
        <div class="row"><span style="font-size:1.3rem">${c.icon}</span><div><b>${i + 1}. ${c.title}</b>${stoppedAt === i ? `<div class="small" style="color:#1565c0">${c.cutMsg}</div>` : ""}</div>${state}</div></div>
        ${i < LT.S3.chain.length - 1 ? `<div class="center" style="color:${stoppedAt >= 0 && i >= stoppedAt ? "#1565c0" : "#c62828"}">↓</div>` : ""}`;
    }).join("");
    if (stoppedAt >= 0) verdict.innerHTML = `<b>${stoppedAt + 1}段階目で連鎖が止まりました。</b> ${stoppedAt < 3 ? "顧客データには到達されていません。" : "顧客データには触れられましたが、持ち出しによる被害は防げています。"}手前で止めるほど被害は小さくなります。`;
    else verdict.innerHTML = `対策が足りず、最後まで到達されています。対策を1つでもオンにして、どこで止まるか見てください。`;
    LT.measure("s3", "chain_stopped_at", Object.assign({}, active), stoppedAt);
  };
  draw();

  LT.writingTask(el, "s3.defend.explain", {
    intro: { title: "ふり返り", text: "「対策は連鎖のどこかを断ち切るもの」という言葉を、自分のことばで言いかえてみよう。" },
    practice: { title: "説明課題", text: "予算の都合で対策を1つしか入れられないとしたら、あなたはどれを選びますか。その理由を連鎖の図を使って説明してください。" },
    inquiry: { title: "設計課題", text: "限られた予算で対策を配置するとして、どの順序で導入すべきか、根拠とともに説明してください。『手前で断つ』『多層防御』の考え方に触れること。" }
  });
};

LT.STAGE_IMPL["3"] = { see: LT.S3.see, break: LT.S3.break, defend: LT.S3.defend };
