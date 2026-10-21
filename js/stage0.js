/* ステージ0 導入：漏えいはなぜ起きる？（統計・個人情報とは・情報セキュリティの3要素） */
window.LT = window.LT || {};
LT.routes = LT.routes || {};
LT.STAGE_IMPL = LT.STAGE_IMPL || {};

LT.S0 = {
  causes: [
    { k: "ウイルス感染・不正アクセス", n: 116, p: 64.4, color: "#c62828", stage: "ステージ1〜3" },
    { k: "誤表示・誤送信", n: 37, p: 20.5, color: "#00695c", stage: "ステージ4" },
    { k: "紛失・誤廃棄", n: 18, p: 10.0, color: "#8d6e63", stage: "ステージ4" },
    { k: "不正持ち出し・盗難", n: 7, p: 3.8, color: "#6a1b9a", stage: "ステージ3" }
  ],
  cards: [
    { t: "クラス名簿の「氏名」", a: "pi", why: "氏名は、それだけで特定の個人を識別できるので個人情報です。" },
    { t: "顔がはっきり写った写真", a: "pi", why: "顔の画像からも特定の個人を識別できるので、個人情報にあたります。" },
    { t: "「yamada.taro@example.jp」というメールアドレス", a: "pi", why: "氏名が分かるメールアドレスは、それ自体で個人を識別できるので個人情報です。" },
    { t: "通院している病院と病名", a: "sensitive", why: "病歴は「要配慮個人情報」。差別や偏見につながりやすいため、取得するときは原則として本人の同意が必要など、特に慎重に扱われます。" },
    { t: "三重県の今日の天気", a: "no", why: "特定の個人に関する情報ではないので、個人情報ではありません。" },
    { t: "出席番号「2年3組15番」（学校の名簿と照らし合わせれば誰か分かる）", a: "pi", why: "番号だけでは誰か分からなくても、ほかの情報（名簿）と簡単に照らし合わせて個人が分かる場合は、個人情報にあたります。" },
    { t: "市の人口や年齢別の人数をまとめた統計", a: "no", why: "個人が分からない形に集計した統計は、個人情報ではありません。" }
  ],
  cia: [
    { t: "誤送信で、名簿を関係のない人に見られた", a: "c" },
    { t: "ランサムウェアでシステムが止まり、商品を出荷できなくなった", a: "a" },
    { t: "不正にログインされ、会員の住所が勝手に書き換えられた", a: "i" },
    { t: "流出したパスワードの一覧が、闇サイトで売られていた", a: "c" },
    { t: "バックアップまで消され、データを元に戻せなかった", a: "a" }
  ],
  ciaName: { c: "機密性", i: "完全性", a: "可用性" },
  ciaDesc: { c: "見てよい人だけが見られること", i: "正しく、勝手に書き換えられていないこと", a: "使いたいときに使えること" }
};

/* あなたのデータの足あと：一日の場面と、情報を預けている先 */
LT.S0.DAY = [
  { time: "7:00", icon: "📱", scene: "スマホでSNSと天気をチェック", holder: "SNSの会社", data: ["名前・ニックネーム", "メールアドレス", "投稿した写真", "位置情報（許可していれば）"] },
  { time: "8:00", icon: "🚃", scene: "交通系ICカードで通学", holder: "鉄道会社", data: ["乗り降りした駅と時刻", "定期券の名前・年齢"] },
  { time: "9:00", icon: "🏫", scene: "学校で出席・小テスト", holder: "学校（教育委員会）", data: ["名前・住所・保護者の連絡先", "成績", "健康診断の結果"] },
  { time: "16:30", icon: "🏪", scene: "コンビニでポイントカードを使う", holder: "ポイントの会社", data: ["買った商品と時刻", "会員番号・生年月日"] },
  { time: "19:00", icon: "🛒", scene: "家族のアカウントで通販", holder: "通販サイト", data: ["住所・電話番号", "買ったもの", "クレジットカード情報"] },
  { time: "21:00", icon: "🎮", scene: "ゲームアプリで遊ぶ", holder: "ゲームの会社", data: ["メールアドレス", "課金の記録", "フレンドとのやりとり"] }
];
LT.S0.footprint = function (el) {
  const box = document.createElement("div");
  box.className = "card";
  box.innerHTML = `<h2>あなたの「データの足あと」</h2>
    <p>ある中高生の一日です。場面をタップすると、その時どこに、どんな情報を預けているかが図に加わります。漏えいは、この「預け先」のどこかで起きます。</p>
    <div class="day" id="day">${LT.S0.DAY.map((d, i) => `<button class="day-item" data-i="${i}"><span class="day-t">${d.time}</span><span class="day-i">${d.icon}</span><span class="day-s">${d.scene}</span></button>`).join("")}</div>
    <div class="fp-wrap"><svg id="fp" viewBox="0 0 640 340" class="chart" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif"></svg></div>
    <div id="fpInfo" class="small"></div>`;
  el.appendChild(box);
  const on = new Set();
  const draw = () => {
    const cx = 320, cy = 170, R = 128;
    let g = "";
    LT.S0.DAY.forEach((d, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / LT.S0.DAY.length;
      const x = cx + R * 1.75 * Math.cos(a) * 0.95, y = cy + R * Math.sin(a);
      const lit = on.has(i);
      g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${lit ? "#2b5fd9" : "#e2e6ee"}" stroke-width="${lit ? 3 : 1.5}" ${lit ? "" : 'stroke-dasharray="4 5"'}/>`;
      g += `<g opacity="${lit ? 1 : .35}"><rect x="${x - 70}" y="${y - 24}" width="140" height="48" rx="12" fill="${lit ? "#e8eefc" : "#fff"}" stroke="${lit ? "#2b5fd9" : "#cfd6e2"}" stroke-width="2"/>
        <text x="${x}" y="${y - 3}" text-anchor="middle" font-size="18">${d.icon}</text><text x="${x}" y="${y + 16}" text-anchor="middle" font-size="12" font-weight="700" fill="#18202f">${d.holder}</text></g>`;
    });
    g += `<circle cx="${cx}" cy="${cy}" r="40" fill="#2b5fd9"/><text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">あなた</text>`;
    box.querySelector("#fp").innerHTML = g;
    const n = on.size, items = [...on].reduce((s, i) => s + LT.S0.DAY[i].data.length, 0);
    box.querySelector("#fpInfo").innerHTML = n ? `<div class="feedback ok mt"><b>${n}か所</b>に、<b>${items}種類</b>の情報を預けています。${n === LT.S0.DAY.length ? "どこか1か所から漏れても、あなたの情報は外に出てしまいます。だから「預け先」の対策と、「自分の使い方」の両方が大切です。" : "ほかの場面もタップしてみましょう。"}</div>` : "";
  };
  box.querySelectorAll(".day-item").forEach(b => b.onclick = () => {
    const i = Number(b.dataset.i), d = LT.S0.DAY[i];
    on.add(i); b.classList.add("on");
    box.querySelectorAll(".day-item .day-d").forEach(x => x.remove());
    b.insertAdjacentHTML("beforeend", `<span class="day-d">${d.data.map(x => `<span class="chip">${x}</span>`).join("")}</span>`);
    LT.log("s0", "see", "footprint", i);
    draw();
  });
  draw();
};

/* ① 数字で見る */
LT.S0.see = function (el) {
  el.innerHTML = `<div class="card">
    <h2>漏えいの原因で、いちばん多いのは何？</h2>
    <p>2025年に上場企業とその子会社が公表した個人情報の漏えい・紛失事故は <b>180件</b>。漏れた人数は合計 <b>3,063万人分</b> で、日本の人口のおよそ4人に1人分にあたります。</p>
    <div id="pred"></div>
    <div id="chart" hidden></div>
  </div>`;
  const pred = el.querySelector("#pred");
  LT.prediction(pred, "s0.see.pred", "原因のうち、いちばん多いものはどれだと思う？",
    [{ text: "社員がパソコンやUSBメモリをなくした（紛失）" }, { text: "メールの送り先や添付ファイルを間違えた（誤送信）" }, { text: "ウイルス感染や不正アクセス（外からの攻撃）", correct: true }, { text: "社員がデータを持ち出した（内部不正）" }],
    "外からの攻撃が約3分の2を占めます。ただし、誤送信や紛失などの「うっかり」も合わせて約3割あり、攻撃者がいなくても漏えいは起きます。", () => { el.querySelector("#chart").hidden = false; });
  if (LT.state.answers["s0.see.pred"]) el.querySelector("#chart").hidden = false;
  const max = 70;
  el.querySelector("#chart").innerHTML = `<h3 class="mt">原因別の件数（2025年・上場企業）</h3>
    <div class="hbars">${LT.S0.causes.map(c => `<div class="hbar"><div class="hbar-k">${c.k}<small>${c.stage}で体験</small></div><div class="hbar-track"><div class="hbar-fill" style="width:${c.p / max * 100}%;background:${c.color}"></div><span class="hbar-v">${c.n}件（${c.p}%）</span></div></div>`).join("")}</div>
    <p class="small mt">出典：東京商工リサーチ調べ（上の「事件ファイル」を参照）。この教材では、多い原因から順に体験していきます。</p>`;
  LT.S0.footprint(el);
  el.insertAdjacentHTML("beforeend", LT.deeper("統計の数字を読むときの注意", `<p>2022年4月の改正個人情報保護法で、次のような漏えいは個人情報保護委員会への報告と本人への通知が義務になりました。</p>
    <ul><li>要配慮個人情報（病歴など）が含まれる</li><li>クレジットカード番号など、お金の被害につながるおそれがある</li><li>不正アクセスなど、悪意のある行為による</li><li>1,000人を超える</li></ul>
    <p class="mb0">それまで公表されなかった事故も数えられるようになったため、件数の増加には「実際に増えた分」と「見えるようになった分」の両方が含まれます。統計を比べるときは、制度の変化にも目を向けましょう。</p>`));
};

/* ② 仕分ける：これは個人情報？ */
LT.S0.break = function (el) {
  el.innerHTML = `<div class="card">
    <h2>これは「個人情報」？</h2>
    <p>${LT.T("個人情報保護法")}では、個人情報を「生きている個人に関する情報で、特定の個人を識別できるもの」と決めています。ほかの情報と照らし合わせて個人が分かる場合も含みます。カードを仕分けてみましょう。</p>
    <div id="cards"></div>
    <div id="sum"></div>
  </div>`;
  const box = el.querySelector("#cards");
  const res = {};
  LT.S0.cards.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "sort-card";
    d.innerHTML = `<div class="sort-q"><span class="qnum">${i + 1}</span>${c.t}</div>
      <div class="sort-btns"><button class="btn sm" data-a="pi">個人情報</button><button class="btn sm" data-a="sensitive">特に慎重に扱う個人情報</button><button class="btn sm" data-a="no">個人情報ではない</button></div><div class="sort-fb"></div>`;
    d.querySelectorAll("button").forEach(b => b.onclick = () => {
      const ok = b.dataset.a === c.a;
      res[i] = ok;
      d.querySelectorAll("button").forEach(x => { x.disabled = true; x.classList.toggle("picked", x === b); x.classList.toggle("right", x.dataset.a === c.a); });
      d.querySelector(".sort-fb").innerHTML = `<div class="feedback ${ok ? "ok" : "ng"}"><b>${ok ? "正解" : "ちがう"}</b> ${c.why}</div>`;
      LT.log("s0", "break", "sort", { card: i, answer: b.dataset.a, correct: ok });
      if (Object.keys(res).length === LT.S0.cards.length) {
        const n = Object.values(res).filter(Boolean).length;
        LT.setScore("s0.sort", { correct: n, total: LT.S0.cards.length, percent: Math.round(n / LT.S0.cards.length * 100), note: "個人情報の仕分け" });
        el.querySelector("#sum").innerHTML = `<div class="feedback ok mt"><b>${LT.S0.cards.length}問中 ${n}問 正解。</b> 名前や顔だけでなく、「照らし合わせれば分かる」情報も個人情報です。病歴などの${LT.T("要配慮個人情報")}は、漏れたときの影響が特に大きくなります。</div>`;
      }
    });
    box.appendChild(d);
  });
};

/* ③ 3つの要素 */
LT.S0.defend = function (el) {
  el.innerHTML = `<div class="card">
    <h2>守るものは「3つの要素」</h2>
    <p>${LT.T("情報セキュリティ")}では、情報を守るとは次の3つを保つことだと考えます。</p>
    <div class="grid3">${["c", "i", "a"].map(k => `<div class="cia cia-${k}"><b>${LT.S0.ciaName[k]}</b><span>${LT.S0.ciaDesc[k]}</span></div>`).join("")}</div>
    <h3 class="mt">次の出来事で損なわれたのは、どの要素？</h3>
    <div id="cia"></div><div id="ciaSum"></div>
  </div>`;
  const box = el.querySelector("#cia");
  const res = {};
  LT.S0.cia.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "sort-card";
    d.innerHTML = `<div class="sort-q"><span class="qnum">${i + 1}</span>${c.t}</div><div class="sort-btns">${["c", "i", "a"].map(k => `<button class="btn sm" data-a="${k}">${LT.S0.ciaName[k]}</button>`).join("")}</div>`;
    d.querySelectorAll("button").forEach(b => b.onclick = () => {
      const ok = b.dataset.a === c.a; res[i] = ok;
      d.querySelectorAll("button").forEach(x => { x.disabled = true; x.classList.toggle("picked", x === b); x.classList.toggle("right", x.dataset.a === c.a); });
      LT.log("s0", "defend", "cia", { item: i, answer: b.dataset.a, correct: ok });
      if (Object.keys(res).length === LT.S0.cia.length) {
        const n = Object.values(res).filter(Boolean).length;
        LT.setScore("s0.cia", { correct: n, total: LT.S0.cia.length, percent: Math.round(n / LT.S0.cia.length * 100), note: "3要素の判別" });
        el.querySelector("#ciaSum").innerHTML = `<div class="feedback ok mt"><b>${LT.S0.cia.length}問中 ${n}問 正解。</b> 個人情報の「漏えい」は${LT.S0.ciaName.c}が損なわれること。ランサムウェアは、データを盗むだけでなく使えなくもするので、${LT.S0.ciaName.c}と${LT.S0.ciaName.a}の両方を損ないます。</div>`;
      }
    });
    box.appendChild(d);
  });
  LT.writingTask(el, "s0.defend.explain", {
    intro: { title: "ふり返り", text: "あなたの身の回り（学校・家・スマホ）で、個人情報が入っているものを3つ挙げてみよう。" },
    practice: { title: "考えてみよう", text: "学校で個人情報が漏れるとしたら、どんな場面が考えられますか。原因の分類（外からの攻撃／うっかり／内部）を使って2つ挙げてください。" },
    inquiry: { title: "考えてみよう", text: "漏えい件数の統計を読むとき、2022年4月から漏えいの報告が義務になったという制度の変化は、数字にどう影響すると考えられますか。" }
  });
};

LT.STAGE_IMPL["0"] = { see: LT.S0.see, break: LT.S0.break, defend: LT.S0.defend };
