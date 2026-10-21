/* ステージ4 人為ミス */
window.LT = window.LT || {};
LT.routes = LT.routes || {};
LT.STAGE_IMPL = LT.STAGE_IMPL || {};

LT.S4 = {
  recipients: [
    { email: "a-tanaka@soramail.jp", name: "田中（社内）", ext: false },
    { email: "sato@soramail.jp", name: "佐藤（社内）", ext: false },
    { email: "customer1@example.com", name: "顧客A（社外）", ext: true },
    { email: "customer2@example.net", name: "顧客B（社外）", ext: true },
    { email: "customer3@example.org", name: "顧客C（社外）", ext: true }
  ]
};

/* ---------- ① 見る ---------- */
LT.S4.see = function (el) {
  el.innerHTML = `
  <div class="card">
    <h2>攻撃者がいなくても、情報は漏れる</h2>
    <p>漏えいの約3割は、${LT.T("フィッシング")}や侵入ではなく、送る人自身の<b>うっかりミス</b>です。代表例が${LT.T("CC")}と${LT.T("BCC")}の取り違えと、${LT.T("共有リンク")}の公開範囲ミスです。</p>
    <div class="grid2">
      <div class="card note mb0"><h4>CC で顧客5人に一斉送信</h4><p class="small">受信者全員に、他の4人のメールアドレスが丸見えになる。「誰が顧客か」という情報が漏れる。</p><div class="mono small">To: customer1@…, customer2@…, customer3@… ← 全員に見える</div></div>
      <div class="card ok mb0"><h4>BCC で送れば</h4><p class="small">各受信者からは、他の宛先が見えない。</p><div class="mono small">Bcc: （各自からは自分以外見えない）</div></div>
    </div>
  </div>`;
  LT.prediction(el, "s4.see.pred", "顧客5人へ同じ案内メールを送ります。全員のアドレスをCC欄に入れて送ると、何が起きる？",
    [{ text: "問題ない。宛先は自分にしか見えない" }, { text: "受信した5人全員に、他の4人のメールアドレスが見えてしまう", correct: true }, { text: "メールが届かない" }],
    "CCは受信者全員に宛先が見えます。顧客どうしが互いのアドレスを知ってしまうのは、立派な個人情報の漏えいです。BCCを使えば防げます。");
  LT.markStep("s4", "see");
};

/* ---------- ② 破る：時間制限つき模擬業務 ---------- */
LT.S4.break = function (el) {
  el.innerHTML = `
  <div class="card attack">
    <h2><span class="badge warn">体験</span> いそがしい中での送信</h2>
    <p>あなたは窓口担当です。「顧客5人に、他の人のアドレスが見えない形で、至急この案内を送って」と頼まれました。時間は限られています。宛先の種類（To/Cc/Bcc）を選んで送信してください。</p>
    <div class="spread"><div class="timer" id="timer">20.0</div><span class="small">急かされると確認がおろそかになりがちです</span></div>
    <div id="form" class="mt"></div>
  </div>`;
  const form = el.querySelector("#form"), timerEl = el.querySelector("#timer");
  let t = 20.0, done = false;
  const timer = setInterval(() => { t -= 0.1; if (t <= 0) { t = 0; clearInterval(timer); if (!done) submit(true); } timerEl.textContent = t.toFixed(1); timerEl.classList.toggle("low", t < 7); }, 100);

  form.innerHTML = `<table><tr><th>宛先</th><th>区分</th><th>To</th><th>Cc</th><th>Bcc</th></tr>
    ${LT.S4.recipients.map((r, i) => `<tr><td class="small">${r.email}<br><span class="muted">${r.name}</span></td><td>${r.ext ? '<span class="badge warn">社外</span>' : '<span class="badge gray">社内</span>'}</td>
      <td><input type="radio" name="r${i}" value="to"></td><td><input type="radio" name="r${i}" value="cc"></td><td><input type="radio" name="r${i}" value="bcc" checked></td></tr>`).join("")}
  </table><button class="btn attack mt" id="send">送信する</button>`;
  form.querySelector("#send").onclick = () => submit(false);

  function submit(timeout) {
    if (done) return; done = true; clearInterval(timer);
    const picks = LT.S4.recipients.map((r, i) => (form.querySelector(`input[name=r${i}]:checked`) || {}).value || "none");
    const extVisible = picks.filter((p, i) => LT.S4.recipients[i].ext && (p === "to" || p === "cc")).length;
    const leaked = extVisible >= 2; // 社外の宛先が2件以上To/Ccで相互に見える
    LT.setScore("s4.send", { correct: leaked ? 0 : 1, total: 1, percent: leaked ? 0 : 100, note: leaked ? "社外アドレスが相互に露出（漏えい）" : "BCCで保護" });
    LT.log("s4", "break", "send", { picks, timeout, leaked });
    const d = document.createElement("div"); d.className = `card ${leaked ? "note" : "ok"} fade-in`;
    if (leaked) { LT.addMapEdge("missend"); d.innerHTML = `<h3><span class="badge ng">漏えい発生</span></h3><p>社外の顧客どうしに、互いのメールアドレスが見えてしまいました${timeout ? "（時間切れで既定のまま送信）" : ""}。これは実際に何度も起きている事故です。</p>`; }
    else d.innerHTML = `<h3><span class="badge ok">保護できた</span></h3><p>社外の宛先はBCCにしたので、顧客どうしにアドレスは見えません。${timeout ? "（時間切れ時の既定がBCCでした）" : ""}よい判断です。</p>`;
    el.querySelector(".card.attack").appendChild(d);
    form.querySelectorAll("input,button").forEach(x => x.disabled = true);
  }
  LT.markStep("s4", "break");
};

/* ---------- ③ なぜ守れるか：確認手順で繰り返し実測 ---------- */
LT.S4.defend = function (el) {
  el.innerHTML = `
  <div class="card defend">
    <h2><span class="badge defend">防御者</span> 確認手順でミスはどれだけ減るか</h2>
    <p>送信前に「宛先確認」と「社外ドメイン警告」を入れると、ミス率がどう変わるかを、繰り返し試行で実測します。各条件で10回ずつ、わざと急かされる状況を再現します。</p>
    <div class="row">
      <label class="toggle" id="t1"><input type="checkbox"> 送信前に宛先を確認する画面を出す</label>
      <label class="toggle" id="t2"><input type="checkbox"> 社外ドメインを赤く警告する</label>
    </div>
    <div class="row mt"><button class="btn primary" id="run">この条件で10回ためす（自動シミュレーション）</button></div>
    <div id="results" class="mt"></div>
    <div id="chart" class="mt"></div>
  </div>`;
  const runs = [];
  const getDef = () => ({ confirm: el.querySelector("#t1 input").checked, warn: el.querySelector("#t2 input").checked });
  [["#t1", "check"], ["#t2", "check"]].forEach(([sel]) => { const t = el.querySelector(sel); t.querySelector("input").onchange = (e) => { t.classList.toggle("on", e.target.checked); LT.setMapDefense("check", e.target.checked); }; });

  el.querySelector("#run").onclick = () => {
    const def = getDef();
    // 基準のミス率30%。確認画面で半減、警告でさらに半減（教材用の簡略モデル）
    let p = 0.30; if (def.confirm) p *= 0.5; if (def.warn) p *= 0.5;
    let miss = 0; for (let i = 0; i < 10; i++) if (Math.random() < p) miss++;
    const label = `${def.confirm ? "確認" : "—"}/${def.warn ? "警告" : "—"}`;
    runs.push({ label, def, miss, rate: miss / 10, modelP: p });
    LT.measure("s4", "misssend_trials", def, { miss, of: 10, modelRate: p });
    LT.setScore("s4.misstrial." + runs.length, { correct: 10 - miss, total: 10, percent: (10 - miss) * 10, note: "条件 " + label + " での成功回数" });
    render();
  };
  const render = () => {
    el.querySelector("#results").innerHTML = `<div class="table-wrap"><table><tr><th>試行</th><th>条件</th><th>ミス回数</th><th>ミス率</th></tr>${runs.map((r, i) => `<tr><td>${i + 1}</td><td>${r.label}</td><td>${r.miss}/10</td><td>${(r.rate * 100).toFixed(0)}%</td></tr>`).join("")}</table></div>`;
    LT.S4.chart(el.querySelector("#chart"), runs);
  };

  LT.writingTask(el, "s4.defend.explain", {
    intro: { title: "ふり返り", text: "メールを送る前に、あなたはこれから何を確認しますか。" },
    practice: { title: "説明課題", text: "「急いでいるときほどミスが起きやすい」のはなぜか、この体験をもとに説明してください。確認手順がなぜ効くのかにも触れること。" },
    inquiry: { title: "説明課題", text: "人のミスは0にはできません。『ミスが起きる前提で被害を小さくする』という考え方（宛先確認・外部警告・送信取消・共有範囲の既定を狭くする等）を、具体例を挙げて説明してください。" }
  });
  LT.markStep("s4", "defend");
};

LT.S4.chart = function (container, runs) {
  if (!runs.length) { container.innerHTML = ""; return; }
  const W = 680, H = 200, padL = 40, padB = 48, padT = 10;
  const bw = Math.min(70, (W - padL - 10) / runs.length - 10);
  const bars = runs.map((r, i) => {
    const x = padL + i * ((W - padL - 10) / runs.length) + 6;
    const h = (H - padB - padT) * r.rate;
    const col = r.rate > 0.2 ? "#c62828" : r.rate > 0.1 ? "#b26a00" : "#1e8e3e";
    return `<rect x="${x}" y="${H - padB - h}" width="${bw}" height="${h}" fill="${col}" rx="3"/><text x="${x + bw / 2}" y="${H - padB - h - 5}" font-size="11" text-anchor="middle">${(r.rate * 100).toFixed(0)}%</text><text x="${x + bw / 2}" y="${H - padB + 14}" font-size="9" text-anchor="middle" fill="#5c6678">${r.label}</text><text x="${x + bw / 2}" y="${H - padB + 26}" font-size="9" text-anchor="middle" fill="#9aa4b5">#${i + 1}</text>`;
  }).join("");
  container.innerHTML = `<p class="small">試行ごとのミス率（低いほど良い）</p><svg viewBox="0 0 ${W} ${H}" class="chart" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif"><line x1="${padL}" y1="${H - padB}" x2="${W - 10}" y2="${H - padB}" stroke="#cfd6e2"/>${bars}</svg>`;
};

LT.STAGE_IMPL["4"] = { see: LT.S4.see, break: LT.S4.break, defend: LT.S4.defend };
