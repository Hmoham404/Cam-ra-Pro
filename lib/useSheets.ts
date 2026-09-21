"use client";
import { useCallback, useEffect, useState } from "react";
import type { SavedSheet } from "@/types/production";
import { getSheets } from "./storage";
export function useSheets() {
  const [sheets, setSheets] = useState<SavedSheet[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      setSheets(await getSheets());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    window.addEventListener("sheets-updated", refresh);
    return () => window.removeEventListener("sheets-updated", refresh);
  }, [refresh]);
  return { sheets, loading, error, refresh };
}
