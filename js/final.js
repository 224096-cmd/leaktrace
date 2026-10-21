/* 最終課題：自分の行動をふり返る */
window.LT = window.LT || {};
LT.routes = LT.routes || {};
LT.STAGE_IMPL = LT.STAGE_IMPL || {};

LT.FINAL = {
  questions: [
    {
      id: "pw", q: "パスワードの決め方は？",
      opts: [
        { t: "いくつかのサービスで同じものを使い回している", risk: 3, edge: "reuse", effect: "1か所の流出が、使い回した全サービスに連鎖します（ステージ1）。" },
        { t: "サービスごとに違うが、短くて単純", risk: 2, effect: "使い回しはしていなくても、短いパスワードは総当たりで割られやすいです（ステージ1）。" },
        { t: "サービスごとに違い、長い。多要素認証も使う", risk: 0, effect: "使い回しの連鎖も総当たりも防げています。よい習慣です。" }
      ]
    },
    {
      id: "mail", q: "『アカウント確認』メールのリンクを開くとき？",
      opts: [
        { t: "急いでいればリンクをすぐ開く", risk: 3, edge: "phish", effect: "緊急性をあおる偽メールにだまされやすい状態です（ステージ2）。" },
        { t: "送信元の名前を見て判断する", risk: 2, effect: "表示名は偽装できます。リンクの本当のドメインまで確認しましょう（ステージ2）。" },
        { t: "リンクは開かず、ブックマークや公式アプリから入る", risk: 0, effect: "フィッシングのリンクを踏まない、最も確実な習慣です。" }
      ]
    },
    {
      id: "update", q: "スマホやPCの更新（アップデート）は？",
      opts: [
        { t: "通知が出ても後回しにしがち", risk: 2, edge: "vpn", effect: "更新の遅れは、既知の穴を開けたままにすることです（ステージ3）。" },
        { t: "気づいたときに時々やる", risk: 1, effect: "できれば自動更新にしておくと、穴がふさがるまでの空白を減らせます（ステージ3）。" },
        { t: "自動更新にしている", risk: 0, effect: "脆弱性がふさがれるまでの空白期間を最小にできています。" }
      ]
    },
    {
      id: "send", q: "複数人へのメールや、ファイルの共有は？",
      opts: [
        { t: "宛先はあまり見ずに送る／共有リンクは『誰でも』にしがち", risk: 3, edge: "missend", effect: "誤送信や共有設定ミスで、攻撃者がいなくても情報は漏れます（ステージ4）。" },
        { t: "ときどき宛先を確認する", risk: 1, effect: "送信前の宛先確認と、共有範囲を狭くする既定を習慣にするとさらに安全です（ステージ4）。" },
        { t: "複数人にはBCC、共有は必要な人だけに限定", risk: 0, effect: "人為ミスによる漏えいを抑えられています。" }
      ]
    }
  ]
};

LT.routes.final = function (app) {
  LT.startStage("final");
  LT.current.stage = "final";
  app.innerHTML = `
  <div class="stage-head"><a href="#/home" class="back" aria-label="ホームへ戻る">‹</a><span class="stage-icon">🧭</span><div class="grow"><div class="eyebrow">まとめ</div><h1>最終課題：自分の行動をふり返る</h1></div></div>
  <div class="card"><p>あなたの普段の行動を選んでください。選ぶと、架空のシナリオ上で何が起こりうるかと、攻撃経路マップのどこにつながるかが表示されます。正解を当てる課題ではありません。自分の「いま」を確かめるものです。</p></div>
  <div id="qs"></div>`;
  const qs = app.querySelector("#qs");
  const answers = {};
  LT.FINAL.questions.forEach(q => {
    const card = document.createElement("div"); card.className = "card";
    card.innerHTML = `<h3>${q.q}</h3>` + q.opts.map((o, i) => `<label class="choice"><input type="radio" name="${q.id}" value="${i}"> ${o.t}</label>`).join("") + `<div class="fb"></div>`;
    card.querySelectorAll("input").forEach((inp, i) => inp.onchange = () => {
      answers[q.id] = i; const o = q.opts[i];
      LT.setAnswer("final." + q.id, { choice: i, text: o.t, risk: o.risk });
      card.querySelector(".fb").innerHTML = `<div class="card ${o.risk === 0 ? "ok" : "note"} mb0 mt fade-in"><p class="mb0"><span class="badge ${o.risk === 0 ? "ok" : o.risk >= 3 ? "ng" : "warn"}">${o.risk === 0 ? "安全な習慣" : o.risk >= 3 ? "要注意" : "改善の余地あり"}</span> ${o.effect}</p></div>`;
      if (o.edge && o.risk >= 2) LT.addMapEdge(o.edge);
      updateResult();
    });
    qs.appendChild(card);
  });
  const result = document.createElement("div"); result.className = "card"; result.id = "result"; result.hidden = true;
  app.appendChild(result);
  const mapCard = document.createElement("div"); mapCard.className = "card"; mapCard.innerHTML = `<h2>あなたの行動とつながる経路</h2><div id="finalmap"></div><p class="small mt">赤い線は、あなたの『要注意』の行動がつながりうる経路です。</p>`;
  app.appendChild(mapCard);
  LT.renderMap(mapCard.querySelector("#finalmap"));

  function updateResult() {
    const done = LT.FINAL.questions.every(q => answers[q.id] !== undefined);
    if (!done) return;
    const totalRisk = LT.FINAL.questions.reduce((s, q) => s + q.opts[answers[q.id]].risk, 0);
    const maxRisk = LT.FINAL.questions.reduce((s, q) => s + Math.max(...q.opts.map(o => o.risk)), 0);
    const safe = Math.round((1 - totalRisk / maxRisk) * 100);
    const weak = LT.FINAL.questions.filter(q => q.opts[answers[q.id]].risk >= 2);
    result.hidden = false;
    result.innerHTML = `<h2>ふり返りのまとめ</h2>
      <div class="spread"><div>いまの行動の安全度（目安）</div><div class="huge">${safe}%</div></div>
      <div class="progress mt"><div style="width:${safe}%;background:${safe > 70 ? "#1e8e3e" : safe > 40 ? "#b26a00" : "#c62828"}"></div></div>
      ${weak.length ? `<p class="mt">特に見直すとよいのは次の点です：</p><ul>${weak.map(q => `<li><b>${q.q}</b> → ${q.opts[answers[q.id]].effect}</li>`).join("")}</ul>` : `<p class="mt">どれも安全な習慣です。この状態を保ちましょう。</p>`}
      <p class="small">これは架空シナリオ上の目安です。学習記録に保存されました。</p>`;
    LT.renderMap(mapCard.querySelector("#finalmap"));
    const s = LT.stageState("final"); if (!s.completedAt) { s.steps = { see: 1, break: 1, defend: 1 }; s.completedAt = new Date().toISOString(); LT.save(); LT.log("final", "", "stage_complete"); }
  }

  LT.writingTask(app, "final.plan", {
    intro: { title: "これからやること", text: "今日からできそうな対策を1つ、具体的に書いてみよう。" },
    practice: { title: "行動宣言", text: "このふり返りをもとに、あなたが変えようと思う行動を2つ、理由とともに書いてください。" },
    inquiry: { title: "まとめ", text: "『なぜ個人情報は漏れるのか。そして、なぜその対策が効くのか』という問いに、4つのステージで学んだことを使って自分なりに答えてください。" }
  });
  const go = document.createElement("div");
  go.className = "card center";
  go.innerHTML = `<h2>おつかれさまでした</h2><p class="muted">最後に「おわりのテスト」で、はじめのテストからどれだけ変わったかを確かめましょう。</p>
    <a class="btn primary lg" href="#/test/post">おわりのテストへ ›</a>`;
  app.appendChild(go);
};
