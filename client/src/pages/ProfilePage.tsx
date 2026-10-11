import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Shield,
  Target,
  Download,
  Trash2,
  Check,
  AlertTriangle,
  Volume2,
  Sparkles,
  Smartphone,
  SunMedium,
  HandMetal,
  Type,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Mascot, type MascotId } from '../components/common/Mascot';
import { promptPwaInstall } from '../components/common/PwaInstallBanner';

export const ProfilePage: React.FC = () => {
  const { user, token, updateProfile, logout } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState<MascotId>(
    (user?.avatar as MascotId) || 'bunny_pink'
  );
  const [dailyGoal, setDailyGoal] = useState<number>(user?.dailyGoal || 20);
  const [defaultVoice, setDefaultVoice] = useState<'zh-CN' | 'zh-TW' | 'en-US' | 'en-GB'>('zh-CN');

  // Cài đặt trải nghiệm di động (Mobile Settings)
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [autoSpeech, setAutoSpeech] = useState(true);
  const [wakeLockEnabled, setWakeLockEnabled] = useState(true);
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'huge'>('normal');

  useEffect(() => {
    setHapticsEnabled(localStorage.getItem('mobile_haptics') !== 'false');
    setAutoSpeech(localStorage.getItem('study_auto_speech') !== 'false');
    setWakeLockEnabled(localStorage.getItem('study_wake_lock') !== 'false');
    setSwipeEnabled(localStorage.getItem('study_swipe') !== 'false');
    setFontScale((localStorage.getItem('mobile_font_scale') as any) || 'normal');
  }, []);

  // Đổi mật khẩu
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwStatus, setPwStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  // Trạng thái lưu & modal
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-20">
        <Mascot id="bunny_pink" mood="shy" size="lg" />
        <h2 className="text-xl font-bold mt-4 text-gray-700 dark:text-gray-300">
          Vui lòng đăng nhập để xem trang cá nhân 🌸
        </h2>
      </div>
    );
  }

  const avatars: { id: MascotId; name: string }[] = [
    { id: 'bunny_pink', name: 'Thỏ Sakura' },
    { id: 'kitty_purple', name: 'Mèo Mochi' },
    { id: 'star_gold', name: 'Ngôi Sao Vàng' },
    { id: 'boba_mint', name: 'Trà Sữa Boba' },
  ];

  // Lưu thông tin hồ sơ & cài đặt di động
  const handleSaveProfile = async () => {
    setSaveStatus('saving');

    // Lưu mobile settings vào localStorage
    localStorage.setItem('mobile_haptics', String(hapticsEnabled));
    localStorage.setItem('study_auto_speech', String(autoSpeech));
    localStorage.setItem('study_wake_lock', String(wakeLockEnabled));
    localStorage.setItem('study_swipe', String(swipeEnabled));
    localStorage.setItem('mobile_font_scale', fontScale);

    if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([15]);
    }

    const success = await updateProfile({
      displayName,
      avatar: selectedAvatar,
      dailyGoal,
      settingsJson: JSON.stringify({ defaultVoice }),
    });

    if (success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } else {
      setSaveStatus('idle');
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setPwStatus({ type: 'error', message: 'Vui lòng nhập mật khẩu cũ và mới.' });
      return;
    }
    if (newPassword.length < 6) {
      setPwStatus({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwStatus({ type: 'error', message: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPwStatus({ type: 'success', message: 'Đổi mật khẩu thành công!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwStatus({ type: 'error', message: data.message || 'Lỗi đổi mật khẩu' });
      }
    } catch {
      setPwStatus({ type: 'error', message: 'Không thể kết nối đến máy chủ.' });
    }
  };

  // Tải file JSON sao lưu
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/auth/backup', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sakura_flashcard_backup_${user.username}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch {
      alert('Không thể xuất dữ liệu lúc này.');
    }
  };

  // Dọn dẹp cache offline an toàn
  const handleClearCache = async () => {
    if (!confirm('Dọn dẹp bộ nhớ đệm offline (Workbox/PWA)? Dữ liệu thẻ trên máy chủ sẽ không bị ảnh hưởng.')) {
      return;
    }
    setIsClearingCache(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      alert('Đã xóa sạch bộ nhớ đệm offline thành công! ✨');
    } catch {
      alert('Không thể xóa bộ nhớ đệm.');
    } finally {
      setIsClearingCache(false);
    }
  };

  // Xóa tài khoản
  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        logout();
      }
    } catch {
      alert('Không thể xóa tài khoản lúc này.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-16">
      
      {/* Tiêu đề */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-kawaii-100 dark:bg-dark-card text-kawaii-600 dark:text-kawaii-400">
          <UserIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 dark:text-white">
            Hồ Sơ & Cài Đặt Cá Nhân 🌸
          </h1>
          <p className="text-xs text-gray-500 dark:text-dark-textMuted">
            Tùy biến linh vật đại diện, trải nghiệm di động và bảo mật tài khoản
          </p>
        </div>
      </div>

      {/* 1. THÔNG TIN HỒ SƠ & LINH VẬT */}
      <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-100 dark:border-dark-border shadow-sm space-y-6">
        <h2 className="text-base sm:text-lg font-bold font-display text-gray-800 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-kawaii-500" />
          <span>Linh Vật & Tên Hiển Thị</span>
        </h2>

        {/* Chọn Linh vật Mascot */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-3">
            Chọn linh vật đại diện của bạn:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {avatars.map((ava) => {
              const isSelected = selectedAvatar === ava.id;
              return (
                <button
                  key={ava.id}
                  type="button"
                  onClick={() => setSelectedAvatar(ava.id)}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all btn-bounce ${
                    isSelected
                      ? 'border-kawaii-500 bg-kawaii-50 dark:bg-dark-bg shadow-kawaii-sm'
                      : 'border-kawaii-100 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-gray-50'
                  }`}
                >
                  <Mascot id={ava.id} size="md" animate={isSelected} />
                  <span className={`text-xs font-bold ${isSelected ? 'text-kawaii-600 dark:text-kawaii-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {ava.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form nhập thông tin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Tên hiển thị (Nickname)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Tên đăng nhập (Username)
            </label>
            <input
              type="text"
              disabled
              value={`@${user.username}`}
              className="w-full px-4 py-3 rounded-2xl bg-gray-100 dark:bg-dark-bg/60 border border-gray-200 dark:border-dark-border text-base sm:text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Mục tiêu học & Giọng đọc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-kawaii-100 dark:border-dark-border">
          {/* Mục tiêu học hàng ngày */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-kawaii-500" /> Mục tiêu học mỗi ngày:
              </span>
              <span className="font-bold text-kawaii-600 dark:text-kawaii-400 text-sm">
                {dailyGoal} thẻ / ngày
              </span>
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="w-full accent-kawaii-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>5 thẻ (Thong thả)</span>
              <span>20 (Tiêu chuẩn)</span>
              <span>100 (Cấp tốc)</span>
            </div>
          </div>

          {/* Giọng đọc mặc định */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-2">
              <Volume2 className="w-4 h-4 text-blue-500" /> Giọng đọc mặc định ưu tiên:
            </label>
            <select
              value={defaultVoice}
              onChange={(e) => setDefaultVoice(e.target.value as any)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white"
            >
              <option value="zh-CN">🇨🇳 Tiếng Trung phổ thông (zh-CN)</option>
              <option value="zh-TW">🇹🇼 Tiếng Trung Đài Loan (zh-TW)</option>
              <option value="en-US">🇺🇸 Tiếng Anh - Mỹ (en-US)</option>
              <option value="en-GB">🇬🇧 Tiếng Anh - Anh (en-GB)</option>
            </select>
          </div>
        </div>

        {/* Nút Lưu hồ sơ */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saveStatus === 'saving'}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-kawaii-400 to-kawaii-500 text-white font-bold text-xs shadow-kawaii btn-bounce flex items-center justify-center gap-2 active:scale-95"
          >
            {saveStatus === 'saved' ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã lưu thành công! ✨</span>
              </>
            ) : (
              <span>Lưu thay đổi hồ sơ</span>
            )}
          </button>
        </div>
      </div>

      {/* 2. CÀI ĐẶT TRẢI NGHIỆM DI ĐỘNG & PWA (MOBILE EXPERIENCE) */}
      <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-100 dark:border-dark-border shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold font-display text-gray-800 dark:text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-kawaii-500" />
            <span>Cài Đặt Trải Nghiệm Di Động & PWA 📱</span>
          </h2>
          <span className="text-[11px] font-bold text-kawaii-600 bg-kawaii-50 dark:bg-dark-bg px-2.5 py-1 rounded-full">
            Mobile-First
          </span>
        </div>

        <div className="space-y-4 divide-y divide-gray-100 dark:divide-dark-border">
          
          {/* Rung phản hồi cảm ứng */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-gray-800 dark:text-white block">
                Rung phản hồi khi bấm nút (Haptic Feedback)
              </span>
              <span className="text-[11px] text-gray-400 block">
                Rung nhẹ 10ms khi lật thẻ, chọn đáp án hoặc vuốt cử chỉ
              </span>
            </div>
            <input
              type="checkbox"
              checked={hapticsEnabled}
              onChange={(e) => {
                setHapticsEnabled(e.target.checked);
                if (e.target.checked && navigator.vibrate) navigator.vibrate(15);
              }}
              className="w-5 h-5 accent-kawaii-500 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Tự động phát âm */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-gray-800 dark:text-white block">
                Tự động phát âm khi lật thẻ
              </span>
              <span className="text-[11px] text-gray-400 block">
                Tự đọc giọng bản xứ từ vựng ngay khi xem mặt sau
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoSpeech}
              onChange={(e) => setAutoSpeech(e.target.checked)}
              className="w-5 h-5 accent-kawaii-500 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Giữ màn hình sáng (Wake Lock) */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                <SunMedium className="w-3.5 h-3.5 text-amber-500" />
                <span>Giữ màn hình luôn sáng khi học</span>
              </span>
              <span className="text-[11px] text-gray-400 block">
                Ngăn màn hình điện thoại tự tắt khóa khi đang suy nghĩ thẻ
              </span>
            </div>
            <input
              type="checkbox"
              checked={wakeLockEnabled}
              onChange={(e) => setWakeLockEnabled(e.target.checked)}
              className="w-5 h-5 accent-kawaii-500 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Cử chỉ vuốt đổi thẻ */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                <HandMetal className="w-3.5 h-3.5 text-purple-500" />
                <span>Cử chỉ vuốt đổi thẻ (Swipe Gesture)</span>
              </span>
              <span className="text-[11px] text-gray-400 block">
                Vuốt sang phải = Tốt, vuốt sang trái = Lại
              </span>
            </div>
            <input
              type="checkbox"
              checked={swipeEnabled}
              onChange={(e) => setSwipeEnabled(e.target.checked)}
              className="w-5 h-5 accent-kawaii-500 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Cỡ chữ thẻ trên di động */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-blue-500" />
                <span>Cỡ chữ hiển thị từ vựng & Hán tự:</span>
              </span>
              <span className="text-[11px] text-gray-400 block">
                Tăng kích thước chữ nếu bạn muốn đọc rõ hơn trên màn hình nhỏ
              </span>
            </div>

            <div className="flex bg-gray-100 dark:bg-dark-bg p-1 rounded-xl text-xs font-bold w-fit">
              <button
                type="button"
                onClick={() => setFontScale('normal')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  fontScale === 'normal' ? 'bg-kawaii-500 text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                Vừa (100%)
              </button>
              <button
                type="button"
                onClick={() => setFontScale('large')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  fontScale === 'large' ? 'bg-kawaii-500 text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                Lớn (115%)
              </button>
              <button
                type="button"
                onClick={() => setFontScale('huge')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  fontScale === 'huge' ? 'bg-kawaii-500 text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                Rất lớn (130%)
              </button>
            </div>
          </div>

          {/* Cài đặt PWA & Xóa bộ nhớ đệm Offline */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => promptPwaInstall()}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>Cài đặt ứng dụng vào màn hình chính (PWA)</span>
            </button>

            <button
              type="button"
              disabled={isClearingCache}
              onClick={handleClearCache}
              className="py-3 px-4 rounded-2xl bg-gray-100 dark:bg-dark-bg hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs border border-gray-200 dark:border-dark-border flex items-center justify-center gap-2 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isClearingCache ? 'animate-spin' : ''}`} />
              <span>Dọn dẹp bộ nhớ đệm Offline</span>
            </button>
          </div>

        </div>
      </div>

      {/* 3. ĐỔI MẬT KHẨU */}
      <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-100 dark:border-dark-border shadow-sm space-y-4">
        <h2 className="text-base sm:text-lg font-bold font-display text-gray-800 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-500" />
          <span>Bảo Mật & Mật Khẩu</span>
        </h2>

        {pwStatus.message && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
              pwStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <span>{pwStatus.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{pwStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="password"
            placeholder="Mật khẩu hiện tại"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white"
          />
          <input
            type="password"
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white"
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-kawaii-200 dark:border-dark-border text-base sm:text-sm outline-none focus:border-kawaii-500 dark:text-white"
          />
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
            >
              Cập nhật mật khẩu
            </button>
          </div>
        </form>
      </div>

      {/* 4. SAO LƯU DỮ LIỆU & VÙNG NGUY HIỂM */}
      <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border-2 border-kawaii-100 dark:border-dark-border shadow-sm space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-gray-800 dark:text-white flex items-center gap-2 mb-1">
            <Download className="w-4 h-4 text-blue-500" />
            <span>Sao Lưu Toàn Bộ Dữ Liệu</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-dark-textMuted mb-3">
            Tải về tệp JSON chứa toàn bộ bộ thẻ, danh sách thẻ và lịch sử ôn tập FSRS của bạn để lưu trữ an toàn.
          </p>
          <button
            type="button"
            onClick={handleExportBackup}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải tệp sao lưu (.json)</span>
          </button>
        </div>

        <div className="pt-4 border-t border-red-100 dark:border-red-950/40">
          <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 mb-1">
            <Trash2 className="w-4 h-4" /> Vùng Nguy Hiểm
          </h3>
          <p className="text-xs text-gray-500 dark:text-dark-textMuted mb-3">
            Xóa vĩnh viễn tài khoản và toàn bộ bộ thẻ học của bạn khỏi máy chủ. Hành động này không thể hoàn tác.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs border border-red-200 dark:border-red-900/60 transition-colors active:scale-95"
          >
            Xóa tài khoản vĩnh viễn
          </button>
        </div>
      </div>

      {/* Modal xác nhận xóa tài khoản */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-sm w-full border-2 border-red-200 dark:border-red-900 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Bạn có chắc chắn muốn xóa?
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-textMuted">
              Toàn bộ bộ thẻ, lịch ôn tập và tiến trình học tập của bạn sẽ bị xóa sạch và không thể khôi phục lại.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-gray-300 text-xs font-bold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600"
              >
                Xác nhận xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
