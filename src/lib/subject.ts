import { Subject } from "@prisma/client";

export const SUBJECT_CONFIG = {
  MATH: {
    label: "算数",
    color: "indigo",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200",
  },
  JAPANESE: {
    label: "国語",
    color: "rose",
    bgColor: "bg-rose-50",
    textColor: "text-rose-700",
    borderColor: "border-rose-200",
  },
  SCIENCE: {
    label: "理科",
    color: "emerald",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  SOCIAL: {
    label: "社会",
    color: "amber",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
  },
} as const;

export function getSubjectConfig(subject: Subject) {
  return SUBJECT_CONFIG[subject];
}

export function getSubjectColor(subject: Subject): string {
  return SUBJECT_CONFIG[subject].color;
}

export function getSubjectLabel(subject: Subject): string {
  return SUBJECT_CONFIG[subject].label;
}