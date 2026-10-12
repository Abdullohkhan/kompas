import { baseCardClass, mutedTextClass, primaryGradientClass } from "./styles";

type BarChartProps = {
  title: string;
  ariaLabel: string;
  labels: readonly string[];
  values: readonly number[];
  formatValue: (value: number) => string;
};

export function BarChart({ title, ariaLabel, labels, values, formatValue }: BarChartProps) {
  const max = Math.max(...values);
  return (
    <article className={`${baseCardClass} p-6`}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <div role="img" aria-label={ariaLabel} className="mt-6 flex h-52 items-end gap-2 sm:gap-3">
        {values.map((value, index) => (
          <div key={labels[index]} className="flex h-full min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex min-h-0 flex-1 items-end">
              <div
                className={`w-full rounded-t-md ${primaryGradientClass} opacity-90`}
                style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
              />
            </div>
            <span className={`truncate text-center text-[10px] sm:text-xs ${mutedTextClass}`}>{formatValue(value)}</span>
            <span className="text-center text-xs font-medium text-slate-700 dark:text-slate-300">{labels[index]}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
