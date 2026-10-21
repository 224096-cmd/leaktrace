/* 攻撃経路マップ（SVG）。各ステージで通った経路が描き足されていく */
window.LT = window.LT || {};
LT.routes = LT.routes || {};
LT.STAGE_IMPL = LT.STAGE_IMPL || {};

LT.MAP = {
  nodes: {
    attacker: { x: 90,  y: 230, label: "攻撃者", kind: "attacker" },
    shop:     { x: 300, y: 70,  label: "モグモグショップ\n（情報が流出した通販）", kind: "ext" },
    you:      { x: 300, y: 390, label: "あなた\n（社員）", kind: "person" },
    mail:     { x: 520, y: 150, label: "SoraMail\n（会社のメール）", kind: "sys" },
    vpn:      { x: 520, y: 300, label: "VPN機器\n（社外からの入口）", kind: "sys" },
    pc:       { x: 700, y: 300, label: "社内PC", kind: "sys" },
    admin:    { x: 860, y: 210, label: "管理者\nアカウント", kind: "sys" },
    db:       { x: 860, y: 390, label: "顧客データベース\n（12万人分）", kind: "data" },
    pub:      { x: 700, y: 470, label: "社外・インターネット", kind: "ext" }
  },
  edges: [
    { id: "leak",   from: "shop", to: "attacker", stage: "s1", label: "流出したID・パスワード一覧" },
    { id: "reuse",  from: "attacker", to: "mail", stage: "s1", label: "使い回しでログイン", cutBy: "mfa" },
    { id: "phish",  from: "attacker", to: "you", stage: "s2", label: "偽メール" },
    { id: "cred",   from: "you", to: "mail", stage: "s2", label: "偽画面に入力した情報", cutBy: "mfa" },
    { id: "vpn",    from: "attacker", to: "vpn", stage: "s3", label: "古い機器の穴から侵入", cutBy: "patch" },
    { id: "mail2pc",from: "mail", to: "pc", stage: "s3", label: "メールから社内へ", cutBy: "least" },
    { id: "lateral",from: "vpn", to: "pc", stage: "s3", label: "社内を探索", cutBy: "segment" },
    { id: "priv",   from: "pc", to: "admin", stage: "s3", label: "権限を奪う", cutBy: "least" },
    { id: "dbget",  from: "admin", to: "db", stage: "s3", label: "全件取り出し", cutBy: "least" },
    { id: "exfil",  from: "db", to: "attacker", stage: "s3", label: "持ち出し・暗号化・脅迫", cutBy: "backup" },
    { id: "missend",from: "you", to: "pub", stage: "s4", label: "誤送信（CC）", cutBy: "check" },
    { id: "share",  from: "db", to: "pub", stage: "s4", label: "共有リンクの公開設定ミス", cutBy: "check" }
  ],
  defenses: {
    mfa: "多要素認証", patch: "機器の更新（パッチ）", segment: "ネットワーク分離", least: "最小権限", backup: "バックアップ・ログ監視", check: "宛先・公開範囲の確認"
  },
  stageColor: { s1: "#c62828", s2: "#e65100", s3: "#6a1b9a", s4: "#00695c" }
};

LT.renderMap = function (container, opts) {
  opts = opts || {};
  const edges = opts.edges || LT.state.map.edges;
  const defenses = opts.defenses || LT.state.map.defenses;
  const M = LT.MAP;
  const W = 980, H = 540;
  const colors = ["#cfd6e2"].concat(Object.values(M.stageColor));
  const mid = (c) => "arr" + c.replace("#", "");
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">
  <defs>${colors.map(c => `<marker id="${mid(c)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`).join("")}</defs>
  <rect x="440" y="100" width="500" height="340" rx="16" fill="#f1f4fa" stroke="#dfe4ec"/>
  <text x="925" y="428" font-size="13" text-anchor="end" fill="#5c6678">架空の会社「ソラ商事」の社内</text>`;

  M.edges.forEach(e => {
    const a = M.nodes[e.from], b = M.nodes[e.to];
    const on = edges.includes(e.id);
    const cut = on && e.cutBy && defenses.includes(e.cutBy);
    const color = on ? M.stageColor[e.stage] : "#cfd6e2";
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const r = 46;
    const x1 = a.x + ux * r, y1 = a.y + uy * r, x2 = b.x - ux * r, y2 = b.y - uy * r;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${on ? 4 : 2}" ${on ? "" : 'stroke-dasharray="4 5"'} marker-end="url(#${mid(color)})"/>`;
    if (on) {
      svg += `<rect x="${mx - 70}" y="${my - 11}" width="140" height="20" rx="6" fill="#fff" fill-opacity=".9"/><text x="${mx}" y="${my + 4}" font-size="11" text-anchor="middle" fill="${color}">${e.label}</text>`;
    }
    if (cut) {
      svg += `<g transform="translate(${mx},${my - 28})"><circle r="13" fill="#1565c0"/><path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="#fff" stroke-width="3"/></g><text x="${mx}" y="${my - 46}" font-size="11" text-anchor="middle" fill="#1565c0">${M.defenses[e.cutBy]}で遮断</text>`;
    }
  });

  Object.keys(M.nodes).forEach(k => {
    const n = M.nodes[k];
    const fill = { attacker: "#fdeaea", person: "#fff8e1", sys: "#fff", data: "#e8f5e9", ext: "#f5f5f5" }[n.kind];
    const stroke = { attacker: "#c62828", person: "#f9a825", sys: "#90a4ae", data: "#2e7d32", ext: "#9e9e9e" }[n.kind];
    const lines = n.label.split("\n");
    svg += `<g><rect x="${n.x - 70}" y="${n.y - 30}" width="140" height="60" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    lines.forEach((t, i) => { svg += `<text x="${n.x}" y="${n.y + (i - (lines.length - 1) / 2) * 16 + 5}" font-size="${i === 0 ? 14 : 11}" font-weight="${i === 0 ? 700 : 400}" text-anchor="middle" fill="#1c2230">${t}</text>`; });
    svg += `</g>`;
  });
  svg += `</svg>`;
  container.innerHTML = `<div class="mapwrap">${svg}</div>`;
};

LT.routes.map = function (app) {
  const edges = LT.state.map.edges;
  app.innerHTML = `<div class="card"><h1>攻撃経路マップ</h1><p>各ステージで、あなたが攻撃者として通った経路が描き足されます。色のついた線が通った経路、点線はまだ体験していない経路です。青い×印は、あなたが置いた対策で遮断された箇所です。</p><div id="map"></div>
  <div class="legend mt"><span><i style="background:#c62828"></i>ステージ1 パスワード</span><span><i style="background:#e65100"></i>ステージ2 フィッシング</span><span><i style="background:#6a1b9a"></i>ステージ3 侵入の連鎖</span><span><i style="background:#00695c"></i>ステージ4 人為ミス</span><span><i style="background:#cfd6e2"></i>未体験</span></div></div>`;
  LT.renderMap(app.querySelector("#map"));
  const box = document.createElement("div");
  box.className = "card";
  const all = LT.MAP.edges.length;
  box.innerHTML = `<h2>読み取り方</h2><p>通った経路：<b>${edges.length} / ${all}</b></p>
  <p>一本ずつはただの「小さなミス」に見えても、線がつながると「1つのパスワードの使い回し」から「12万人分の顧客情報の流出」までが一本の道になります。対策は、この道のどこかを<b>断ち切る</b>ものです。</p>
  <h3>対策を置いてみる</h3><div class="pill-list" id="defs"></div><p class="small mt">対策を切り替えると、遮断される経路が×印で表示されます（ステージ3で詳しく扱います）。</p>`;
  app.appendChild(box);
  const defs = box.querySelector("#defs");
  Object.keys(LT.MAP.defenses).forEach(k => {
    const l = document.createElement("label");
    const on = LT.state.map.defenses.includes(k);
    l.className = "toggle" + (on ? " on" : "");
    l.innerHTML = `<input type="checkbox" ${on ? "checked" : ""}> ${LT.MAP.defenses[k]}`;
    l.querySelector("input").onchange = (e) => { LT.setMapDefense(k, e.target.checked); l.classList.toggle("on", e.target.checked); LT.renderMap(app.querySelector("#map")); };
    defs.appendChild(l);
  });
};
