'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { calculateCharges, type ChargesBreakdown as ChargesData } from '@/lib/brokerage';

interface ChargesBreakdownProps {
  tradeValue: number;
  type: 'BUY' | 'SELL';
}

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

export default function ChargesBreakdown({ tradeValue, type }: ChargesBreakdownProps) {
  const [externalOpen, setExternalOpen] = useState(false);
  const [taxesOpen, setTaxesOpen] = useState(false);

  const charges: ChargesData = useMemo(
    () => calculateCharges(tradeValue, type),
    [tradeValue, type],
  );

  if (tradeValue <= 0) return null;

  const externalTotal = charges.exchangeCharges + charges.stampDuty + charges.ipftCharges + charges.sebiFees;
  const taxesTotal = charges.stt + charges.gst;

  return (
    <div className="rounded-lg border border-gray-800 bg-[#0F0F0F] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-200">Transaction Charges</h3>
      </div>

      <div className="px-4 py-2 space-y-0">
        {/* Trade Value */}
        <Row label="Trade Value" value={fmt(charges.tradeValue)} bold sub={`(${type === 'BUY' ? 'Buy' : 'Sell'} Order)`} />

        <Divider />

        {/* Brokerage */}
        <Row label="Brokerage" value={fmt(charges.brokerage)} />

        <Divider />

        {/* External Charges — collapsible */}
        <button
          type="button"
          onClick={() => setExternalOpen(!externalOpen)}
          className="w-full flex items-center justify-between py-2 text-sm group"
        >
          <span className="flex items-center gap-1 text-blue-400 font-medium">
            External Charges
            {externalOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
          <span className="text-gray-200 font-medium">{fmt(externalTotal)}</span>
        </button>

        {externalOpen && (
          <div className="pl-3 space-y-0 border-l border-gray-800 ml-1 mb-1">
            <SubRow label="Exchange Txn Charges" value={fmt(charges.exchangeCharges)} />
            <SubRow label="Stamp Duty" value={fmt(charges.stampDuty)} />
            <SubRow label="IPFT Charges" value={fmt(charges.ipftCharges)} />
            <SubRow label="SEBI Fees" value={fmt(charges.sebiFees)} />
          </div>
        )}

        <Divider />

        {/* Taxes — collapsible */}
        <button
          type="button"
          onClick={() => setTaxesOpen(!taxesOpen)}
          className="w-full flex items-center justify-between py-2 text-sm group"
        >
          <span className="flex items-center gap-1 text-blue-400 font-medium">
            Taxes
            {taxesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
          <span className="text-gray-200 font-medium">{fmt(taxesTotal)}</span>
        </button>

        {taxesOpen && (
          <div className="pl-3 space-y-0 border-l border-gray-800 ml-1 mb-1">
            <SubRow label="Securities Transaction Tax" value={fmt(charges.stt)} />
            <SubRow label="GST" value={fmt(charges.gst)} />
          </div>
        )}

        <Divider />

        {/* Total Charges */}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm font-bold text-gray-100">Total Charges</span>
          <span className="text-sm font-bold text-gray-100">{fmt(charges.totalCharges)}</span>
        </div>
      </div>

      {/* Footer note */}
      <div className="px-4 py-2.5 bg-[#0a0a0a] border-t border-gray-800">
        <p className="text-[11px] text-gray-500 text-center leading-relaxed">
          Note: Actual charges are settled at order execution and may differ slightly from the estimates shown above.
        </p>
      </div>
    </div>
  );
}

// ── Helper sub-components ────────────────────────────────────────

function Row({ label, value, bold, sub }: { label: string; value: string; bold?: boolean; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <div>
        <span className={bold ? 'text-gray-100 font-semibold' : 'text-gray-400'}>{label}</span>
        {sub && <span className="block text-xs text-gray-600">{sub}</span>}
      </div>
      <span className={bold ? 'text-gray-100 font-semibold' : 'text-gray-200'}>{value}</span>
    </div>
  );
}

function SubRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-400">{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="border-b border-gray-800/60" />;
}

// Re-export for external usage
export { calculateCharges, type ChargesData };
