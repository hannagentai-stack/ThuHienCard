import React, { useEffect, useState } from 'react';
import { WifiOff, Cloud, CheckCircle2, X } from 'lucide-react';
import { Mascot } from './Mascot';

export const ServerWakeupBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [serverState, setServerState] = useState<
    'checking' | 'awake' | 'waking_up' | 'ready' | 'hidden'
  >('checking');
  const [isDismissed, setIsDismissed] = useState(false);

  // 1. Giám sát trạng thái mạng online / offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Gửi request đánh thức (Wake-up ping) tới máy chủ Render free-tier
  useEffect(() => {
    if (!isOnline) {
      setServerState('hidden');
      return;
    }

    let isSubscribed = true;
    let wakeTimer: any = null;

    // Nếu sau 3.5 giây server chưa phản hồi (do Render free-tier đang ngủ), hiện thông báo dễ thương
    wakeTimer = setTimeout(() => {
      if (isSubscribed && serverState === 'checking') {
        setServerState('waking_up');
      }
    }, 3500);

    const pingServer = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok && isSubscribed) {
          clearTimeout(wakeTimer);
          if (serverState === 'waking_up') {
            setServerState('ready');
            // Tự động ẩn sau 3 giây khi server đã thức
            setTimeout(() => {
              if (isSubscribed) setServerState('hidden');
            }, 3000);
          } else {
            setServerState('awake');
          }
        } else {
          // Thử lại sau 6 giây
          setTimeout(pingServer, 6000);
        }
      } catch {
        if (isSubscribed) {
          setServerState('waking_up');
          setTimeout(pingServer, 6000);
        }
      }
    };

    pingServer();

    return () => {
      isSubscribed = false;
      clearTimeout(wakeTimer);
    };
  }, [isOnline]);

  if (isDismissed) return null;

  // Banner khi mất mạng (Offline Indicator)
  if (!isOnline) {
    return (
      <div className="fixed top-14 sm:top-16 inset-x-0 z-40 px-3 py-1.5 flex justify-center animate-slide-down pointer-events-none">
        <div className="pointer-events-auto bg-amber-500 text-white px-4 py-2 rounded-2xl shadow-lg border border-amber-400 flex items-center gap-2 text-xs font-bold max-w-md w-full justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
            <span>Đang học ngoại tuyến 🌸 Dữ liệu sẽ tự đồng bộ khi có mạng!</span>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-white/20 rounded-lg shrink-0"
            aria-label="Ẩn thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Banner khi Render server đang "thức dậy" sau giấc ngủ ngắn (Cold start notification)
  if (serverState === 'waking_up') {
    return (
      <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-40 flex justify-center animate-slide-up">
        <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-md text-gray-800 dark:text-white px-4 py-3 rounded-3xl shadow-kawaii-lg border-2 border-kawaii-300 dark:border-dark-border flex items-center gap-3 text-xs max-w-sm w-full">
          <div className="shrink-0 animate-bounce">
            <Mascot id="bunny_pink" mood="studying" size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-kawaii-600 dark:text-kawaii-400">
              <Cloud className="w-3.5 h-3.5 animate-pulse" />
              <span>Máy chủ đang thức dậy... (~30s)</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-dark-textMuted mt-0.5 leading-tight">
              Gói Render miễn phí đang khởi động lại. Bạn vẫn có thể học bình thường bằng dữ liệu offline!
            </p>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl shrink-0"
            aria-label="Ẩn thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Banner khi máy chủ đã thức dậy hoàn tất
  if (serverState === 'ready') {
    return (
      <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-40 flex justify-center animate-slide-up">
        <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-2xl shadow-kawaii-lg flex items-center gap-2.5 text-xs font-bold max-w-sm w-full justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Máy chủ đã thức dậy! Đám mây đã kết nối ✨</span>
          </div>
          <button
            onClick={() => setServerState('hidden')}
            className="p-1 hover:bg-white/20 rounded-lg shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
