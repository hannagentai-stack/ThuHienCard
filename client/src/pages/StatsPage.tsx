import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  Flame,
  Snowflake,
  Sparkles,
  Award,
  Calendar,
  Brain,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { HeatmapCalendar } from '../components/stats/HeatmapCalendar';
import { Mascot } from '../components/common/Mascot';

export const StatsPage: React.FC = () => {
  const { user, token, checkAuth } = useAuthStore();

  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [forecastDays, setForecastDays] = useState<'7' | '30'>('7');
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [badgesData, setBadgesData] = useState<any[]>([]);
  const [retentionRate, setRetentionRate] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuyingFreeze, setIsBuyingFreeze] = useState(false);

  useEffect(() => {
    const fetchAllStats = async () => {
      setIsLoading(true);

      // Nếu chưa có token (khách offline), cung cấp số liệu mặc định hợp lý
      if (!token) {
        setSummaryStats({
          streakCount: 1,
          longestStreak: 1,
          streakFreezes: 0,
          todayReviews: 0,
          dailyGoal: 20,
          todayProgress: 0,
          totalCards: 0,
          distribution: { new: 0, learning: 0, review: 0, relearning: 0 },
        });
        setForecastData([
          { dayLabel: 'Hôm nay', count: 0 },
          { dayLabel: 'Ngày mai', count: 0 },
          { dayLabel: 'Ngày 3', count: 0 },
          { dayLabel: 'Ngày 4', count: 0 },
          { dayLabel: 'Ngày 5', count: 0 },
          { dayLabel: 'Ngày 6', count: 0 },
          { dayLabel: 'Ngày 7', count: 0 },
        ]);
        setHeatmapData([]);
        setBadgesData([
          {
            id: 'first_card',
            icon: '🌸',
            title: 'Bước Đầu Khởi Sắc',
            desc: 'Ôn tập thẻ flashcard đầu tiên',
            isUnlocked: false,
            progress: 0,
          },
          {
            id: 'streak_3',
            icon: '🔥',
            title: 'Ngọn Lửa Kiên Trì',
            desc: 'Duy trì chuỗi học 3 ngày liên tục',
            isUnlocked: false,
            progress: 0.33,
          },
        ]);
        setRetentionRate(95);
        setIsLoading(false);
        return;
      }

      try {
        const [sumRes, fcRes, hmRes, bgRes] = await Promise.all([
          fetch('/api/stats/summary', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/stats/forecast', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/stats/heatmap', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/stats/badges', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (sumRes.ok) setSummaryStats((await sumRes.json()).stats);
        if (fcRes.ok) {
          const fc = await fcRes.json();
          setForecastData(fc.next7Days || []);
        }
        if (hmRes.ok) setHeatmapData((await hmRes.json()).heatmap || []);
        if (bgRes.ok) {
          const bg = await bgRes.json();
          setBadgesData(bg.badges || []);
          setRetentionRate(bg.retentionRate || 100);
        }
      } catch (err) {
        console.error('Lỗi nạp thống kê:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStats();
  }, [token]);

  // Đổi lựa chọn 7 ngày / 30 ngày cho Forecast
  const handleToggleForecastRange = async (range: '7' | '30') => {
    setForecastDays(range);
    if (!token) return;
    try {
      const res = await fetch('/api/stats/forecast', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setForecastData(range === '7' ? data.next7Days : data.next30Days);
      }
    } catch {}
  };

  // Mua thêm lượt đóng băng Streak
  const handleBuyFreeze = async () => {
    if (!token || isBuyingFreeze) return;
    setIsBuyingFreeze(true);

    try {
      const res = await fetch('/api/stats/buy-freeze', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert('Đổi thành công 1 lượt đóng băng chuỗi học ❄️!');
        checkAuth();
        const sumRes = await fetch('/api/stats/summary', { headers: { Authorization: `Bearer ${token}` } });
        if (sumRes.ok) setSummaryStats((await sumRes.json()).stats);
      } else {
        alert(data.message || 'Không thể đổi lúc này.');
      }
    } catch {
      alert('Lỗi kết nối máy chủ.');
    } finally {
      setIsBuyingFreeze(false);
    }
  };

  if (isLoading || !summaryStats) {
    return (
      <div className="py-24 text-center space-y-3">
        <Mascot id="bunny_pink" mood="studying" size="lg" />
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
          Đang tính toán biểu đồ thống kê học tập...
        </h3>
      </div>
    );
  }

  // Dữ liệu phân bố thẻ FSRS
  const dist = summaryStats.distribution || { new: 0, learning: 0, review: 0, relearning: 0 };
  const totalCards = summaryStats.totalCards || (dist.new + dist.learning + dist.review + dist.relearning) || 1;
  const pctNew = Math.round((dist.new / totalCards) * 100);
  const pctLearning = Math.round((dist.learning / totalCards) * 100);
  const pctReview = Math.round((dist.review / totalCards) * 100);
  const pctRelearning = Math.round((dist.relearning / totalCards) * 100);

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      
      {/* 1. TIÊU ĐỀ & TỔNG QUAN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-kawaii-500" />
            <span>Thống Kê & Chuỗi Ngày Học 📊</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1">
            Theo dõi đường cong trí nhớ, dự báo thẻ đến hạn và huy hiệu đạt được
          </p>
        </div>

        {/* Nút Đổi Streak Freeze */}
        {token && (
          <button
            onClick={handleBuyFreeze}
            disabled={isBuyingFreeze || (user?.xp || 0) < 150}
            className="px-4 py-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <Snowflake className="w-4 h-4 text-cyan-500 animate-spin" />
            <span>Đổi Streak Freeze (150 XP)</span>
          </button>
        )}
      </div>

      {/* 4 THẺ CHỈ SỐ KPI CHUẨN MOBILE (2 CỘT) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Streak hiện tại */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-orange-200 dark:border-dark-border shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-orange-500 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-orange-500 text-orange-500 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
              Chuỗi học
            </span>
            <span className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400 leading-tight">
              {summaryStats.streakCount} ngày
            </span>
            <span className="text-[10px] text-gray-400 block truncate">Kỷ lục: {summaryStats.longestStreak}d</span>
          </div>
        </div>

        {/* Lượt đóng băng Streak */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-cyan-200 dark:border-dark-border shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-100 dark:bg-cyan-950/50 text-cyan-500 flex items-center justify-center shrink-0">
            <Snowflake className="w-6 h-6 text-cyan-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
              Bảo vệ chuỗi
            </span>
            <span className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 leading-tight">
              {summaryStats.streakFreezes} lượt
            </span>
            <span className="text-[10px] text-gray-400 block truncate">Streak Freeze</span>
          </div>
        </div>

        {/* Tỉ lệ nhớ Retention */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-emerald-200 dark:border-dark-border shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center shrink-0">
            <Brain className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
              Tỉ lệ nhớ FSRS
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
              {retentionRate}%
            </span>
            <span className="text-[10px] text-gray-400 block truncate">Mục tiêu: 90%</span>
          </div>
        </div>

        {/* Mục tiêu học hôm nay */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-kawaii-100 dark:bg-dark-bg text-kawaii-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-kawaii-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
              Hôm nay đã học
            </span>
            <span className="text-xl sm:text-2xl font-black text-kawaii-600 dark:text-kawaii-400 leading-tight">
              {summaryStats.todayReviews}/{summaryStats.dailyGoal}
            </span>
            <span className="text-[10px] text-kawaii-500 font-bold block truncate">
              {summaryStats.todayProgress}% mục tiêu
            </span>
          </div>
        </div>

      </div>

      {/* 2. DỰ BÁO ÔN TẬP & PHÂN BỐ TRẠNG THÁI THẺ FSRS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Cột 1: Biểu đồ cột Dự báo ôn tập trong 7/30 ngày tới */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-kawaii-500" />
                <span>Dự Báo Số Thẻ Cần Ôn</span>
              </h3>
              <p className="text-[11px] text-gray-400">
                FSRS tính toán trước lượng thẻ bạn cần ôn mỗi ngày tới
              </p>
            </div>

            {/* Toggle 7 ngày vs 30 ngày */}
            <div className="flex bg-gray-100 dark:bg-dark-bg p-1 rounded-xl text-xs font-bold w-fit">
              <button
                type="button"
                onClick={() => handleToggleForecastRange('7')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  forecastDays === '7' ? 'bg-kawaii-500 text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                7 Ngày
              </button>
              <button
                type="button"
                onClick={() => handleToggleForecastRange('30')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  forecastDays === '30' ? 'bg-kawaii-500 text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                30 Ngày
              </button>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData}>
                <XAxis dataKey="dayLabel" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFF5F8',
                    borderRadius: '16px',
                    borderColor: '#FFD1E3',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Bar dataKey="count" fill="#FF5C9E" radius={[6, 6, 0, 0]} name="Thẻ đến hạn" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cột 2: Phân bố thẻ FSRS dạng THANH TIẾN TRÌNH XẾP CHỒNG (STACKED PROGRESS BAR) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-kawaii-500" />
              <span>Phân Bố Trạng Thái Thẻ 🍰</span>
            </h3>
            <p className="text-[11px] text-gray-400">
              Tổng cộng <strong>{summaryStats.totalCards}</strong> thẻ trong kho kiến thức
            </p>
          </div>

          {/* Thanh xếp chồng trực quan 100% mượt mà trên mobile */}
          <div className="space-y-2 py-2">
            <div className="w-full h-5 rounded-2xl bg-gray-100 dark:bg-dark-bg flex overflow-hidden p-0.5 border border-kawaii-200 dark:border-dark-border">
              {pctNew > 0 && (
                <div
                  style={{ width: `${pctNew}%` }}
                  title={`Mới: ${pctNew}%`}
                  className="bg-blue-400 h-full first:rounded-l-xl last:rounded-r-xl transition-all"
                />
              )}
              {pctLearning > 0 && (
                <div
                  style={{ width: `${pctLearning}%` }}
                  title={`Đang học: ${pctLearning}%`}
                  className="bg-amber-400 h-full first:rounded-l-xl last:rounded-r-xl transition-all"
                />
              )}
              {pctReview > 0 && (
                <div
                  style={{ width: `${pctReview}%` }}
                  title={`Ôn tập: ${pctReview}%`}
                  className="bg-emerald-500 h-full first:rounded-l-xl last:rounded-r-xl transition-all"
                />
              )}
              {pctRelearning > 0 && (
                <div
                  style={{ width: `${pctRelearning}%` }}
                  title={`Học lại: ${pctRelearning}%`}
                  className="bg-rose-500 h-full first:rounded-l-xl last:rounded-r-xl transition-all"
                />
              )}
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 px-1 font-semibold">
              <span>Độ sâu bộ nhớ</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {pctReview}% Đã ghi nhớ
              </span>
            </div>
          </div>

          {/* 4 Thẻ chỉ số trạng thái mini */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                <span>Mới</span>
              </span>
              <span className="font-extrabold text-blue-900 dark:text-blue-200">
                {dist.new} ({pctNew}%)
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span>Đang học</span>
              </span>
              <span className="font-extrabold text-amber-900 dark:text-amber-200">
                {dist.learning} ({pctLearning}%)
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Ôn tập</span>
              </span>
              <span className="font-extrabold text-emerald-900 dark:text-emerald-200">
                {dist.review} ({pctReview}%)
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>Học lại</span>
              </span>
              <span className="font-extrabold text-rose-900 dark:text-rose-200">
                {dist.relearning} ({pctRelearning}%)
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. ACTIVITY HEATMAP CHUYÊN CẦN MOBILE */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-sm space-y-3">
        <h3 className="text-base font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
          <span>🌸</span>
          <span>Bản Đồ Chuyên Cần Theo Ngày (Heatmap)</span>
        </h3>
        <HeatmapCalendar data={heatmapData} />
      </div>

      {/* 4. HỆ THỐNG HUY HIỆU & DANH HIỆU */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-sm space-y-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Bộ Sưu Tập Huy Hiệu Danh Dự 🏆</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Mỗi cột mốc kiên trì mang lại huy hiệu vinh danh độc quyền
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {badgesData.map((badge) => {
            const isUnlocked = badge.isUnlocked;
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border-2 flex flex-col justify-between space-y-3 transition-all ${
                  isUnlocked
                    ? 'border-kawaii-300 dark:border-dark-border bg-gradient-to-br from-pink-50/50 to-white dark:from-dark-bg/60 dark:to-dark-card shadow-sm'
                    : 'border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/20 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{badge.icon}</span>
                  {isUnlocked ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đạt được
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Chưa mở
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-gray-800 dark:text-white">
                    {badge.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-dark-textMuted mt-0.5">
                    {badge.desc}
                  </p>
                </div>

                {/* Thanh tiến trình mở khóa */}
                <div className="w-full bg-gray-200 dark:bg-dark-border h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-kawaii-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.round(badge.progress * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
