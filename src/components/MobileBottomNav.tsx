"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, BarChart3, BookOpen, TestTube, Clock, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "ホーム",
      icon: Calendar,
    },
    {
      href: "/review",
      label: "レビュー",
      icon: BookOpen,
    },
    {
      href: "/logs",
      label: "学習記録",
      icon: Clock,
    },
    {
      href: "/analytics",
      label: "分析",
      icon: BarChart3,
    },
    {
      href: "/tests",
      label: "テスト",
      icon: TestTube,
    },
    {
      href: "/past-exams",
      label: "過去問",
      icon: GraduationCap,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
      <div className="grid grid-cols-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-1 text-xs",
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900"
              )}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}