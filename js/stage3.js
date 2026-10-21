/* ステージ3 ランサムウェア：委託先から全社停止まで（アスクル・アサヒ・イセトーの事件の型） */
window.LT = window.LT || {};
LT.routes = LT.routes || {};
LT.STAGE_IMPL = LT.STAGE_IMPL || {};

LT.S3 = {
  entries: {
    vendor: { icon: "🪪", title: "委託先のアカウントでログイン", desc: "システムの保守を任せている委託先の管理者IDとパスワードを盗み、社外からの入口にログインする。この1つだけ、多要素認証が「例外」で設定されていなかった。", cutBy: "mfa", cutMsg: "例外なく多要素認証を設定していれば、IDとパスワードだけでは入れない。", edges: ["vendor", "vpn"] },
    vpn: { icon: "🚪", title: "古い機器の弱点から侵入", desc: "社外から社内につなぐための機器（VPN機器）に、公表済みの弱点が残っていた。更新（パッチ）が後回しにされていた。", cutBy: "patch", cutMsg: "機器を更新していれば、この弱点はふさがっている。", edges: ["vpnhole"] }
  },
  chain: [
    { id: "lateral", icon: "🧭", title: "社内を探索し、対策ソフトを止める", desc: "入った1台から、ほかのサーバーを探して回る。監視のための対策ソフトも止めてしまう。", cutBy: "segment", cutMsg: "ネットワークが分けられていれば、入った場所からほかのサーバーが見えず、先へ進めない。", edge: "lateral" },
    { id: "priv", icon: "🔑", title: "管理者の権限を奪う", desc: "弱い設定のアカウントを足がかりに、すべてのサーバーを操作できる権限を手に入れる。", cutBy: "least", cutMsg: "最小権限で、強い権限を持つアカウントが限られていれば、奪える権限が小さい。", edge: "priv" },
    { id: "steal", icon: "📤", title: "顧客データを盗み出す", desc: "顧客データベースから、数十万件の個人情報を社外へ送り出す。", cutBy: "monitor", cutMsg: "ログを監視していれば、深夜の大量送信に気づいて通信を止められる。", edge: "dbget", leak: true },
    { id: "encrypt", icon: "🔒", title: "バックアップを消し、すべてを暗号化", desc: "バックアップを先に削除してから、社内のデータを一斉に暗号化して使えなくする。そして「データを公開されたくなければ支払え」と脅す（二重恐喝）。", cutBy: "offline", cutMsg: "ネットワークから切り離したバックアップがあれば、消されずに残り、データを戻せる。", edge: "exfil", stop: true }
  ],
  defenses: {
    mfa: { label: "全アカウントに多要素認証（例外なし）", short: "多要素認証", icon: "📱" },
    patch: { label: "機器をすぐ更新する（パッチ）", short: "更新", icon: "🩹" },
    segment: { label: "ネットワークを分ける", short: "分離", icon: "🧱" },
    least: { label: "権限を必要最小限に", short: "最小権限", icon: "🗝️" },
    monitor: { label: "ログを監視する", short: "監視", icon: "👀" },
    offline: { label: "切り離したバックアップ", short: "バックアップ", icon: "💾" }
  }
};

/* ① 見る：連鎖の全体像 */
LT.S3.see = function (el) {
  el.innerHTML = `<div class="card">
    <h2>1つのアカウントから、会社全体が止まるまで</h2>
    <p>${LT.T("ランサムウェア")}の攻撃は1回では終わりません。入口から入り、社内で足場を広げ、データを盗んだうえで、${LT.T("バックアップ")}まで消して暗号化します。最近は、本体の会社ではなく${LT.T("委託先")}が入口になる例が増えています（${LT.T("サプライチェーン攻撃")}）。</p>
    <button class="btn primary" id="play">▶ 連鎖を再生</button>
    <div id="chain" class="mt"></div>
    <div id="impact"></div>
  </div>`;
  const steps = [LT.S3.entries.vendor].concat(LT.S3.chain);
  const chain = el.querySelector("#chain");
  const draw = (active) => {
    chain.innerHTML = steps.map((c, i) => `<div class="chain-step ${i <= active ? "hit" : ""}">
      <span class="chain-icon">${c.icon}</span><div class="grow"><b>${i + 1}. ${c.title}</b>${LT.isIntro() ? "" : `<div class="small">${c.desc}</div>`}</div>${i <= active ? '<span class="badge attack">突破</span>' : ""}</div>`).join('<div class="chain-arrow">↓</div>');
  };
  draw(-1);
  el.querySelector("#play").onclick = async () => {
    el.querySelector("#play").disabled = true;
    for (let i = 0; i < steps.length; i++) { draw(i); await LT.sleep(650); }
    el.querySelector("#impact").innerHTML = LT.S3.impactHTML({ leak: true, stop: true, recover: false });
    el.querySelector("#play").disabled = false;
  };
  LT.prediction(el, "s3.see.pred", "この連鎖を止めるには、どうするのが効果的だと思う？",
    [{ text: "最後の「暗号化」だけを全力で防ぐ" }, { text: "連鎖のどこか1か所でも断ち切れれば、その先には進めない", correct: true }, { text: "完全に防ぐのは不可能なので、身代金を用意しておく" }],
    "対策は「連鎖のどこかを断ち切るもの」です。手前で止めるほど被害は小さくなります。ただし1か所だけに頼ると、そこが破られたときに全部進まれてしまうため、いくつかを重ねます（多層防御）。");
};

/* 被害の表示 */
LT.S3.impactHTML = function (r) {
  return `<div class="impact fade-in">
    <div class="impact-item ${r.leak ? "bad" : "good"}"><span>👥</span><div><b>個人情報</b><br>${r.leak ? "約74万件が流出" : "流出なし"}</div></div>
    <div class="impact-item ${r.stop ? (r.recover ? "warn" : "bad") : "good"}"><span>🚚</span><div><b>商品の出荷</b><br>${r.stop ? (r.recover ? "数日止まるが、バックアップから復旧" : "長期間の全面停止") : "通常どおり"}</div></div>
    <div class="impact-item ${r.stop || r.leak ? "bad" : "good"}"><span>💴</span><div><b>会社の損失</b><br>${r.stop && !r.recover ? "数十億円規模" : r.leak || r.stop ? "調査・おわび・復旧の費用" : "小さい"}</div></div>
  </div>
  ${r.leak || r.stop ? `<p class="small mt">損なわれたもの：${r.leak ? `${LT.T("機密性")}（情報が漏れた）` : ""}${r.leak && r.stop ? "と" : ""}${r.stop ? `${LT.T("可用性")}（システムが使えない）` : ""}</p>` : ""}`;
};

/* ② 破る：攻撃者として連鎖をたどる */
LT.S3.break = function (el) {
  el.innerHTML = `<div class="card attack">
    <h2><span class="badge attack">攻撃者</span> 架空の通販会社「ソラ商事」をねらう</h2>
    <p>まず入口を選びます。どちらも実際の事件で使われた「型」です。今のソラ商事には、どの対策も入っていません。</p>
    <div class="grid2" id="entry">${Object.keys(LT.S3.entries).map(k => { const e = LT.S3.entries[k]; return `<button class="choice-card" data-e="${k}"><span class="chain-icon">${e.icon}</span><b>${e.title}</b><span class="small">${e.desc}</span></button>`; }).join("")}</div>
    <div id="steps" class="mt"></div>
    <div class="xray mt" id="xray" hidden></div>
    <div id="done"></div>
  </div>`;
  const stepsEl = el.querySelector("#steps"), xray = el.querySelector("#xray");
  let entry = null, reached = 0;
  const log = [];
  el.querySelectorAll("[data-e]").forEach(b => b.onclick = () => {
    entry = b.dataset.e;
    el.querySelectorAll("[data-e]").forEach(x => { x.disabled = true; x.classList.toggle("picked", x === b); });
    LT.S3.entries[entry].edges.forEach(LT.addMapEdge);
    log.push(`<span class="dim">02:13</span> 入口：${LT.S3.entries[entry].title} <span class="ng">成功</span>`);
    LT.log("s3", "break", "entry", entry);
    render();
  });
  const render = () => {
    stepsEl.innerHTML = LT.S3.chain.map((c, i) => `<div class="chain-step ${i < reached ? "hit" : ""}">
      <span class="chain-icon">${c.icon}</span><div class="grow"><b>${i + 2}. ${c.title}</b><div class="small">${c.desc}</div></div>
      ${i < reached ? '<span class="badge attack">突破</span>' : i === reached ? `<button class="btn sm attack" id="go">実行 ›</button>` : '<span class="badge gray">未到達</span>'}</div>`).join('<div class="chain-arrow">↓</div>');
    xray.hidden = false;
    xray.innerHTML = `<span class="hl">ソラ商事のサーバーの記録</span>\n` + log.join("\n");
    const go = stepsEl.querySelector("#go");
    if (go) go.onclick = () => {
      const c = LT.S3.chain[reached];
      reached++;
      LT.addMapEdge(c.edge);
      if (c.id === "priv") LT.addMapEdge("dbget");
      const t = ["02:41", "03:20", "03:55", "04:30"][reached - 1];
      log.push(`<span class="dim">${t}</span> ${c.title} <span class="ng">成功</span>${c.id === "lateral" ? " <span class=\"dim\">（対策ソフト停止 → これ以降の記録は残りにくい）</span>" : ""}`);
      LT.log("s3", "break", "advance", reached);
      render();
      if (reached === LT.S3.chain.length) done();
    };
  };
  const done = () => {
    el.querySelector("#done").innerHTML = `<div class="ransom fade-in"><div class="ransom-hd">⚠ あなたのファイルは暗号化されました（教材の再現画面）</div>
      <p>ソラ商事の社員のパソコンに、このような画面が表示されます。顧客データは盗まれ、社内のデータは暗号化され、バックアップは消されています。</p></div>
      ${LT.S3.impactHTML({ leak: true, stop: true, recover: false })}
      <div class="feedback ok mt">どの入口から入っても、対策がなければ同じ結末にたどり着きます。次の「なぜ守れるか」で、どこで断ち切れるかを確かめます。</div>`;
    LT.setAnswer("s3.break.entry", entry);
  };
};

/* ③ なぜ守れるか：対策を置いて、連鎖と被害を比べる */
LT.S3.defend = function (el) {
  const budget = LT.isIntro() ? 99 : 3;
  const active = {};
  Object.keys(LT.S3.defenses).forEach(k => active[k] = false);
  let entry = "vendor";
  el.innerHTML = `<div class="card defend">
    <h2><span class="badge defend">防御者</span> どこで断ち切るか</h2>
    <p>${budget < 99 ? `<b>予算が限られています。対策は${budget}つまで</b>選べます。` : ""}対策を選ぶと、攻撃がどこで止まり、被害がどう変わるかが表示されます。</p>
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
    el.querySelector("#budget").textContent = budget < 99 ? `選んだ対策：${n} / ${budget}` : "";
    defsEl.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { active[b.dataset.d] = !active[b.dataset.d]; LT.log("s3", "defend", "toggle", { def: b.dataset.d, on: active[b.dataset.d] }); draw(); });
    // 連鎖の判定
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
    el.querySelector("#verdict").innerHTML = stopAt === 0 ? `<div class="feedback ok mt">入口で止まりました。最も被害が小さい形です。</div>` :
      stopAt > 0 ? `<div class="feedback ok mt">${stopAt + 1}段階目で止まりました。${leak ? "" : "個人情報は守られています。"}</div>` :
      recover ? `<div class="feedback ng mt">最後まで進まれましたが、バックアップのおかげで事業は戻せます。ただし盗まれた情報は戻りません。</div>` :
      `<div class="feedback ng mt">最後まで進まれ、事業も止まりました。対策を選んでみましょう。</div>`;
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
