/* 端末の計算速度を実測するための Web Worker。
   「1秒あたり何回ハッシュ化できるか」だけを測り、その数値を画面に返す。
   実際のパスワードを言い当てる処理は行わない。解読時間は
   「組み合わせの総数 ÷ 実測した速度」として stage1.js 側で見積もる。 */

async function benchmark(ms) {
  // ダミーの文字列を次々にハッシュ化し、一定時間に何回できたかを数える
  const enc = new TextEncoder();
  let count = 0;
  const end = performance.now() + ms;
  let i = 0;
  // まとめて回すことで計測のばらつきを抑える
  while (performance.now() < end) {
    const batch = 200;
    const jobs = [];
    for (let k = 0; k < batch; k++) {
      jobs.push(crypto.subtle.digest("SHA-256", enc.encode("bench-" + (i++))));
    }
    await Promise.all(jobs);
    count += batch;
  }
  return count;
}

self.onmessage = async (e) => {
  if (e.data && e.data.cmd === "bench") {
    const ms = e.data.ms || 600;
    const t0 = performance.now();
    const count = await benchmark(ms);
    const sec = (performance.now() - t0) / 1000;
    const rate = count / sec; // 1秒あたりのハッシュ化回数
    self.postMessage({ type: "bench", rate: rate, count: count, seconds: sec });
  }
};
