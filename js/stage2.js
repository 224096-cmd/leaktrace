/* ステージ2 フィッシング */
window.LT = window.LT || {};
LT.routes = LT.routes || {};
LT.STAGE_IMPL = LT.STAGE_IMPL || {};

LT.S2 = {
  // 判別課題用のサンプル。すべて架空サービス。is: "real" | "fake"
  samples: [
    {
      id: "q1", kind: "fake",
      from: "SoraMail サポート <support@sora-mail-security.net>",
      subject: "【至急】24時間以内にパスワードを更新してください",
      body: "お客様のアカウントに不審なログインがありました。以下よりただちに確認しないとアカウントは停止されます。",
      url: "https://soramail.account-verify.net/login",
      display: "soramail.account-verify.net",
      reasons: ["送信元ドメインが本物の soramail.jp と違う（sora-mail-security.net）", "「24時間以内」「ただちに」と緊急性をあおっている", "本当のドメインは account-verify.net で、soramail は左側の飾り"]
    },
    {
      id: "q2", kind: "real",
      from: "SoraMail <no-reply@soramail.jp>",
      subject: "新しい端末からのログインのお知らせ",
      body: "お使いのアカウントに新しい端末からログインがありました。心当たりがある場合は操作は不要です。",
      url: "https://soramail.jp/activity",
      display: "soramail.jp",
      reasons: ["送信元が本物の soramail.jp", "本当のドメインが soramail.jp", "何かを今すぐ入力させようとしていない"]
    },
    {
      id: "q3", kind: "fake",
      from: "ソラ銀行 <info@sorabank.jp.account-login.com>",
      subject: "口座がロックされました",
      body: "セキュリティのため口座を一時停止しました。下記リンクから本人確認を行ってください。",
      url: "https://sorabank.jp.account-login.com/unlock",
      display: "sorabank.jp.account-login.com",
      reasons: ["sorabank.jp は飾りで、本当のドメインは account-login.com", "不安をあおって急がせている", "銀行がメールのリンクから認証を求めることは通常ない"]
    },
    {
      id: "q4", kind: "real",
      from: "モグモグショップ <order@mogumogu-shop.jp>",
      subject: "ご注文ありがとうございます（注文番号 8842）",
      body: "ご注文を受け付けました。発送までしばらくお待ちください。",
      url: "https://mogumogu-shop.jp/orders/8842",
      display: "mogumogu-shop.jp",
      reasons: ["送信元が本物の mogumogu-shop.jp", "本当のドメインが mogumogu-shop.jp", "入力を求めず、注文の報告だけ"]
    },
    {
      id: "q5", kind: "fake",
      from: "SoraMail <security@soramaii.jp>",
      subject: "アカウント確認のお願い",
      body: "規約変更に伴い再認証が必要です。こちらからログインしてください。",
      url: "https://soramaii.jp/login",
      display: "soramaii.jp",
      reasons: ["soramail の l（エル）が i（アイ）2つの soramaii にすり替えられている", "一見すると本物のドメインに見える", "ログインを促している"]
    }
  ],
  // 偽メールの構成要素（破るで選ぶ）
  parts: {
    sender: [
      { t: "no-reply@soramail.jp（本物）", trust: 0 },
      { t: "support@soramail-info.jp（それらしい別ドメイン）", trust: 2 },
      { t: "security@soramaii.jp（lをiにすり替え）", trust: 3 }
    ],
    urgency: [
      { t: "特になし（お知らせ）", trust: 0 },
      { t: "ご確認ください", trust: 1 },
      { t: "24時間以内に対応しないと停止します", trust: 3 }
    ],
    link: [
      { t: "soramail.jp（本物）", trust: 0 },
      { t: "soramail.account-verify.net（本物は飾り）", trust: 3 },
      { t: "soramaii.jp（そっくりな別ドメイン）", trust: 3 }
    ]
  }
};

/* ---------- ① 見る ---------- */
LT.S2.see = function (el) {
  el.innerHTML = `
  <div class="card">
    <h2>URLのどこが「本当の住所」か</h2>
    <p>${LT.T("フィッシング")}を見抜く鍵は${LT.T("ドメイン")}の読み方です。URLの本当の持ち主を示すのは、最初の「/」より前の、右端に近い部分です。左側はいくらでも飾りを付けられます。</p>
    <div class="urlbox" id="demo"></div>
    <p class="small">色分け：<span class="badge gray">方式</span> <span style="color:#b26a00">薄い=飾り（自由に付けられる）</span> <span style="color:#1565c0">濃い=本当のドメイン</span> <span class="badge gray">その後=ページ</span></p>
    <label class="field mt"><span>URLを入れて確かめる</span><input type="text" id="u" value="https://soramail.jp.account-verify.net/login"></label>
    <div class="card note mb0" id="verdict"></div>
  </div>`;
  const u = el.querySelector("#u"), demo = el.querySelector("#demo"), verdict = el.querySelector("#verdict");
  const parse = (url) => {
    let m = url.match(/^(https?:\/\/)?([^\/]+)(\/.*)?$/i);
    if (!m) return null;
    const host = m[2].split("@").pop().split(":")[0];
    const labels = host.split(".");
    const reg = labels.slice(-2).join("."); // 簡略化：登録ドメインは末尾2ラベル
    const sub = labels.slice(0, -2).join(".");
    return { scheme: m[1] || "", host, sub, reg, path: m[3] || "" };
  };
  const render = () => {
    const p = parse(u.value.trim());
    if (!p) { demo.textContent = "URLとして読めません"; verdict.innerHTML = ""; return; }
    demo.innerHTML = `<span class="sch">${LT.esc(p.scheme)}</span>${p.sub ? `<span class="subd">${LT.esc(p.sub)}.</span>` : ""}<span class="dom">${LT.esc(p.reg)}</span><span class="path">${LT.esc(p.path)}</span>`;
    const suspicious = /verify|login|secure|account|-info|confirm/i.test(p.reg) || /soramaii|soramai1|s0ra/i.test(p.reg);
    verdict.innerHTML = `このページの本当の持ち主は <b class="mono">${LT.esc(p.reg)}</b> です。${p.sub ? `左側の <span class="mono">${LT.esc(p.sub)}</span> は飾りで、持ち主とは関係ありません。` : ""} ${suspicious ? '<span class="badge ng">本物の会社のドメインか、よく確かめましょう</span>' : ""}`;
  };
  u.oninput = render; render();
  LT.markStep("s2", "see");
};

/* ---------- ② 破る ---------- */
LT.S2.break = function (el) {
  el.innerHTML = `
  <div class="card attack">
    <h2><span class="badge attack">攻撃者</span> 偽メールを組み立てる</h2>
    <p>どの要素が「だまされやすさ」を高めるのかを、自分で選んで確かめます。実際に送る機能はありません。選ぶと、右のプレビューと「だまされやすさ」メーターが変わります。</p>
    <div class="grid2">
      <div>
        ${LT.S2.selectBlock("sender", "送信元アドレス")}
        ${LT.S2.selectBlock("urgency", "本文の緊急性")}
        ${LT.S2.selectBlock("link", "リンクのドメイン")}
      </div>
      <div>
        <div class="mail" id="preview"></div>
        <div class="card ok mb0 mt"><div class="spread"><div>だまされやすさ</div><div class="big" id="score">—</div></div><div class="progress attack mt"><div id="bar"></div></div></div>
      </div>
    </div>
    <div class="xray mt" id="xray"></div>
  </div>`;
  el.querySelectorAll("select[data-part]").forEach(s => s.onchange = () => update(el));
  const update = (el) => {
    const pick = {};
    el.querySelectorAll("select[data-part]").forEach(s => pick[s.dataset.part] = LT.S2.parts[s.dataset.part][Number(s.value)]);
    const trust = pick.sender.trust + pick.urgency.trust + pick.link.trust;
    const pct = Math.round(trust / 9 * 100);
    el.querySelector("#score").textContent = pct + "%";
    el.querySelector("#bar").style.width = pct + "%";
    el.querySelector("#preview").innerHTML = `<div class="hd"><div><b>From:</b> ${LT.esc(pick.sender.t)}</div><div><b>件名:</b> ${pct > 50 ? "【至急】アカウント確認のお願い" : "アカウントのお知らせ"}</div></div><div class="bd">${pick.urgency.t === LT.S2.parts.urgency[2].t ? "お客様のアカウントに問題が検知されました。至急ご確認ください。\n\n" : "お知らせがあります。\n\n"}<span class="link">https://${LT.esc(pick.link.t.split("（")[0])}/login</span></div>`;
    el.querySelector("#xray").innerHTML = `<span class="hl">── 透視ビュー：なぜ効くか ──</span>
送信元の偽装度: <span class="${pick.sender.trust > 1 ? "ng" : "dim"}">${pick.sender.trust}/3</span>  ${pick.sender.trust > 1 ? "本物に似た別ドメイン" : "本物のアドレス"}
緊急性の圧力  : <span class="${pick.urgency.trust > 1 ? "ng" : "dim"}">${pick.urgency.trust}/3</span>  ${pick.urgency.trust > 1 ? "冷静な判断を奪う" : "ふつうの連絡"}
リンクの偽装  : <span class="${pick.link.trust > 1 ? "ng" : "dim"}">${pick.link.trust}/3</span>  ${pick.link.trust > 1 ? "本当のドメインが別物" : "本物のドメイン"}
<span class="dim"># だまされやすさは「送信元・緊急性・リンク」の</span>
<span class="dim"># 組み合わせで決まる。見抜く側はこの3つを確かめればよい。</span>`;
    LT.log("s2", "break", "compose", { trust: trust });
    if (pct >= 60) LT.addMapEdge("phish");
  };
  update(el);
  LT.markStep("s2", "break");
};

LT.S2.selectBlock = function (part, label) {
  const opts = LT.S2.parts[part].map((o, i) => `<option value="${i}">${LT.esc(o.t)}</option>`).join("");
  return `<label class="field"><span>${label}</span><select data-part="${part}">${opts}</select></label>`;
};

/* ---------- ③ なぜ守れるか：判別課題（自動採点） ---------- */
LT.S2.defend = function (el) {
  el.innerHTML = `
  <div class="card defend">
    <h2><span class="badge defend">防御者</span> 本物・偽物の判別課題</h2>
    <p>届いたメールが「本物」か「フィッシング（偽物）」かを見分けます。送信元・緊急性・リンクのドメインを確かめましょう。全${LT.S2.samples.length}問、終わると自動採点され、学習記録に残ります。</p>
    <div id="quiz"></div>
  </div>`;
  const quiz = el.querySelector("#quiz");
  const items = LT.shuffle(LT.S2.samples);
  let idx = 0, correct = 0;
  const show = () => {
    if (idx >= items.length) return finish();
    const s = items[idx];
    quiz.innerHTML = `
    <div class="spread"><span class="small">${idx + 1} / ${items.length} 問</span><div class="progress" style="width:120px"><div style="width:${idx / items.length * 100}%"></div></div></div>
    <div class="mail mt">
      <div class="hd"><div><b>From:</b> ${LT.esc(s.from)}</div><div><b>件名:</b> ${LT.esc(s.subject)}</div></div>
      <div class="bd">${LT.esc(s.body)}\n\n<span class="link">${LT.esc(s.url)}</span></div>
    </div>
    <div class="row mt"><button class="btn defend" data-a="real">本物だと思う</button><button class="btn attack" data-a="fake">フィッシングだと思う</button></div>
    <div id="fb"></div>`;
    quiz.querySelectorAll("button[data-a]").forEach(b => b.onclick = () => judge(s, b.dataset.a));
  };
  const judge = (s, ans) => {
    const ok = ans === s.kind;
    if (ok) correct++;
    LT.log("s2", "defend", "quiz_answer", { id: s.id, answer: ans, correct: ok });
    const fb = quiz.querySelector("#fb");
    quiz.querySelectorAll("button[data-a]").forEach(b => b.disabled = true);
    fb.innerHTML = `<div class="card ${ok ? "ok" : "note"} mt fade-in"><p><span class="badge ${ok ? "ok" : "ng"}">${ok ? "正解" : "不正解"}</span> これは<b>${s.kind === "real" ? "本物" : "フィッシング"}</b>です。</p><ul>${s.reasons.map(r => `<li>${LT.esc(r)}</li>`).join("")}</ul><p class="urlbox mono mb0">${LT.esc(s.url)}</p><button class="btn primary mt" id="next">${idx + 1 < items.length ? "次の問題へ" : "結果を見る"}</button></div>`;
    fb.querySelector("#next").onclick = () => { idx++; show(); };
  };
  const finish = () => {
    const pct = Math.round(correct / items.length * 100);
    LT.setScore("s2.phish_quiz", { correct, total: items.length, percent: pct, note: "フィッシング判別課題の正答率" });
    quiz.innerHTML = `<div class="card ok center"><div class="huge">${correct} / ${items.length}</div><p>正答率 ${pct}%</p><p>見分けるコツは3つ。①<b>送信元</b>のドメイン、②<b>リンク</b>の本当のドメイン、③<b>緊急性</b>で急かされていないか。この正答率は学習記録に保存されました（事前・事後の比較に使えます）。</p><button class="btn" id="again">もう一度挑戦</button></div>`;
    quiz.querySelector("#again").onclick = () => { idx = 0; correct = 0; show(); };
    LT.addMapEdge("cred");
  };
  show();

  LT.writingTask(el, "s2.defend.explain", {
    intro: { title: "ふり返り", text: "フィッシングメールを見分けるとき、あなたはこれからどこを確かめますか。" },
    practice: { title: "説明課題", text: "友達に「このメール本物かな？」と聞かれました。どこをどう確かめればよいか、手順を説明してください。" },
    inquiry: { title: "説明課題", text: "送信元アドレスの偽装は技術的な対策（DMARC など）でも減らせます。それでも「リンクのドメインを確認する」人の習慣が重要なのはなぜか、説明してください。" }
  });
  LT.markStep("s2", "defend");
};

LT.STAGE_IMPL["2"] = { see: LT.S2.see, break: LT.S2.break, defend: LT.S2.defend };
