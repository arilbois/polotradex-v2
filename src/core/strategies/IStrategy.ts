import { Exchange } from 'ccxt';
import { StrategySignal, BotConfig } from '@shared/interfaces/trading.interface'; // Diperbarui

/**
 * Interface (kontrak) yang harus dipatuhi oleh semua kelas strategi.
 * Ini memastikan bahwa semua strategi memiliki metode yang sama untuk
 * menghasilkan sinyal dan diperbarui.
 */
export interface IStrategy {
  // [DIPERBAIKI] Menggunakan BotConfig yang lebih lengkap
  updateParams(params: BotConfig): void;
  generateSignal(exchange: Exchange, symbol: string): Promise<StrategySignal>;
}