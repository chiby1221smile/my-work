// ==========================================
// CAMPFIREマーケティング戦略資料 - Gemini API版
// ==========================================

// 【重要】ここにあなたのGemini APIキーを入力してください
const MY_API_KEY = "YOUR_API_KEY_HERE";

// ==========================================
// 定数設定
// ==========================================

// A4縦型サイズ（ポイント単位）
const ページサイズ = {
  幅: 595,  // 21cm = 595pt
  高さ: 842  // 29.7cm = 842pt
};

// デザインカラーパレット
const 色設定 = {
  背景色: '#FFF9E6',
  見出し帯: '#FF9500',
  アクセント: '#FFD966',
  本文色: '#333333',
  カード背景: '#FFFFFF',
  テキスト薄: '#666666'
};

// 余白設定
const 余白 = {
  上: 40,
  下: 40,
  左: 40,
  右: 40
};

// コンテンツエリア
const コンテンツ幅 = ページサイズ.幅 - 余白.左 - 余白.右; // 515pt
const コンテンツ高さ = ページサイズ.高さ - 余白.上 - 余白.下; // 762pt

// フォントサイズ範囲（文字見切れ防止用）
const フォントサイズ = {
  タイトル最大: 32,
  タイトル最小: 22,
  見出し最大: 22,
  見出し最小: 16,
  本文最大: 16,
  本文最小: 11,
  小文字最大: 12,
  小文字最小: 9
};

// ==========================================
// メニュー追加
// ==========================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🤖 CAMPFIRE AI戦略')
    .addItem('🚀 戦略資料を自動生成（Gemini版）', '戦略資料を自動生成_Gemini')
    .addItem('🔌 API接続テスト', 'APIテスト')
    .addSeparator()
    .addItem('📂 最新資料のURL表示', '最新資料のURL表示')
    .addToUi();
}

// ==========================================
// Gemini API接続関数（リトライ機能付き）
// ==========================================

/**
 * Gemini APIでテキストを生成（Not Found対策のリトライ機能付き）
 * @param {string} prompt - プロンプト
 * @return {string} 生成されたテキスト
 */
function Geminiでテキスト生成(prompt) {
  if (MY_API_KEY === "YOUR_API_KEY_HERE" || !MY_API_KEY) {
    throw new Error("❌ APIキーが設定されていません。コード.gsの MY_API_KEY を設定してください。");
  }

  // 試行するモデルのリスト（優先順位順）
  const モデルリスト = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-pro',
    'gemini-1.5-pro'
  ];

  let 最後のエラー = null;

  // 各モデルを順番に試行
  for (let i = 0; i < モデルリスト.length; i++) {
    const モデル名 = モデルリスト[i];
    Logger.log(`🔄 モデル試行中: ${モデル名} (${i + 1}/${モデルリスト.length})`);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${モデル名}:generateContent?key=${MY_API_KEY}`;

      const payload = {
        "contents": [{
          "parts": [{
            "text": prompt
          }]
        }],
        "generationConfig": {
          "temperature": 0.7,
          "topK": 40,
          "topP": 0.95,
          "maxOutputTokens": 2048
        }
      };

      const options = {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(payload),
        "muteHttpExceptions": true
      };

      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();

      if (responseCode === 200) {
        const result = JSON.parse(response.getContentText());

        if (result.candidates && result.candidates[0] && result.candidates[0].content) {
          const text = result.candidates[0].content.parts[0].text;
          Logger.log(`✅ 成功: ${モデル名}で生成完了`);
          return text;
        }
      } else if (responseCode === 404) {
        Logger.log(`⚠️ モデル ${モデル名} が見つかりません（404 Not Found）`);
        最後のエラー = `モデル ${モデル名} は利用できません`;
        continue; // 次のモデルを試行
      } else {
        const errorText = response.getContentText();
        Logger.log(`⚠️ エラー（${responseCode}）: ${errorText}`);
        最後のエラー = `HTTP ${responseCode}: ${errorText}`;
        continue;
      }
    } catch (e) {
      Logger.log(`⚠️ 例外発生: ${e.message}`);
      最後のエラー = e.message;
      continue;
    }
  }

  // すべてのモデルで失敗した場合
  throw new Error(`❌ すべてのモデルで接続失敗しました。最後のエラー: ${最後のエラー}`);
}

// ==========================================
// API接続テスト関数
// ==========================================

function APIテスト() {
  try {
    SpreadsheetApp.getUi().alert('🔌 API接続テスト開始\n\n簡単なテキストを生成します...');

    const テストプロンプト = "「こんにちは」と日本語で一言返してください。";
    const 結果 = Geminiでテキスト生成(テストプロンプト);

    SpreadsheetApp.getUi().alert(`✅ API接続成功！\n\nGeminiの応答:\n${結果}`);
  } catch (e) {
    SpreadsheetApp.getUi().alert(`❌ API接続失敗\n\nエラー内容:\n${e.message}\n\n対処方法:\n1. MY_API_KEYが正しく設定されているか確認\n2. https://aistudio.google.com/app/apikey でAPIキーを確認`);
  }
}

// ==========================================
// プロジェクトデータ取得
// ==========================================

/**
 * スプレッドシートから選択されたクライアントのデータを取得
 * @return {Object} クライアントデータ
 */
function クライアントデータを取得() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const データ範囲 = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6);
  const データ = データ範囲.getValues();

  // データが存在するか確認
  const 有効データ = データ.filter(row => row[0] !== "" || row[5] !== "");

  if (有効データ.length === 0) {
    throw new Error("❌ スプレッドシートにデータがありません。\n\nA列〜F列に以下を入力してください:\nA: 起案者名\nB: 目標金額\nC: 背景\nD: URL\nE: 実現したいこと\nF: プロジェクト名");
  }

  let 選択行 = 0;

  // 複数データがある場合は選択ダイアログを表示
  if (有効データ.length > 1) {
    const ui = SpreadsheetApp.getUi();
    const 選択肢 = 有効データ.map((row, index) =>
      `${index + 1}. ${row[5] || row[0] || '（名前なし）'}`
    ).join('\n');

    const 応答 = ui.prompt(
      'クライアント選択',
      `生成するクライアントの番号を入力してください:\n\n${選択肢}`,
      ui.ButtonSet.OK_CANCEL
    );

    if (応答.getSelectedButton() === ui.Button.OK) {
      選択行 = parseInt(応答.getResponseText()) - 1;
      if (選択行 < 0 || 選択行 >= 有効データ.length) {
        throw new Error("❌ 無効な番号です");
      }
    } else {
      throw new Error("キャンセルされました");
    }
  }

  const 行 = 有効データ[選択行];

  return {
    起案者名: 行[0] || "起案者",
    目標金額: 行[1] || 300000,
    背景: 行[2] || "",
    URL: 行[3] || "",
    実現したいこと: 行[4] || "",
    プロジェクト名: 行[5] || "新規プロジェクト"
  };
}

// ==========================================
// スライド作成ユーティリティ
// ==========================================

/**
 * 新しいプレゼンテーションを作成
 * @param {string} タイトル - プレゼンテーションのタイトル
 * @return {Object} プレゼンテーションオブジェクト
 */
function プレゼンテーションを作成(タイトル) {
  const presentation = SlidesApp.create(タイトル);

  // A4縦型に設定
  presentation.getPageWidth();  // 既存サイズを取得（初期化のため）

  // ページサイズを設定（ポイント単位）
  const ページ = presentation.getSlides()[0];

  // 注: Google Slides APIではページサイズ変更が制限されているため、
  // SlidesApp.create()後に手動で設定が必要な場合があります
  // 以下は将来的なAPI対応のための準備コード

  Logger.log(`📊 プレゼンテーション作成: ${タイトル}`);
  Logger.log(`📐 設定サイズ: ${ページサイズ.幅} x ${ページサイズ.高さ} pt`);

  return presentation;
}

/**
 * 背景色を設定
 * @param {Slide} スライド - 対象スライド
 */
function 背景色を設定(スライド) {
  const 背景 = スライド.getBackground();
  背景.setSolidFill(色設定.背景色);
}

/**
 * テキストボックスを追加
 * @param {Slide} スライド - 対象スライド
 * @param {string} テキスト - 表示テキスト
 * @param {number} left - 左位置
 * @param {number} top - 上位置
 * @param {number} width - 幅
 * @param {number} height - 高さ
 * @param {Object} オプション - スタイル設定
 * @return {Shape} テキストボックス
 */
function テキストボックスを追加(スライド, テキスト, left, top, width, height, オプション = {}) {
  const shape = スライド.insertTextBox(テキスト, left, top, width, height);
  const textRange = shape.getText();

  // フォントサイズ
  if (オプション.フォントサイズ) {
    textRange.getTextStyle().setFontSize(オプション.フォントサイズ);
  }

  // 太字
  if (オプション.太字) {
    textRange.getTextStyle().setBold(true);
  }

  // 文字色
  if (オプション.文字色) {
    textRange.getTextStyle().setForegroundColor(オプション.文字色);
  }

  // 背景色
  if (オプション.背景色) {
    shape.getFill().setSolidFill(オプション.背景色);
  } else {
    shape.getFill().setTransparent();
  }

  // 枠線なし
  shape.getBorder().setTransparent();

  // テキスト整列
  if (オプション.中央揃え) {
    textRange.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  }

  return shape;
}

/**
 * 文字数に応じて最適なフォントサイズを計算（見切れ防止）
 * @param {string} テキスト - 対象テキスト
 * @param {number} 最大サイズ - 最大フォントサイズ
 * @param {number} 最小サイズ - 最小フォントサイズ
 * @param {number} 基準文字数 - 基準となる文字数（デフォルト50文字）
 * @return {number} 最適なフォントサイズ
 */
function 最適フォントサイズを計算(テキスト, 最大サイズ, 最小サイズ, 基準文字数 = 50) {
  const 文字数 = テキスト.length;

  if (文字数 <= 基準文字数) {
    return 最大サイズ;
  }

  // 文字数に比例してサイズを縮小
  const 縮小率 = 基準文字数 / 文字数;
  const 計算サイズ = Math.floor(最大サイズ * 縮小率);

  // 最小サイズを下回らないようにする
  return Math.max(計算サイズ, 最小サイズ);
}

/**
 * 見出し帯を追加
 * @param {Slide} スライド - 対象スライド
 * @param {string} テキスト - 見出しテキスト
 * @param {number} top - 上位置
 */
function 見出し帯を追加(スライド, テキスト, top = 余白.上) {
  const 帯高さ = 50;
  const 帯 = スライド.insertShape(
    SlidesApp.ShapeType.RECTANGLE,
    余白.左,
    top,
    コンテンツ幅,
    帯高さ
  );

  帯.getFill().setSolidFill(色設定.見出し帯);
  帯.getBorder().setTransparent();

  const textRange = 帯.getText();
  textRange.setText(テキスト);
  textRange.getTextStyle()
    .setFontSize(20)
    .setBold(true)
    .setForegroundColor('#FFFFFF');  // 見出しのみ白文字OK

  textRange.getParagraphStyle()
    .setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // 垂直中央揃え
  帯.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
}

/**
 * カードボックスを追加
 * @param {Slide} スライド - 対象スライド
 * @param {number} left - 左位置
 * @param {number} top - 上位置
 * @param {number} width - 幅
 * @param {number} height - 高さ
 * @return {Shape} カード
 */
function カードボックスを追加(スライド, left, top, width, height) {
  const カード = スライド.insertShape(
    SlidesApp.ShapeType.ROUND_RECTANGLE,
    left,
    top,
    width,
    height
  );

  カード.getFill().setSolidFill(色設定.カード背景);
  カード.getBorder().setWeight(1);
  カード.getBorder().setSolidFill(色設定.アクセント);

  return カード;
}

// ==========================================
// 最新URLを表示
// ==========================================

function 最新資料のURL表示() {
  const properties = PropertiesService.getScriptProperties();
  const url = properties.getProperty('LAST_PRESENTATION_URL');

  if (url) {
    const ui = SpreadsheetApp.getUi();
    ui.alert('📂 最新の資料', `以下のURLをクリックして開いてください:\n\n${url}`, ui.ButtonSet.OK);
  } else {
    SpreadsheetApp.getUi().alert('❌ まだ資料が生成されていません');
  }
}

/**
 * URLを保存
 * @param {string} url - プレゼンテーションURL
 */
function URLを保存(url) {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('LAST_PRESENTATION_URL', url);
}
