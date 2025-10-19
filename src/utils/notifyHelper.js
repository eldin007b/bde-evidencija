// Safe notification helper
// Prefer ServiceWorkerRegistration.showNotification when available (required on mobile)
// Fall back to the Window Notification API when running in a window context
export async function showNotification(payload = {}) {
  const { title = 'BD Evidencija', body = '', icon, badge, data = {}, requireInteraction = false, actions = [], tag } = payload;

  // Try Service Worker first (recommended for push and mobile)
  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration('/bde-evidencija/sw.js');
      if (registration && registration.showNotification) {
        // Use SW registration to show notification (works in SW and window)
        await registration.showNotification(title, {
          body,
          icon,
          badge,
          data,
          actions,
          requireInteraction,
          tag
        });
        return true;
      }
    }
  } catch (swErr) {
    // Continue to fallback
    console.warn('⚠️ showNotification (SW) failed:', swErr?.message || swErr);
  }

  // Fallback: Window Notification API (only available in window context)
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        // Attempt to request permission (non-blocking best-effort)
        // Caller should ideally have requested permission beforehand
        // but we'll try anyway for convenience
        // Note: requestPermission returns a promise in modern browsers
        try { await Notification.requestPermission(); } catch (e) {}
      }

      if (Notification.permission === 'granted') {
        const notif = new Notification(title, {
          body,
          icon,
          badge,
          data,
          tag
        });
        // Auto-close if not requireInteraction
        if (!requireInteraction) {
          setTimeout(() => { try { notif.close(); } catch(e){} }, 5000);
        }
        return true;
      }
    }
  } catch (winErr) {
    console.warn('⚠️ showNotification (Window) failed:', winErr?.message || winErr);
  }

  return false;
}
