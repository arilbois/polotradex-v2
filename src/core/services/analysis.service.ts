import { OHLCV } from '@shared/interfaces/trading.interface';
import { logger } from '@infrastructure/logger';

export interface SupportResistanceLevels {
  supports: number[];
  resistances: number[];
}

export class AnalysisService {
  constructor() {}

  /**
   * Menemukan level support dan resistance dari data historis
   * menggunakan metode identifikasi pivot high/low sederhana.
   * @param ohlcvData - Array data OHLCV.
   * @param strength - Jumlah candle di kiri dan kanan yang harus lebih rendah/tinggi.
   */
  public findSupportResistanceLevels(
    ohlcvData: OHLCV[],
    strength: number
  ): SupportResistanceLevels {
    const supports: number[] = [];
    const resistances: number[] = [];

    if (ohlcvData.length < strength * 2 + 1) {
      logger.warn('[Analysis] Data tidak cukup untuk menemukan level S/R.');
      return { supports, resistances };
    }

    // Iterasi melalui data, tapi sisakan ruang di awal dan akhir untuk perbandingan
    for (let i = strength; i < ohlcvData.length - strength; i++) {
      let isPivotHigh = true;
      let isPivotLow = true;

      // Cek candle di kiri dan kanan
      for (let j = 1; j <= strength; j++) {
        // Cek untuk pivot high (resistance)
        if (ohlcvData[i].high < ohlcvData[i - j].high || ohlcvData[i].high < ohlcvData[i + j].high) {
          isPivotHigh = false;
        }
        // Cek untuk pivot low (support)
        if (ohlcvData[i].low > ohlcvData[i - j].low || ohlcvData[i].low > ohlcvData[i + j].low) {
          isPivotLow = false;
        }
      }

      if (isPivotHigh) {
        resistances.push(ohlcvData[i].high);
      }
      if (isPivotLow) {
        supports.push(ohlcvData[i].low);
      }
    }

    // Hapus duplikat dan kembalikan level yang unik
    return {
      supports: [...new Set(supports)],
      resistances: [...new Set(resistances)],
    };
  }
}