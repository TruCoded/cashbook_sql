import useSWR from "swr";
import { fetcher } from "@/lib/api-client";

export interface AnalyticsSeriesPoint {
  day: string;
  cashIn: number;
  cashOut: number;
}

export interface AnalyticsResponse {
  series: AnalyticsSeriesPoint[];
  cashIn: number;
  cashOut: number;
  count: number;
}

export function useAnalytics(range: "7D" | "30D" | "90D" | "ALL") {
  const { data, isLoading } = useSWR<AnalyticsResponse>(`/api/analytics?range=${range}`, fetcher, {
    refreshInterval: 15000,
  });
  return { data, isLoading };
}
