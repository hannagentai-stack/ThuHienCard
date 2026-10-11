import React, { useEffect, useState } from 'react';
import { X, Smartphone } from 'lucide-react';

let globalDeferredPrompt: any = null;
const installListeners = new Set<() => void>();

export const promptPwaInstall = async (): Promise<boolean> => {
  if (!globalDeferredPrompt) {
    alert('Để cài đặt ứng dụng:\n- Trên iPhone (Safari): Bấm nút Chia sẻ (biểu tượng ô vuông mũi tên lên) -> Chọn "Thêm vào MH chính" (Add to Home Screen).\n- Trên Android: Bấm menu 3 chấm ở góc trên trình duyệt -> Chọn "Cài đặt ứng dụng".');
    return false;
  }

  globalDeferredPrompt.prompt();
  const { outcome } = await globalDeferredPrompt.userChoice;
  globalDeferredPrompt = null;
  installListeners.forEach((fn) => fn());
  return outcome === 'accepted';
};

export const PwaInstallBanner: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Kiểm tra xem đã mở dưới dạng standalone (đã cài đặt) chưa
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setCanInstall(false);
      return;
    }

    const checkDismissed = localStorage.getItem('pwa_banner_dismissed');
    if (checkDismissed) {
      setIsDismissed(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setCanInstall(true);
      installListeners.forEach((fn) => fn());
    };

    const handleAppInstalled = () => {
      globalDeferredPrompt = null;
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const listener = () => {
      setCanInstall(!!globalDeferredPrompt);
    };
    installListeners.add(listener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      installListeners.delete(listener);
    };
  }, []);

  const handleInstallClick = async () => {
    await promptPwaInstall();
    setCanInstall(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!canInstall || isDismissed) return null;

  return (
    <div className="fixed top-14 sm:top-16 inset-x-0 z-40 px-3 py-1 flex justify-center animate-slide-down pointer-events-none">
      <div className="pointer-events-auto bg-gradient-to-r from-kawaii-500 to-purple-600 text-white px-3.5 py-2.5 rounded-2xl shadow-kawaii-lg border border-pink-300/40 flex items-center justify-between gap-3 text-xs font-bold max-w-md w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <span className="block truncate font-extrabold text-white">
              Cài Sakura Flashcard 🌸
            </span>
            <span className="block truncate text-[11px] text-pink-100 font-normal">
              Mở nhanh như app, học offline không cần mạng
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-white text-kawaii-600 hover:bg-pink-50 font-bold text-xs shadow-sm active:scale-95 transition-transform"
          >
            Cài ngay
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded-lg text-pink-200 hover:text-white"
            aria-label="Ẩn thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
