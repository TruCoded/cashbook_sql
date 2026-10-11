"use client";

import { createContext, useContext } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api-client";
import type { SessionUser } from "@/types";

interface UserContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  refresh: () => void;
}

const UserContext = createContext<UserContextValue>({ user: null, isLoading: true, refresh: () => {} });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, mutate } = useSWR<{ user: SessionUser | null }>("/api/me", fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: true,
  });

  return <UserContext.Provider value={{ user: data?.user ?? null, isLoading, refresh: () => mutate() }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
