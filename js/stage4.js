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
  window.addEventListener("hashchange", () => { done = true; clearInterval(timer); }, { once: true });

  form.innerHTML = `<div class="table-wrap"><table><tr><th>宛先</th><th>区分</th><th>To</th><th>Cc</th><th>Bcc</th></tr>
    ${LT.S4.recipients.map((r, i) => `<tr><td class="small">${r.email}<br><span class="muted">${r.name}</span></td><td>${r.ext ? '<span class="badge warn">社外</span>' : '<span class="badge gray">社内</span>'}</td>
      <td><input type="radio" name="r${i}" value="to" checked></td><td><input type="radio" name="r${i}" value="cc"></td><td><input type="radio" name="r${i}" value="bcc"></td></tr>`).join("")}
  </table></div><button class="btn attack block mt" id="send">送信する</button>`;
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
    else d.innerHTML = `<h3><span class="badge ok">保護できた</span></h3><p>社外の宛先はBCCにしたので、顧客どうしにアドレスは見えません。${timeout ? "" : ""}よい判断です。</p>`;
    el.querySelector(".card.attack").appendChild(d);
    form.querySelectorAll("input,button").forEach(x => x.disabled = true);
  }
};

/* ---------- ③ なぜ守れるか：確認手順で繰り返し実測 ---------- */
/* ---------- ③ なぜ守れるか：自分で試行して測る ---------- */
LT.S4.TASKS = [
  { hide: true,  text: "社外の顧客3人に、セールの案内を送る。<b>顧客どうしにはアドレスを見せない。</b>",
    to: [["k.mori@example.com", "森（顧客）", true], ["yuki88@example.net", "ゆき（顧客）", true], ["h-abe@example.org", "阿部（顧客）", true]] },
  { hide: false, text: "社内の3人に会議の日程を送る。<b>誰に送ったかが全員に分かるように。</b>",
    to: [["kato@soramail.jp", "加藤（社内）", false], ["ono@soramail.jp", "小野（社内）", false], ["ishii@soramail.jp", "石井（社内）", false]] },
  { hide: true,  text: "社外の保護者2人にお知らせを送り、上司にも写しを送る。<b>保護者どうしにはアドレスを見せない。</b>",
    to: [["parent.a@example.com", "保護者A（社外）", true], ["parent.b@example.net", "保護者B（社外）", true], ["boss@soramail.jp", "上司（社内）", false]] },
  { hide: false, text: "社内の2人に資料を送る。<b>2人とも、もう一人に届いたことが分かるように。</b>",
    to: [["nakano@soramail.jp", "中野（社内）", false], ["ueda@soramail.jp", "上田（社内）", false]] },
  { hide: true,  text: "社外の応募者4人に面接日時を送る。<b>応募者どうしにはアドレスを見せない。</b>",
    to: [["apply01@example.com", "応募者1", true], ["apply02@example.org", "応募者2", true], ["apply03@example.net", "応募者3", true], ["apply04@example.com", "応募者4", true]] },
  { hide: false, text: "社内の2人と取引先1人に打ち合わせの確認を送る。<b>3人とも、お互いに宛先が分かるように。</b>",
    to: [["sakai@soramail.jp", "酒井（社内）", false], ["fujii@soramail.jp", "藤井（社内）", false], ["tanimoto@example.co.jp", "谷本（取引先）", true]] }
];
LT.S4.ROUNDS = 4;      // 1条件あたりの回数
LT.S4.LIMIT = 15;      // 1回あたりの制限時間（秒）

/* 送信結果の判定。hide の依頼で社外アドレスが2件以上 To/Cc に入ると漏えい。
   公開してよい依頼で BCC を使うと「伝わらない」ミス（漏えいではない） */
LT.S4.judge = function (task, picks) {
  const extVisible = task.to.filter((r, i) => r[2] && picks[i] !== "bcc").length;
  if (task.hide && extVisible >= 2) return { ok: false, type: "leak", msg: "社外の宛先どうしにアドレスが見えてしまった（漏えい）" };
  if (!task.hide && picks.some(p => p === "bcc")) return { ok: false, type: "hidden", msg: "BCCにした人が、誰に送られたか分からない（伝達ミス）" };
  return { ok: true, type: "ok", msg: "依頼どおりに送れた" };
};

LT.S4.defend = function (el) {
  const saved = LT.state.answers["s4.trials"];
  const runs = saved && Array.isArray(saved.value) ? saved.value.slice() : [];
  el.innerHTML = `
  <div class="card defend">
    <h2><span class="badge defend">防御者</span> 確認の手順で、ミスは本当に減るのか</h2>
    <p>「送る前に確認する」ことに効き目があるかを、<b>あなた自身の操作で</b>測ります。急いでいる状況（1回${LT.S4.LIMIT}秒）で、2つの条件を${LT.S4.ROUNDS}回ずつ試します。</p>
    <div class="vs">
      <div class="no"><h4>条件A：確認なし</h4><p class="small mb0">「送信」を押すとすぐに送られる。</p></div>
      <div class="yes"><h4>条件B：確認あり</h4><p class="small mb0">社外の宛先が赤く表示され、送信前に「誰に何が見えるか」の確認画面が出る。</p></div>
    </div>
    <div id="trialArea"></div>
  </div>
  <div class="card" id="resultCard" hidden><h2>結果</h2><div id="results"></div><div id="chart" class="mt"></div></div>`;
  const area = el.querySelector("#trialArea");

  const doneCount = (cond) => runs.filter(r => r.cond === cond).length;
  const saveRuns = () => { LT.state.answers["s4.trials"] = { value: runs, t: new Date().toISOString(), layer: LT.state.layer }; LT.save(); };

  const menu = () => {
    const a = doneCount("none"), b = doneCount("check");
    area.innerHTML = `<div class="grid2 mt">
      <button class="btn lg" id="goA" ${a >= LT.S4.ROUNDS ? "disabled" : ""}>条件A を試す（${a}/${LT.S4.ROUNDS}）</button>
      <button class="btn defend lg" id="goB" ${b >= LT.S4.ROUNDS ? "disabled" : ""}>条件B を試す（${b}/${LT.S4.ROUNDS}）</button></div>
      ${runs.length ? `<button class="btn ghost sm mt" id="clear">記録を消してやり直す</button>` : ""}`;
    area.querySelector("#goA").onclick = () => round("none");
    area.querySelector("#goB").onclick = () => round("check");
    const c = area.querySelector("#clear");
    if (c) c.onclick = () => { if (confirm("この課題の試行記録を消しますか？")) { runs.length = 0; saveRuns(); menu(); showResults(); } };
    showResults();
  };

  const round = (cond) => {
    // 同じ条件の中で依頼が偏らないよう、回数に応じて順番に出す
    const order = cond === "none" ? [0, 1, 2, 3, 4, 5] : [4, 5, 0, 3, 2, 1];
    const task = LT.S4.TASKS[order[doneCount(cond) % order.length]];
    const n = doneCount(cond) + 1;
    const t0 = Date.now();
    let left = LT.S4.LIMIT, finished = false;
    area.innerHTML = `
      <div class="card mt mb0 fade-in">
        <div class="spread"><span class="badge ${cond === "none" ? "gray" : "defend"}">条件${cond === "none" ? "A：確認なし" : "B：確認あり"} ・ ${n}回目</span><span class="timer" id="tm">${left}</span></div>
        <p class="q mt">📨 依頼：${task.text}</p>
        <div class="table-wrap"><table><tr><th>宛先</th><th>To</th><th>Cc</th><th>Bcc</th></tr>
          ${task.to.map((r, i) => `<tr><td><span class="${cond === "check" && r[2] ? "ext-warn" : ""}">${r[0]}</span><br><span class="small">${r[1]}${cond === "check" && r[2] ? ' <span class="badge ng">社外</span>' : ""}</span></td>
            ${["to", "cc", "bcc"].map(k => `<td><input type="radio" name="p${i}" value="${k}" ${k === "to" ? "checked" : ""} style="width:22px;height:22px"></td>`).join("")}</tr>`).join("")}
        </table></div>
        <button class="btn attack block mt" id="send">送信</button>
        <div id="confirm"></div>
      </div>`;
    const tm = area.querySelector("#tm");
    const timer = setInterval(() => { left--; tm.textContent = left; tm.classList.toggle("low", left <= 5); if (left <= 0) { clearInterval(timer); commit(true); } }, 1000);
    window.addEventListener("hashchange", () => { finished = true; clearInterval(timer); }, { once: true });
    const picks = () => task.to.map((_, i) => area.querySelector(`input[name=p${i}]:checked`).value);

    const commit = (timeout) => {
      if (finished) return; finished = true; clearInterval(timer);
      const p = picks(), j = LT.S4.judge(task, p);
      const rec = { cond, n, task: LT.S4.TASKS.indexOf(task), hide: task.hide, picks: p, ok: j.ok, type: j.type, timeout, seconds: Math.round((Date.now() - t0) / 100) / 10 };
      runs.push(rec); saveRuns();
      LT.log("s4", "defend", "trial", rec);
      LT.measure("s4", "send_trial", { cond, task: rec.task, n }, { ok: j.ok, type: j.type, seconds: rec.seconds, timeout });
      if (j.type === "leak") LT.addMapEdge("missend");
      area.innerHTML = `<div class="feedback ${j.ok ? "ok" : "ng"} mt fade-in"><b>${j.ok ? "✓ " : "✗ "}${j.msg}</b>${timeout ? "（時間切れ）" : ""}<br><span class="small">かかった時間 ${rec.seconds} 秒</span></div>
        <button class="btn primary block mt" id="back">${doneCount(cond) < LT.S4.ROUNDS ? "続けて次の回へ ›" : "条件の選択へ戻る"}</button>`;
      area.scrollIntoView({ block: "nearest", behavior: "smooth" });
      area.querySelector("#back").onclick = () => { if (doneCount(cond) < LT.S4.ROUNDS) round(cond); else menu(); };
      updateScores();
    };

    area.querySelector("#send").onclick = () => {
      if (cond === "none") { commit(false); return; }
      // 確認あり：誰に何が見えるかを示す
      const p = picks();
      const visible = task.to.filter((r, i) => p[i] !== "bcc");
      const extVisible = task.to.filter((r, i) => r[2] && p[i] !== "bcc");
      const box = area.querySelector("#confirm");
      box.innerHTML = `<div class="card note mt mb0 fade-in"><h3>送信前の確認</h3>
        <p class="mb0">受け取った人どうしで見えるアドレス：<b>${visible.length}件</b>${visible.length ? `（${visible.map(r => r[1]).join("、")}）` : ""}</p>
        ${extVisible.length >= 2 ? `<p class="mb0" style="color:var(--ng)"><b>⚠ 社外の宛先 ${extVisible.length}件が、互いのアドレスを見られる状態です。</b></p>` : ""}
        <div class="grid2 mt"><button class="btn" id="fix">戻って直す</button><button class="btn attack" id="go">このまま送る</button></div></div>`;
      area.querySelector("#send").disabled = true;
      box.scrollIntoView({ block: "nearest", behavior: "smooth" });
      box.querySelector("#fix").onclick = () => { box.innerHTML = ""; area.querySelector("#send").disabled = false; LT.log("s4", "defend", "confirm_fix", { n }); };
      box.querySelector("#go").onclick = () => commit(false);
    };
  };

  const updateScores = () => {
    ["none", "check"].forEach(c => {
      const r = runs.filter(x => x.cond === c);
      if (r.length) LT.setScore("s4.trial." + c, { correct: r.filter(x => x.ok).length, total: r.length, percent: Math.round(r.filter(x => x.ok).length / r.length * 100), note: c === "none" ? "確認なしで依頼どおりに送れた回数" : "確認ありで依頼どおりに送れた回数" });
    });
  };

  const showResults = () => {
    const card = el.querySelector("#resultCard");
    if (!runs.length) { card.hidden = true; return; }
    card.hidden = false;
    const stat = (c) => { const r = runs.filter(x => x.cond === c); return { n: r.length, miss: r.filter(x => !x.ok).length, leak: r.filter(x => x.type === "leak").length, sec: r.length ? (r.reduce((s, x) => s + x.seconds, 0) / r.length).toFixed(1) : "—" }; };
    const A = stat("none"), B = stat("check");
    const rate = (s) => s.n ? Math.round(s.miss / s.n * 100) + "%" : "—";
    el.querySelector("#results").innerHTML = `<div class="table-wrap"><table>
      <tr><th>条件</th><th>回数</th><th>ミス</th><th>うち漏えい</th><th>ミス率</th><th>平均時間</th></tr>
      <tr><td>A：確認なし</td><td>${A.n}</td><td>${A.miss}</td><td>${A.leak}</td><td><b>${rate(A)}</b></td><td>${A.sec} 秒</td></tr>
      <tr><td>B：確認あり</td><td>${B.n}</td><td>${B.miss}</td><td>${B.leak}</td><td><b>${rate(B)}</b></td><td>${B.sec} 秒</td></tr></table></div>
      ${A.n >= LT.S4.ROUNDS && B.n >= LT.S4.ROUNDS ? `<div class="feedback ok mt">${A.miss > B.miss ? "確認ありのほうがミスが少なくなりました。確認の画面は、急いでいるときに見落としに気づくきっかけになります。" : A.miss === B.miss ? "今回はミスの数が同じでした。確認の画面に頼らず、もともと注意深く操作できていた可能性があります。クラス全体の結果と比べてみましょう。" : "今回は確認ありのほうがミスが多くなりました。確認の画面を読まずに「このまま送る」を押していないか、ふり返ってみましょう。"}<br><span class="small">確認にかかる時間（平均 ${A.sec} 秒 → ${B.sec} 秒）とのバランスも考えてみましょう。</span></div>` : `<p class="small mt">両方の条件を${LT.S4.ROUNDS}回ずつ終えると、まとめが表示されます。</p>`}`;
    LT.S4.chart(el.querySelector("#chart"), [{ label: "A 確認なし", rate: A.n ? A.miss / A.n : 0, n: A.n }, { label: "B 確認あり", rate: B.n ? B.miss / B.n : 0, n: B.n }]);
  };

  menu();

  LT.writingTask(el, "s4.defend.explain", {
    intro: { title: "ふり返り", text: "メールを送る前に、あなたはこれから何を確認しますか。" },
    practice: { title: "説明課題", text: "急いでいるときほどミスが起きやすいのはなぜか、この体験をもとに説明してください。確認の手順がなぜ効くのかにも触れること。" },
    inquiry: { title: "説明課題", text: "人のミスは0にはできません。「ミスが起きる前提で被害を小さくする」仕組み（確認画面、社外ドメイン警告、送信の取り消し、共有範囲の初期設定を狭くするなど）を、この測定結果と時間の増加も踏まえて論じてください。" }
  });
};

LT.S4.chart = function (container, bars) {
  const W = 560, H = 210, padL = 44, padB = 34, padT = 20;
  const bw = 120, gap = (W - padL - bw * bars.length) / (bars.length + 1);
  let g = "";
  [0, 0.5, 1].forEach(v => { const y = H - padB - (H - padB - padT) * v; g += `<line x1="${padL}" y1="${y}" x2="${W - 8}" y2="${y}" stroke="#e2e6ee"/><text x="${padL - 6}" y="${y + 4}" font-size="11" text-anchor="end" fill="#586273">${v * 100}%</text>`; });
  bars.forEach((b, i) => {
    const x = padL + gap * (i + 1) + bw * i, h = (H - padB - padT) * b.rate;
    g += `<rect x="${x}" y="${H - padB - h}" width="${bw}" height="${Math.max(h, 1)}" rx="6" fill="${i === 0 ? "#c62828" : "#1565c0"}"/>`;
    g += `<text x="${x + bw / 2}" y="${H - padB - h - 6}" font-size="13" font-weight="700" text-anchor="middle" fill="#18202f">${b.n ? Math.round(b.rate * 100) + "%" : "—"}</text>`;
    g += `<text x="${x + bw / 2}" y="${H - padB + 18}" font-size="12" text-anchor="middle" fill="#586273">${b.label}（${b.n}回）</text>`;
  });
  container.innerHTML = `<p class="small mb0">条件ごとのミス率（低いほど良い）</p><svg viewBox="0 0 ${W} ${H}" class="chart" style="max-width:560px" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">${g}</svg>`;
};

LT.STAGE_IMPL["4"] = { see: LT.S4.see, break: LT.S4.break, defend: LT.S4.defend };
