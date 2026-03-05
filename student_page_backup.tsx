"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPublishedExams, type DbExam } from "@/lib/examService";
import { getProfile, signOut } from "@/lib/authService";
import { getSession } from "@/lib/authService";

function getUrgencyColor(duration: number | null): string {
  if (!duration) return "text-green-700";
  if (duration <= 30) return "text-red-600";
  if (duration <= 60) return "text-amber-600";
  return "text-green-700";
}

function formatDuration(minutes: number | null): string {
