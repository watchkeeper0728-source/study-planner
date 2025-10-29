# -*- coding: utf-8 -*-
"""
アンケート送付先（Excel, シート名: アンケート送付先）の C列企業名に対応する法人番号を
D列（23行目以降）へ付与するローカル実行用スクリプト。

- Excel:  【RIETI共有】中小企業_ローデータ.xlsx
- ZIP:    00_zenkoku_all.zip（中に全国一括CSVが1本入っている想定）
- 出力:   【RIETI共有】中小企業_ローデータ_法人番号付与.xlsx
         （未マッチ一覧: 【RIETI共有】中小企業_ローデータ_未マッチ一覧.csv）

依存: pandas, openpyxl, rapidfuzz(任意)
  pip install pandas openpyxl rapidfuzz
"""

import os, re, zipfile, unicodedata
import pandas as pd

# ========= ▼▼▼ ここだけ環境に合わせて変更（例を参考に） ▼▼▼ =========
# 例）Windows: r"C:\Users\Yuichi\Documents\houjin"
#    macOS:    "/Users/yuichi/Documents/houjin"
BASE_DIR = os.path.abspath(".")   # 現在のフォルダを使うなら "." のままでOK

XLSX_PATH = os.path.join(BASE_DIR, "【RIETI共有】中小企業_ローデータ.xlsx")
ZIP_PATH  = os.path.join(BASE_DIR, "00_zenkoku_all.zip")
CSV_NAME_IN_ZIP = None  # None のままなら ZIP 内で最初に見つかった CSV を使用

# 上書き or 追加挿入を選択
#   True  = 既存の D列を上書き（D列が「法人番号」になる／元のDは失われます）
#   False = Dの位置に「法人番号」列を新規挿入（既存のD列は右へ1つずれます）
OVERWRITE_D = True

# ========= ▲▲▲ パスと挙動の切替はここまで ▲▲▲ =========

SHEET_NAME = "アンケート送付先"
ROW_START  = 23   # 23行目から（1始まり）
COL_NAME_C = 2    # C列（0始まりで2）: 企業名参照
COL_ADDR_H = 7    # H列（0始まりで7）: 企業所在地（住所照合に利用）

OUTPUT_XLSX = os.path.splitext(XLSX_PATH)[0] + "_法人番号付与.xlsx"
UNMATCHED_CSV = os.path.splitext(XLSX_PATH)[0] + "_未マッチ一覧.csv"

# ========= 名称・住所の正規化 =========
CORP_TOKENS = [
    "株式会社","(株)","（株）","㈱",
    "有限会社","(有)","（有）","㈲",
    "合同会社","(同)","（同）",
    "一般社団法人","一般財団法人","公益社団法人","公益財団法人",
    "医療法人","社会福祉法人","学校法人","宗教法人",
    "信用金庫","信用組合","農業協同組合","漁業協同組合"
]

# 取り除きたい記号類（全角スペース・句読点・各種かっこ・ダッシュ類など）
PUNCTUATION_CHARS = " 　、。・.,，．/／()（）［］[]{}「」『』<>＜＞※＊*#＃$＄%％=＝_＿:：;；\"'`~ｰ－‐–—―-"
PUNCT_RE = re.compile(r"[{}]".format(re.escape(PUNCTUATION_CHARS)))

def normalize_name(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = unicodedata.normalize("NFKC", s).strip()
    # 法人格の除去
    for t in CORP_TOKENS:
        s = s.replace(t, "")
    # 空白→記号の順に除去（安全な事前エスケープ済みパターン）
    s = re.sub(r"\s+", "", s)
    s = PUNCT_RE.sub("", s)
    return s

def normalize_addr(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = unicodedata.normalize("NFKC", s).strip()
    s = re.sub(r"\s+", "", s)
    s = PUNCT_RE.sub("", s)
    return s

# ========= ZIP内CSVから（法人番号・名称・住所）を抽出 =========
def iter_corp_rows(zip_path, csv_name=None, chunksize=200000, encoding="utf-8"):
    """
    全国一括CSV（ヘッダ無し想定）の一般的レイアウトを前提に、
    - 法人番号（列1：0始まりで1）
    - 名称    （列6：0始まりで6）
    - 住所    （都道府県=9, 市区町村=10, 丁目番地等=11 を連結）
    を抽出します。CSVの仕様が異なる場合は下の idx_* を調整してください。
    """
    with zipfile.ZipFile(zip_path) as zf:
        csv_files = [n for n in zf.namelist() if n.lower().endswith(".csv")]
        if not csv_files:
            raise FileNotFoundError("ZIP内にCSVが見つかりません。")
        target = csv_name or csv_files[0]

        # 先に数行読んでカラム数を推定
        with zf.open(target) as f:
            head = pd.read_csv(f, header=None, dtype=str, nrows=5, encoding=encoding)
        n_cols = head.shape[1]

        # 想定 index
        idx_no   = 1   # 法人番号
        idx_name = 6   # 商号又は名称
        idx_pref = 9   # 都道府県
        idx_city = 10  # 市区町村
        idx_addr = 11  # 丁目番地等

        use_addr = n_cols > max(idx_pref, idx_city, idx_addr)

        # チャンクで読み直し
        with zf.open(target) as f:
            reader = pd.read_csv(f, header=None, dtype=str, chunksize=chunksize, encoding=encoding)
            for chunk in reader:
                chunk = chunk.fillna("")
                if max(idx_no, idx_name) >= chunk.shape[1]:
                    continue
                corp_no = chunk.iloc[:, idx_no].astype(str)
                name_jp = chunk.iloc[:, idx_name].astype(str)
                if use_addr:
                    pref = chunk.iloc[:, idx_pref].astype(str)
                    city = chunk.iloc[:, idx_city].astype(str)
                    addr = chunk.iloc[:, idx_addr].astype(str)
                    full_addr = (pref + city + addr).fillna("")
                else:
                    full_addr = pd.Series([""]*len(chunk))
                for n, nm, ad in zip(corp_no, name_jp, full_addr):
                    # 13桁のみ採用
                    if not (isinstance(n, str) and n.isdigit() and len(n) == 13):
                        continue
                    yield n, nm, ad

def build_candidates(zip_path, needed_norm_names, csv_name=None, encoding="utf-8"):
    from collections import defaultdict
    name_to_candidates = defaultdict(dict)
    for corp_no, name_jp, addr in iter_corp_rows(zip_path, csv_name, encoding=encoding):
        norm = normalize_name(name_jp)
        if norm in needed_norm_names:
            if corp_no not in name_to_candidates[norm] or len(addr) > len(name_to_candidates[norm][corp_no]):
                name_to_candidates[norm][corp_no] = addr
    return name_to_candidates

def main():
    if not os.path.exists(XLSX_PATH):
        raise FileNotFoundError(f"Excelが見つかりません: {XLSX_PATH}")
    if not os.path.exists(ZIP_PATH):
        raise FileNotFoundError(f"ZIPが見つかりません: {ZIP_PATH}")

    # --- Excel 読み込み（全シート保持） ---
    xls = pd.ExcelFile(XLSX_PATH)
    sheets = {s: pd.read_excel(XLSX_PATH, sheet_name=s) for s in xls.sheet_names}

    if SHEET_NAME not in sheets:
        raise KeyError(f"シートが見つかりません: {SHEET_NAME}")

    df = sheets[SHEET_NAME].copy()
    df_orig = df.copy()  # 未マッチ一覧の表示に元の列位置を使うため

    # 23行目以降を対象（1始まりの行番号）
    df["__idx__"] = range(1, len(df)+1)
    target = df[df["__idx__"] >= ROW_START].copy()

    # C列（企業名）と H列（住所）
    name_series = target.iloc[:, COL_NAME_C] if COL_NAME_C < target.shape[1] else pd.Series([""]*len(target), index=target.index)
    addr_series = target.iloc[:, COL_ADDR_H] if COL_ADDR_H < target.shape[1] else pd.Series([""]*len(target), index=target.index)

    # 正規化
    target_norm_name = name_series.map(normalize_name)
    target_norm_addr = addr_series.map(normalize_addr)

    # 必要な企業名（正規化）のユニーク集合
    needed = sorted(set([n for n in target_norm_name.tolist() if n]))

    # --- 候補の構築（UTF-8 -> 失敗時CP932にフォールバック） ---
    try:
        name_to_candidates = build_candidates(ZIP_PATH, needed, CSV_NAME_IN_ZIP, encoding="utf-8")
    except UnicodeDecodeError:
        name_to_candidates = build_candidates(ZIP_PATH, needed, CSV_NAME_IN_ZIP, encoding="cp932")

    # --- 住所スコアリング（rapidfuzz があれば利用） ---
    try:
        from rapidfuzz import fuzz
        def addr_score(a, b):
            a = normalize_addr(a); b = normalize_addr(b)
            if not a or not b: return 0
            return fuzz.token_set_ratio(a, b)
    except Exception:
        def addr_score(a, b):
            a = normalize_addr(a); b = normalize_addr(b)
            if not a or not b: return 0
            common = len(set(a) & set(b))
            return int(100 * common / max(len(a), 1))

    # --- 照合 ---
    hits, multi_hits, nohits = 0, 0, 0
    results = []  # (row_index_in_df, corp_no, status)

    for rid, nm_norm, ad_norm in zip(target.index, target_norm_name, target_norm_addr):
        corp = ""
        status = ""
        if not nm_norm:
            status = "企業名欠落"
            nohits += 1
        else:
            cands = name_to_candidates.get(nm_norm, {})
            if len(cands) == 0:
                status = "候補なし"
                nohits += 1
            elif len(cands) == 1:
                corp = list(cands.keys())[0]
                status = "一意一致"
                hits += 1
            else:
                # 住所でスコアリング（80点以上を採用）
                best_no, best_sc = "", -1
                for cno, caddr in cands.items():
                    sc = addr_score(ad_norm, caddr)
                    if sc > best_sc:
                        best_sc = sc
                        best_no = cno
                if best_sc >= 80:
                    corp = best_no
                    status = f"複数→住所スコア{best_sc}採用"
                    hits += 1
                else:
                    status = f"複数候補（住所不十分, max={best_sc}）"
                    multi_hits += 1

        results.append((rid, corp, status))

    # --- D列への付与（上書き or 挿入） ---
    corp_col_values = pd.Series(index=df.index, dtype=object)
    for rid, corp, _ in results:
        corp_col_values.loc[rid] = corp
    # 23行目未満は空欄
    corp_col_values.loc[df.index[df["__idx__"] < ROW_START]] = ""

    if OVERWRITE_D:
        # 既存D列（0始まりで3）を上書き
        if df.shape[1] <= 3:
            for _ in range(3 - df.shape[1] + 1):
                df[f"__tmp{_}__"] = ""
        df.iloc[:, 3] = corp_col_values
    else:
        # D列位置に「法人番号」を挿入
        df.insert(3, "法人番号", corp_col_values)

    df = df.drop(columns=["__idx__"])

    # --- 未マッチ一覧の作成（元の列配置 df_orig から C/H を参照） ---
    unmatched_rows = []
    for rid, corp, status in results:
        if not corp:
            row_c = df_orig.iloc[rid, COL_NAME_C] if COL_NAME_C < df_orig.shape[1] else ""
            row_h = df_orig.iloc[rid, COL_ADDR_H] if COL_ADDR_H < df_orig.shape[1] else ""
            unmatched_rows.append({
                "行番号": rid + 1,
                "企業名(C列)": row_c,
                "企業所在地(H列)": row_h,
                "付与状況": status
            })
    unmatched_df = pd.DataFrame(unmatched_rows)

    # --- 書き出し（全シート保持のまま対象だけ差し替え） ---
    sheets[SHEET_NAME] = df
    with pd.ExcelWriter(OUTPUT_XLSX, engine="openpyxl") as w:
        for s, d in sheets.items():
            d.to_excel(w, sheet_name=s, index=False)

    if len(unmatched_df):
        unmatched_df.to_csv(UNMATCHED_CSV, index=False, encoding="utf-8-sig")

    # --- サマリ ---
    print("=== サマリ ===")
    print(f"一意or住所で特定できた件数: {hits}")
    print(f"複数候補で未確定: {multi_hits}")
    print(f"候補なし/企業名欠落: {nohits}")
    print(f"出力Excel: {OUTPUT_XLSX}")
    if len(unmatched_df):
        print(f"未マッチ一覧: {UNMATCHED_CSV}")
    print(f"D列の処理モード: {'上書き(OVERWRITE_D=True)' if OVERWRITE_D else '挿入(OVERWRITE_D=False)'}")

if __name__ == "__main__":
    main()
