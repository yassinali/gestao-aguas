"use client";

import { useState, useEffect } from "react";
import { useSession as betterUseSession } from "@/lib/auth-client";

type SessionState = {
  data: any;
  isPending: boolean;
  error?: any;
};

export function useSessionData() {
  const [state, setState] = useState<SessionState>({ data: null, isPending: true });

  useEffect(() => {
    // useSession do Better Auth já possui subscribe
    const unsubscribe = (betterUseSession as any)?.subscribe?.((value: any) => {
      setState({
        data: value.data ?? null,
        isPending: value.isPending ?? false,
        error: value.error ?? null,
      });
    });

    return () => unsubscribe?.();
  }, []);

  return state;
}
