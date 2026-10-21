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
    },
    {
      id: "q6", kind: "fake", channel: "sms",
      from: "ソラ証券",
      subject: "",
      body: "【ソラ証券】お客様の口座で不審な取引を検知しました。取引を制限しています。至急ご本人確認をお願いします。",
      url: "https://sora-sec.account-check.com/login",
      reasons: ["SMSの送信者名「ソラ証券」は偽装できるので、名前だけでは信用できない", "「不審な取引」「至急」と不安をあおって急がせている", "本当のドメインは account-check.com で、sora-sec は飾り"]
    },
    {
      id: "q7", kind: "real", channel: "sms",
      from: "ソラ証券",
      subject: "",
      body: "【ソラ証券】新しい端末からログインがありました。お心当たりがない場合は、公式アプリからパスワードを変更してください。（このメッセージにリンクはありません）",
      url: "",
      reasons: ["リンクがなく、何かを入力させようとしていない", "確認先として、自分で開く公式アプリを案内している", "ログインのお知らせは、乗っ取りに早く気づくための正しい通知"]
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

/* 登録ドメイン（本当の持ち主を示す部分）を取り出す。co.jp などの2段の区分に対応（教材用の簡略版） */
LT.S2.splitHost = function (host) {
  const labels = host.toLowerCase().split(".");
  const sld = ["co", "ne", "or", "ac", "go", "ed", "lg", "ad", "gr"];
  const n = labels.length >= 3 && labels[labels.length - 1] === "jp" && sld.includes(labels[labels.length - 2]) ? 3 : 2;
  return { reg: labels.slice(-n).join("."), sub: labels.slice(0, -n).join(".") };
};

/* 没入シミュレーション：スマホに偽SMSが届いてから乗っ取りまでを順に体験する。
   すべて架空。入力欄は作らず、行動をボタンで選ぶ（本物の情報はどこにも送られない）。 */
LT.S2.sim = function (el) {
  const box = document.createElement("div");
  box.className = "card sim-card";
  box.innerHTML = `
    <div class="card-label">体験する</div>
    <h2>あなたのスマホに、1通のメッセージが届いた</h2>
    <p class="mb0">これは、2025年に多発した証券口座の乗っ取りを、架空の「ソラ証券」で再現したものです。あなたならどうするか、実際に操作してみましょう。</p>
    <div class="phone" id="phone"></div>
    <div class="sim-note" id="simNote"></div>`;
  el.appendChild(box);
  const phone = box.querySelector("#phone"), note = box.querySelector("#simNote");
  let outcome = null;
  const go = (s) => { LT.log("s2", "sim", "scene", s); render(s); };

  function render(scene) {
    if (scene === "lock") {
      phone.className = "phone wall";
      phone.innerHTML = `
        <div class="ph-status"><span>9:41</span><span>5G ▮▮▮</span></div>
        <div class="ph-clock"><div class="ph-time">9:41</div><div class="ph-date">6月12日 木曜日</div></div>
        <div class="ph-notif pop-in">
          <div class="pn-top"><span class="pn-app">メッセージ</span><span class="pn-now">今</span></div>
          <div class="pn-title">ソラ証券</div>
          <div class="pn-body">【ソラ証券】お客様の口座で不審な取引を検知しました。至急ご確認ください。</div>
        </div>
        <button class="ph-tap" id="toMsg">通知をタップして開く</button>`;
      phone.querySelector("#toMsg").onclick = () => go("msg");
      note.innerHTML = `<span class="small">通知が届きました。多くの人が、驚いてそのままタップしてしまいます。</span>`;
    }
    else if (scene === "msg") {
      phone.className = "phone app";
      phone.innerHTML = `
        <div class="ph-bar"><span class="ph-back">‹</span><b>ソラ証券</b><span></span></div>
        <div class="ph-thread">
          <div class="ph-sender">SMS・送信元は確認できません</div>
          <div class="ph-bubble pop-in">【ソラ証券】お客様の口座で不審な取引を検知しました。取引を制限しています。至急ご本人確認をお願いします。<br><a class="ph-link" id="toSite">https://sora-sec.account-check.com/login</a></div>
        </div>
        <div class="ph-choices"><button class="btn attack sm" id="open">リンクを開く</button><button class="btn sm" id="stopMsg">あやしい。開かない</button></div>`;
      phone.querySelector("#toSite").onclick = phone.querySelector("#open").onclick = () => go("load");
      phone.querySelector("#stopMsg").onclick = () => { outcome = "safe-early"; go("end"); };
      note.innerHTML = `<span class="small">リンクのドメインは <b class="mono">account-check.com</b>。ソラ証券の本物（sora-sec.co.jp）とは別です。ここで気づければ一番安全ですが、急いでいると見落としがちです。</span>`;
    }
    else if (scene === "load") {
      phone.className = "phone app";
      phone.innerHTML = `
        <div class="ph-urlbar"><span class="ph-lock">🔒</span><span class="ph-url">sora-sec.account-check.com</span></div>
        <div class="ph-loading"><div class="ph-progress" id="prog"></div></div>
        <div class="ph-loadmsg">読み込み中…</div>`;
      setTimeout(() => { phone.querySelector("#prog") && (phone.querySelector("#prog").style.width = "100%"); }, 50);
      setTimeout(() => go("site"), LT.mapReduceMotion() ? 200 : 1100);
      note.innerHTML = `<span class="small">鍵マーク（🔒）が付いていますが、これは「通信が暗号化されている」という意味で、「本物のサイト」という意味ではありません。偽サイトにも鍵は付きます。</span>`;
    }
    else if (scene === "site") {
      phone.className = "phone app";
      phone.innerHTML = `
        <div class="ph-urlbar"><span class="ph-lock">🔒</span><span class="ph-url" id="urlbar">sora-sec.account-check.com</span></div>
        <div class="ph-site">
          <div class="site-logo">🌤 ソラ証券</div>
          <div class="site-warn">⚠ 24時間以内に確認しないと口座を凍結します</div>
          <label class="site-field">ログインID<span class="site-input filled">sora_taro</span></label>
          <label class="site-field">パスワード<span class="site-input filled">••••••••</span></label>
          <label class="site-field">取引暗証番号<span class="site-input filled">••••</span></label>
          <button class="site-btn" id="login">ログイン</button>
          <button class="btn sm ph-cancel" id="stopSite">やっぱり、やめておく</button>
        </div>`;
      phone.querySelector("#login").onclick = () => { outcome = "caught"; go("steal"); };
      phone.querySelector("#stopSite").onclick = () => { outcome = "safe-late"; go("end"); };
      note.innerHTML = `<span class="small">本物そっくりの画面です。入力欄にはあらかじめ例が入れてあります（あなたの本当の情報は使いません）。<b>「ログイン」を押すと何が起きる</b>か、見てみましょう。</span>`;
    }
    else if (scene === "steal") {
      phone.className = "phone app";
      phone.innerHTML = `
        <div class="steal-stage">
          <div class="steal-you">📱<span>あなた</span></div>
          <div class="steal-fake">🎭<span>偽サイト</span></div>
          <div class="steal-real">🏦<span>ソラ証券（本物）</span></div>
          <div class="steal-att">🕶️<span>攻撃者</span></div>
          <div class="steal-packet p1">ID・パスワード</div>
          <div class="steal-packet p2">そのまま中継</div>
        </div>`;
      note.innerHTML = `<span class="small">入力した情報は偽サイトから本物のサイトへ<b>その場で中継</b>され、攻撃者がログインします。確認コードを入れても、同じように中継されます。</span>`;
      setTimeout(() => go("end"), LT.mapReduceMotion() ? 300 : 2400);
    }
    else if (scene === "end") {
      LT.addMapEdge("phish");
      const win = outcome === "caught";
      if (win) LT.addMapEdge("cred");
      LT.setScore("s2.sim", { correct: win ? 0 : 1, total: 1, percent: win ? 0 : 100, note: { "safe-early": "リンクを開かず回避", "safe-late": "入力直前で回避", caught: "乗っ取り成立（体験）" }[outcome] });
      phone.className = "phone end " + (win ? "bad" : "good");
      phone.innerHTML = `
        <div class="ph-result">
          <div class="pr-icon">${win ? "⚠" : "🛡️"}</div>
          <div class="pr-title">${win ? "口座が乗っ取られました" : "被害を防げました"}</div>
          <div class="pr-sub">${win ? "（これはシミュレーションです。本当の被害はありません）" : outcome === "safe-early" ? "リンクを開かなかったのが正解でした。" : "入力する前にやめられたのが正解でした。"}</div>
          <button class="btn sm" id="again">もう一度ためす</button>
        </div>`;
      phone.querySelector("#again").onclick = () => { outcome = null; go("lock"); };
      note.innerHTML = `<div class="feedback ${win ? "ng" : "ok"} mb0"><b>見破る手がかりは3つ。</b>
        <ol class="mb0"><li><b>送信元</b>：SMSの差出人名は偽装できる。名前だけで信用しない。</li>
        <li><b>リンクのドメイン</b>：本当の持ち主は右端に近い部分（ここでは account-check.com）。</li>
        <li><b>緊急性</b>：「至急」「凍結」で急がされたら、いったん止まる。リンクではなく公式アプリから確かめる。</li></ol></div>`;
    }
  }
  go("lock");
};

/* ---------- ① 見る ---------- */
LT.S2.see = function (el) {
  LT.S2.sim(el);
  const more = document.createElement("div");
  el.appendChild(more);
  el = more;
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
    const d = LT.S2.splitHost(host);
    return { scheme: m[1] || "", host, sub: d.sub, reg: d.reg, path: m[3] || "" };
  };
  const render = () => {
    const p = parse(u.value.trim());
    if (!p) { demo.textContent = "URLとして読めません"; verdict.innerHTML = ""; return; }
    demo.innerHTML = `<span class="sch">${LT.esc(p.scheme)}</span>${p.sub ? `<span class="subd">${LT.esc(p.sub)}.</span>` : ""}<span class="dom">${LT.esc(p.reg)}</span><span class="path">${LT.esc(p.path)}</span>`;
    const suspicious = /verify|login|secure|account|-info|confirm/i.test(p.reg) || /soramaii|soramai1|s0ra/i.test(p.reg);
    verdict.innerHTML = `このページの本当の持ち主は <b class="mono">${LT.esc(p.reg)}</b> です。${p.sub ? `左側の <span class="mono">${LT.esc(p.sub)}</span> は飾りで、持ち主とは関係ありません。` : ""} ${suspicious ? '<span class="badge ng">本物の会社のドメインか、よく確かめましょう</span>' : ""}`;
  };
  u.oninput = render; render();
  LT.S2.relay(el);
  el.insertAdjacentHTML("beforeend", LT.deeper("送信元のチェックを通る偽メールが増えている", `<p>メールには、送信元のドメインが本物かを受信側が確かめる仕組み（${LT.T("DMARC")} など）があります。2025年に通信事業者へ対応が求められると、攻撃者は手口を変えました。</p>
    <p>フィッシング対策協議会の報告では、2025年2月には、本物のドメインになりすましたメールが全体の約69%を占めていました。ところが12月には、攻撃者が<b>自分で取った別のドメイン</b>を使い、送信元のチェックを正しく通るメールが約75%を占めるようになりました。</p>
    <p class="mb0">つまり「迷惑メールに分けられなかった」「送信元のチェックを通った」ことは、本物の会社からのメールである証明にはなりません。最後は、ドメインそのものが本物かを人が確かめる必要があります。</p>`));
};

/* 中継型フィッシングの図（概念）。3つの列：あなた／偽サイト／本物のサイト */
LT.S2.RELAY = [
  { from: 0, to: 0, t: "「口座で不審な取引を検知。至急確認を」というSMSが届く", who: "you" },
  { from: 0, to: 1, t: "リンクを開き、偽サイトでIDとパスワードを入力", who: "you" },
  { from: 1, to: 2, t: "偽サイトが、入力された内容をすぐに本物のサイトへ入力", who: "fake" },
  { from: 2, to: 0, t: "本物のサイトが、あなたのスマホに確認コードを送る", who: "real" },
  { from: 0, to: 1, t: "あなたは確認コードも偽サイトに入力してしまう", who: "you" },
  { from: 1, to: 2, t: "偽サイトがコードを中継 → 攻撃者のログインが成立", who: "fake", bad: true }
];
LT.S2.relay = function (el) {
  const box = document.createElement("div");
  box.className = "card";
  box.innerHTML = `<h2>確認コードがあっても、なぜ乗っ取られたのか</h2>
    <p>2025年の証券口座乗っ取りでは、${LT.T("ワンタイムパスワード")}（確認コード）を使っていても被害が出ました。偽サイトが、入力された内容をその場で本物のサイトへ送り込む${LT.T("中継型フィッシング")}だったからです。</p>
    <div class="relay"><div class="relay-cols"><div>📱 あなた</div><div>🎭 偽サイト</div><div>🏦 本物のサイト</div></div><div id="relaySteps"></div></div>
    <div class="row mt"><button class="btn primary" id="rNext">▶ 1つ進める</button><button class="btn ghost sm" id="rReset">最初から</button></div>
    <div id="relayEnd"></div>`;
  el.appendChild(box);
  let n = 0;
  const draw = () => {
    box.querySelector("#relaySteps").innerHTML = LT.S2.RELAY.slice(0, n).map((r, i) => {
      const l = Math.min(r.from, r.to), w = Math.abs(r.to - r.from);
      return `<div class="relay-row fade-in"><span class="relay-no">${i + 1}</span><div class="relay-lane">
        ${w ? `<div class="relay-arrow ${r.bad ? "bad" : ""} ${r.to < r.from ? "rev" : ""}" style="left:${l * 33.3 + 16.6}%;width:${w * 33.3}%"></div>` : `<div class="relay-dot" style="left:${r.from * 33.3 + 16.6}%"></div>`}
        </div><div class="relay-t ${r.bad ? "bad" : ""}">${r.t}</div></div>`;
    }).join("");
    box.querySelector("#rNext").disabled = n >= LT.S2.RELAY.length;
    box.querySelector("#relayEnd").innerHTML = n >= LT.S2.RELAY.length ? `<div class="feedback ng mt fade-in"><b>ポイント：</b>確認コードは「本物のサイトかどうか」を確かめてくれません。だから、偽サイトに入力すると、コードごと使われてしまいます。どうすれば防げるかは「なぜ守れるか」で確かめます。</div>` : "";
  };
  box.querySelector("#rNext").onclick = () => { n++; draw(); if (n === LT.S2.RELAY.length) LT.log("s2", "see", "relay_done"); };
  box.querySelector("#rReset").onclick = () => { n = 0; draw(); };
  draw();
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
};

LT.S2.selectBlock = function (part, label) {
  const opts = LT.S2.parts[part].map((o, i) => `<option value="${i}">${LT.esc(o.t)}</option>`).join("");
  return `<label class="field"><span>${label}</span><select data-part="${part}">${opts}</select></label>`;
};

/* ---------- ③ なぜ守れるか：判別課題（自動採点） ---------- */
LT.S2.defend = function (el) {
  const authBox = document.createElement("div");
  const spotBox = document.createElement("div");
  el.appendChild(spotBox);
  LT.S2.spot(spotBox);
  el.appendChild(authBox);
  LT.S2.auth(authBox);
  const quizWrap = document.createElement("div");
  el.appendChild(quizWrap);
  el = quizWrap;
  el.innerHTML = `
  <div class="card defend">
    <h2><span class="badge defend">防御者</span> 本物・偽物の判別課題</h2>
    <p>届いたメールやSMSが「本物」か「フィッシング（偽物）」かを見分けます。送信元・緊急性・リンクのドメインを確かめましょう。全${LT.S2.samples.length}問、終わると自動採点され、学習記録に残ります。</p>
    <div id="quiz"></div>
  </div>`;
  const quiz = el.querySelector("#quiz");
  const items = LT.shuffle(LT.S2.samples);
  let idx = 0, correct = 0, attempt = 0;
  const show = () => {
    if (idx >= items.length) return finish();
    const s = items[idx];
    if (idx > 0) quiz.scrollIntoView({ block: "start", behavior: "smooth" });
    quiz.innerHTML = `
    <div class="spread"><span class="small">${idx + 1} / ${items.length} 問</span><div class="progress" style="flex:1;max-width:240px"><div style="width:${idx / items.length * 100}%"></div></div></div>
    ${LT.S2.mailHTML(s, false)}
    <div class="grid2 mt"><button class="btn defend lg" data-a="real">✓ 本物だと思う</button><button class="btn attack lg" data-a="fake">⚠ フィッシングだと思う</button></div>
    <div id="fb"></div>`;
    quiz.querySelectorAll("button[data-a]").forEach(b => b.onclick = () => judge(s, b.dataset.a));
  };
  const judge = (s, ans) => {
    const ok = ans === s.kind;
    if (ok) correct++;
    LT.log("s2", "defend", "quiz_answer", { id: s.id, answer: ans, correct: ok });
    const fb = quiz.querySelector("#fb");
    quiz.querySelectorAll("button[data-a]").forEach(b => b.disabled = true);
    quiz.querySelector(".mail, .sms").outerHTML = LT.S2.mailHTML(s, true);
    const flags = LT.S2.FLAGS[s.id] || [];
    fb.innerHTML = `<div class="feedback ${ok ? "ok" : "ng"} fade-in"><p><b>${ok ? "正解！" : "おしい！"}</b> これは<b>${s.kind === "real" ? "本物" : "フィッシング（偽物）"}</b>です。${s.kind === "fake" ? "赤い枠と番号が、見抜くための手がかりです。" : ""}</p>
      <ol class="mb0">${s.reasons.map((r, i) => `<li>${LT.esc(r)}</li>`).join("")}</ol>
      ${s.url ? `<p class="small mt mb0">リンクの本当の持ち主：</p>${LT.S2.urlHTML(s.url)}` : ""}</div>
      <button class="btn primary block mt" id="next">${idx + 1 < items.length ? "次の問題へ ›" : "結果を見る ›"}</button>`;
    fb.querySelector("#next").onclick = () => { idx++; show(); };
    fb.querySelector("#next").scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  const finish = () => {
    const pct = Math.round(correct / items.length * 100);
    attempt++;
    LT.setScore(attempt === 1 ? "s2.phish_quiz" : "s2.phish_quiz.retry" + (attempt - 1), { correct, total: items.length, percent: pct, note: attempt === 1 ? "フィッシング判別課題の正答率（1回目）" : `${attempt}回目` });
    quiz.innerHTML = `<div class="card ok center"><div class="huge">${correct} / ${items.length}</div><p>正答率 ${pct}%</p><p>見分けるコツは3つ。①<b>送信元</b>のドメイン、②<b>リンク</b>の本当のドメイン、③<b>緊急性</b>で急かされていないか。この正答率は学習記録に保存されました（事前・事後の比較に使えます）。</p><button class="btn" id="again">もう一度挑戦</button></div>`;
    quiz.querySelector("#again").onclick = () => { idx = 0; correct = 0; items.splice(0, items.length, ...LT.shuffle(LT.S2.samples)); show(); };
    LT.addMapEdge("cred");
  };
  show();

  LT.writingTask(el, "s2.defend.explain", {
    intro: { title: "ふり返り", text: "フィッシングメールを見分けるとき、あなたはこれからどこを確かめますか。" },
    practice: { title: "説明課題", text: "友達に「このメール本物かな？」と聞かれました。どこをどう確かめればよいか、手順を説明してください。" },
    inquiry: { title: "説明課題", text: "送信元アドレスの偽装は技術的な対策（DMARC など）でも減らせます。それでも「リンクのドメインを確認する」人の習慣が重要なのはなぜか、説明してください。" }
  });
};

/* 偽サイトを見破る：怪しい箇所をタップして見つける */
LT.S2.SPOTS = [
  { k: "url", t: "アドレスバーのドメイン", why: "本当の持ち主は account-check.com。ソラ証券の本物（sora-sec.co.jp）とは別の会社です。見た目の画面よりも、まずアドレスを確かめます。" },
  { k: "banner", t: "不安をあおる赤い帯", why: "「24時間以内に確認しないと取引停止」のように急がせて、落ち着いて確かめる時間を奪います。" },
  { k: "pin", t: "取引暗証番号まで入力させる欄", why: "ログインの画面で、取引暗証番号やカード番号まで一度に入力させるのは不自然です。盗んだ情報で取引や出金をするためです。" },
  { k: "text", t: "不自然な日本語", why: "「ご本人様確認を完成してください」のような、ふだん使わない言い回しは、偽サイトによく見られる手がかりの一つです（最近は自然な文章の偽サイトも増えているので、これだけに頼らないこと）。" }
];
LT.S2.spot = function (box) {
  const found = new Set();
  box.innerHTML = `<div class="card defend"><h2><span class="badge defend">防御者</span> 偽サイトを見破る</h2>
    <p>SMSのリンクを開くと、次の画面が出ました。<b>怪しいところを4つ</b>見つけて、タップしてください。</p>
    <div class="browser">
      <div class="br-bar"><span class="br-dots"><i></i><i></i><i></i></span><span class="br-url spot" data-k="url">🔒 https://sora-sec.<b>account-check.com</b>/login</span></div>
      <div class="br-body">
        <div class="br-banner spot" data-k="banner">⚠ お客様の口座で不審な取引を検知しました。24時間以内に確認しない場合、取引を停止します。</div>
        <div class="br-logo">🌤 ソラ証券</div>
        <p class="br-text spot" data-k="text">ご本人様確認を完成してください。</p>
        <div class="br-field">ログインID<span></span></div>
        <div class="br-field">パスワード<span></span></div>
        <div class="br-field spot" data-k="pin">取引暗証番号（4桁）<span></span></div>
        <div class="br-btn">ログイン</div>
      </div>
    </div>
    <div class="row mt"><span class="small" id="spotCount">見つけた数：0 / 4</span><button class="btn ghost sm" id="spotHint">ヒント</button></div>
    <ol class="spot-list" id="spotList"></ol>
    <p class="small">🔒（鍵マーク）は「通信が暗号化されている」という意味で、「本物のサイト」という意味ではありません。偽サイトにも鍵マークは付きます。</p></div>`;
  const list = box.querySelector("#spotList");
  box.querySelectorAll(".spot").forEach(el => el.onclick = () => {
    const k = el.dataset.k;
    if (found.has(k)) return;
    found.add(k); el.classList.add("found");
    const sp = LT.S2.SPOTS.find(x => x.k === k);
    list.insertAdjacentHTML("beforeend", `<li class="fade-in"><b>${sp.t}</b><br><span class="small">${sp.why}</span></li>`);
    box.querySelector("#spotCount").textContent = `見つけた数：${found.size} / 4`;
    LT.log("s2", "defend", "spot", k);
    if (found.size === 4) { LT.setScore("s2.spot", { correct: 4, total: 4, percent: 100, note: "偽サイトの怪しい箇所" }); LT.toast("4つすべて見つけました！"); }
  });
  box.querySelector("#spotHint").onclick = () => {
    const left = LT.S2.SPOTS.find(x => !found.has(x.k));
    if (left) { const el = box.querySelector(`.spot[data-k=${left.k}]`); el.classList.add("hint"); setTimeout(() => el.classList.remove("hint"), 1500); }
  };
};

/* 認証方式の比較 */
LT.S2.AUTH = [
  { k: "pw", icon: "🔤", name: "パスワードだけ", a: false, b: false, note: "知っている人なら誰でも入れる。" },
  { k: "otp", icon: "🔢", name: "パスワード＋確認コード", a: true, b: false, note: "パスワードが漏れただけなら止まる。しかし確認コードは本物と偽物を区別しないため、偽サイトに入力すると中継されてしまう。" },
  { k: "passkey", icon: "👆", name: "パスキー", a: true, b: true, note: "そもそも盗まれるパスワードがない。登録した本物のサイトでしか働かないので、偽サイトでは使えない（フィッシングに強い）。" }
];
LT.S2.auth = function (box) {
  box.innerHTML = `<div class="card defend"><h2><span class="badge defend">防御者</span> だまされても守れる認証はどれ？</h2>
    <p>${LT.T("パスキー")}は、スマホやPCの指紋・顔認証などでログインする方式です。2025年の事件の後、日本証券業協会はログインなどで「フィッシングに強い多要素認証」（パスキーなど）を必須にする方向でルールを見直しました。</p>
    <div id="authPred"></div>
    <div id="authTable" hidden>
      <div class="auth-grid"><div></div><div class="auth-h">場面A<br><small>別のサービスからパスワードが漏れていた</small></div><div class="auth-h">場面B<br><small>偽サイトに全部入力してしまった</small></div>
      ${LT.S2.AUTH.map(m => `<div class="auth-m"><span>${m.icon}</span>${m.name}</div><div class="auth-r ${m.a ? "ok" : "ng"}">${m.a ? "🛡️ 止まる" : "⚠ 乗っ取られる"}</div><div class="auth-r ${m.b ? "ok" : "ng"}">${m.b ? "🛡️ 止まる" : "⚠ 乗っ取られる"}</div><div class="auth-note">${m.note}</div>`).join("")}
      </div>
      <div class="feedback ok mt"><b>パスキーが使えないサービスでは：</b>メールやSMSのリンクからログインせず、公式アプリやブックマークから開く習慣が、偽サイトに入力しないための一番の守りになります。</div>
    </div></div>`;
  LT.prediction(box.querySelector("#authPred"), "s2.auth.pred", "偽サイトに入力してしまった場合でも、乗っ取りを防げる可能性が高いのはどれ？",
    LT.S2.AUTH.map(m => ({ text: `${m.icon} ${m.name}`, correct: m.k === "passkey" })),
    "パスキーは本物のサイトとだけ結びついているので、偽サイトでは働きません。確認コードは、入力した先が本物かどうかを確かめてくれません。",
    (ok) => { box.querySelector("#authTable").hidden = false; LT.setScore("s2.auth", { correct: ok ? 1 : 0, total: 1, percent: ok ? 100 : 0, note: "認証方式の予想" }); });
  if (LT.state.answers["s2.auth.pred"]) box.querySelector("#authTable").hidden = false;
};

/* 判別課題の「怪しい箇所」：reasons の順番に対応（from / subject / body / url） */
LT.S2.FLAGS = {
  q1: ["from", "body", "url"],
  q3: ["url", "body", null],
  q5: ["from", "url", "body"],
  q6: ["from", "body", "url"]
};

/* URL を「飾り」と「本当のドメイン」に色分けしたHTML */
LT.S2.urlHTML = function (url) {
  const m = url.match(/^(https?:\/\/)?([^\/]+)(\/.*)?$/i);
  if (!m) return `<div class="urlbox">${LT.esc(url)}</div>`;
  const { reg, sub } = LT.S2.splitHost(m[2]);
  return `<div class="urlbox"><span class="sch">${LT.esc(m[1] || "")}</span>${sub ? `<span class="subd">${LT.esc(sub)}.</span>` : ""}<span class="dom">${LT.esc(reg)}</span><span class="path">${LT.esc(m[3] || "")}</span></div>`;
};

/* メールアプリ風の表示。reveal=true で怪しい箇所に番号つきの枠 */
LT.S2.mailHTML = function (s, reveal) {
  const flags = reveal ? (LT.S2.FLAGS[s.id] || []) : [];
  const mark = (part) => { const n = flags.indexOf(part); return n >= 0 ? { cls: " flag", tag: `<span class="flag-n">${n + 1}</span>` } : { cls: "", tag: "" }; };
  const name = s.from.split("<")[0].trim();
  const f = mark("from"), sb = mark("subject"), b = mark("body"), u = mark("url");
  if (s.channel === "sms") {
    return `<div class="sms mt"><div class="sms-hd"><span class="${f.cls}">${LT.esc(s.from)}</span>${f.tag}<small>SMS（ショートメッセージ）</small></div>
      <div class="sms-bubble"><span class="${b.cls}">${LT.esc(s.body)}</span>${b.tag}${s.url ? `<br><span class="link${u.cls}">${LT.esc(s.url)}</span>${u.tag}` : ""}</div></div>`;
  }
  return `<div class="mail mt">
    <div class="hd"><div class="subj"><span class="${sb.cls}">${LT.esc(s.subject)}</span>${sb.tag}</div>
      <div><span class="avatar">${LT.esc(name.slice(0, 1))}</span><span class="${f.cls}">${LT.esc(s.from)}</span>${f.tag}</div></div>
    <div class="bd"><span class="${b.cls}">${LT.esc(s.body)}</span>${b.tag}\n\n<span class="link${u.cls}">${LT.esc(s.url)}</span>${u.tag}</div>
  </div>`;
};

LT.STAGE_IMPL["2"] = { see: LT.S2.see, break: LT.S2.break, defend: LT.S2.defend };
