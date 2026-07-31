"use client";

import { useEffect, useState } from "react";
import {
  computeDeadlineFromDate,
  type ComputedDeadline,
} from "./deadline";

export {
  computeDeadlineFromDate,
  type ComputedDeadline,
  type DeadlineUrgency,
} from "./deadline";

export function useDeadlineCountdown(deadlineDate: string): ComputedDeadline {
  const [computed, setComputed] = useState(() =>
    computeDeadlineFromDate(deadlineDate),
  );

  useEffect(() => {
    const tick = () => setComputed(computeDeadlineFromDate(deadlineDate));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [deadlineDate]);

  return computed;
}
