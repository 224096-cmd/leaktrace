/* 攻撃経路マップ（SVG）。各ステージで通った経路が描き足されていく。
   線の種類：流れる（到達される）／遮断（対策で止まる）／届かない（手前で止まった）／外で起きる（自社の対策では止められない） */
window.LT = window.LT || {};
LT.routes = LT.routes || {};
LT.STAGE_IMPL = LT.STAGE_IMPL || {};

LT.MAP = {
  nodes: {
    attacker: { x: 95,  y: 270, label: "攻撃者", kind: "attacker" },
    shop:     { x: 280, y: 50,  label: "モグモグショップ\n（情報が流出した通販）", kind: "ext" },
    vendor:   { x: 280, y: 165, label: "委託先\n（管理者アカウント）", kind: "ext" },
    you:      { x: 280, y: 455, label: "あなた\n（社員）", kind: "person" },
    mail:     { x: 530, y: 165, label: "SoraMail\n（会社のメール）", kind: "sys" },
    vpn:      { x: 530, y: 345, label: "VPN機器\n（社外からの入口）", kind: "sys" },
    pc:       { x: 700, y: 255, label: "社内PC", kind: "sys" },
    admin:    { x: 870, y: 165, label: "管理者\nアカウント", kind: "sys" },
    db:       { x: 870, y: 345, label: "顧客データベース\n（12万人分）", kind: "data" },
    pub:      { x: 700, y: 490, label: "社外\n（インターネット）", kind: "ext" }
  },
  /* outside: 自社の外で起きるため、ソラ商事の対策では止められない線 / mistake: 攻撃者がいなくても起きる線 */
  edges: [
    { id: "leak",   from: "shop", to: "attacker", stage: "s1", label: "流出したID・パスワード一覧", outside: true,
      desc: "通販サイト「モグモグショップ」から会員のIDとパスワードの一覧が流出し、攻撃者の手に渡る。",
      outsideNote: "流出はほかの会社の中で起きたこと。ソラ商事の対策では止められないので、次の「使い回しでログイン」で止める。" },
    { id: "reuse",  from: "attacker", to: "mail", stage: "s1", label: "使い回しでログイン", cutBy: "mfa",
      desc: "通販サイトと同じパスワードを使い回している社員の会社メールに、そのままログインする。" },
    { id: "phish",  from: "attacker", to: "you", stage: "s2", label: "偽メール・SMS", outside: true,
      desc: "社員に、会社や証券会社を装った偽メール・SMSを送り、偽サイトへ誘う。",
      outsideNote: "偽メールが届くこと自体はなくせない。止めるのは、入力した情報が使われる次の線。" },
    { id: "cred",   from: "you", to: "mail", stage: "s2", label: "偽画面に入力した情報", cutBy: "mfa",
      desc: "社員が偽画面に入力したIDとパスワードを使い、会社メールにログインする。" },
    { id: "vendor", from: "attacker", to: "vendor", stage: "s3", label: "委託先のID・パスワードを盗む", outside: true,
      desc: "システムの保守を任せている委託先から、管理者のIDとパスワードを盗む。",
      outsideNote: "盗まれるのは委託先の中。委託元は次の「ログイン」に例外なく多要素認証をかけて止める。" },
    { id: "vpn",    from: "vendor", to: "vpn", stage: "s3", label: "多要素認証なしでログイン", cutBy: "mfa",
      desc: "盗んだ委託先のアカウントで、社外からの入口（VPN機器）にログインする。" },
    { id: "vpnhole",from: "attacker", to: "vpn", stage: "s3", label: "古い機器の弱点から侵入", cutBy: "patch",
      desc: "更新されていない入口の機器の、公表済みの弱点を使って入り込む。" },
    { id: "mail2pc",from: "mail", to: "pc", stage: "s3", label: "メールから社内へ", cutBy: "least",
      desc: "乗っ取ったメールのアカウントを足がかりに、社内のPCへ広がる。" },
    { id: "lateral",from: "vpn", to: "pc", stage: "s3", label: "社内を探索", cutBy: "segment",
      desc: "入口から社内のPCへ、ネットワークの中を探して回る。" },
    { id: "priv",   from: "pc", to: "admin", stage: "s3", label: "権限を奪う", cutBy: "least",
      desc: "社内PCから、すべてを操作できる管理者の権限を奪う。" },
    { id: "dbget",  from: "admin", to: "db", stage: "s3", label: "全件取り出し", cutBy: "least",
      desc: "管理者の権限で、顧客データベースから全件を取り出す。" },
    { id: "exfil",  from: "db", to: "pub", stage: "s3", label: "社外へ持ち出し・脅迫", cutBy: "monitor",
      desc: "盗んだデータを社外の攻撃者へ送り出し、社内のデータを暗号化して「公開するぞ」と脅す。" },
    { id: "missend",from: "mail", to: "pub", stage: "s4", label: "誤送信（CC）", cutBy: "check", mistake: true,
      desc: "攻撃者がいなくても、社員がCCで一斉送信し、顧客どうしのアドレスが見えてしまう。" },
    { id: "attach", from: "you", to: "pub", stage: "s4", label: "名簿の誤添付", cutBy: "check", mistake: true,
      desc: "攻撃者がいなくても、社員が名簿を誤って添付し、社外に送ってしまう。" }
  ],
  order: ["leak", "reuse", "phish", "cred", "vendor", "vpn", "vpnhole", "mail2pc", "lateral", "priv", "dbget", "exfil", "missend", "attach"],
  defenses: {
    mfa: "多要素認証（例外なし）", patch: "機器の更新（パッチ）", segment: "ネットワーク分離", least: "最小権限", monitor: "ログ監視", check: "送信前の確認"
  },
  stageColor: { s1: "#c0392b", s2: "#d35400", s3: "#7d3c98", s4: "#16a085" },
  stageName: { s1: "ステージ1 不正ログイン", s2: "ステージ2 フィッシング", s3: "ステージ3 ランサムウェア", s4: "ステージ4 人為ミス" }
};

/* 線ごとの状態を計算する。shown: 表示する線のid一覧 */
LT.mapStatus = function (shown, defenses) {
  const M = LT.MAP;
  const reached = new Set(["attacker", "shop"]);
  const status = {};
  // 攻撃の線は、届いた場所から順にたどる（何度か繰り返して広げる）
  for (let round = 0; round < 6; round++) {
    M.order.forEach(id => {
      const e = M.edges.find(x => x.id === id);
      if (e.mistake || !shown.includes(id)) return;
      if (!reached.has(e.from)) return;
      if (e.cutBy && defenses.includes(e.cutBy)) return;
      reached.add(e.to);
    });
  }
  M.edges.forEach(e => {
    if (!shown.includes(e.id)) { status[e.id] = "none"; return; }
    if (e.mistake) { status[e.id] = defenses.includes(e.cutBy) ? "cut" : "flow"; return; }
    if (!reached.has(e.from)) { status[e.id] = "unreached"; return; }
    if (e.cutBy && defenses.includes(e.cutBy)) { status[e.id] = "cut"; return; }
    status[e.id] = e.outside ? "outside" : "flow";
  });
  return { status, reached };
};

LT.mapReduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* 描画。opts: { shown, defenses, focus（強調する線）, draw（線を伸ばすアニメーション）, packets（流れる点） } */
LT.renderMap = function (container, opts) {
  opts = opts || {};
  const M = LT.MAP;
  const shown = opts.shown || LT.state.map.edges;
  const defenses = opts.defenses || LT.state.map.defenses;
  const { status, reached } = LT.mapStatus(shown, defenses);
  const motion = opts.packets !== false && !LT.mapReduceMotion();
  const W = 980, H = 540;
  const GRAY = "#c3cad6", BLUE = "#2c5ec9";
  const colors = [GRAY, BLUE].concat(Object.values(M.stageColor));
  const mk = (c) => "arr" + c.replace("#", "");
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif" class="map-svg">
  <defs>${colors.map(c => `<marker id="${mk(c)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`).join("")}</defs>
  <rect x="440" y="110" width="500" height="300" rx="14" fill="#f4f7fd" stroke="#dbe3f1"/>
  <text x="930" y="400" font-size="12" text-anchor="end" fill="#5f6b7d">架空の会社「ソラ商事」の社内</text>`;

  let order = 0;
  M.order.forEach(id => {
    const e = M.edges.find(x => x.id === id);
    const st = status[id];
    const a = M.nodes[e.from], b = M.nodes[e.to];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len, r = 46;
    const x1 = a.x + ux * r, y1 = a.y + uy * r, x2 = b.x - ux * r, y2 = b.y - uy * r;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const focus = opts.focus === id;
    const color = st === "none" || st === "unreached" ? GRAY : M.stageColor[e.stage];
    const dash = st === "none" ? 'stroke-dasharray="4 5"' : st === "unreached" ? 'stroke-dasharray="2 6"' : st === "outside" ? 'stroke-dasharray="10 5"' : "";
    const drawCls = opts.draw && (st === "flow" || st === "cut") ? "edge-draw" : "";
    const delay = (order++) * 0.12;
    const op = opts.focus && !focus && st !== "none" ? 0.35 : 1;
    svg += `<g opacity="${op}" class="edge ${focus ? "edge-focus" : ""}">`;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${st === "none" ? 2 : focus ? 6 : 4}" ${dash} marker-end="url(#${mk(color)})" pathLength="100" class="${drawCls}" style="animation-delay:${delay}s"/>`;
    const num = M.order.indexOf(id) + 1;
    // 流れる点（攻撃やミスの流れ）
    if (motion && (st === "flow" || st === "outside" || st === "cut")) {
      const ex = st === "cut" ? mx : x2, ey = st === "cut" ? my : y2;
      const dur = st === "cut" ? 1.4 : 2.2;
      const begin = (delay % 2).toFixed(2);
      svg += `<circle r="5.5" fill="${color}" stroke="#fff" stroke-width="1.5" opacity="0">
        <animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="M${x1},${y1} L${ex},${ey}"/>
        <animate attributeName="opacity" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.1;0.85;1"/></circle>`;
    }
    if (st === "cut") {
      svg += `<g transform="translate(${mx + 20},${my - 18})" class="${opts.draw ? "cut-pop" : ""}" style="animation-delay:${delay + 0.4}s"><circle r="11" fill="${BLUE}"/><path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="#fff" stroke-width="2.6"/></g>`;
    }
    // 線の番号（説明は図の下の一覧）
    if (st !== "none") {
      const nc = st === "unreached" ? "#9aa3b2" : color;
      svg += `<g transform="translate(${mx},${my})" class="edge-num" data-edge="${id}" style="cursor:pointer"><circle r="${focus ? 13 : 11}" fill="#fff" stroke="${nc}" stroke-width="2" ${st === "outside" ? 'stroke-dasharray="3 2"' : ""}/><text y="4" font-size="11" font-weight="700" text-anchor="middle" fill="${nc}">${num}</text></g>`;
    }
    if (focus) {
      const tw = e.label.length * 12 + 20;
      svg += `<g transform="translate(${mx},${my - 30})"><rect x="${-tw / 2}" y="-13" width="${tw}" height="24" rx="5" fill="#1d2433"/><text y="4" font-size="12" font-weight="700" text-anchor="middle" fill="#fff">${e.label}</text></g>`;
    }
    svg += `</g>`;
  });

  Object.keys(M.nodes).forEach(k => {
    const n = M.nodes[k];
    const fill = { attacker: "#fbefee", person: "#fff8e6", sys: "#fff", data: "#edf6f0", ext: "#f3f4f7" }[n.kind];
    const stroke = { attacker: "#b83a32", person: "#d4a017", sys: "#9aa6b8", data: "#2b7a47", ext: "#a0a8b5" }[n.kind];
    const hit = k !== "attacker" && k !== "shop" && reached.has(k) && shown.some(id => { const e = M.edges.find(x => x.id === id); return e.to === k; });
    const danger = hit && (k === "db" || k === "admin");
    const lines = n.label.split("\n");
    svg += `<g class="${danger ? "node-danger" : ""}"><rect x="${n.x - 70}" y="${n.y - 30}" width="140" height="60" rx="10" fill="${fill}" stroke="${danger ? "#b83a32" : stroke}" stroke-width="${danger ? 3 : 2}"/>`;
    lines.forEach((t, i) => { svg += `<text x="${n.x}" y="${n.y + (i - (lines.length - 1) / 2) * 16 + 5}" font-size="${i === 0 ? 14 : 11}" font-weight="${i === 0 ? 700 : 400}" text-anchor="middle" fill="#1d2433">${t}</text>`; });
    svg += `</g>`;
  });
  svg += `</svg>`;
  container.innerHTML = `<div class="mapwrap">${svg}</div>`;
  return { status, reached };
};

/* 結果のまとめ（何が守れて、何が守れていないか） */
LT.mapSummary = function (shown, defenses) {
  const { status, reached } = LT.mapStatus(shown, defenses);
  const has = (id) => shown.includes(id);
  const rows = [];
  if (["dbget", "exfil", "priv"].some(has)) {
    const db = reached.has("db");
    const out = db && status.exfil === "flow";
    rows.push({ ok: !db, t: "顧客データベース", v: db ? (out ? "到達され、社外へ持ち出される" : "到達されるが、持ち出しはログ監視で止まる") : "到達されない" });
  }
  if (["reuse", "cred"].some(has)) rows.push({ ok: !reached.has("mail"), t: "会社のメール", v: reached.has("mail") ? "乗っ取られる" : "乗っ取られない" });
  if (["missend", "attach"].some(has)) rows.push({ ok: defenses.includes("check"), t: "うっかりミスによる漏えい", v: defenses.includes("check") ? "送信前の確認で防げる" : "起きうる" });
  const outside = LT.MAP.edges.filter(e => e.outside && has(e.id));
  return { rows, outside, status };
};

LT.routes.map = function (app) {
  const exp = LT.state.map.edges;
  let mode = exp.length ? "mine" : "all";
  let playing = null;
  app.innerHTML = `
  <div class="stage-head"><div class="kicker">ふり返り</div><h1>攻撃経路マップ<span class="h-sub"> — 一つひとつのミスが、一本の道になる</span></h1></div>
  <div class="card">
    <div class="spread">
      <div class="seg" id="mode"><button data-m="mine">自分が通った経路（${exp.length} / ${LT.MAP.edges.length}）</button><button data-m="all">すべての経路</button></div>
      <button class="btn primary sm" id="play">▶ 順に再生</button>
    </div>
    <div id="map" class="mt"></div>
    <div id="caption" class="map-caption" hidden></div>
    <ol class="edge-list" id="edgeList"></ol>
    <div class="legend mt">${Object.keys(LT.MAP.stageColor).map(k => `<span><i style="background:${LT.MAP.stageColor[k]}"></i>${LT.MAP.stageName[k]}</span>`).join("")}</div>
  </div>
  <div class="card">
    <h2>対策を置いてみる</h2>
    <p class="small">対策を選ぶと、その対策で止まる線に×印が付き、その先の線は「届かない」に変わります。図の番号や下の一覧をタップすると、その線を強調できます。</p>
    <div class="def-grid" id="defs"></div>
    <div id="summary" class="mt"></div>
  </div>
  <div class="card">
    <h2>読み取り方</h2>
    <div class="map-key">
      <div><svg width="60" height="14"><line x1="2" y1="7" x2="58" y2="7" stroke="#7d3c98" stroke-width="4"/><circle cx="30" cy="7" r="5" fill="#7d3c98" stroke="#fff" stroke-width="1.5"/></svg><span><b>流れている線</b>：攻撃（またはミス）が進んでいる経路。点が流れる向きに進む。</span></div>
      <div><svg width="60" height="14"><line x1="2" y1="7" x2="58" y2="7" stroke="#7d3c98" stroke-width="4"/><circle cx="30" cy="7" r="6" fill="#2c5ec9"/></svg><span><b>×印の線</b>：あなたが置いた対策で遮断された経路。点はここで止まる。</span></div>
      <div><svg width="60" height="14"><line x1="2" y1="7" x2="58" y2="7" stroke="#c3cad6" stroke-width="4" stroke-dasharray="2 6"/></svg><span><b>届かない線</b>：手前の線が遮断されたため、攻撃がここまで来ない経路。</span></div>
      <div><svg width="60" height="14"><line x1="2" y1="7" x2="58" y2="7" stroke="#d35400" stroke-width="4" stroke-dasharray="10 5"/></svg><span><b>外で起きる線</b>：ほかの会社や委託先の中、あるいは届くメールそのもの。ソラ商事の対策では<b>止められない</b>ので、その<b>次の線</b>で断ち切る。</span></div>
      <div><svg width="60" height="14"><line x1="2" y1="7" x2="58" y2="7" stroke="#c3cad6" stroke-width="2" stroke-dasharray="4 5"/></svg><span><b>点線</b>：まだ体験していない経路（「すべての経路」で表示）。</span></div>
    </div>
    <p class="mt mb0">一本ずつはただの「小さなミス」に見えても、線がつながると、1つのパスワードの使い回しから12万人分の顧客情報の流出までが一本の道になります。すべての線を止めることはできませんが、道の<b>どこか</b>を断ち切れば、その先には進めません。</p>
  </div>`;

  const mapEl = app.querySelector("#map"), cap = app.querySelector("#caption");
  const shownList = () => mode === "mine" ? LT.state.map.edges : LT.MAP.order.slice();
  let focus = null;
  const STX = { flow: '<span class="badge ng">進む</span>', outside: '<span class="badge warn">外で起きる</span>', unreached: '<span class="badge gray">届かない</span>' };
  const list = (status) => {
    const ol = app.querySelector("#edgeList");
    ol.innerHTML = LT.MAP.order.filter(id => status[id] !== "none").map(id => {
      const e = LT.MAP.edges.find(x => x.id === id), st = status[id];
      const badge = st === "cut" ? `<span class="badge defend">${LT.MAP.defenses[e.cutBy]}で遮断</span>` : STX[st];
      return `<li class="${focus === id ? "on" : ""}" data-edge="${id}"><span class="en" style="border-color:${st === "unreached" ? "#9aa3b2" : LT.MAP.stageColor[e.stage]};color:${st === "unreached" ? "#9aa3b2" : LT.MAP.stageColor[e.stage]}">${LT.MAP.order.indexOf(id) + 1}</span><span class="et"><b>${e.label}</b><small>${e.desc}</small></span>${badge}</li>`;
    }).join("");
    ol.querySelectorAll("li").forEach(li => li.onclick = () => { focus = focus === li.dataset.edge ? null : li.dataset.edge; draw(false); });
  };
  const draw = (animate) => {
    stop();
    const r = LT.renderMap(mapEl, { shown: shownList(), draw: animate, focus });
    list(r.status);
    mapEl.querySelectorAll(".edge-num").forEach(g => g.addEventListener("click", () => { focus = focus === g.dataset.edge ? null : g.dataset.edge; draw(false); }));
    app.querySelectorAll("#mode button").forEach(b => b.classList.toggle("on", b.dataset.m === mode));
    summary();
  };
  const summary = () => {
    const s = LT.mapSummary(shownList(), LT.state.map.defenses);
    const el = app.querySelector("#summary");
    if (!shownList().length) { el.innerHTML = `<p class="small">まだ通った経路がありません。「すべての経路」に切り替えると、全体を見られます。</p>`; return; }
    el.innerHTML = `<div class="table-wrap"><table><tr><th>守りたいもの</th><th>結果</th></tr>${s.rows.map(r => `<tr><td>${r.t}</td><td><span class="badge ${r.ok ? "ok" : "ng"}">${r.ok ? "守れる" : "守れない"}</span> ${r.v}</td></tr>`).join("")}</table></div>
      ${s.outside.length ? `<div class="feedback ng mt"><b>どの対策でも遮断されない線が ${s.outside.length} 本あります。</b><ul class="mb0">${s.outside.map(e => `<li><b>${e.label}</b>：${e.outsideNote}</li>`).join("")}</ul></div>` : ""}`;
  };
  const defs = app.querySelector("#defs");
  defs.innerHTML = Object.keys(LT.MAP.defenses).map(k => `<button class="def ${LT.state.map.defenses.includes(k) ? "on" : ""}" data-d="${k}">${LT.MAP.defenses[k]}</button>`).join("");
  defs.querySelectorAll("[data-d]").forEach(b => b.onclick = () => {
    const on = !LT.state.map.defenses.includes(b.dataset.d);
    LT.setMapDefense(b.dataset.d, on);
    b.classList.toggle("on", on);
    LT.log("map", "", "defense", { def: b.dataset.d, on });
    draw(false);
  });
  app.querySelectorAll("#mode button").forEach(b => b.onclick = () => { mode = b.dataset.m; focus = null; draw(true); });

  /* 順に再生：1本ずつ線を増やし、説明を表示する */
  function stop() {
    if (playing) { clearTimeout(playing); playing = null; app.querySelector("#play").textContent = "▶ 順に再生"; }
  }
  app.querySelector("#play").onclick = () => {
    if (playing) { stop(); draw(false); cap.hidden = true; return; }
    const list = LT.MAP.order.filter(id => shownList().includes(id));
    if (!list.length) { LT.toast("まだ通った経路がありません"); return; }
    let i = 0;
    app.querySelector("#play").textContent = "■ 止める";
    cap.hidden = false;
    const step = () => {
      const id = list[i];
      const e = LT.MAP.edges.find(x => x.id === id);
      const { status } = LT.renderMap(mapEl, { shown: list.slice(0, i + 1), focus: id, draw: false });
      const st = status[id];
      const stTxt = { flow: '<span class="badge ng">進む</span>', outside: '<span class="badge warn">外で起きる（止められない）</span>', cut: `<span class="badge defend">${LT.MAP.defenses[e.cutBy]}で遮断</span>`, unreached: '<span class="badge gray">届かない</span>' }[st] || "";
      cap.innerHTML = `<div class="spread"><span class="small">${i + 1} / ${list.length}　${LT.MAP.stageName[e.stage]}</span>${stTxt}</div><p class="mb0"><b>${e.label}</b>：${e.desc}${e.outside ? `<br><span class="small">${e.outsideNote}</span>` : ""}</p>`;
      i++;
      if (i < list.length) playing = setTimeout(step, LT.mapReduceMotion() ? 3200 : 2600);
      else playing = setTimeout(() => { playing = null; app.querySelector("#play").textContent = "▶ もう一度再生"; LT.renderMap(mapEl, { shown: shownList(), draw: false }); }, 2600);
    };
    step();
    LT.log("map", "", "play", list.length);
  };
  window.addEventListener("hashchange", stop, { once: true });
  draw(true);
};
