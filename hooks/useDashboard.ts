"use client";

import { useMemo, useState } from "react";

export function useDashboard() {
  const [loading] = useState(false);

  const ready = useMemo(() => !loading, [loading]);

  return {
    loading,
    ready,
  };
}