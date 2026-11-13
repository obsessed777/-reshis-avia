'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type AuthUser = { id: string; email: string };
export function useAuth() {
  const [user, updateUser] = useState<AuthUser | null>(null);
  const generation = useRef(0);
  const setUser = useCallback((next: AuthUser | null) => { generation.current++; updateUser(next); }, []);
  const [busy, setBusy] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const started = generation.current;
    fetch('/api/auth/me', { cache: 'no-store', signal: controller.signal }).then(async result => {
      if (result.ok) { const data = await result.json(); if (started === generation.current && !controller.signal.aborted) updateUser(data.user); }
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  const logout = useCallback(async () => {
    generation.current++;
    setBusy(true); setLogoutError(false);
    try {
      const result = await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
      if (result.ok) updateUser(null);
      else {
        const data = await result.json().catch(() => null);
        if (data?.localCleared) updateUser(null);
        setLogoutError(true);
      }
    } catch { setLogoutError(true); }
    finally { setBusy(false); }
  }, []);
  return { user, busy, logout, logoutError, setUser };
}
