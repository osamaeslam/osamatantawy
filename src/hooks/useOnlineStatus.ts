import { useCallback, useEffect, useState } from 'react';
import { offlineStoreService } from '../services/offline-store.service';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedCount, setLastSyncedCount] = useState<number>(0);

  const refreshPendingCount = useCallback(async () => {
    try {
      const pending = await offlineStoreService.getPendingActions();
      setPendingCount(pending.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    setIsSyncing(true);
    try {
      const { synced } = await offlineStoreService.flushPendingActions();
      if (synced > 0) {
        setLastSyncedCount(synced);
        window.setTimeout(() => setLastSyncedCount(0), 6000);
      }
      await refreshPendingCount();
    } finally {
      setIsSyncing(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();

    if (typeof navigator === 'undefined' || navigator.onLine) {
      void triggerSync();
    }

    const handleOnline = () => {
      setIsOnline(true);
      void triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    const handleQueueChange = () => {
      void refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('tantawy-offline-queue-changed', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('tantawy-offline-queue-changed', handleQueueChange);
    };
  }, [refreshPendingCount, triggerSync]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncedCount,
    triggerSync,
    refreshPendingCount,
  };
}
