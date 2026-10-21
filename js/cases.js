/* 実際の事件・統計（各ステージの冒頭に「事件ファイル」として表示）
   教材内の体験はすべて架空の会社で行う。ここでは報道・公的資料に基づく事実だけを要約し、出典を示す。 */
window.LT = window.LT || {};

LT.CASES = {
  s0: {
    label: "統計",
    title: "2025年、上場企業だけで3,000万人分以上の個人情報が漏えい",
    when: "2025年（2026年2月公表）",
    facts: [
      "上場企業とその子会社の個人情報漏えい・紛失事故は180件、漏えい・紛失した人数は3,063万6,910人分（前年の約1.9倍）。",
      "原因の内訳は「ウイルス感染・不正アクセス」116件（64.4%）、「誤表示・誤送信」37件（20.5%）、「紛失・誤廃棄」18件（10.0%）、「不正持ち出し・盗難」7件（3.8%）。",
      "上場企業以外も含めた民間事業者から個人情報保護委員会への漏えい等の報告は、年間1万7,139件（令和7年度年次報告）。"
    ],
    sources: [
      { t: "Web担当者Forum：2025年の個人情報漏えい、被害人数は3,063万人（東京商工リサーチ調べ）", url: "https://webtan.impress.co.jp/n/2026/02/06/52123" },
      { t: "企業法務ナビ：民間事業者における個人データの漏えい等 1万7,139件（令和7年度の年次報告）", url: "https://www.kaiketsu-j.com/trouble/22893/" }
    ]
  },
  s1: {
    label: "不正ログイン",
    title: "盗まれたIDとパスワードは、売買され、別のサービスで試される",
    when: "2025〜2026年",
    facts: [
      "IPA「情報セキュリティ10大脅威 2026」（個人）に「インターネット上のサービスへの不正ログイン」「インターネット上のサービスからの個人情報の窃取」が選ばれている。",
      "2025年の証券口座乗っ取り事件では、盗まれた証券口座のアカウント情報が闇サイトで10万件以上流通していると報じられた。",
      "1か所から漏れたIDとパスワードは、使い回しているほかのサービスへのログインに使われる。"
    ],
    sources: [
      { t: "IPA：情報セキュリティ10大脅威 2026", url: "https://www.ipa.go.jp/security/10threats/10threats2026.html" },
      { t: "nippon.com：証券口座乗っ取り 不正な株取引の手口と急増の背景", url: "https://www.nippon.com/ja/in-depth/d01153/" }
    ]
  },
  s2: {
    label: "フィッシング",
    title: "偽サイトから証券口座が乗っ取られ、不正取引は数千億円規模に",
    when: "2025年",
    facts: [
      "2025年のフィッシング報告件数は245万4,297件で過去最多（前年の約1.43倍）。かたられた分野はクレジットカード、金融、証券が上位。",
      "証券会社を装ったメールやSMSで偽サイトに誘導し、IDやパスワードを盗んで口座を乗っ取る被害が多発。金融庁の集計では、2025年6月までに不正取引7,139件、売買総額は約5,710億円。",
      "偽サイトが入力内容を本物のサイトへすぐに中継するため、ワンタイムパスワードによる多要素認証でも突破される例があった。",
      "日本証券業協会は、ログインなどの重要な操作で「フィッシングに耐性のある多要素認証」（パスキーなど）を必須とする方向でガイドラインを改正した。"
    ],
    sources: [
      { t: "ScanNetSecurity：フィッシング対策協議会「フィッシングレポート2026」", url: "https://scan.netsecurity.ne.jp/article/2026/06/11/55466.html" },
      { t: "nippon.com：証券口座乗っ取り 不正な株取引の手口と急増の背景", url: "https://www.nippon.com/ja/in-depth/d01153/" },
      { t: "トレンドマイクロ：多要素認証も突破される証券口座の乗っ取り", url: "https://www.trendmicro.com/ja_jp/research/25/f/mfa-securities-hacks.html" },
      { t: "Impress Watch：日本証券業協会がガイドライン改正案、フィッシング耐性のある多要素認証を必須化", url: "https://www.watch.impress.co.jp/docs/news/2031496.html" }
    ]
  },
  s3: {
    label: "ランサムウェア・委託先",
    title: "1つのアカウントから全社停止へ。委託先も入口になる",
    when: "2024〜2025年",
    facts: [
      "IPA「情報セキュリティ10大脅威 2026」（組織）の1位は「ランサム攻撃による被害」、2位は「サプライチェーンや委託先を狙った攻撃」。",
      "アスクル（2025年10月）：例外的に多要素認証を設定していなかった業務委託先の管理者アカウントが不正に使われて侵入され、サーバー間を移動して権限を奪われた。バックアップも削除され、物流センターの出荷が全面停止。約74万件の情報が流出。",
      "アサヒグループ（2025年9月）：ランサムウェア攻撃を受け、約191万件の個人情報が漏えいした可能性。再発防止策としてリモートアクセス用VPN装置の全面廃止などを発表。",
      "イセトー（2024年）：納税通知書の印刷などを請け負う委託先がランサムウェアに感染し、委託元の自治体や企業の個人情報が漏えいした。業務完了後に削除したと報告されていたデータが残っていた例もあった。"
    ],
    sources: [
      { t: "IPA：情報セキュリティ10大脅威 2026", url: "https://www.ipa.go.jp/security/10threats/10threats2026.html" },
      { t: "Impress Watch：アスクル、ランサムウェア被害の調査結果", url: "https://www.watch.impress.co.jp/docs/news/2070955.html" },
      { t: "ITmedia：アサヒグループHDで11万件漏えい発覚 サイバー攻撃巡り", url: "https://www.itmedia.co.jp/news/article/2602/18/1260218117/" },
      { t: "ScanNetSecurity：イセトーへのランサムウェア攻撃で徳島県の個人情報も漏えい", url: "https://scan.netsecurity.ne.jp/article/2024/07/08/51260.html" }
    ]
  },
  s4: {
    label: "人為ミス",
    title: "学年全員の保護者に、成績や家庭環境を書いた名簿が届いた",
    when: "2025年4月",
    facts: [
      "山形市の小学校で、教員が学年の保護者全員へ連絡メールを送る際、クラス編成用の児童名簿（学力検査の結果、性格・行動の傾向、家庭環境などを記載）を誤って添付した。ファイルにパスワードはなく、少なくとも5人の保護者が開封していた。",
      "再発防止策として、送信前の複数人によるチェック、個人情報を含むファイルの保護、研修、名簿に載せる情報の見直しが挙げられた。",
      "上場企業の事故でも「誤表示・誤送信」は37件（20.5%）で、不正アクセスに次いで多い。"
    ],
    sources: [
      { t: "Rocket Boys：山形市の小学校が児童情報のメールを誤送信", url: "https://rocket-boys.co.jp/security-measures-lab/yamagata-elementary-school-email-data-breach-student-info-leak/" },
      { t: "Web担当者Forum：2025年の個人情報漏えい（東京商工リサーチ調べ）", url: "https://webtan.impress.co.jp/n/2026/02/06/52123" }
    ]
  },
  final: {
    label: "漏えいの後",
    title: "漏えいの「お知らせ」を装った詐欺にも注意",
    when: "",
    facts: [
      "漏えいが起きると、事業者は個人情報保護委員会への報告と本人への通知を求められる場合がある（2022年4月の改正個人情報保護法から義務化）。",
      "漏えいの報道や「お知らせ」に便乗して、本物そっくりの通知メールで偽サイトへ誘導する手口もある。通知を受けたら、メール内のリンクではなく公式サイトやアプリで確かめる。"
    ],
    sources: [
      { t: "個人情報保護委員会：漏えい等の対応とお役立ち資料", url: "https://www.ppc.go.jp/personalinfo/legal/leakAction/" }
    ]
  }
};

/* 事件ファイルのカード */
LT.caseCard = function (id) {
  const c = LT.CASES[id];
  if (!c) return "";
  const intro = LT.isIntro && LT.isIntro();
  const facts = intro ? c.facts.slice(0, 2) : c.facts;
  return `<details class="case" ${LT.state.ui && LT.state.ui.caseClosed && LT.state.ui.caseClosed[id] ? "" : "open"} data-case="${id}">
    <summary><span class="case-tag">📁 実際の事件ファイル：${c.label}</span><span class="case-when">${c.when}</span></summary>
    <h3 class="case-title">${c.title}</h3>
    <ul class="case-facts">${facts.map(f => `<li>${f}</li>`).join("")}</ul>
    <div class="case-src"><b>出典</b>${c.sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener">${LT.esc(s.t)}</a>`).join("")}</div>
    <p class="case-note">この教材では、同じ「型」の出来事を架空の会社で再現して体験します。</p>
  </details>`;
};
