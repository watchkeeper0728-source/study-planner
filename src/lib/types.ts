import { z } from "zod";

// 丸め単位の定義
export const RoundUnit = z.union([z.literal(1), z.literal(10), z.literal(100)]);
export type RoundUnitT = z.infer<typeof RoundUnit>;

// 丸め方式の定義
export const RoundMode = z.enum(["round", "ceil", "floor"]);
export type RoundModeT = z.infer<typeof RoundMode>;

// 端数配分方式の定義
export const RemainderMode = z.enum(["largest_remainder", "order", "random"]);
export type RemainderModeT = z.infer<typeof RemainderMode>;

// 参加者の定義
export const Participant = z.object({
  id: z.string(),          // nanoid
  name: z.string().min(1).max(30),
  weight: z.number().min(0.1).max(10).default(1),
});
export type ParticipantT = z.infer<typeof Participant>;

// 計算結果の定義
export const ResultItem = z.object({
  participantId: z.string(),
  amount: z.number().int().nonnegative(),
});
export type ResultItemT = z.infer<typeof ResultItem>;

// イベントの定義
export const Event = z.object({
  id: z.string(),
  title: z.string().default("未タイトル"),
  total: z.number().int().nonnegative(),
  participants: z.array(Participant),
  roundUnit: RoundUnit.default(1),
  roundMode: RoundMode.default("round"),
  remainderMode: RemainderMode.default("largest_remainder"),
  createdAt: z.string(),   // ISO
  updatedAt: z.string(),   // ISO
  results: z.array(ResultItem).default([]),
});
export type EventT = z.infer<typeof Event>;

// 計算設定の定義
export const CalculationSettings = z.object({
  total: z.number().int().nonnegative(),
  roundUnit: RoundUnit.default(1),
  roundMode: RoundMode.default("round"),
  remainderMode: RemainderMode.default("largest_remainder"),
});
export type CalculationSettingsT = z.infer<typeof CalculationSettings>;

// 重みプリセットの定義
export const WeightPreset = z.enum(["0.5", "0.8", "1.0", "1.2", "1.5"]);
export type WeightPresetT = z.infer<typeof WeightPreset>;

// 重みプリセットの値
export const WEIGHT_PRESETS: Record<WeightPresetT, number> = {
  "0.5": 0.5,
  "0.8": 0.8,
  "1.0": 1.0,
  "1.2": 1.2,
  "1.5": 1.5,
};

// 重みプリセットのラベル
export const WEIGHT_PRESET_LABELS: Record<WeightPresetT, string> = {
  "0.5": "半分 (0.5)",
  "0.8": "幹事割 (0.8)",
  "1.0": "通常 (1.0)",
  "1.2": "少し多め (1.2)",
  "1.5": "多め (1.5)",
};

// 丸め単位のラベル
export const ROUND_UNIT_LABELS: Record<RoundUnitT, string> = {
  1: "1円単位",
  10: "10円単位",
  100: "100円単位",
};

// 丸め方式のラベル
export const ROUND_MODE_LABELS: Record<RoundModeT, string> = {
  round: "四捨五入",
  ceil: "切り上げ",
  floor: "切り捨て",
};

// 端数配分方式のラベル
export const REMAINDER_MODE_LABELS: Record<RemainderModeT, string> = {
  largest_remainder: "最大剰余方式（推奨）",
  order: "順番配分",
  random: "ランダム配分",
};

