import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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
      if (!token) return;
      setIsLoading(true);

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
    try {
      const res = await fetch('/api/stats/forecast', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setForecastData(range === '7' ? data.next7Days : data.next30Days);
      }
    } catch {
      // Ignored
    }
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
        // Cập nhật lại stats
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

  // Dữ liệu biểu đồ tròn phân bố thẻ
  const dist = summaryStats.distribution || { new: 0, learning: 0, review: 0, relearning: 0 };
  const pieData = [
    { name: 'Mới', value: dist.new, color: '#60A5FA' },
    { name: 'Đang học', value: dist.learning, color: '#FBBF24' },
    { name: 'Ôn tập', value: dist.review, color: '#10B981' },
    { name: 'Học lại', value: dist.relearning, color: '#F43F5E' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. TIÊU ĐỀ & TỔNG QUAN GAMIFICATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-kawaii-500" />
            <span>Thống Kê & Chuỗi Ngày Học 📊</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-dark-textMuted mt-1">
            Theo dõi đường cong trí nhớ, dự báo thẻ đến hạn và danh hiệu đạt được
          </p>
        </div>

        {/* Nút Đổi Streak Freeze */}
        <button
          onClick={handleBuyFreeze}
          disabled={isBuyingFreeze || (user?.xp || 0) < 150}
          className="px-4 py-2 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          <Snowflake className="w-4 h-4 text-cyan-500 animate-spin" />
          <span>Đổi Streak Freeze (150 XP)</span>
        </button>
      </div>

      {/* 4 THẺ CHỈ SỐ NỔI BẬT */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Streak hiện tại */}
        <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-orange-200 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-orange-500 flex items-center justify-center shrink-0">
            <Flame className="w-7 h-7 fill-orange-500 text-orange-500 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Chuỗi học hiện tại
            </span>
            <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
              {summaryStats.streakCount} ngày
            </span>
            <span className="text-[10px] text-gray-400 block">Kỷ lục: {summaryStats.longestStreak} ngày</span>
          </div>
        </div>

        {/* Lượt đóng băng Streak */}
        <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-cyan-200 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950/50 text-cyan-500 flex items-center justify-center shrink-0">
            <Snowflake className="w-7 h-7 text-cyan-500" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Streak Freeze
            </span>
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {summaryStats.streakFreezes} lượt
            </span>
            <span className="text-[10px] text-gray-400 block">Bảo vệ chuỗi khi lỡ 1 ngày</span>
          </div>
        </div>

        {/* Tỉ lệ nhớ Retention */}
        <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-emerald-200 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center shrink-0">
            <Brain className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Tỉ lệ nhớ FSRS
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {retentionRate}%
            </span>
            <span className="text-[10px] text-gray-400 block">Mục tiêu: 90% chuẩn hóa</span>
          </div>
        </div>

        {/* Mục tiêu học hôm nay */}
        <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-kawaii-100 dark:bg-dark-bg text-kawaii-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-7 h-7 text-kawaii-500" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Hôm nay đã học
            </span>
            <span className="text-2xl font-black text-kawaii-600 dark:text-kawaii-400">
              {summaryStats.todayReviews} / {summaryStats.dailyGoal}
            </span>
            <span className="text-[10px] text-kawaii-500 font-bold block">
              Đạt {summaryStats.todayProgress}% mục tiêu
            </span>
          </div>
        </div>

      </div>

      {/* 2. DỰ BÁO ÔN TẬP (REVIEW FORECAST CHART) & PHÂN BỐ THẺ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Cột 1: Biểu đồ cột Dự báo ôn tập trong 7/30 ngày tới */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-kawaii-500" />
                <span>Dự Báo Số Thẻ Cần Ôn (Review Forecast)</span>
              </h3>
              <p className="text-xs text-gray-400">
                Thuật toán FSRS tính toán trước lượng thẻ bạn cần ôn mỗi ngày tới
              </p>
            </div>

            {/* Toggle 7 ngày vs 30 ngày */}
            <div className="flex bg-gray-100 dark:bg-dark-bg p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => handleToggleForecastRange('7')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  forecastDays === '7' ? 'bg-kawaii-500 text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                7 Ngày tới
              </button>
              <button
                onClick={() => handleToggleForecastRange('30')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  forecastDays === '30' ? 'bg-kawaii-500 text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                30 Ngày tới
              </button>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
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
                <Bar dataKey="count" fill="#FF5C9E" radius={[6, 6, 0, 0]} name="Số thẻ đến hạn" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cột 2: Phân bố trạng thái thẻ (New, Learning, Review, Relearning) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
              Phân Bố Trạng Thái Thẻ 🍰
            </h3>
            <p className="text-xs text-gray-400">Tổng cộng {summaryStats.totalCards} thẻ vựng</p>
          </div>

          {pieData.length > 0 ? (
            <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 text-xs">Chưa có dữ liệu phân bố</div>
          )}

          {/* Chú thích trạng thái thẻ */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 dark:border-dark-border">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-gray-500">Mới: <strong>{dist.new}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-gray-500">Đang học: <strong>{dist.learning}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-gray-500">Ôn tập: <strong>{dist.review}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-gray-500">Học lại: <strong>{dist.relearning}</strong></span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. ACTIVITY HEATMAP KIỂU GITHUB (12 THÁNG) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-sm space-y-4">
        <h3 className="text-base font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
          <span>🌸</span>
          <span>Bản Đồ Hoạt Động Chuyên Cần (Activity Heatmap)</span>
        </h3>
        <HeatmapCalendar data={heatmapData} />
      </div>

      {/* 4. HỆ THỐNG HUY HIỆU & DANH HIỆU (BADGES) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-200 dark:border-dark-border shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Bộ Sưu Tập Huy Hiệu Mở Khóa 🏆</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Mỗi cột mốc kiên trì mang lại huy hiệu vinh danh độc quyền
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
