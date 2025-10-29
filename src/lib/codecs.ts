import { EventT } from "./types";

/**
 * イベントデータを圧縮してbase64urlエンコードする
 * @param event イベントデータ
 * @returns 圧縮・エンコードされた文字列
 */
export function encodeEvent(event: EventT): string {
  try {
    // JSON文字列に変換
    const jsonString = JSON.stringify(event);
    
    // LZ文字列圧縮（簡易実装 - 実際にはlz-stringライブラリを使用）
    const compressed = compressString(jsonString);
    
    // base64urlエンコード
    return base64urlEncode(compressed);
  } catch (error) {
    console.error("エンコードエラー:", error);
    throw new Error("イベントデータのエンコードに失敗しました");
  }
}

/**
 * base64urlデコード・復元してイベントデータを取得する
 * @param encodedString エンコードされた文字列
 * @returns イベントデータ
 */
export function decodeEvent(encodedString: string): EventT {
  try {
    // base64urlデコード
    const compressed = base64urlDecode(encodedString);
    
    // LZ文字列復元（簡易実装 - 実際にはlz-stringライブラリを使用）
    const jsonString = decompressString(compressed);
    
    // JSONパース
    const event = JSON.parse(jsonString) as EventT;
    
    return event;
  } catch (error) {
    console.error("デコードエラー:", error);
    throw new Error("イベントデータのデコードに失敗しました");
  }
}

/**
 * 共有リンクを生成する
 * @param event イベントデータ
 * @param baseUrl ベースURL（省略時は現在のURL）
 * @returns 共有リンク
 */
export function generateShareLink(event: EventT, baseUrl?: string): string {
  const encoded = encodeEvent(event);
  const currentUrl = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return `${currentUrl}/import?d=${encoded}`;
}

/**
 * 共有コードを生成する
 * @param event イベントデータ
 * @returns 共有コード
 */
export function generateShareCode(event: EventT): string {
  return encodeEvent(event);
}

/**
 * URLから共有データを抽出する
 * @param url URL文字列
 * @returns 共有データ（存在しない場合はnull）
 */
export function extractShareDataFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("d");
  } catch {
    return null;
  }
}

/**
 * 簡易的な文字列圧縮（実際の実装ではlz-stringライブラリを使用）
 * @param str 圧縮する文字列
 * @returns 圧縮された文字列
 */
function compressString(str: string): string {
  // 簡易実装：実際にはlz-stringライブラリを使用
  // ここではBase64エンコードのみ実行
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * 簡易的な文字列復元（実際の実装ではlz-stringライブラリを使用）
 * @param compressed 圧縮された文字列
 * @returns 復元された文字列
 */
function decompressString(compressed: string): string {
  // 簡易実装：実際にはlz-stringライブラリを使用
  // ここではBase64デコードのみ実行
  return decodeURIComponent(escape(atob(compressed)));
}

/**
 * base64urlエンコード
 * @param str エンコードする文字列
 * @returns base64urlエンコードされた文字列
 */
function base64urlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * base64urlデコード
 * @param str base64urlエンコードされた文字列
 * @returns デコードされた文字列
 */
function base64urlDecode(str: string): string {
  // パディングを追加
  let padded = str;
  while (padded.length % 4) {
    padded += "=";
  }
  
  return atob(
    padded
      .replace(/-/g, "+")
      .replace(/_/g, "/")
  );
}

/**
 * 共有データの検証
 * @param shareData 共有データ
 * @returns 検証結果
 */
export function validateShareData(shareData: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    decodeEvent(shareData);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "不明なエラー",
    };
  }
}

/**
 * 共有リンクの形式を検証
 * @param url URL文字列
 * @returns 検証結果
 */
export function validateShareLink(url: string): {
  isValid: boolean;
  shareData?: string;
  error?: string;
} {
  try {
    const shareData = extractShareDataFromUrl(url);
    if (!shareData) {
      return {
        isValid: false,
        error: "共有データが見つかりません",
      };
    }
    
    const validation = validateShareData(shareData);
    if (!validation.isValid) {
      return {
        isValid: false,
        error: validation.error,
      };
    }
    
    return {
      isValid: true,
      shareData,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "不明なエラー",
    };
  }
}

