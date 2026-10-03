/**
 * Brokerage & transaction charges calculator.
 *
 * Modeled after Indian stock-market charges (Angel One / Zerodha style)
 * but expressed in USD since the platform uses USD-based stocks.
 *
 * Charge schedule (per executed order):
 *   Brokerage              – $0.20 flat  OR  0.03% of trade value (whichever is lower)
 *   Exchange Txn Charges   – 0.00297% of trade value
 *   Stamp Duty             – 0.003% of trade value  (BUY side only)
 *   IPFT Charges           – 0.0001% of trade value
 *   SEBI Fees              – 0.0001% of trade value
 *   STT                    – 0.025% of trade value   (SELL side only)
 *   GST                    – 18% on (brokerage + exchange charges + SEBI fees)
 */

// ── Rate constants ────────────────────────────────────────────────
const BROKERAGE_FLAT = 0.20;           // $0.20 flat cap
const BROKERAGE_PERCENT = 0.0003;      // 0.03%
const EXCHANGE_TXN_RATE = 0.0000297;   // 0.00297%
const STAMP_DUTY_RATE = 0.00003;       // 0.003%
const IPFT_RATE = 0.000001;            // 0.0001%
const SEBI_RATE = 0.000001;            // 0.0001%
const STT_RATE = 0.00025;              // 0.025%
const GST_RATE = 0.18;                 // 18%

// ── Types ─────────────────────────────────────────────────────────
export interface ChargesBreakdown {
  tradeValue: number;
  brokerage: number;
  exchangeCharges: number;
  stampDuty: number;
  ipftCharges: number;
  sebiFees: number;
  stt: number;
  gst: number;
  totalCharges: number;
  totalPayable: number;
}

// ── Calculator ────────────────────────────────────────────────────
export function calculateCharges(
  tradeValue: number,
  type: 'BUY' | 'SELL',
): ChargesBreakdown {
  if (tradeValue <= 0) {
    return {
      tradeValue: 0,
      brokerage: 0,
      exchangeCharges: 0,
      stampDuty: 0,
      ipftCharges: 0,
      sebiFees: 0,
      stt: 0,
      gst: 0,
      totalCharges: 0,
      totalPayable: 0,
    };
  }

  // Brokerage: lower of flat cap or percentage
  const brokerage = round(Math.min(BROKERAGE_FLAT, tradeValue * BROKERAGE_PERCENT));

  // Exchange transaction charges
  const exchangeCharges = round(tradeValue * EXCHANGE_TXN_RATE);

  // Stamp duty – buy side only
  const stampDuty = type === 'BUY' ? round(tradeValue * STAMP_DUTY_RATE) : 0;

  // IPFT charges
  const ipftCharges = round(tradeValue * IPFT_RATE);

  // SEBI fees
  const sebiFees = round(tradeValue * SEBI_RATE);

  // STT – sell side only
  const stt = type === 'SELL' ? round(tradeValue * STT_RATE) : 0;

  // GST – 18% on (brokerage + exchange charges + SEBI fees)
  const gst = round((brokerage + exchangeCharges + sebiFees) * GST_RATE);

  const totalCharges = round(
    brokerage + exchangeCharges + stampDuty + ipftCharges + sebiFees + stt + gst,
  );

  // BUY  → user pays tradeValue + charges
  // SELL → user receives tradeValue − charges
  const totalPayable = type === 'BUY'
    ? round(tradeValue + totalCharges)
    : round(tradeValue - totalCharges);

  return {
    tradeValue: round(tradeValue),
    brokerage,
    exchangeCharges,
    stampDuty,
    ipftCharges,
    sebiFees,
    stt,
    gst,
    totalCharges,
    totalPayable,
  };
}

/** Round to 2 decimal places. */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}
