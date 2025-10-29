"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { ja } from "date-fns/locale";
import { Subject, StudyLog } from "@prisma/client";
import { getSubjectConfig } from "@/lib/subject";

interface StudyTimeBarProps {
  logs: StudyLog[];
}

type TimeRange = "day" | "week" | "month";

interface ChartData {
  name: string;
  [key: string]: string | number;
}

export function StudyTimeBar({ logs }: StudyTimeBarProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [selectedSubject, setSelectedSubject] = useState<Subject | "all">("all");

  const subjects: Subject[] = ["MATH", "JAPANESE", "SCIENCE", "SOCIAL"];

  const generateChartData = (): ChartData[] => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let intervalDates: Date[];

    switch (timeRange) {
      case "day":
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        intervalDates = eachDayOfInterval({ start: startDate, end: endDate });
        break;
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        intervalDates = eachDayOfInterval({ start: startDate, end: endDate });
        break;
      case "month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        intervalDates = eachWeekOfInterval({ start: startDate, end: endDate });
        break;
    }

    const filteredLogs = selectedSubject === "all" 
      ? logs 
      : logs.filter(log => log.subject === selectedSubject);

    return intervalDates.map(date => {
      const data: ChartData = {
        name: format(date, timeRange === "day" ? "HH:mm" : timeRange === "week" ? "M/d" : "M/d", { locale: ja }),
      };

      if (selectedSubject === "all") {
        subjects.forEach(subject => {
          const subjectLogs = filteredLogs.filter(log => 
            log.subject === subject && 
            format(new Date(log.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
          );
          data[getSubjectConfig(subject).label] = subjectLogs.reduce((sum, log) => sum + log.minutes, 0);
        });
      } else {
        const dayLogs = filteredLogs.filter(log => 
          format(new Date(log.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
        );
        data[getSubjectConfig(selectedSubject).label] = dayLogs.reduce((sum, log) => sum + log.minutes, 0);
      }

      return data;
    });
  };

  const chartData = generateChartData();

  const getTotalMinutes = () => {
    const filteredLogs = selectedSubject === "all" 
      ? logs 
      : logs.filter(log => log.subject === selectedSubject);
    
    return filteredLogs.reduce((sum, log) => sum + log.minutes, 0);
  };

  const totalMinutes = getTotalMinutes();
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const getSubjectColors = () => {
    const colors: { [key: string]: string } = {};
    subjects.forEach(subject => {
      const config = getSubjectConfig(subject);
      colors[config.label] = `var(--${config.color}-500)`;
    });
    return colors;
  };

  const subjectColors = getSubjectColors();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" aria-label="学習時間グラフ">
          学習時間グラフ
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            合計: {hours}時間{minutes}分
          </div>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">日別</SelectItem>
              <SelectItem value="week">週別</SelectItem>
              <SelectItem value="month">月別</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSubject} onValueChange={(value) => setSelectedSubject(value as Subject | "all")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全科目</SelectItem>
              {subjects.map(subject => {
                const config = getSubjectConfig(subject);
                return (
                  <SelectItem key={subject} value={subject}>
                    {config.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {timeRange === "day" ? "今日" : timeRange === "week" ? "今週" : "今月"}の学習時間
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value}分`, ""]}
                  labelFormatter={(label) => `時間: ${label}`}
                />
                {selectedSubject === "all" ? (
                  subjects.map(subject => {
                    const config = getSubjectConfig(subject);
                    return (
                      <Bar
                        key={subject}
                        dataKey={config.label}
                        stackId="a"
                        fill={subjectColors[config.label]}
                        name={config.label}
                      />
                    );
                  })
                ) : (
                  <Bar
                    dataKey={getSubjectConfig(selectedSubject).label}
                    fill={subjectColors[getSubjectConfig(selectedSubject).label]}
                    name={getSubjectConfig(selectedSubject).label}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 科目別集計 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">科目別集計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subjects.map(subject => {
              const config = getSubjectConfig(subject);
              const subjectLogs = logs.filter(log => log.subject === subject);
              const subjectMinutes = subjectLogs.reduce((sum, log) => sum + log.minutes, 0);
              const subjectHours = Math.floor(subjectMinutes / 60);
              const subjectMinutesRemainder = subjectMinutes % 60;
              
              return (
                <div key={subject} className={`p-4 rounded-lg ${config.bgColor}`}>
                  <div className="text-sm font-medium text-gray-600">{config.label}</div>
                  <div className={`text-2xl font-bold ${config.textColor}`}>
                    {subjectHours}h {subjectMinutesRemainder}m
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}