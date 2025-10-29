"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, BarChart3, BookOpen, TestTube, Clock, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function SideNav() {
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
    <aside className="hidden md:flex md:flex-col md:w-32 md:bg-white md:border-r md:h-screen md:fixed md:left-0 md:top-16">
      <nav className="flex flex-col p-2 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center px-2 py-3 rounded-lg transition-colors",
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="h-6 w-6" />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

