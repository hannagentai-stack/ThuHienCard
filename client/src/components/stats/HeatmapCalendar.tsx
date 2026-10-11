import React, { useState } from 'react';
import { Calendar, Info } from 'lucide-react';

interface HeatmapCalendarProps {
  data: { date: string; count: number; level: number }[];
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ data }) => {
  // Mobile range filter: 3 months (default for mobile) vs 6 months vs 12 months
  const [rangeMonths, setRangeMonths] = useState<3 | 6 | 12>(3);
  const [selectedCell, setSelectedCell] = useState<{ date: string; count: number } | null>(null);

  const today = new Date();
  const totalDays = rangeMonths === 3 ? 91 : rangeMonths === 6 ? 182 : 364;

  const dataMap = new Map<string, number>();
  data.forEach((d) => dataMap.set(d.date, d.count));

  const days: { date: string; count: number; level: number; dayOfWeek: number }[] = [];

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = dataMap.get(dateStr) || 0;
    const level = count >= 30 ? 4 : count >= 15 ? 3 : count >= 5 ? 2 : count > 0 ? 1 : 0;
    days.push({
      date: dateStr,
      count,
      level,
      dayOfWeek: d.getDay(), // 0 = CN, 1 = T2, ...
    });
  }

  // Chia thành các tuần (mỗi tuần 7 ngày)
  const weeks: { date: string; count: number; level: number; dayOfWeek: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getCellColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#FFD1E3] dark:bg-[#682B48]'; // 1-4 thẻ
      case 2:
        return 'bg-[#FFA8CA] dark:bg-[#9B2C62]'; // 5-14 thẻ
      case 3:
        return 'bg-[#FF70A6] dark:bg-[#D92576]'; // 15-29 thẻ
      case 4:
        return 'bg-[#FF5C9E] dark:bg-[#FF5C9E] shadow-sm'; // >=30 thẻ
      default:
        return 'bg-gray-100 dark:bg-dark-border/40'; // 0 thẻ
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-3.5">
      
      {/* Header điều khiển: Chọn khoảng thời gian 3/6/12 tháng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
          <Calendar className="w-4 h-4 text-kawaii-500" />
          <span>Biểu đồ chuyên cần:</span>
        </div>

        {/* Nút lọc khoảng thời gian thân thiện với ngón cái */}
        <div className="flex bg-gray-100 dark:bg-dark-bg p-1 rounded-2xl text-xs font-bold w-fit">
          <button
            type="button"
            onClick={() => setRangeMonths(3)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              rangeMonths === 3
                ? 'bg-kawaii-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            3 Tháng qua
          </button>
          <button
            type="button"
            onClick={() => setRangeMonths(6)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              rangeMonths === 6
                ? 'bg-kawaii-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            6 Tháng qua
          </button>
          <button
            type="button"
            onClick={() => setRangeMonths(12)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              rangeMonths === 12
                ? 'bg-kawaii-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Cả năm
          </button>
        </div>
      </div>

      {/* Khung Heatmap: Ô to hơn trên điện thoại, cuộn ngang mượt mà */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex gap-1.5 min-w-max p-1">
          {/* Nhãn thứ trong tuần */}
          <div className="flex flex-col gap-1.5 text-[10px] text-gray-400 pr-1.5 select-none justify-between h-[126px]">
            <span>T2</span>
            <span>T4</span>
            <span>T6</span>
            <span>CN</span>
          </div>

          {/* Các tuần */}
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day) => {
                const isSelected = selectedCell?.date === day.date;
                return (
                  <button
                    type="button"
                    key={day.date}
                    onClick={() => setSelectedCell({ date: day.date, count: day.count })}
                    aria-label={`${day.date}: ${day.count} thẻ`}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] transition-transform active:scale-125 focus:outline-none ${
                      isSelected
                        ? 'ring-2 ring-kawaii-500 scale-110 z-10'
                        : 'hover:scale-110'
                    } ${getCellColor(day.level)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Banner / Toast hiển thị ngày được chạm trên mobile */}
      <div className="p-2.5 rounded-2xl bg-kawaii-50/70 dark:bg-dark-bg/60 border border-kawaii-200 dark:border-dark-border flex items-center justify-between text-xs">
        {selectedCell ? (
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-kawaii-700 dark:text-kawaii-300">
              📅 Ngày {formatDateDisplay(selectedCell.date)}:
            </span>
            <span className="font-bold text-gray-800 dark:text-white">
              {selectedCell.count > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {selectedCell.count} lượt thẻ ôn tập 🎉
                </span>
              ) : (
                <span className="text-gray-400 font-normal">Chưa có lượt ôn nào</span>
              )}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
            <Info className="w-3.5 h-3.5 text-kawaii-400" />
            <span>Chạm vào bất kỳ ô nào trên biểu đồ để xem chi tiết ngày đó</span>
          </div>
        )}

        {/* Chú thích màu sắc (Legend) */}
        <div className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0">
          <span>Ít</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-gray-100 dark:bg-dark-border/40" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#FFD1E3]" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#FFA8CA]" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#FF70A6]" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#FF5C9E]" />
          <span>Nhiều</span>
        </div>
      </div>

    </div>
  );
};
