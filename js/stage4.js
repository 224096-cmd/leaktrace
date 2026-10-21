/* ステージ4 人為ミス */
window.LT = window.LT || {};
LT.routes = LT.routes || {};
LT.STAGE_IMPL = LT.STAGE_IMPL || {};

LT.S4 = {
  recipients: [
    { email: "hogosha.aoki@example.com", name: "青木さん（保護者）", ext: true },
    { email: "inoue-family@example.net", name: "井上さん（保護者）", ext: true },
    { email: "u.kimura@example.org", name: "木村さん（保護者）", ext: true },
    { email: "sasaki.home@example.jp", name: "佐々木さん（保護者）", ext: true },
    { email: "shunin@sora-jh.ed.jp", name: "学年主任（校内）", ext: false }
  ],
  files: [
    { name: "2年_学年だより_6月号.pdf", icon: "📄", kind: "ok", meta: "PDF・1ページ・きのう作成" },
    { name: "2年_名簿_クラス編成用.xlsx", icon: "📊", kind: "leak", meta: "Excel・成績や家庭の様子の記述あり・きのう更新" },
    { name: "2年_学年だより_5月号.pdf", icon: "📄", kind: "old", meta: "PDF・1ページ・先月作成" },
    { name: "2年_成績一覧_1学期.xlsx", icon: "📊", kind: "leak", meta: "Excel・全員の点数・きのう更新" }
  ]
};

/* ---------- ① 見る ---------- */
LT.S4.see = function (el) {
  el.innerHTML = `
  <div class="card">
    <h2>攻撃者がいなくても、情報は漏れる</h2>
    <p>漏えいの約3割は、送る人自身の<b>うっかりミス</b>です。メールでは、特に次の2つが多く起きています。</p>
    <div class="grid2">
      <div class="card note mb0"><h4>① 添付ファイルの取り違え</h4><p class="small mb0">名前の似たファイルを選んでしまう。上の事件ファイルでは、学年だよりのつもりで、成績や家庭環境まで書かれた名簿を添付してしまった。</p></div>
      <div class="card note mb0"><h4>② ${LT.T("CC")}と${LT.T("BCC")}の取り違え</h4><p class="small mb0">CCに入れた宛先は受信者全員に見える。保護者どうしや顧客どうしに、互いのメールアドレスが知られてしまう。</p></div>
    </div>
  </div>`;
  LT.prediction(el, "s4.see.pred", "保護者30人へ同じお知らせを送ります。全員のアドレスをCC欄に入れて送ると、何が起きる？",
    [{ text: "問題ない。宛先は送った自分にしか見えない" }, { text: "受け取った30人全員に、ほかの29人のメールアドレスが見えてしまう", correct: true }, { text: "メールが届かない" }],
    "CCは受信者全員に宛先が見えます。メールアドレスも、誰の保護者かが分かれば個人情報です。互いに見せない場合はBCCを使います。");
  LT.S4.share(el);
  el.insertAdjacentHTML("beforeend", LT.deeper("ミスは「人の注意」だけでは防ぎきれない", `<p>人は急いでいるときや慣れた作業ほど、確認を飛ばしがちです。そこで、ミスが起きにくい・起きても被害が小さい仕組みを組み合わせます。</p>
    <ul><li><b>送信の保留</b>：送信ボタンを押してから数分間は実際には送らず、取り消せるようにする</li>
    <li><b>社外ドメインの警告</b>：学校や会社の外のアドレスが入っていると、送る前に目立つ警告を出す</li>
    <li><b>多人数への送信の制限</b>：一定人数を超える宛先はToやCcに入れられないようにし、一斉配信の仕組みを使う</li>
    <li><b>共有範囲の初期設定を狭くする</b>：最初から「制限付き」にしておき、広げるときだけ操作が必要にする</li>
    <li><b>そもそも載せない</b>：連絡用の名簿に、成績や家庭の様子など不要な情報を書かない</li></ul>
    <p class="mb0">ステージ4の③では、このうち「送る前の確認」に本当に効き目があるかを、自分の操作で確かめます。</p>`));
};

/* 共有リンクの公開範囲：設定を切り替えると、見られる人の範囲が変わる */
LT.S4.SHARE = [
  { k: "restricted", icon: "🔒", t: "制限付き（招待した人だけ）", ring: 1, who: "あなたが招待した先生2人だけが開けます。リンクが転送されても、招待されていない人は開けません。" },
  { k: "link", icon: "🔗", t: "リンクを知っている全員", ring: 2, who: "リンクを知っていれば誰でも開けます。メールやチャットで転送されると、どこまで広がるか分かりません。" },
  { k: "public", icon: "🌐", t: "ウェブ上で一般公開", ring: 3, who: "検索で見つかる可能性があり、世界中の誰でも開けます。" }
];
LT.S4.share = function (el) {
  const box = document.createElement("div");
  box.className = "card";
  box.innerHTML = `<h2>もう一つの「うっかり」：共有の設定</h2>
    <p>クラウドでファイルやアンケートの回答を共有するとき、公開範囲の設定を間違えて、名簿や申込者の情報を誰でも見られる状態にしてしまう事故がくり返し起きています。<b>「2年_保護者連絡先.xlsx」</b>の共有設定を切り替えて、見られる人の範囲を確かめましょう。</p>
    <div class="grid2">
      <div class="share-dlg"><div class="share-hd">「2年_保護者連絡先.xlsx」を共有</div>
        ${LT.S4.SHARE.map((o, i) => `<label class="share-opt"><input type="radio" name="share" value="${i}" ${i === 0 ? "checked" : ""}><span class="share-i">${o.icon}</span><span>${o.t}</span></label>`).join("")}
      </div>
      <div><svg viewBox="0 0 300 300" class="chart" id="rings" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif"></svg></div>
    </div>
    <div id="shareInfo"></div>`;
  el.appendChild(box);
  const draw = (i) => {
    const o = LT.S4.SHARE[i];
    const rings = [
      { r: 140, t: "インターネット上の誰でも", n: 3 },
      { r: 100, t: "リンクを転送された人", n: 2 },
      { r: 60, t: "招待した人", n: 1 }
    ];
    let g = "";
    rings.forEach(rg => {
      const lit = o.ring >= rg.n;
      g += `<circle cx="150" cy="150" r="${rg.r}" fill="${lit ? (rg.n === 1 ? "#e5f0fb" : rg.n === 2 ? "#fff4e0" : "#fdecec") : "#f6f8fc"}" stroke="${lit ? (rg.n === 1 ? "#1565c0" : rg.n === 2 ? "#a35f00" : "#c62828") : "#e2e6ee"}" stroke-width="2"/>`;
    });
    rings.forEach(rg => { g += `<text x="150" y="${150 - rg.r + 18}" text-anchor="middle" font-size="11" font-weight="700" fill="${o.ring >= rg.n ? "#18202f" : "#b0b8c6"}">${rg.t}</text>`; });
    g += `<circle cx="150" cy="150" r="22" fill="#2b5fd9"/><text x="150" y="155" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">ファイル</text>`;
    box.querySelector("#rings").innerHTML = g;
    box.querySelector("#shareInfo").innerHTML = `<div class="feedback ${o.ring === 1 ? "ok" : "ng"} mt"><b>${o.icon} ${o.t}</b><br>${o.who}${o.ring > 1 ? "<br>個人情報を含むファイルは、「制限付き」にして必要な人だけを招待します。" : ""}</div>`;
    LT.log("s4", "see", "share", o.k);
  };
  box.querySelectorAll("input[name=share]").forEach(r => r.onchange = () => draw(Number(r.value)));
  draw(0);
};

/* ---------- ② 破る（体験）：時間に追われての一斉送信 ---------- */
LT.S4.break = function (el) {
  const files = LT.shuffle(LT.S4.files);
  el.innerHTML = `
  <div class="card attack">
    <h2><span class="badge warn">体験</span> 終業前の、いそがしい一斉送信</h2>
    <p>あなたは架空の「そら中学校」の先生です。会議の合間に「<b>2年生の保護者へ、6月号の学年だよりを送っておいて。保護者どうしのアドレスは見えないように。学年主任にも写しを</b>」と頼まれました。次の会議まであと少しです。</p>
    <div class="spread"><div class="timer" id="timer">25.0</div><span class="small">急かされると確認がおろそかになりがちです</span></div>
    <div class="mailer mt" id="form">
      <div class="mailer-row"><b>添付</b><div class="file-pick" id="files">${files.map((f, i) => `<label class="file"><input type="radio" name="file" value="${LT.S4.files.indexOf(f)}"><span class="file-icon">${f.icon}</span><span><span class="file-name">${f.name}</span><small>${f.meta}</small></span></label>`).join("")}</div></div>
      <div class="table-wrap"><table><tr><th>宛先</th><th>To</th><th>Cc</th><th>Bcc</th></tr>
      ${LT.S4.recipients.map((r, i) => `<tr><td class="small">${r.email}<br><span class="muted">${r.name}</span></td>
        <td><input type="radio" name="r${i}" value="to" checked></td><td><input type="radio" name="r${i}" value="cc"></td><td><input type="radio" name="r${i}" value="bcc"></td></tr>`).join("")}
      </table></div>
      <button class="btn attack block mt" id="send">送信する</button>
    </div>
    <div id="result"></div>
  </div>`;
  const form = el.querySelector("#form"), timerEl = el.querySelector("#timer");
  let t = 25.0, done = false;
  const timer = setInterval(() => { t -= 0.1; if (t <= 0) { t = 0; clearInterval(timer); if (!done) submit(true); } timerEl.textContent = t.toFixed(1); timerEl.classList.toggle("low", t < 8); }, 100);
  window.addEventListener("hashchange", () => { done = true; clearInterval(timer); }, { once: true });
  form.querySelector("#send").onclick = () => submit(false);

  function submit(timeout) {
    if (done) return; done = true; clearInterval(timer);
    const picks = LT.S4.recipients.map((r, i) => (form.querySelector(`input[name=r${i}]:checked`) || {}).value || "to");
    const fsel = form.querySelector("input[name=file]:checked");
    const file = fsel ? LT.S4.files[Number(fsel.value)] : null;
    const extVisible = picks.filter((p, i) => LT.S4.recipients[i].ext && p !== "bcc").length;
    const addrLeak = extVisible >= 2;
    const fileLeak = file && file.kind === "leak";
    const problems = [];
    if (fileLeak) problems.push(`<li><b>添付ファイルの取り違え：</b>「${file.name}」を保護者全員に送ってしまった。成績や家庭の情報が漏れる、最も重い事故です。</li>`);
    if (addrLeak) problems.push(`<li><b>宛先の取り違え：</b>保護者${extVisible}人のメールアドレスが、互いに見えてしまった。</li>`);
    if (file && file.kind === "old") problems.push(`<li><b>古い資料：</b>5月号を送ってしまった（漏えいではないが、訂正の連絡が必要）。</li>`);
    if (!file) problems.push(`<li><b>添付なし：</b>学年だよりを付け忘れた${timeout ? "（時間切れ）" : ""}。</li>`);
    const leaked = fileLeak || addrLeak;
    LT.setScore("s4.send", { correct: leaked ? 0 : 1, total: 1, percent: leaked ? 0 : 100, note: leaked ? "漏えい発生" : "漏えいなし" });
    LT.setScore("s4.attach", { correct: file && file.kind === "ok" ? 1 : 0, total: 1, percent: file && file.kind === "ok" ? 100 : 0, note: file ? file.name : "添付なし" });
    LT.log("s4", "break", "send", { picks, file: file ? file.name : "", timeout, addrLeak, fileLeak, seconds: Math.round((25 - t) * 10) / 10 });
    if (addrLeak) LT.addMapEdge("missend");
    if (fileLeak) LT.addMapEdge("attach");
    el.querySelector("#result").innerHTML = `<div class="feedback ${leaked ? "ng" : "ok"} mt fade-in">
      <b>${leaked ? "⚠ 漏えいが発生しました" : problems.length ? "漏えいはありませんが、ミスがありました" : "✓ 依頼どおりに送れました"}</b>${timeout ? "（時間切れで、その時点の内容のまま送信）" : ""}
      ${problems.length ? `<ul class="mb0">${problems.join("")}</ul>` : `<p class="mb0">6月号を選び、保護者はBCCにできました。よい確認です。</p>`}</div>
      <p class="small mt">実際の事件でも、送った後で受け取った人からの指摘で気づき、「開かずに削除してください」とお願いすることになりました。一度送ったメールは取り消せません。</p>`;
    form.querySelectorAll("input,button").forEach(x => x.disabled = true);
  }
};

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
