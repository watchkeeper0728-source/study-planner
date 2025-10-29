import { EventT, ParticipantT, ResultItemT, RoundUnitT, RoundModeT, RemainderModeT } from "./types";

/**
 * 丸め処理を適用する
 * @param x 元の値
 * @param unit 丸め単位
 * @param mode 丸め方式
 * @returns 丸め後の値
 */
export function applyRound(x: number, unit: RoundUnitT, mode: RoundModeT): number {
  // 浮動小数点数の精度問題を回避するため、整数ベースで計算
  const scaled = Math.round(x * 100) / 100; // 小数点第2位まで考慮
  
  switch (mode) {
    case "round":
      return Math.round(scaled / unit) * unit;
    case "ceil":
      return Math.ceil(scaled / unit) * unit;
    case "floor":
      return Math.floor(scaled / unit) * unit;
    default:
      return Math.round(scaled / unit) * unit;
  }
}

/**
 * 参加者の生額を計算する
 * @param total 合計金額
 * @param participant 参加者
 * @param totalWeight 全参加者の重みの合計
 * @returns 生額
 */
export function calculateRawAmount(
  total: number,
  participant: ParticipantT,
  totalWeight: number
): number {
  if (totalWeight === 0) {
    return 0;
  }
  return (total * participant.weight) / totalWeight;
}

/**
 * 端数配分のための参加者情報
 */
interface ParticipantWithRemainder {
  participant: ParticipantT;
  rawAmount: number;
  baseAmount: number;
  remainder: number;
}

/**
 * 最大剰余方式で端数を配分する
 * @param participants 参加者とその計算結果
 * @param diff 配分する端数
 * @param unit 丸め単位
 * @returns 配分後の結果
 */
function distributeByLargestRemainder(
  participants: ParticipantWithRemainder[],
  diff: number,
  unit: RoundUnitT
): ResultItemT[] {
  // 剰余の大きい順にソート
  const sorted = [...participants].sort((a, b) => b.remainder - a.remainder);
  
  const results: ResultItemT[] = [];
  const absDiff = Math.abs(diff);
  const adjustmentCount = Math.floor(absDiff / unit);
  const isPositive = diff > 0;
  
  for (let i = 0; i < sorted.length; i++) {
    const { participant, baseAmount } = sorted[i];
    let finalAmount = baseAmount;
    
    // 調整が必要な場合
    if (i < adjustmentCount) {
      finalAmount += isPositive ? unit : -unit;
    }
    
    results.push({
      participantId: participant.id,
      amount: Math.max(0, Math.round(finalAmount)), // 負の値は0に
    });
  }
  
  return results;
}

/**
 * 順番配分で端数を配分する
 * @param participants 参加者とその計算結果
 * @param diff 配分する端数
 * @param unit 丸め単位
 * @returns 配分後の結果
 */
function distributeByOrder(
  participants: ParticipantWithRemainder[],
  diff: number,
  unit: RoundUnitT
): ResultItemT[] {
  const results: ResultItemT[] = [];
  const absDiff = Math.abs(diff);
  const adjustmentCount = Math.floor(absDiff / unit);
  const isPositive = diff > 0;
  
  for (let i = 0; i < participants.length; i++) {
    const { participant, baseAmount } = participants[i];
    let finalAmount = baseAmount;
    
    // 調整が必要な場合
    if (i < adjustmentCount) {
      finalAmount += isPositive ? unit : -unit;
    }
    
    results.push({
      participantId: participant.id,
      amount: Math.max(0, Math.round(finalAmount)), // 負の値は0に
    });
  }
  
  return results;
}

/**
 * ランダム配分で端数を配分する
 * @param participants 参加者とその計算結果
 * @param diff 配分する端数
 * @param unit 丸め単位
 * @returns 配分後の結果
 */
function distributeByRandom(
  participants: ParticipantWithRemainder[],
  diff: number,
  unit: RoundUnitT
): ResultItemT[] {
  // ランダムな順序でインデックスを生成
  const indices = Array.from({ length: participants.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  const results: ResultItemT[] = [];
  const absDiff = Math.abs(diff);
  const adjustmentCount = Math.floor(absDiff / unit);
  const isPositive = diff > 0;
  
  for (let i = 0; i < participants.length; i++) {
    const { participant, baseAmount } = participants[i];
    let finalAmount = baseAmount;
    
    // 調整が必要な場合（ランダムな順序で）
    if (indices.indexOf(i) < adjustmentCount) {
      finalAmount += isPositive ? unit : -unit;
    }
    
    results.push({
      participantId: participant.id,
      amount: Math.max(0, Math.round(finalAmount)), // 負の値は0に
    });
  }
  
  return results;
}

/**
 * 割り勘計算を実行する
 * @param event イベント情報
 * @returns 計算結果
 */
export function calculateSplitBill(event: EventT): ResultItemT[] {
  const { total, participants, roundUnit, roundMode, remainderMode } = event;
  
  if (participants.length === 0) {
    return [];
  }
  
  if (total <= 0) {
    return participants.map(p => ({
      participantId: p.id,
      amount: 0,
    }));
  }
  
  // 全参加者の重みの合計を計算
  const totalWeight = participants.reduce((sum, p) => sum + p.weight, 0);
  
  if (totalWeight === 0) {
    return participants.map(p => ({
      participantId: p.id,
      amount: 0,
    }));
  }
  
  // 各参加者の生額と丸め後の金額を計算
  const participantsWithRemainder: ParticipantWithRemainder[] = participants.map(participant => {
    const rawAmount = calculateRawAmount(total, participant, totalWeight);
    const baseAmount = applyRound(rawAmount, roundUnit, roundMode);
    const remainder = rawAmount - baseAmount;
    
    return {
      participant,
      rawAmount,
      baseAmount,
      remainder,
    };
  });
  
  // 丸め後の合計を計算
  const baseTotal = participantsWithRemainder.reduce((sum, p) => sum + p.baseAmount, 0);
  const diff = total - baseTotal;
  
  // 端数がなければそのまま返す
  if (Math.abs(diff) < 0.01) {
    return participantsWithRemainder.map(({ participant, baseAmount }) => ({
      participantId: participant.id,
      amount: Math.round(baseAmount),
    }));
  }
  
  // 端数配分を実行
  switch (remainderMode) {
    case "largest_remainder":
      return distributeByLargestRemainder(participantsWithRemainder, diff, roundUnit);
    case "order":
      return distributeByOrder(participantsWithRemainder, diff, roundUnit);
    case "random":
      return distributeByRandom(participantsWithRemainder, diff, roundUnit);
    default:
      return distributeByLargestRemainder(participantsWithRemainder, diff, roundUnit);
  }
}

/**
 * 計算結果の合計を検証する
 * @param results 計算結果
 * @param expectedTotal 期待される合計
 * @returns 検証結果
 */
export function validateCalculation(results: ResultItemT[], expectedTotal: number): {
  isValid: boolean;
  actualTotal: number;
  difference: number;
} {
  const actualTotal = results.reduce((sum, r) => sum + r.amount, 0);
  const difference = expectedTotal - actualTotal;
  
  return {
    isValid: Math.abs(difference) < 0.01,
    actualTotal,
    difference,
  };
}

/**
 * 参加者ごとの詳細な計算情報を取得する
 * @param event イベント情報
 * @returns 詳細な計算情報
 */
export function getCalculationDetails(event: EventT) {
  const { total, participants, roundUnit, roundMode } = event;
  
  if (participants.length === 0) {
    return [];
  }
  
  const totalWeight = participants.reduce((sum, p) => sum + p.weight, 0);
  
  return participants.map(participant => {
    const rawAmount = calculateRawAmount(total, participant, totalWeight);
    const baseAmount = applyRound(rawAmount, roundUnit, roundMode);
    const remainder = rawAmount - baseAmount;
    
    return {
      participant,
      rawAmount,
      baseAmount,
      remainder,
      weightRatio: totalWeight > 0 ? participant.weight / totalWeight : 0,
    };
  });
}

