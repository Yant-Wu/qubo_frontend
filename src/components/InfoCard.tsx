// src/components/InfoCard.tsx — 資訊卡片（單一職責：顯示一組 label + value）


interface Props {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

export default function InfoCard({ icon: Icon, label, value }: Props) {
  return (
    <div className="flex items-start gap-3 bg-gray-800/40 border border-gray-700/40 rounded-xl p-4">
      <div className="w-9 h-9 rounded-lg bg-gray-700/50 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-gray-400" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-0.5">{label}</div>
        <div className="text-sm font-medium text-gray-200 truncate">{value}</div>
      </div>
    </div>
  );
}
