/* 用語解説（クリック/タップで吹き出し表示） */
window.LT = window.LT || {};

LT.GLOSSARY = {
  "ハッシュ化": "データを、決まった長さの文字列（ハッシュ値）に変換する処理。同じ入力からは必ず同じ値が出るが、値から元のデータを逆算することはできない。パスワードはこの形で保存される。",
  "ハッシュ値": "ハッシュ化で得られる固定長の文字列。SHA-256なら64文字の16進数になる。",
  "SHA-256": "広く使われているハッシュ化の方式の一つ。どんな長さの入力でも256ビット（64文字の16進数）の値に変換する。",
  "リスト型攻撃": "ある場所から漏れた「メールアドレスとパスワードの組」の一覧（リスト）を、別のサービスにそのまま入力して、使い回している人のアカウントに侵入する攻撃。",
  "総当たり攻撃": "考えられるパスワードを「a」「b」…「aa」「ab」…と順番にすべて試して当てる攻撃。ブルートフォース攻撃ともいう。",
  "多要素認証": "パスワード（知っているもの）に加えて、スマホに届くコードや指紋（持っているもの・本人そのもの）など、別の種類の確認を組み合わせるログイン方式。MFA、二段階認証とも呼ばれる。",
  "フィッシング": "本物そっくりのメールやWebサイトでだまして、パスワードやクレジットカード番号などを入力させて盗み取る手口。",
  "ドメイン": "Webサイトの住所にあたる部分。「https://www.example.co.jp/login」なら「example.co.jp」が本当の持ち主を示す部分で、その左側（www など）は持ち主が自由に付けられる。",
  "脆弱性": "ソフトウェアや機器の設計・プログラムに含まれる欠陥のうち、攻撃に悪用できるもの。「セキュリティホール」ともいう。",
  "パッチ": "見つかった脆弱性をふさぐための修正プログラム。「更新」「アップデート」として配布される。",
  "VPN": "外出先から社内ネットワークに安全につなぐための仕組み（Virtual Private Network）。入口にあたる機器が古いままだと、攻撃者の侵入口になる。",
  "最小権限": "各アカウントに、仕事に必要な最低限の権限だけを与える考え方。1つのアカウントが乗っ取られても被害が広がりにくい。",
  "ネットワーク分離": "社内ネットワークを部署や役割ごとに区切り、必要のない通信を通さないようにすること。",
  "ランサムウェア": "データを勝手に暗号化して使えなくし、元に戻す代わりに金銭を要求する不正なプログラム。",
  "二重恐喝": "データを暗号化して身代金を要求するだけでなく、先に盗んだデータを「公開するぞ」と脅して二重に金銭を要求する手口。",
  "ログ": "システムが残す「いつ・誰が・何をしたか」の記録。監視すると異常な動き（深夜の大量通信など）に気づける。",
  "CC": "メールの「Carbon Copy」。CCに入れた宛先は、受信者全員から見える。",
  "BCC": "メールの「Blind Carbon Copy」。BCCに入れた宛先は、他の受信者からは見えない。",
  "透視ビュー": "この教材の機能。操作の裏側でサーバーのデータや通信、ログがどう変化したかを見せる画面。",
  "WebCrypto": "ブラウザに標準で入っている暗号機能。この教材では本物のハッシュ化・暗号化をこの機能で実行している。",
  "不正アクセス禁止法": "他人のIDやパスワードで無断でログインしたり、脆弱性を突いてシステムに侵入したりすることを禁じる日本の法律。この教材の模擬環境以外で試すことは犯罪になる。",
  "塩": "ソルト（salt）。ハッシュ化の前にパスワードへ付け足すランダムな文字列。同じパスワードでも人ごとに違うハッシュ値になり、流出時に一度に割られにくくなる。",
  "ソルト": "ハッシュ化の前にパスワードへ付け足すランダムな文字列。同じパスワードでも人ごとに違うハッシュ値になり、流出時に一度に割られにくくなる。",
  "共有リンク": "クラウドのファイルを「このURLを知っている人は誰でも見られる」などの設定で共有する機能。公開範囲の設定を誤ると、意図しない人にも見られる。",
  "Web Worker": "ブラウザで重い計算を画面とは別の場所で動かす仕組み。画面が固まるのを防ぐ。",
  "SUS": "System Usability Scale。使いやすさを10問で測る標準的な質問紙。",
  "ドメインスプーフィング": "メールの送信元アドレスを本物のドメインに偽装する手口。対策（SPF/DKIM/DMARC）を入れていないドメインはなりすましやすい。",
  "DMARC": "メールの送信元ドメインが本物かを受信側が確認するための仕組み。偽装されたメールを拒否したり隔離したりできる。"
};

/* 用語を吹き出し付きにして返す。T("ハッシュ化") / T("ハッシュ化", "ハッシュ") */
LT.T = function (term, label) {
  const text = label || term;
  if (!LT.GLOSSARY[term]) return text;
  return `<span class="term" data-term="${term}">${text}</span>`;
};

LT.initGlossary = function () {
  const pop = document.getElementById("glossaryPop");
  function hide() { pop.hidden = true; }
  document.addEventListener("click", (e) => {
    const t = e.target.closest(".term");
    if (!t) { hide(); return; }
    const term = t.dataset.term;
    const desc = LT.GLOSSARY[term];
    if (!desc) return;
    pop.innerHTML = `<b>${term}</b><br>${desc}`;
    pop.hidden = false;
    const r = t.getBoundingClientRect();
    const pw = Math.min(320, window.innerWidth - 24);
    let left = r.left;
    if (left + pw > window.innerWidth - 12) left = window.innerWidth - 12 - pw;
    if (left < 12) left = 12;
    let top = r.bottom + 8;
    pop.style.left = left + "px";
    pop.style.top = top + "px";
    pop.style.maxWidth = pw + "px";
    // 画面下にはみ出す場合は上に出す
    const ph = pop.getBoundingClientRect().height;
    if (top + ph > window.innerHeight - 12) pop.style.top = Math.max(12, r.top - ph - 8) + "px";
    e.stopPropagation();
  });
  window.addEventListener("scroll", hide, { passive: true });
  window.addEventListener("hashchange", hide);
};
