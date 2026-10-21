/* 使いやすさアンケート（SUS: System Usability Scale, Brooke 1996）＋自由記述 */
window.LT = window.LT || {};
LT.routes = LT.routes || {};

LT.SUS = [
  "この教材を、これからもくり返し使いたいと思う",
  "この教材は、ちょうどよいシンプルさだと思う",
  "この教材は、使いやすいと思う",
  "詳しい人に手伝ってもらわなくても、一人で使えると思う",
  "この教材のいろいろな機能は、うまくまとまっていると思う",
  "この教材には、ちぐはぐなところが少ないと思う",
  "たいていの人は、この教材の使い方をすぐに覚えられると思う",
  "この教材は、すらすら操作できると思う",
  "この教材を使うとき、自信をもって操作できた",
  "この教材は、事前に覚えることが少なくすぐ使い始められた"
];

/* スコア：全項目を肯定文にそろえているため、(回答-1) を合計して 2.5 倍（0〜100）。
   SUS（Brooke 1996）をもとに文を肯定形へ統一した改変版なので、論文では「SUSに基づく改変尺度」と記す */
LT.susScore = function (items) {
  let s = 0;
  items.forEach(v => { s += (v - 1); });
  return s * 2.5;
};

LT.routes.survey = function (app) {
  const prev = LT.state.survey;
  app.innerHTML = `
  <div class="narrow">
    <h1>使いやすさアンケート</h1>
    <p class="muted">教材を改善するためのアンケートです。思ったとおりに答えてください（正解はありません）。<b>5が「とてもそう思う」</b>、1が「まったくそう思わない」です。</p>
    <div class="card" id="items">
      ${LT.SUS.map((q, i) => `<div class="${i ? "mt" : ""}"><p class="mb0"><span class="qnum">${i + 1}</span>${q}</p>
        <div class="likert mt">${LT.TEST.likert.map((l, v) => `<label><input type="radio" name="sus${i}" value="${v + 1}" ${prev && prev.items && prev.items[i] === v + 1 ? "checked" : ""}><b>${v + 1}</b>${l}</label>`).join("")}</div></div>`).join("")}
    </div>
    <div class="card">
      <label class="field"><span>よかったところ（自由に）</span><textarea id="good">${prev ? LT.esc(prev.good || "") : ""}</textarea></label>
      <label class="field mb0"><span>分かりにくかったところ・直してほしいところ</span><textarea id="comment">${prev ? LT.esc(prev.comment || "") : ""}</textarea></label>
    </div>
    <button class="btn primary lg block" id="send" disabled>回答を保存する</button>
    <div id="done"></div>
  </div>`;
  const send = app.querySelector("#send");
  const check = () => { send.disabled = LT.SUS.some((_, i) => !app.querySelector(`input[name=sus${i}]:checked`)); };
  app.querySelectorAll(".likert input").forEach(r => r.onchange = check);
  check();
  send.onclick = () => {
    const items = LT.SUS.map((_, i) => Number(app.querySelector(`input[name=sus${i}]:checked`).value));
    const sus = LT.susScore(items);
    LT.state.survey = { t: new Date().toISOString(), layer: LT.state.layer, items, sus, good: app.querySelector("#good").value.trim(), comment: app.querySelector("#comment").value.trim() };
    LT.setScore("survey.sus", { correct: sus, total: 100, percent: sus, note: "使いやすさスコア（SUSに基づく改変版、0〜100）" });
    LT.save();
    app.querySelector("#done").innerHTML = `<div class="card ok center mt fade-in"><h2>ご協力ありがとうございました</h2><p>回答を保存しました。これで学習はすべて終わりです。</p><a class="btn primary" href="#/records">学習記録を見る ›</a></div>`;
    app.querySelector("#done").scrollIntoView({ behavior: "smooth" });
  };
};
