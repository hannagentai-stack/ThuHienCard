import React, { useState } from 'react';

interface HeatmapCalendarProps {
  data: { date: string; count: number; level: number }[];
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ data }) => {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number } | null>(null);

  // Tạo mảng 52 tuần (364 ngày)
  const today = new Date();
  const days: { date: string; count: number; level: number }[] = [];
  const dataMap = new Map<string, number>();

  data.forEach((d) => dataMap.set(d.date, d.count));

  for (let i = 363; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = dataMap.get(dateStr) || 0;
    const level = count >= 30 ? 4 : count >= 15 ? 3 : count >= 5 ? 2 : count > 0 ? 1 : 0;
    days.push({ date: dateStr, count, level });
  }

  // Chia thành các tuần (mỗi tuần 7 ngày)
  const weeks: { date: string; count: number; level: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getCellColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#FFD1E3] dark:bg-[#682B48]'; // Nhẹ
      case 2:
        return 'bg-[#FFA8CA] dark:bg-[#9B2C62]'; // Vừa
      case 3:
        return 'bg-[#FF70A6] dark:bg-[#D92576]'; // Nhiều
      case 4:
        return 'bg-[#FF5C9E] dark:bg-[#FF5C9E]'; // Rất chăm
      default:
        return 'bg-gray-100 dark:bg-dark-border/40'; // Chưa học
    }
  };

  return (
    <div className="space-y-3">
      
      {/* Vùng hiển thị Tooltip khi hover */}
      <div className="h-6 flex items-center justify-between text-xs">
        <span className="font-bold text-gray-500 dark:text-dark-textMuted">
          Lịch sử chuyên cần (12 tháng qua):
        </span>
        {hoveredCell ? (
          <span className="font-extrabold text-kawaii-600 dark:text-kawaii-400 animate-fade-in">
            📅 {hoveredCell.date}: {hoveredCell.count} lượt thẻ đã ôn
          </span>
        ) : (
          <span className="text-gray-400 italic">Rê chuột vào từng ô để xem chi tiết</span>
        )}
      </div>

      {/* Khung Heatmap cuộn ngang */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-[720px]">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredCell({ date: day.date, count: day.count })}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`w-3 h-3 rounded-[3px] transition-transform hover:scale-125 hover:z-10 cursor-pointer ${getCellColor(
                    day.level
                  )}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Chú thích màu sắc (Legend) */}
      <div className="flex items-center justify-end gap-1.5 text-[11px] text-gray-400 pt-1">
        <span>Ít</span>
        <div className="w-2.5 h-2.5 rounded-[2px] bg-gray-100 dark:bg-dark-border/40" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-[#FFD1E3] dark:bg-[#682B48]" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-[#FFA8CA] dark:bg-[#9B2C62]" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-[#FF70A6] dark:bg-[#D92576]" />
        <div className="w-2.5 h-2.5 rounded-[2px] bg-[#FF5C9E]" />
        <span>Nhiều</span>
      </div>

    </div>
  );
};
