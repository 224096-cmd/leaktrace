/* 学習記録（ブラウザ内の localStorage に保存。外部には送信しない） */
window.LT = window.LT || {};

LT.STORE_KEY = "leaktrace_v1";
LT.VERSION = "0.2.0";

LT.defaultState = function () {
  return {
    version: LT.VERSION,
    learnerId: "P-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    layer: "intro",          // intro | practice | inquiry
    ethicsAccepted: false,
    research: false,
    createdAt: new Date().toISOString(),
    events: [],
    stages: {},              // s1: { steps:{see,break,defend}, startedAt, completedAt }
    answers: {},             // 予想・記述課題
    scores: {},              // 判別課題などの得点
    map: { edges: [], defenses: [] },
    measurements: []         // 研究モードの実測値
  };
};

LT.state = null;

LT.load = function () {
  try {
    const raw = localStorage.getItem(LT.STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      LT.state = Object.assign(LT.defaultState(), s);
      return LT.state;
    }
  } catch (e) { /* 壊れていたら作り直す */ }
  LT.state = LT.defaultState();
  LT.save();
  return LT.state;
};

LT.save = function () {
  try { localStorage.setItem(LT.STORE_KEY, JSON.stringify(LT.state)); } catch (e) { /* 容量超過など */ }
};

LT.reset = function () {
  LT.state = LT.defaultState();
  LT.save();
};

/* イベント記録 */
LT.log = function (stage, step, type, detail) {
  LT.state.events.push({
    t: new Date().toISOString(),
    layer: LT.state.layer,
    stage: stage || "",
    step: step || "",
    type: type,
    detail: detail === undefined ? "" : detail
  });
  if (LT.state.events.length > 5000) LT.state.events.splice(0, LT.state.events.length - 5000);
  LT.save();
};

LT.stageState = function (id) {
  if (!LT.state.stages[id]) LT.state.stages[id] = { steps: {}, startedAt: null, completedAt: null, seconds: 0 };
  return LT.state.stages[id];
};

LT.startStage = function (id) {
  const s = LT.stageState(id);
  if (!s.startedAt) { s.startedAt = new Date().toISOString(); LT.log(id, "", "stage_start"); }
  LT.save();
};

LT.markStep = function (id, step) {
  const s = LT.stageState(id);
  if (!s.steps[step]) {
    s.steps[step] = new Date().toISOString();
    LT.log(id, step, "step_done");
  }
  if (s.steps.see && s.steps.break && s.steps.defend && !s.completedAt) {
    s.completedAt = new Date().toISOString();
    LT.log(id, "", "stage_complete");
  }
  LT.save();
};

LT.addSeconds = function (id, sec) {
  const s = LT.stageState(id);
  s.seconds = (s.seconds || 0) + sec;
  LT.save();
};

LT.setAnswer = function (key, value) {
  LT.state.answers[key] = { value: value, t: new Date().toISOString(), layer: LT.state.layer };
  LT.log(key.split(".")[0], "", "answer", { key: key, value: value });
  LT.save();
};

LT.setScore = function (key, obj) {
  LT.state.scores[key] = Object.assign({ t: new Date().toISOString(), layer: LT.state.layer }, obj);
  LT.log(key.split(".")[0], "", "score", Object.assign({ key: key }, obj));
  LT.save();
};

LT.measure = function (stage, name, params, value) {
  LT.state.measurements.push({ t: new Date().toISOString(), stage: stage, name: name, params: params, value: value, ua: navigator.userAgent });
  LT.save();
};

LT.addMapEdge = function (edgeId) {
  if (!LT.state.map.edges.includes(edgeId)) { LT.state.map.edges.push(edgeId); LT.log("map", "", "edge_added", edgeId); }
  LT.save();
};
LT.setMapDefense = function (defId, on) {
  const d = LT.state.map.defenses;
  const i = d.indexOf(defId);
  if (on && i < 0) d.push(defId);
  if (!on && i >= 0) d.splice(i, 1);
  LT.save();
};

/* ---------- 書き出し ---------- */
LT.download = function (filename, text, mime) {
  const blob = new Blob(["﻿" + text], { type: (mime || "text/plain") + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
};

LT.csvEscape = function (v) {
  if (v === null || v === undefined) return "";
  let s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
};

LT.toCSV = function (rows, header) {
  const lines = [header.map(LT.csvEscape).join(",")];
  rows.forEach(r => lines.push(header.map(h => LT.csvEscape(r[h])).join(",")));
  return lines.join("\r\n");
};

LT.exportEventsCSV = function () {
  const rows = LT.state.events.map(e => ({ learnerId: LT.state.learnerId, time: e.t, layer: e.layer, stage: e.stage, step: e.step, type: e.type, detail: e.detail }));
  LT.download(`leaktrace_events_${LT.state.learnerId}.csv`, LT.toCSV(rows, ["learnerId", "time", "layer", "stage", "step", "type", "detail"]), "text/csv");
};

LT.exportMeasurementsCSV = function () {
  const rows = LT.state.measurements.map(m => ({ learnerId: LT.state.learnerId, time: m.t, stage: m.stage, name: m.name, params: m.params, value: m.value, ua: m.ua }));
  LT.download(`leaktrace_measurements_${LT.state.learnerId}.csv`, LT.toCSV(rows, ["learnerId", "time", "stage", "name", "params", "value", "ua"]), "text/csv");
};

LT.exportJSON = function () {
  LT.download(`leaktrace_${LT.state.learnerId}.json`, JSON.stringify(LT.state, null, 2), "application/json");
};

LT.summary = function () {
  const st = LT.state;
  const stages = ["s1", "s2", "s3", "s4", "final"];
  const names = { s1: "ステージ1 パスワード", s2: "ステージ2 フィッシング", s3: "ステージ3 侵入の連鎖", s4: "ステージ4 人為ミス", final: "最終課題" };
  return stages.map(id => {
    const s = st.stages[id] || { steps: {} };
    return {
      id, name: names[id],
      see: !!s.steps.see, break: !!s.steps.break, defend: !!s.steps.defend,
      completed: !!s.completedAt, seconds: Math.round(s.seconds || 0),
      startedAt: s.startedAt || "", completedAt: s.completedAt || ""
    };
  });
};

LT.exportMarkdown = function () {
  const st = LT.state;
  const layerName = { intro: "導入（中学生〜）", practice: "体験（高校生〜）", inquiry: "探究（大学生〜）" };
  let md = `# LeakTrace 学習記録\n\n`;
  md += `- 参加者ID: ${st.learnerId}\n- 学習層: ${layerName[st.layer] || st.layer}\n- 記録開始: ${st.createdAt}\n- 書き出し: ${new Date().toISOString()}\n- 教材バージョン: ${st.version}\n\n`;
  md += `## ステージ進捗\n\n| ステージ | 見る | 破る | なぜ守れるか | 完了 | 所要時間(秒) |\n|---|---|---|---|---|---|\n`;
  LT.summary().forEach(s => {
    const c = v => v ? "✓" : "–";
    md += `| ${s.name} | ${c(s.see)} | ${c(s.break)} | ${c(s.defend)} | ${c(s.completed)} | ${s.seconds} |\n`;
  });
  md += `\n## 得点（判別課題など）\n\n`;
  const sk = Object.keys(st.scores);
  if (!sk.length) md += "（なし）\n";
  sk.forEach(k => { const v = st.scores[k]; md += `- **${k}**: ${v.correct}/${v.total}（${v.percent}%）${v.note ? " — " + v.note : ""}\n`; });
  md += `\n## 予想・記述の回答\n\n`;
  const ak = Object.keys(st.answers);
  if (!ak.length) md += "（なし）\n";
  ak.forEach(k => { const v = st.answers[k]; md += `### ${k}\n\n${typeof v.value === "object" ? "```json\n" + JSON.stringify(v.value, null, 2) + "\n```" : v.value}\n\n`; });
  md += `## 実測値\n\n`;
  if (!st.measurements.length) md += "（なし）\n";
  else {
    md += `| 時刻 | ステージ | 項目 | 条件 | 値 |\n|---|---|---|---|---|\n`;
    st.measurements.forEach(m => md += `| ${m.t} | ${m.stage} | ${m.name} | ${JSON.stringify(m.params)} | ${JSON.stringify(m.value)} |\n`);
  }
  md += `\n## イベント数\n\n${st.events.length} 件（CSV で書き出し可能）\n`;
  LT.download(`leaktrace_summary_${st.learnerId}.md`, md, "text/markdown");
};
