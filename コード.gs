/**
 * ========================================
 * CAMPFIREマーケティング戦略資料 自動生成ツール
 * ========================================
 *
 * Google Slidesで戦略資料を自動生成します
 * 16:9横サイズ（960 x 540ポイント）
 *
 * 【現在のモード】第1章のみ生成（Gemini AI戦略付き）
 *
 * 【AI連携】
 * - Gemini API でクライアント固有の戦略コンテンツを自動生成
 * - スプレッドシートの「背景」「実現したいこと」等を分析
 * - CAMPFIRE成功法則に基づいたアドバイスを生成
 *
 * 【使い方】
 * 1. メニュー「🔑 Gemini APIキーを設定」でAPIキーを登録
 * 2. スプレッドシートにクライアント情報を入力
 * 3. メニューから「🚀 第1章を生成（AI戦略付き）」を選択
 * 4. 完成するまで待つ
 */

// ========================================
// グローバル変数
// ========================================

let 現在のプレゼンID = null;

// ========================================
// 定数定義
// ========================================

const 色設定 = {
  背景色: '#FFF9E6',        // クリーム色
  アクセント色: '#FF9500',  // オレンジ
  テキスト濃: '#333333',    // ダークグレー
  カード背景: '#FFFFFF',    // 白
  テキスト薄: '#666666',    // ライトグレー
  アクセント薄: '#FFF3E0',  // 薄いオレンジ
  ボーダー: '#EEEEEE',      // ボーダー
  赤: '#D32F2F',             // 赤（警告・必須）
  暗い背景: '#333333'       // ダーク背景
};

const ページサイズ = {
  幅: 960,    // 16:9 横（標準プレゼンサイズ）
  高さ: 540   // 16:9 横
};

const 余白 = {
  上: 40,
  下: 40,
  左: 60,
  右: 60
};

const コンテンツ幅 = ページサイズ.幅 - 余白.左 - 余白.右;

const フォントサイズ = {
  タイトル: 32,
  見出し1: 24,
  見出し2: 18,
  見出し3: 14,
  本文: 12,
  小: 10,
  極小: 9
};

// ========================================
// Gemini API 設定
// ========================================

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent';

// ========================================
// メニュー作成
// ========================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 CAMPFIRE戦略')
    .addItem('🚀 第1章を生成（AI戦略付き）', '戦略資料を自動生成_分割')
    .addItem('📂 最新資料のURL表示', '最新資料のURL表示')
    .addSeparator()
    .addItem('🔑 Gemini APIキーを設定', 'GeminiAPIキーを設定')
    .addItem('📝 テンプレート行を追加', 'テンプレート行を追加')
    .addToUi();
}

function 最新資料のURL表示() {
  const url = PropertiesService.getUserProperties().getProperty('最新プレゼンURL');

  if (url) {
    const ui = SpreadsheetApp.getUi();
    const htmlOutput = HtmlService.createHtmlOutput(
      '<p>最新の戦略資料:</p>' +
      '<p><a href="' + url + '" target="_blank">' + url + '</a></p>' +
      '<p><button onclick="google.script.host.close()">閉じる</button></p>'
    ).setWidth(500).setHeight(150);

    ui.showModalDialog(htmlOutput, '最新資料のURL');
  } else {
    SpreadsheetApp.getUi().alert('まだ資料が生成されていません。');
  }
}

function テンプレート行を追加() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const newRow = lastRow + 1;

  sheet.getRange(newRow, 1, 1, 6).setValues([[
    '起案者名（例：山田太郎）',
    300000,
    'プロジェクトの背景を記入してください',
    'https://x.com/username\nhttps://note.com/username',
    '実現したいことを記入してください',
    'プロジェクト名を記入してください（例：○○制作プロジェクト）'
  ]]);

  SpreadsheetApp.getUi().alert('テンプレート行を追加しました。\n内容を編集してご利用ください。');
}

// ========================================
// Gemini API キー設定
// ========================================

function GeminiAPIキーを設定() {
  const ui = SpreadsheetApp.getUi();
  const 現在のキー = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const 状態 = 現在のキー ? '（設定済み）' : '（未設定）';

  const 応答 = ui.prompt(
    '🔑 Gemini APIキー設定 ' + 状態,
    'Google AI Studio で取得した Gemini API キーを入力してください。\n\n' +
    '取得先: https://aistudio.google.com/apikey\n\n' +
    '※ 空欄でOKを押すと現在のキーを削除します',
    ui.ButtonSet.OK_CANCEL
  );

  if (応答.getSelectedButton() === ui.Button.OK) {
    const apiKey = 応答.getResponseText().trim();
    if (apiKey) {
      PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
      ui.alert('✅ APIキーを保存しました。\n\nこれでAI戦略生成が利用できます。');
    } else {
      PropertiesService.getScriptProperties().deleteProperty('GEMINI_API_KEY');
      ui.alert('APIキーを削除しました。');
    }
  }
}

// ========================================
// Gemini API 連携
// ========================================

/**
 * スクリプトプロパティからGemini APIキーを取得
 */
function GeminiAPIキーを取得() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error(
      'Gemini APIキーが設定されていません。\n\n' +
      'メニューの「📊 CAMPFIRE戦略」→「🔑 Gemini APIキーを設定」から登録してください。\n' +
      '（APIキー取得先: https://aistudio.google.com/apikey）'
    );
  }
  return apiKey;
}

/**
 * Gemini APIを呼び出して第1章のコンテンツを生成
 * クライアントデータ（背景・実現したいこと等）をプロンプトに注入し、
 * プロジェクト固有の戦略を生成する
 */
function Geminiで第1章を生成(クライアントデータ) {
  Logger.log('=== Gemini API で第1章コンテンツを生成中 ===');
  Logger.log('起案者名: ' + クライアントデータ.起案者名);
  Logger.log('目標金額: ' + クライアントデータ.目標金額);

  const apiKey = GeminiAPIキーを取得();
  const プロンプト = 第1章プロンプトを構築(クライアントデータ);

  Logger.log('プロンプト文字数: ' + プロンプト.length);

  const payload = {
    contents: [{
      parts: [{ text: プロンプト }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(
      GEMINI_API_ENDPOINT + '?key=' + apiKey,
      options
    );

    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('Gemini API ステータス: ' + statusCode);

    if (statusCode !== 200) {
      Logger.log('APIエラー応答: ' + responseText.substring(0, 500));
      throw new Error('Gemini API応答エラー (HTTP ' + statusCode + ')');
    }

    const json = JSON.parse(responseText);
    const 生成テキスト = json.candidates[0].content.parts[0].text;

    Logger.log('Gemini応答（先頭300文字）: ' + 生成テキスト.substring(0, 300));

    const 結果 = Geminiレスポンスを解析(生成テキスト);

    Logger.log('=== Gemini API 第1章コンテンツ生成完了 ===');
    Logger.log('生成ページ数: ' + (結果.ページ一覧 ? 結果.ページ一覧.length : '不明'));

    return 結果;

  } catch (e) {
    Logger.log('Gemini APIエラー: ' + e.toString());
    Logger.log('スタックトレース: ' + e.stack);
    throw new Error(
      'Gemini AIの呼び出しに失敗しました。\n\n' +
      'エラー内容: ' + e.message + '\n\n' +
      '【確認事項】\n' +
      '・APIキーが正しく設定されていますか？\n' +
      '・Google AI Studio でキーが有効ですか？\n' +
      '・インターネット接続は正常ですか？'
    );
  }
}

/**
 * 第1章用のGeminiプロンプトを構築
 * クライアントの「背景」「実現したいこと」「目標金額」「起案者名」を注入
 */
function 第1章プロンプトを構築(クライアントデータ) {
  const 目標金額テキスト = クライアントデータ.目標金額 ? クライアントデータ.目標金額.toLocaleString() : '未定';
  const 初日目標 = クライアントデータ.目標金額 ? Math.round(クライアントデータ.目標金額 * 0.15).toLocaleString() : '未定';
  const 三日目標 = クライアントデータ.目標金額 ? Math.round(クライアントデータ.目標金額 * 0.30).toLocaleString() : '未定';

  return 'あなたはCAMPFIREクラウドファンディングの専門マーケティングコンサルタントです。\n' +
    '以下のクライアント情報を分析し、第1章「導入・プロジェクト概要」のスライド内容を生成してください。\n\n' +
    '【絶対ルール】\n' +
    '1. 専門用語は一切使わない（中学生でもわかる日本語で書く）\n' +
    '   - KPI → 「数値目標」\n' +
    '   - リーチ → 「見た人の数」\n' +
    '   - CVR → 「申し込み率」\n' +
    '   - ペルソナ → 「想定する支援者像」\n' +
    '   - エンゲージメント → 「反応」\n' +
    '   - コンバージョン → 「支援につながった数」\n' +
    '2. このプロジェクト固有の具体的な内容を書くこと（汎用的な内容はNG）\n' +
    '3. CAMPFIRE成功法則を踏まえること:\n' +
    '   - 初日に目標の15%（' + 初日目標 + '円）達成が重要\n' +
    '   - 3日間で30%（' + 三日目標 + '円）達成すると成功率90%\n' +
    '   - お気に入り登録100件が必須ライン\n' +
    '   - 支援者の8割は知り合い・身近な人\n' +
    '4. 各項目の「説明」は2〜4文で簡潔に書く\n' +
    '5. 各ページの「項目一覧」は3〜4個にする\n\n' +
    '【クライアント情報】\n' +
    '- 起案者名: ' + (クライアントデータ.起案者名 || '未入力') + '\n' +
    '- プロジェクト名: ' + (クライアントデータ.プロジェクト名 || '未定') + '\n' +
    '- 目標金額: ' + 目標金額テキスト + '円\n' +
    '- 背景: ' + (クライアントデータ.背景 || '未入力') + '\n' +
    '- 実現したいこと: ' + (クライアントデータ.実現したいこと || '未入力') + '\n\n' +
    '【出力JSON形式】\n' +
    '以下の形式で、ちょうど8ページ分のスライドコンテンツを生成してください。\n' +
    '（章タイトルページとまとめページは自動生成するため含めないこと）\n\n' +
    '{\n' +
    '  "ページ一覧": [\n' +
    '    {\n' +
    '      "タイトル": "ページの見出し（20文字以内）",\n' +
    '      "サブタイトル": "補足説明（30文字以内、省略可）",\n' +
    '      "項目一覧": [\n' +
    '        {\n' +
    '          "タイトル": "項目の見出し（15文字以内）",\n' +
    '          "説明": "2〜4文の説明文（100文字以内）"\n' +
    '        }\n' +
    '      ]\n' +
    '    }\n' +
    '  ]\n' +
    '}\n\n' +
    '【8ページの構成（この順番で生成すること）】\n' +
    '1. プロジェクトの全体像 - ' + (クライアントデータ.プロジェクト名 || 'このプロジェクト') + 'の概要を一目でわかるように\n' +
    '2. 背景にある課題と想い - なぜこのプロジェクトが必要なのか、起案者の想い\n' +
    '3. なぜ今クラウドファンディングなのか - CAMPFIREを選ぶ理由と意義\n' +
    '4. 届けたい相手 - このプロジェクトを届けたいターゲット層の分析\n' +
    '5. 想定する支援者像 - 具体的にどんな人が支援してくれるか\n' +
    '6. 実現したいことの具体化 - 「' + (クライアントデータ.実現したいこと || '目標').substring(0, 30) + '」を具体的なステップに\n' +
    '7. 目標金額' + 目標金額テキスト + '円の根拠と設計 - 金額の内訳と達成の道筋\n' +
    '8. このプロジェクトだけの強み - 他にはない独自の価値と差別化ポイント';
}

/**
 * Geminiの応答テキストをJSONとして解析（フォールバック付き）
 */
function Geminiレスポンスを解析(テキスト) {
  // まずそのままJSON解析を試みる
  try {
    return JSON.parse(テキスト);
  } catch (e1) {
    Logger.log('直接JSON解析失敗、フォールバック処理開始');
  }

  // ```json ... ``` ブロックを抽出して再試行
  var jsonMatch = テキスト.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e2) {
      Logger.log('JSONブロック解析失敗');
    }
  }

  // 最外部の { ... } を抽出して再試行
  var braceMatch = テキスト.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch (e3) {
      Logger.log('ブレース抽出解析失敗');
    }
  }

  throw new Error('Geminiの応答をJSON形式で解析できませんでした。\n応答テキスト先頭: ' + テキスト.substring(0, 200));
}

// ========================================
// テスト用関数（Gemini不要・4枚だけ生成）
// ========================================

function テスト生成() {
  try {
    Logger.log('========================================');
    Logger.log('テスト生成開始（横向き4枚）');
    Logger.log('========================================');

    // テスト用クライアントデータ
    const テストデータ = {
      起案者名: 'テストクライアント',
      プロジェクト名: 'テストプロジェクト',
      目標金額: 500000,
      公開日: '2026年3月1日',
      終了日: '2026年3月31日',
      URL一覧: 'https://twitter.com/test,https://instagram.com/test,https://facebook.com/test'
    };

    const SNS情報 = SNSのURLを解析(テストデータ.URL一覧);

    // テスト用プレゼンテーション作成
    const プレゼン名 = 'テスト_横向きスライド_' + new Date().getTime();
    const プレゼン = SlidesApp.create(プレゼン名);
    現在のプレゼンID = プレゼン.getId();

    Logger.log('プレゼンテーションID: ' + 現在のプレゼンID);
    Logger.log('Google Slidesのデフォルトサイズ (16:9) を使用');

    // 最初のスライドを削除
    const スライド一覧 = プレゼン.getSlides();
    if (スライド一覧.length > 0) {
      スライド一覧[0].remove();
    }

    // スライド作成（表紙から4枚：横向きデザイン確認）
    Logger.log('1. 表紙スライド作成中...');
    表紙スライドを作成(プレゼン, テストデータ, SNS情報);

    Logger.log('2. 目次スライド作成中...');
    目次スライドを作成(プレゼン, SNS情報);

    Logger.log('3. プロジェクト概要スライド作成中...');
    プロジェクト概要スライドを作成(プレゼン, テストデータ);

    Logger.log('4. クラファン成功データスライド作成中...');
    クラファン成功データスライドを作成(プレゼン);

    const 作成枚数 = プレゼン.getSlides().length;
    const プレゼンURL = プレゼン.getUrl();

    Logger.log('========================================');
    Logger.log('テスト生成完了: ' + 作成枚数 + '枚');
    Logger.log('URL: ' + プレゼンURL);
    Logger.log('========================================');

    SpreadsheetApp.getUi().alert(
      '✅ テスト完了！\n\n' +
      '横向きスライド' + 作成枚数 + '枚を生成しました。\n' +
      'デザインを確認してください。\n\n' +
      プレゼンURL
    );

    return プレゼンURL;

  } catch (エラー) {
    Logger.log('エラー発生: ' + エラー.toString());
    Logger.log('スタックトレース: ' + エラー.stack);
    SpreadsheetApp.getUi().alert('エラー', 'エラーが発生しました:\n\n' + エラー.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
    throw エラー;
  }
}

// ========================================
// メイン処理（第1章のみ生成）
// ========================================

function 戦略資料を自動生成_分割() {
  try {
    Logger.log('========================================');
    Logger.log('戦略資料生成開始（第1章のみ・AI戦略付き）');
    Logger.log('========================================');

    const クライアントデータ = クライアントを選択();
    if (!クライアントデータ) {
      Logger.log('クライアント選択がキャンセルされました');
      return;
    }

    Logger.log('選択されたクライアント: ' + クライアントデータ.起案者名);
    Logger.log('目標金額: ' + クライアントデータ.目標金額);
    Logger.log('背景: ' + (クライアントデータ.背景 || '未入力').substring(0, 100));
    Logger.log('実現したいこと: ' + (クライアントデータ.実現したいこと || '未入力').substring(0, 100));

    // ----------------------------------------
    // ステップ1: Gemini API で第1章のコンテンツを生成
    // ----------------------------------------
    メッセージ表示('🤖 AI分析開始',
      'Gemini AIがプロジェクト固有の戦略を分析します。\n\n' +
      'クライアント: ' + クライアントデータ.起案者名 + '\n' +
      '目標金額: ¥' + クライアントデータ.目標金額.toLocaleString() + '\n\n' +
      '分析には30秒〜1分ほどかかります。\n' +
      'OKを押して開始してください。'
    );

    Logger.log('--- Gemini API 呼び出し開始 ---');
    クライアントデータ.AI戦略 = Geminiで第1章を生成(クライアントデータ);
    Logger.log('--- Gemini API 呼び出し完了 ---');

    const SNS情報 = SNSのURLを解析(クライアントデータ.URL一覧);

    // ----------------------------------------
    // ステップ2: プレゼンテーション作成 + 表紙・目次・第1章
    // ----------------------------------------
    Logger.log('=== スライド生成開始 ===');
    const プレゼン = プレゼンテーションを作成(クライアントデータ);

    Logger.log('表紙スライド作成中...');
    表紙スライドを作成(プレゼン, クライアントデータ, SNS情報);

    Logger.log('目次スライド作成中...');
    目次スライドを作成(プレゼン, SNS情報);

    Logger.log('第1章スライド作成中...');
    第1章を作成(プレゼン, クライアントデータ);

    // 第2章を作成(プレゼン, クライアントデータ);  // ← 第1章のみ生成のため一旦コメントアウト

    Logger.log('=== パート1完了: ' + プレゼン.getSlides().length + 'スライド ===');

    // ========================================
    // パート2: 第3章〜第5章（一旦コメントアウト）
    // ========================================
    // Logger.log('=== パート2生成開始 ===');
    // 第3章を作成(プレゼン, クライアントデータ);
    // 第4章を作成(プレゼン, クライアントデータ);
    // 第5章を作成(プレゼン, クライアントデータ, SNS情報);
    // Logger.log('パート2完了: ' + プレゼン.getSlides().length + 'スライド');

    // ========================================
    // パート3: 第6章〜第9章（一旦コメントアウト）
    // ========================================
    // Logger.log('=== パート3生成開始 ===');
    // 第6章を作成(プレゼン, クライアントデータ);
    // 第7章を作成(プレゼン, クライアントデータ);
    // 第8章を作成(プレゼン, クライアントデータ);
    // 第9章を作成(プレゼン, クライアントデータ);

    // ----------------------------------------
    // ステップ3: 完了処理
    // ----------------------------------------
    const プレゼンURL = プレゼン.getUrl();
    const 総スライド数 = プレゼン.getSlides().length;

    PropertiesService.getUserProperties().setProperty('最新プレゼンURL', プレゼンURL);

    // スプレッドシートのG列にURLを書き込む
    try {
      const シート = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      シート.getRange(クライアントデータ.行番号, 7).setValue(プレゼンURL);
      Logger.log('G' + クライアントデータ.行番号 + 'にURLを書き込みました');
    } catch (e) {
      Logger.log('URL書き込みエラー（処理は続行）: ' + e.toString());
    }

    Logger.log('========================================');
    Logger.log('第1章 生成完了');
    Logger.log('URL: ' + プレゼンURL);
    Logger.log('総スライド数: ' + 総スライド数);
    Logger.log('========================================');

    メッセージ表示('✅ 第1章が完成しました！',
      '第1章「導入・プロジェクト概要」の生成が完了しました。\n\n' +
      'クライアント: ' + クライアントデータ.起案者名 + '\n' +
      '目標金額: ¥' + クライアントデータ.目標金額.toLocaleString() + '\n' +
      '総スライド数: ' + 総スライド数 + 'ページ\n' +
      '（表紙 + 目次 + 第1章）\n\n' +
      'G列にURLを記録しました。\n\n' +
      '以下のURLをコピーして開いてください:\n' + プレゼンURL
    );

    return プレゼンURL;

  } catch (エラー) {
    Logger.log('エラー発生: ' + エラー.toString());
    Logger.log('スタックトレース: ' + エラー.stack);
    メッセージ表示('エラー', 'エラーが発生しました:\n\n' + エラー.toString());
    throw エラー;
  }
}

// ========================================
// クライアント選択
// ========================================

function クライアントを選択() {
  const シート = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const 最終行 = シート.getLastRow();

  if (最終行 < 2) {
    メッセージ表示('エラー', 'データが入力されていません。\nスプレッドシートにクライアント情報を入力してください。');
    return null;
  }

  const データ範囲 = シート.getRange(2, 1, 最終行 - 1, 6);
  const 値配列 = データ範囲.getValues();

  const クライアント一覧 = [];
  値配列.forEach(function(行, インデックス) {
    if (行[0] && 行[0].toString().trim() !== '') {
      クライアント一覧.push({
        行番号: インデックス + 2,
        起案者名: 行[0],
        目標金額: parseInt(行[1]) || 300000,
        背景: 行[2] || '',
        URL一覧: 行[3] || '',
        実現したいこと: 行[4] || '',
        プロジェクト名: 行[5] || ''
      });
    }
  });

  if (クライアント一覧.length === 0) {
    メッセージ表示('エラー', '有効なクライアントデータが見つかりません。\n起案者名を入力してください。');
    return null;
  }

  if (クライアント一覧.length === 1) {
    return クライアント一覧[0];
  }

  const ui = SpreadsheetApp.getUi();
  var メッセージ = 'クライアントを選択してください（番号を入力）:\n\n';
  クライアント一覧.forEach(function(クライアント, インデックス) {
    メッセージ += (インデックス + 1) + '. ' + クライアント.起案者名 + ' (¥' + クライアント.目標金額.toLocaleString() + ')\n';
  });
  メッセージ += '\n番号を入力してOKを押してください:';

  const 応答 = ui.prompt('クライアント選択', メッセージ, ui.ButtonSet.OK_CANCEL);

  if (応答.getSelectedButton() === ui.Button.CANCEL) {
    return null;
  }

  const 選択番号 = parseInt(応答.getResponseText()) - 1;
  if (選択番号 >= 0 && 選択番号 < クライアント一覧.length) {
    return クライアント一覧[選択番号];
  }

  メッセージ表示('エラー', '無効な番号です。');
  return null;
}

// ========================================
// プレゼンテーション作成
// ========================================

function プレゼンテーションを作成(クライアントデータ) {
  const プレゼン名 = クライアントデータ.起案者名 + '様_CAMPFIREマーケティング戦略資料';
  const プレゼン = SlidesApp.create(プレゼン名);

  // グローバル変数にプレゼンIDを保存
  現在のプレゼンID = プレゼン.getId();

  Logger.log('プレゼンテーション名: ' + プレゼン名);

  // 16:9横サイズに設定
  try {
    Slides.Presentations.patch({
      pageSize: {
        width: { magnitude: ページサイズ.幅, unit: 'PT' },
        height: { magnitude: ページサイズ.高さ, unit: 'PT' }
      }
    }, プレゼン.getId());

    Logger.log('ページサイズ設定完了: 16:9横 (' + ページサイズ.幅 + ' x ' + ページサイズ.高さ + ' pt)');
  } catch (e) {
    Logger.log('ページサイズ設定エラー: ' + e.toString());
  }

  const スライド一覧 = プレゼン.getSlides();
  if (スライド一覧.length > 0) {
    スライド一覧[0].remove();
  }

  return プレゼン;
}

// ========================================
// SNS URL解析
// ========================================

function SNSのURLを解析(URL文字列) {
  const SNS情報 = {
    Xあり: false,
    Instagramあり: false,
    Facebookあり: false,
    Noteあり: false,
    Amebaあり: false,
    URL一覧: []
  };

  if (!URL文字列) return SNS情報;

  const URL配列 = URL文字列.split(/[\n,]+/).map(function(url) { return url.trim(); }).filter(function(url) { return url; });
  SNS情報.URL一覧 = URL配列;

  URL配列.forEach(function(url) {
    const 小文字URL = url.toLowerCase();
    if (小文字URL.includes('twitter.com') || 小文字URL.includes('x.com')) {
      SNS情報.Xあり = true;
    } else if (小文字URL.includes('instagram.com')) {
      SNS情報.Instagramあり = true;
    } else if (小文字URL.includes('facebook.com')) {
      SNS情報.Facebookあり = true;
    } else if (小文字URL.includes('note.com') || 小文字URL.includes('note.mu')) {
      SNS情報.Noteあり = true;
    } else if (小文字URL.includes('ameblo.jp') || 小文字URL.includes('ameba.jp')) {
      SNS情報.Amebaあり = true;
    }
  });

  Logger.log('解析されたSNS: X=' + SNS情報.Xあり + ', Note=' + SNS情報.Noteあり + ', Ameba=' + SNS情報.Amebaあり + ', Instagram=' + SNS情報.Instagramあり);

  return SNS情報;
}

// ========================================
// ユーティリティ関数
// ========================================

function メッセージ表示(タイトル, メッセージ) {
  try {
    SpreadsheetApp.getUi().alert(タイトル, メッセージ, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    Logger.log('メッセージ表示エラー: ' + e.toString());
  }
}

function ポイントをインチに変換(ポイント) {
  return ポイント / 72;
}

/**
 * SlidesApp でテキストボックスを作成
 */
function テキストを追加(スライド, テキスト, オプション) {
  // テキストボックスを作成
  const テキストボックス = スライド.insertShape(
    SlidesApp.ShapeType.TEXT_BOX,
    オプション.左位置,
    オプション.上位置,
    オプション.幅,
    オプション.高さ
  );

  // テキストを設定
  const テキスト範囲 = テキストボックス.getText();
  テキスト範囲.setText(テキスト);

  // スタイルを適用
  const スタイル = テキスト範囲.getTextStyle();

  // フォントサイズ
  if (オプション.フォントサイズ) {
    スタイル.setFontSize(オプション.フォントサイズ);
  }

  // 太字
  if (オプション.太字) {
    スタイル.setBold(true);
  }

  // 色
  if (オプション.色) {
    スタイル.setForegroundColor(オプション.色);
  }

  // 配置
  if (オプション.配置) {
    const 段落スタイル = テキスト範囲.getParagraphStyle();
    if (オプション.配置 === '中央') {
      段落スタイル.setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    } else if (オプション.配置 === '右') {
      段落スタイル.setParagraphAlignment(SlidesApp.ParagraphAlignment.END);
    } else {
      段落スタイル.setParagraphAlignment(SlidesApp.ParagraphAlignment.START);
    }
  }

  return テキストボックス;
}

/**
 * HEX色をRGBに変換
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    red: parseInt(result[1], 16) / 255,
    green: parseInt(result[2], 16) / 255,
    blue: parseInt(result[3], 16) / 255
  } : { red: 1, green: 1, blue: 1 };
}

/**
 * SlidesApp で図形を追加（ポイント単位で直接指定）
 */
function 図形を追加(スライド, 図形タイプ, オプション) {
  var 図形;

  if (図形タイプ === '長方形') {
    図形 = スライド.insertShape(SlidesApp.ShapeType.RECTANGLE,
      オプション.左位置,
      オプション.上位置,
      オプション.幅,
      オプション.高さ
    );
  } else if (図形タイプ === '楕円') {
    図形 = スライド.insertShape(SlidesApp.ShapeType.ELLIPSE,
      オプション.左位置,
      オプション.上位置,
      オプション.幅,
      オプション.高さ
    );
  } else if (図形タイプ === '角丸長方形') {
    図形 = スライド.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE,
      オプション.左位置,
      オプション.上位置,
      オプション.幅,
      オプション.高さ
    );
  }

  if (図形 && オプション.塗りつぶし色) {
    図形.getFill().setSolidFill(オプション.塗りつぶし色);
  }

  if (図形) {
    図形.getBorder().setTransparent();
  }

  return 図形;
}

// ========================================
// 共通スライドパーツ関数
// ========================================

/**
 * ページヘッダー（英字サブタイトル + 日本語タイトル + アクセントライン）
 */
function ページヘッダーを作成(スライド, 英字, 日本語タイトル, サブタイトル) {
  if (英字) {
    テキストを追加(スライド, 英字, {
      左位置: 余白.左, 上位置: 余白.上 - 5, 幅: コンテンツ幅, 高さ: 18,
      フォントサイズ: フォントサイズ.小, 色: 色設定.テキスト薄
    });
  }

  テキストを追加(スライド, 日本語タイトル, {
    左位置: 余白.左, 上位置: 英字 ? 余白.上 + 12 : 余白.上, 幅: コンテンツ幅, 高さ: 36,
    フォントサイズ: フォントサイズ.見出し1, 太字: true, 色: 色設定.テキスト濃
  });

  if (サブタイトル) {
    テキストを追加(スライド, サブタイトル, {
      左位置: 余白.左, 上位置: 英字 ? 余白.上 + 45 : 余白.上 + 35, 幅: コンテンツ幅, 高さ: 22,
      フォントサイズ: フォントサイズ.見出し3, 太字: true, 色: 色設定.アクセント色
    });
  }

  const ラインY = サブタイトル ? (英字 ? 余白.上 + 68 : 余白.上 + 58) : (英字 ? 余白.上 + 48 : 余白.上 + 38);
  図形を追加(スライド, '長方形', {
    左位置: 余白.左, 上位置: ラインY, 幅: 100, 高さ: 3, 塗りつぶし色: 色設定.アクセント色
  });

  return ラインY + 10;
}

/**
 * 章タイトルスライド（オレンジ背景）
 */
function 章タイトルスライドを作成(プレゼン, 章番号, タイトル, サブタイトル) {
  const スライド = プレゼン.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  スライド.getBackground().setSolidFill(色設定.アクセント色);

  テキストを追加(スライド, 章番号, {
    左位置: 余白.左, 上位置: 160, 幅: 200, 高さ: 80,
    フォントサイズ: 64, 太字: true, 色: '#FFFFFF'
  });

  テキストを追加(スライド, タイトル, {
    左位置: 余白.左, 上位置: 260, 幅: コンテンツ幅, 高さ: 60,
    フォントサイズ: フォントサイズ.タイトル, 太字: true, 色: '#FFFFFF'
  });

  if (サブタイトル) {
    テキストを追加(スライド, サブタイトル, {
      左位置: 余白.左, 上位置: 330, 幅: コンテンツ幅, 高さ: 40,
      フォントサイズ: フォントサイズ.見出し3, 色: '#FFFFFF'
    });
  }
}

/**
 * 情報カード（白背景・左オレンジボーダー）
 */
function 情報カードを作成(スライド, 左位置, 上位置, 幅, 高さ, タイトル, 内容, オプション) {
  オプション = オプション || {};

  図形を追加(スライド, '長方形', {
    左位置: 左位置, 上位置: 上位置, 幅: 幅, 高さ: 高さ,
    塗りつぶし色: オプション.背景色 || 色設定.カード背景
  });

  if (オプション.左ボーダー !== false) {
    図形を追加(スライド, '長方形', {
      左位置: 左位置, 上位置: 上位置, 幅: 5, 高さ: 高さ,
      塗りつぶし色: オプション.ボーダー色 || 色設定.アクセント色
    });
  }

  if (オプション.上ボーダー) {
    図形を追加(スライド, '長方形', {
      左位置: 左位置, 上位置: 上位置, 幅: 幅, 高さ: 5,
      塗りつぶし色: オプション.ボーダー色 || 色設定.アクセント色
    });
  }

  if (タイトル) {
    テキストを追加(スライド, タイトル, {
      左位置: 左位置 + 15, 上位置: 上位置 + 10, 幅: 幅 - 30, 高さ: 20,
      フォントサイズ: オプション.タイトルサイズ || フォントサイズ.本文,
      太字: true, 色: オプション.タイトル色 || 色設定.アクセント色
    });
  }

  if (内容) {
    テキストを追加(スライド, 内容, {
      左位置: 左位置 + 15, 上位置: 上位置 + (タイトル ? 32 : 10), 幅: 幅 - 30, 高さ: 高さ - (タイトル ? 42 : 20),
      フォントサイズ: オプション.内容サイズ || フォントサイズ.小,
      色: オプション.内容色 || 色設定.テキスト濃
    });
  }
}

/**
 * ラベルバッジ（角丸四角＋テキスト）
 */
function ラベルを作成(スライド, 左位置, 上位置, テキスト, オプション) {
  オプション = オプション || {};
  const 幅 = オプション.幅 || 100;
  const 高さ = オプション.高さ || 22;

  図形を追加(スライド, '角丸長方形', {
    左位置: 左位置, 上位置: 上位置, 幅: 幅, 高さ: 高さ,
    塗りつぶし色: オプション.背景色 || 色設定.アクセント色
  });

  テキストを追加(スライド, テキスト, {
    左位置: 左位置, 上位置: 上位置 + 3, 幅: 幅, 高さ: 高さ - 6,
    フォントサイズ: オプション.フォントサイズ || フォントサイズ.極小,
    太字: true, 色: オプション.文字色 || '#FFFFFF', 配置: '中央'
  });
}

/**
 * タイムライン丸アイコン + ラベル
 */
function タイムライン項目を作成(スライド, 左位置, 上位置, ラベルテキスト, タイトル, 内容リスト, オプション) {
  オプション = オプション || {};
  const カード幅 = オプション.カード幅 || (コンテンツ幅 - 80);

  // 丸アイコン
  図形を追加(スライド, '楕円', {
    左位置: 左位置, 上位置: 上位置 + 5, 幅: 16, 高さ: 16,
    塗りつぶし色: 色設定.アクセント色
  });

  // ラベル
  if (ラベルテキスト) {
    ラベルを作成(スライド, 左位置 + 30, 上位置, ラベルテキスト, {
      幅: 80, 高さ: 20, フォントサイズ: フォントサイズ.極小
    });
  }

  // カード
  const カード上位置 = 上位置 + 28;
  図形を追加(スライド, '長方形', {
    左位置: 左位置 + 30, 上位置: カード上位置, 幅: カード幅, 高さ: オプション.カード高さ || 90,
    塗りつぶし色: 色設定.カード背景
  });

  図形を追加(スライド, '長方形', {
    左位置: 左位置 + 30, 上位置: カード上位置, 幅: 5, 高さ: オプション.カード高さ || 90,
    塗りつぶし色: 色設定.アクセント色
  });

  if (タイトル) {
    テキストを追加(スライド, タイトル, {
      左位置: 左位置 + 48, 上位置: カード上位置 + 8, 幅: カード幅 - 30, 高さ: 22,
      フォントサイズ: フォントサイズ.見出し3, 太字: true, 色: 色設定.テキスト濃
    });
  }

  if (内容リスト && 内容リスト.length > 0) {
    const 内容テキスト = 内容リスト.join('\n');
    テキストを追加(スライド, 内容テキスト, {
      左位置: 左位置 + 48, 上位置: カード上位置 + 30, 幅: カード幅 - 30, 高さ: (オプション.カード高さ || 90) - 38,
      フォントサイズ: フォントサイズ.小, 色: 色設定.テキスト薄
    });
  }
}

/**
 * 番号付きステップカード（縦並び）
 */
function ステップカードを作成(スライド, 左位置, 上位置, 番号, タイトル, 説明, オプション) {
  オプション = オプション || {};
  const 幅 = オプション.幅 || コンテンツ幅;
  const 高さ = オプション.高さ || 80;

  図形を追加(スライド, '長方形', {
    左位置: 左位置, 上位置: 上位置, 幅: 幅, 高さ: 高さ,
    塗りつぶし色: 色設定.カード背景
  });

  // 番号丸
  図形を追加(スライド, '楕円', {
    左位置: 左位置 + 15, 上位置: 上位置 + (高さ - 32) / 2, 幅: 32, 高さ: 32,
    塗りつぶし色: 色設定.アクセント色
  });

  テキストを追加(スライド, 番号, {
    左位置: 左位置 + 15, 上位置: 上位置 + (高さ - 32) / 2 + 6, 幅: 32, 高さ: 20,
    フォントサイズ: フォントサイズ.見出し3, 太字: true, 色: '#FFFFFF', 配置: '中央'
  });

  テキストを追加(スライド, タイトル, {
    左位置: 左位置 + 60, 上位置: 上位置 + 10, 幅: 幅 - 80, 高さ: 22,
    フォントサイズ: フォントサイズ.見出し3, 太字: true, 色: 色設定.テキスト濃
  });

  if (説明) {
    テキストを追加(スライド, 説明, {
      左位置: 左位置 + 60, 上位置: 上位置 + 34, 幅: 幅 - 80, 高さ: 高さ - 42,
      フォントサイズ: フォントサイズ.小, 色: 色設定.テキスト薄
    });
  }
}

/**
 * 簡易スライド（共通テンプレート: タイトル + カード項目リスト）
 * 横長最適化版
 */
function 簡易スライドを作成(プレゼン, タイトル, 項目一覧, オプション) {
  オプション = オプション || {};
  const スライド = プレゼン.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  スライド.getBackground().setSolidFill(色設定.背景色);

  const コンテンツ開始Y = ページヘッダーを作成(スライド, オプション.英字 || null, タイトル);

  var y = コンテンツ開始Y + 15;
  const 利用可能高さ = ページサイズ.高さ - y - 余白.下;
  const 項目高さ = Math.min(100, Math.floor(利用可能高さ / 項目一覧.length) - 5);

  項目一覧.forEach(function(項目, idx) {
    情報カードを作成(スライド, 余白.左, y, コンテンツ幅, 項目高さ, 項目.タイトル, 項目.説明, { 左ボーダー: true });
    y += 項目高さ + 5;
  });
}
