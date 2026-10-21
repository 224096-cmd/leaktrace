/* ステージ1 パスワード */
window.LT = window.LT || {};
LT.routes = LT.routes || {};
LT.STAGE_IMPL = LT.STAGE_IMPL || {};

LT.S1 = {
  // 架空の流出リスト（モグモグショップから漏れた「メール・パスワード・ハッシュ」）
  leak: [
    { email: "tanaka@example-sora.jp", pw: "password123", reuse: true },
    { email: "sato.h@example-sora.jp", pw: "sakura2020", reuse: true },
    { email: "yamada@example-sora.jp", pw: "qwerty", reuse: false },
    { email: "suzuki_k@example-sora.jp", pw: "ilovecats", reuse: true },
    { email: "ito.m@example-sora.jp", pw: "123456", reuse: false },
    { email: "watanabe@example-sora.jp", pw: "SoraShop!", reuse: false }
  ],
  charsets: [
    { id: "digit", label: "数字のみ（0-9）", size: 10, ex: "4821" },
    { id: "lower", label: "英小文字（a-z）", size: 26, ex: "sakura" },
    { id: "alnum", label: "英大小＋数字", size: 62, ex: "Sora2020" },
    { id: "full", label: "英大小＋数字＋記号", size: 95, ex: "S0ra!2o?" }
  ]
};

/* ---------- ① 見る ---------- */
LT.S1.see = async function (el) {
  const intro = LT.isIntro();
  el.innerHTML = `
  <div class="card">
    <h2>パスワードはそのまま保存されていない</h2>
    <p>まともなサービスは、あなたのパスワードを文字のまま保存しません。${LT.T("ハッシュ化")}という変換をかけて、元に戻せない${LT.T("ハッシュ値")}の形で保存します。下の欄に文字を打つと、${LT.T("WebCrypto")}（ブラウザ標準の暗号機能）で本物の${LT.T("SHA-256")}を計算します。</p>
    <label class="field"><span>パスワードを入力（架空のものを）</span><input type="text" id="pw" value="sakura2020" autocomplete="off"></label>
    <div>ハッシュ値（64文字）：</div>
    <div class="urlbox mono" id="hash">—</div>
    <p class="small mt">同じ入力からは必ず同じハッシュ値が出ます。1文字変えるとまったく違う値になります。試してみてください。</p>
  </div>`;
  const pw = el.querySelector("#pw"), out = el.querySelector("#hash");
  const upd = async () => { out.textContent = pw.value ? await LT.sha256hex(pw.value) : "—"; };
  pw.oninput = upd; upd();

  if (!intro) {
    el.insertAdjacentHTML("beforeend", `
    <div class="card">
      <h3>同じパスワードは同じハッシュになる — だから危ない</h3>
      <p>ハッシュは「元に戻せない」はずなのに、なぜ流出が問題になるのでしょうか。攻撃者は、よく使われるパスワードのハッシュ値をあらかじめ大量に計算した表を持っています。流出したハッシュがその表にあれば、元のパスワードが分かってしまいます。さらに、同じ人が複数サービスで同じパスワードを使っていると、1か所の流出が連鎖します。</p>
      <p>${LT.T("ソルト", "ソルト（塩）")}を加えると、同じパスワードでも人ごとに違うハッシュになり、表での一括照合を防げます。</p>
    </div>`);
  }

  LT.prediction(el, "s1.see.pred", "同じ人が『通販サイト』と『会社のメール』で同じパスワードを使っていました。通販サイトからパスワードが流出すると、会社のメールはどうなると思う？",
    [{ text: "会社のメールは別のサービスなので影響はない" }, { text: "同じパスワードなら、会社のメールにもログインされてしまう", correct: true }, { text: "ハッシュ化されているので絶対に大丈夫" }],
    "流出したパスワードをそのまま別のサービスで試すのが、次の『破る』で体験するリスト型攻撃です。使い回しは連鎖します。");
};

/* ---------- ② 破る ---------- */
LT.S1.break = function (el) {
  el.innerHTML = `
  <div class="card attack">
    <div class="spread"><h2 class="mb0"><span class="badge attack">攻撃者</span> リスト型攻撃</h2></div>
    <p>あなたは攻撃者です。通販「モグモグショップ」から流出した下の一覧を手に入れました。これを会社のメール「SoraMail」のログイン画面にそのまま打ち込み、${LT.T("使い回し", "パスワードを使い回している人")}のアカウントに入れるか試します。</p>
    <div class="table-wrap"><table id="leakTable"><tr><th>メール</th><th>流出パスワード</th><th>SoraMailに試す</th><th>結果</th></tr></table></div>
    <button class="btn attack mt" id="autoAll">一覧をまとめて試す</button>
    <div class="xray mt" id="xray" hidden></div>
  </div>`;
  const tb = el.querySelector("#leakTable"), xray = el.querySelector("#xray");
  let success = 0, tried = 0;
  const rows = LT.S1.leak.map((u) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${u.email}</td><td class="mono">${u.pw}</td><td><button class="btn sm attack">試す</button></td><td class="result">—</td>`;
    const btn = tr.querySelector("button"), rc = tr.querySelector(".result");
    btn.onclick = () => {
      tried++;
      if (u.reuse) { rc.innerHTML = `<span class="badge ng">ログイン成功</span>`; success++; LT.addMapEdge("leak"); LT.addMapEdge("reuse"); }
      else { rc.innerHTML = `<span class="badge gray">失敗（使い回しなし）</span>`; }
      btn.disabled = true;
      xray.hidden = false;
      xray.innerHTML = LT.S1.xrayText(tried, success);
      LT.log("s1", "break", "list_try", { email: u.email, reuse: u.reuse });
      if (tried === LT.S1.leak.length) LT.S1.breakDone(el, success);
    };
    tb.appendChild(tr);
    return { u, btn };
  });
  el.querySelector("#autoAll").onclick = () => { rows.forEach(r => { if (!r.btn.disabled) r.btn.click(); }); };

  if (!LT.isIntro()) {
    const box = document.createElement("div");
    box.className = "card attack";
    box.innerHTML = `<h3>もう一つの手口：総当たり</h3><p>使い回していなくても、短くて単純なパスワードは${LT.T("総当たり攻撃")}で割られます。次の『なぜ守れるか』で、あなたの端末の計算速度を実測し、文字数と種類で解読時間がどれだけ変わるかを確かめます。</p>`;
    el.appendChild(box);
  }
};

LT.S1.xrayText = function (tried, success) {
  return `<span class="hl">── 透視ビュー：SoraMail サーバー ──</span>
ログイン試行: <span class="hl">${tried}</span> 回
成功: <span class="ok">${success}</span> 件  失敗: <span class="ng">${tried - success}</span> 件
<span class="dim"># 攻撃者は1件ずつ手で打つ必要はなく、プログラムで</span>
<span class="dim"># 流出リスト全体を数秒で試せる。</span>
<span class="dim"># 「使い回し」をしている人だけが入られている点に注目。</span>`;
};

LT.S1.breakDone = function (el, success) {
  LT.setScore("s1.listattack", { correct: success, total: LT.S1.leak.length, percent: Math.round(success / LT.S1.leak.length * 100), note: "リスト型攻撃で侵入できた割合" });
  const d = document.createElement("div");
  d.className = "card ok fade-in";
  d.innerHTML = `<h3>結果</h3><p>6人のうち <b>${success}人</b> が、通販と会社メールで同じパスワードを使い回していたため、会社のメールに侵入されました。攻撃者はパスワードを「破った」のではなく、<b>別の場所から漏れたものを使い回しの隙に当てただけ</b>です。</p>`;
  el.querySelector(".card.attack").appendChild(d);
};

/* ---------- ③ なぜ守れるか ---------- */
LT.S1.defend = function (el) {
  el.innerHTML = `
  <div class="card defend">
    <h2><span class="badge defend">防御者</span> 対策1：多要素認証で止める</h2>
    <p>${LT.T("多要素認証")}を入れると、パスワードが正しくても、次の段階（スマホに届くコードなど）で止まります。先ほどのリスト型攻撃をやり直してみましょう。</p>
    <label class="toggle on" id="mfaTgl"><input type="checkbox" checked> 多要素認証をオンにする</label>
    <div class="vs mt">
      <div class="no"><h4>対策なし</h4><p>流出パスワード一致 → <span class="badge ng">ログイン成功</span></p></div>
      <div class="yes" id="withMfa"><h4>多要素認証あり</h4><p>流出パスワード一致 → <span class="badge ok">コード要求で停止</span></p></div>
    </div>
    <p class="small">パスワードは「知っているもの」。コードやスマホは「持っているもの」。種類の違う鍵を組み合わせるので、片方が漏れても突破されにくくなります。</p>
  </div>
  <div class="card defend">
    <h2>対策2：長く複雑にして総当たりを現実的に不可能にする</h2>
    <p>あなたの端末で1秒あたり何回ハッシュ化できるかを実測し、総当たりにかかる時間を見積もります（組み合わせの総数 ÷ 実測速度）。実際にパスワードを言い当てる処理はしません。</p>
    <div class="row">
      <button class="btn primary" id="bench">この端末の速度を実測する</button>
      <span id="benchOut" class="small"></span>
    </div>
    <div id="estArea" hidden>
      <div class="grid2 mt">
        <label class="field"><span>文字の種類</span><select id="cs"></select></label>
        <label class="field"><span>文字数：<b id="lenV">8</b> 文字</span><input type="range" id="len" min="4" max="20" value="8"></label>
      </div>
      <div class="card ok mb0"><div class="spread"><div>推定解読時間（総当たり）</div><div class="huge" id="estTime">—</div></div><div class="small" id="estDetail"></div></div>
      <div class="mt" id="chart"></div>
    </div>
  </div>`;

  const mfa = el.querySelector("#mfaTgl");
  mfa.querySelector("input").onchange = (e) => {
    mfa.classList.toggle("on", e.target.checked);
    el.querySelector("#withMfa").innerHTML = e.target.checked ? `<h4>多要素認証あり</h4><p>流出パスワード一致 → <span class="badge ok">コード要求で停止</span></p>` : `<h4>多要素認証あり</h4><p class="muted">オフ：パスワードだけで入れてしまう</p>`;
    LT.setMapDefense("mfa", e.target.checked);
    LT.log("s1", "defend", "mfa_toggle", e.target.checked);
  };
  LT.setMapDefense("mfa", true);

  const cs = el.querySelector("#cs");
  LT.S1.charsets.forEach((c, i) => { const o = document.createElement("option"); o.value = i; o.textContent = c.label; if (i === 1) o.selected = true; cs.appendChild(o); });

  let rate = 0;
  const bench = el.querySelector("#bench"), benchOut = el.querySelector("#benchOut");
  bench.onclick = () => {
    bench.disabled = true; benchOut.textContent = "計測中…";
    let w;
    try { w = new Worker("js/worker-crack.js"); } catch (e) { benchOut.textContent = "この環境では計測できません"; bench.disabled = false; return; }
    w.onmessage = (ev) => {
      if (ev.data.type === "bench") {
        rate = ev.data.rate;
        benchOut.innerHTML = `約 <b>${LT.fmtNum(Math.round(rate))}</b> 回/秒（SHA-256）`;
        el.querySelector("#estArea").hidden = false;
        bench.disabled = false; bench.textContent = "もう一度実測する";
        LT.measure("s1", "hash_rate_per_sec", { ua: navigator.userAgent.slice(0, 60) }, Math.round(rate));
        update();
        w.terminate();
      }
    };
    w.onerror = () => { benchOut.textContent = "計測に失敗しました"; bench.disabled = false; };
    w.postMessage({ cmd: "bench", ms: 700 });
  };

  const len = el.querySelector("#len"), lenV = el.querySelector("#lenV");
  const estTime = el.querySelector("#estTime"), estDetail = el.querySelector("#estDetail");
  const update = () => {
    lenV.textContent = len.value;
    const c = LT.S1.charsets[Number(cs.value)];
    const L = Number(len.value);
    // 組み合わせ総数、平均で半分試すと仮定
    const combos = Math.pow(c.size, L);
    const avgTries = combos / 2;
    const seconds = rate > 0 ? avgTries / rate : Infinity;
    estTime.textContent = LT.fmtDuration(seconds);
    estDetail.innerHTML = `${c.size} 種類 の文字を ${L} 個 → 組み合わせは約 ${combos.toExponential(2)} 通り。平均でその半分を試すと仮定。`;
    if (rate > 0) { LT.S1.drawChart(el.querySelector("#chart"), c, rate); LT.measure("s1", "crack_estimate_sec", { charset: c.id, length: L }, isFinite(seconds) ? seconds : -1); }
  };
  cs.onchange = update; len.oninput = update;

  LT.prediction(el, "s1.defend.pred", "英小文字だけのパスワードを、8文字から12文字に増やすと、総当たりの時間はおよそ何倍になる？",
    [{ text: "少し増える程度（数倍）" }, { text: "だいたい2倍" }, { text: "けた違いに増える（数十万倍以上）", correct: true }],
    "英小文字は26種類。1文字増えるごとに時間は26倍になります。4文字増えれば 26×26×26×26 ＝ 約46万倍です。上のスライダーで確かめてください。");

  LT.writingTask(el, "s1.defend.explain", {
    intro: { title: "ふり返り", text: "パスワードを使い回すとなぜ危ないか、ステージ1で分かったことを1〜2文で書いてみよう。" },
    practice: { title: "説明課題", text: "「パスワードの使い回しが危険な理由」を、リスト型攻撃という言葉を使って説明してください。" },
    inquiry: { title: "説明課題", text: "多要素認証と「パスワードを長くすること」は、それぞれ攻撃のどの段階を妨げますか。両者がなぜ別々に有効なのかを説明してください。" }
  });
};

LT.S1.drawChart = function (container, charset, rate) {
  const W = 680, H = 260, padL = 54, padB = 40, padT = 16, padR = 12;
  const lens = [4, 6, 8, 10, 12, 14, 16];
  const data = lens.map(L => ({ L, sec: Math.pow(charset.size, L) / 2 / rate }));
  const maxLog = Math.max(...data.map(d => Math.log10(Math.max(d.sec, 1e-3))));
  const minLog = Math.min(...data.map(d => Math.log10(Math.max(d.sec, 1e-3))), 0);
  const span = Math.max(maxLog - minLog, 1);
  const x = (i) => padL + (W - padL - padR) * i / (lens.length - 1);
  const y = (sec) => { const lg = Math.log10(Math.max(sec, 1e-3)); return H - padB - (H - padB - padT) * (lg - minLog) / span; };
  let bars = "";
  data.forEach((d, i) => {
    const yy = y(d.sec), xx = x(i);
    bars += `<rect x="${xx - 20}" y="${yy}" width="40" height="${H - padB - yy}" fill="#2b5fd9" rx="3"/>`;
    bars += `<text x="${xx}" y="${H - padB + 16}" font-size="12" text-anchor="middle" fill="#5c6678">${d.L}</text>`;
    bars += `<text x="${xx}" y="${yy - 6}" font-size="10" text-anchor="middle" fill="#1c2230">${LT.fmtDuration(d.sec)}</text>`;
  });
  container.innerHTML = `<p class="small">文字数ごとの推定解読時間（${charset.label}、縦は対数目盛）</p>
  <svg viewBox="0 0 ${W} ${H}" class="chart" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" stroke="#cfd6e2"/>
    <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="#cfd6e2"/>
    ${bars}
    <text x="${padL}" y="${padT + 2}" font-size="10" fill="#5c6678">長い</text>
    <text x="${(W) / 2}" y="${H - 4}" font-size="11" text-anchor="middle" fill="#5c6678">パスワードの文字数</text>
  </svg>`;
};

/* ステージ1のルーティング登録は app 側の汎用ルータで処理 */
LT.STAGE_IMPL["1"] = { see: LT.S1.see, break: LT.S1.break, defend: LT.S1.defend };
