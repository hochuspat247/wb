"use client";

import { useEffect } from "react";
import { reachGoal } from "@/lib/metrika";

export default function CabinetMetrikaGoal() {
  useEffect(() => {
    reachGoal("open_cabinet");
  }, []);

  return null;
}
