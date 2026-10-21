/* はじめ（事前）・おわり（事後）のテスト
   構成：
   A. 知識問題 … data/test-items.json から読み込む（研究者が作成。空なら出題しない）
   B. 判別課題 … ステージ2の判別問題（本物／偽物）
   C. 理解の自己評価（5段階）
   D. 行動意図（5段階）
   はじめのテストでは正誤を表示しない。おわりのテスト後に比較を表示する。 */
window.LT = window.LT || {};
LT.routes = LT.routes || {};

LT.TEST = {
  self: [
    "パスワードを使い回すと、なぜ被害が広がるのかを説明できる",
    "メールのリンク先が本物かどうかを、URLを見て判断できる",
    "1つの侵入が大きな漏えいにつながる流れを説明できる",
    "メールの宛先（To / CC / BCC）を正しく使い分けられる"
  ],
  intent: [
    "これから、サービスごとに違うパスワードを使おうと思う",
    "これから、使えるサービスでは多要素認証（二段階認証）を設定しようと思う",
    "これから、メールのリンクを開く前に、本当のドメインを確かめようと思う",
    "これから、メールを送る前に宛先と公開範囲を確かめようと思う"
  ],
  likert: ["まったくそう思わない", "あまりそう思わない", "どちらとも言えない", "ややそう思う", "とてもそう思う"],
  custom: null
};

/* 研究者が用意する問題ファイルを読む（無い・空なら知識問題は省略） */
LT.loadCustomItems = async function () {
  if (LT.TEST.custom !== null) return LT.TEST.custom;
  const ok = (it) => it && it.id && it.q && Array.isArray(it.opts) && typeof it.ans === "number";
  const okP = (it) => it && it.id && (it.kind === "real" || it.kind === "fake") && it.from && it.body;
  try {
    const res = await fetch("data/test-items.json", { cache: "no-cache" });
    const j = await res.json();
    LT.TEST.custom = { items: Array.isArray(j.items) ? j.items.filter(ok) : [], phish: Array.isArray(j.phish) ? j.phish.filter(okP) : [] };
  } catch (e) { LT.TEST.custom = { items: [], phish: [] }; }
  return LT.TEST.custom;
};

/* 判別問題の出題元：テスト専用があればそれ、なければステージ2の練習問題 */
LT.testPhishSet = function () {
  const c = LT.TEST.custom;
  return c && c.phish && c.phish.length ? c.phish : LT.S2.samples;
};

LT.routes.test = async function (app, parts) {
  const phase = parts[0] === "post" ? "post" : "pre";
  const name = phase === "pre" ? "はじめのテスト" : "おわりのテスト";
  const done = LT.state.tests[phase];
  const custom = await LT.loadCustomItems();
  const phishItems = LT.testPhishSet().map(s => ({ id: "ph_" + s.id, cat: "phish", sample: s }));
  const knowItems = custom.items.map(it => Object.assign({ cat: it.cat || "know" }, it));
  const total = knowItems.length + phishItems.length + 2; // +2 は自己評価・行動意図のページ

  if (done) { LT.testResult(app, phase); return; }

  app.innerHTML = `
  <div class="card narrow center">
    <div style="font-size:3rem">${phase === "pre" ? "📝" : "🏁"}</div>
    <h1>${name}</h1>
    <p class="muted">${phase === "pre" ? "学習を始める前の、いまの自分を確かめます。" : "学習を終えたあとの自分を確かめます。はじめのテストと比べられます。"}</p>
    <div class="stat-row mt" style="text-align:left">
      ${knowItems.length ? `<div class="stat"><div class="k">知識・判断</div><div class="v">${knowItems.length}問</div></div>` : ""}
      <div class="stat"><div class="k">メール・SMSの判別</div><div class="v">${phishItems.length}問</div></div>
      <div class="stat"><div class="k">ふり返り</div><div class="v">8問</div></div>
    </div>
    <p class="small mt">${phase === "pre" ? "このテストでは正解は表示されません。分からない問題は「わからない」を選んでください。" : "終わると、はじめのテストとの比較が表示されます。"}</p>
    ${phase === "post" && !LT.state.tests.pre ? `<div class="feedback ng" style="text-align:left">はじめのテストをまだ受けていません。比較はできませんが、受けることはできます。</div>` : ""}
    <button class="btn primary lg block mt" id="start">始める</button>
  </div>`;
  app.querySelector("#start").onclick = () => LT.runTest(app, phase, LT.shuffle(knowItems), LT.shuffle(phishItems), total);
};

LT.runTest = function (app, phase, knowItems, phishItems, total) {
  const t0 = Date.now();
  const queue = knowItems.concat(phishItems);
  const result = { t: new Date().toISOString(), layer: LT.state.layer, items: [], self: [], intent: [], seconds: 0 };
  let idx = 0;
  LT.log("test", phase, "test_start");

  const header = (n) => `<div class="spread"><span class="small">${n} / ${total}</span><a href="#/home" class="small">中断する</a></div><div class="progress mt" style="margin-bottom:16px"><div style="width:${(n - 1) / total * 100}%"></div></div>`;

  const next = () => {
    if (idx < queue.length) {
      const it = queue[idx];
      if (it.cat === "phish") showPhish(it); else showChoice(it);
    } else if (idx === queue.length) showLikert("self", "理解の自己評価", "いまの自分にどのくらい当てはまりますか。", LT.TEST.self);
    else if (idx === queue.length + 1) showLikert("intent", "これからの行動", "どのくらいそう思いますか。", LT.TEST.intent);
    else finish();
  };

  const showChoice = (it) => {
    const opts = it.opts.concat(["わからない"]);
    app.innerHTML = `<div class="narrow">${header(idx + 1)}<div class="card"><p class="q"><span class="qnum">Q${idx + 1}</span>${LT.esc(it.q)}</p><div class="choices">${opts.map((o, i) => `<label class="choice"><input type="radio" name="tq" value="${i}"><span class="mark">${i < it.opts.length ? "ABCDEF"[i] : "?"}</span><span>${LT.esc(o)}</span></label>`).join("")}</div>
      <button class="btn primary block mt" id="ok" disabled>回答する</button></div></div>`;
    let pick = -1;
    app.querySelectorAll("input[name=tq]").forEach(r => r.onchange = () => { pick = Number(r.value); app.querySelector("#ok").disabled = false; });
    app.querySelector("#ok").onclick = () => {
      const dunno = pick === it.opts.length;
      result.items.push({ id: it.id, cat: it.cat, answer: dunno ? "dunno" : pick, correct: !dunno && pick === it.ans });
      idx++; next();
    };
  };

  const showPhish = (it) => {
    const s = it.sample;
    app.innerHTML = `<div class="narrow">${header(idx + 1)}<div class="card"><p class="q"><span class="qnum">Q${idx + 1}</span>この${s.channel === "sms" ? "SMS" : "メール"}は本物？それとも偽物（フィッシング）？</p>
      ${LT.S2.mailHTML(s, false)}
      <div class="grid3 mt"><button class="btn defend" data-a="real">本物</button><button class="btn attack" data-a="fake">偽物</button><button class="btn" data-a="dunno">わからない</button></div></div></div>`;
    app.querySelectorAll("button[data-a]").forEach(b => b.onclick = () => {
      const a = b.dataset.a;
      result.items.push({ id: it.id, cat: "phish", answer: a, correct: a === s.kind });
      idx++; next();
    });
  };

  const showLikert = (key, title, lead, statements) => {
    app.innerHTML = `<div class="narrow">${header(idx + 1)}<div class="card"><h2>${title}</h2><p class="muted">${lead}</p>
      ${statements.map((st, i) => `<div class="mt"><p class="mb0"><span class="qnum">${i + 1}</span>${st}</p>
        <div class="likert mt">${LT.TEST.likert.map((l, v) => `<label><input type="radio" name="${key}${i}" value="${v + 1}"><b>${v + 1}</b>${l}</label>`).join("")}</div></div>`).join("")}
      <button class="btn primary block mt" id="ok" disabled>次へ</button></div></div>`;
    const check = () => { app.querySelector("#ok").disabled = statements.some((_, i) => !app.querySelector(`input[name=${key}${i}]:checked`)); };
    app.querySelectorAll(".likert input").forEach(r => r.onchange = check);
    app.querySelector("#ok").onclick = () => {
      result[key] = statements.map((_, i) => Number(app.querySelector(`input[name=${key}${i}]:checked`).value));
      idx++; next();
    };
  };

  const finish = () => {
    result.seconds = Math.round((Date.now() - t0) / 1000);
    LT.state.tests[phase] = result;
    const correct = result.items.filter(x => x.correct).length;
    LT.setScore("test." + phase, { correct, total: result.items.length, percent: result.items.length ? Math.round(correct / result.items.length * 100) : 0, note: `所要 ${result.seconds} 秒` });
    LT.log("test", phase, "test_done", { correct, total: result.items.length, self: result.self, intent: result.intent });
    LT.save();
    LT.testResult(app, phase);
  };

  next();
};

LT.testResult = function (app, phase) {
  const r = LT.state.tests[phase];
  const correct = r.items.filter(x => x.correct).length;
  const avg = a => a && a.length ? (a.reduce((s, v) => s + v, 0) / a.length).toFixed(1) : "—";
  const pre = LT.state.tests.pre, post = LT.state.tests.post;
  let body;
  if (phase === "pre") {
    body = `<div class="card narrow center"><div style="font-size:3rem">✅</div><h1>はじめのテスト 完了</h1>
      <p class="muted">おつかれさまでした。正解は、全部の学習が終わったあとの「おわりのテスト」で確かめられます。</p>
      <a class="btn primary lg block mt" href="#/stage/1">ステージ1を始める ›</a></div>`;
  } else {
    const lik = (k, i) => `<td>${pre ? pre[k][i] : "—"}</td><td>${post[k][i]}</td>`;
    body = `<div class="narrow"><div class="card center"><div style="font-size:3rem">🎉</div><h1>おわりのテスト 完了</h1>
      <div class="stat-row mt" style="text-align:left">
        <div class="stat"><div class="k">正答（はじめ → おわり）</div><div class="v">${pre ? pre.items.filter(x => x.correct).length + " → " : ""}${correct} <small>/ ${r.items.length}</small></div></div>
        <div class="stat"><div class="k">自己評価の平均</div><div class="v">${pre ? avg(pre.self) + " → " : ""}${avg(post.self)}</div></div>
        <div class="stat"><div class="k">行動意図の平均</div><div class="v">${pre ? avg(pre.intent) + " → " : ""}${avg(post.intent)}</div></div>
      </div></div>
      <div class="card"><h2>分類ごとの正答率</h2>${LT.prePostView()}</div>
      <div class="card"><h2>自己評価・行動意図（1〜5）</h2><div class="table-wrap"><table><tr><th>項目</th><th>はじめ</th><th>おわり</th></tr>
        ${LT.TEST.self.map((s, i) => `<tr><td class="small">${s}</td>${lik("self", i)}</tr>`).join("")}
        ${LT.TEST.intent.map((s, i) => `<tr><td class="small">${s}</td>${lik("intent", i)}</tr>`).join("")}
      </table></div></div>
      ${LT.TEST.custom && LT.TEST.custom.items.length ? `<div class="card"><h2>知識・判断の答え合わせ</h2>${LT.TEST.custom.items.map(q => { const it = post.items.find(x => x.id === q.id); return `<p class="mb0"><span class="badge ${it && it.correct ? "ok" : "ng"}">${it && it.correct ? "正解" : "不正解"}</span> ${LT.esc(q.q)}</p><p class="small">答え：<b>${LT.esc(q.opts[q.ans])}</b>${q.exp ? "　" + LT.esc(q.exp) : ""}</p>`; }).join("")}</div>` : ""}
      <div class="card"><h2>判別問題の答え合わせ</h2>${LT.testPhishSet().map(s => { const it = post.items.find(x => x.id === "ph_" + s.id); return `<p class="mb0"><span class="badge ${it && it.correct ? "ok" : "ng"}">${it && it.correct ? "正解" : "不正解"}</span> ${LT.esc(s.subject || s.body.slice(0, 24) + "…")} → <b>${s.kind === "real" ? "本物" : "偽物"}</b></p><p class="small">${s.reasons.map(LT.esc).join("／")}</p>`; }).join("")}</div>
      <a class="btn primary lg block" href="#/survey">最後に、使いやすさアンケートへ ›</a></div>`;
  }
  app.innerHTML = body;
  if (LT.state.research) {
    const b = document.createElement("div"); b.className = "card narrow";
    b.innerHTML = `<h3>研究モード</h3><p class="small">このテストの結果を消して、もう一度受けられるようにします。</p><button class="btn sm danger" id="redo">${phase === "pre" ? "はじめ" : "おわり"}のテストを消去</button>`;
    b.querySelector("#redo").onclick = () => { delete LT.state.tests[phase]; delete LT.state.scores["test." + phase]; LT.save(); LT.render(); };
    app.appendChild(b);
  }
};
