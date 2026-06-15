"use client";

import { useAuth } from "@/lib/auth/context";
import { useCallback } from "react";

/**
 * Returns an authenticated fetch function that automatically adds
 * the Authorization: Bearer <token> header to every request.
 */
export function useAuthFetch() {
  const { accessToken } = useAuth();

  const authFetch = useCallback(
    (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(init.headers ?? {});
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
      return fetch(input, { ...init, headers });
    },
    [accessToken]
  );

  return authFetch;
}
