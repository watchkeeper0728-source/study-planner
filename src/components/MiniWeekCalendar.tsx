"use client";

import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput } from "@fullcalendar/core";
import { format, startOfWeek, addDays } from "date-fns";
import { ja } from "date-fns/locale";
import { generateWeekTimeBlocks } from "@/lib/timeblocks";
import { getSubjectConfig } from "@/lib/subject";
import { Subject } from "@prisma/client";

function getColor(colorName: string, shade: string): string {
  const colorMap: { [key: string]: { [key: string]: string } } = {
    indigo: {
      "500": "#6366f1",
      "600": "#4f46e5",
    },
    rose: {
      "500": "#f43f5e",
      "600": "#e11d48",
    },
    emerald: {
      "500": "#10b981",
      "600": "#059669",
    },
    amber: {
      "500": "#f59e0b",
      "600": "#d97706",
    },
  };
  return colorMap[colorName]?.[shade] || "#6b7280";
}

interface Plan {
  id: string;
  title: string;
  start: Date;
  end: Date;
  subject: Subject;
}

interface MiniWeekCalendarProps {
  plans: Plan[];
  onPlanCreate: (plan: { title: string; start: string; end: string; subject: Subject }) => void;
  onPlanUpdate: (id: string, updates: { start?: string; end?: string; title?: string }) => void;
  onPlanDelete: (id: string) => void;
  onPlanDeleteAll?: () => void;
  onPlanComplete?: (plan: { id: string; title: string; start: Date; end: Date; subject: Subject }) => void;
}

export function MiniWeekCalendar({ 
  plans, 
  onPlanCreate, 
  onPlanUpdate, 
  onPlanDelete,
  onPlanDeleteAll,
  onPlanComplete
}: MiniWeekCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [completedPlanIds, setCompletedPlanIds] = useState<Set<string>>(new Set());

  const events: EventInput[] = plans
    .filter(plan => plan.subject !== undefined && plan.subject !== null)
    .map(plan => {
      try {
        const subjectConfig = getSubjectConfig(plan.subject);
        const startDate = typeof plan.start === 'string' ? new Date(plan.start) : plan.start;
        const endDate = typeof plan.end === 'string' ? new Date(plan.end) : plan.end;
        const isCompleted = completedPlanIds.has(plan.id);
        
        return {
          id: plan.id,
          title: plan.title,
          start: startDate,
          end: endDate,
          backgroundColor: isCompleted ? "#9CA3AF" : getColor(subjectConfig.color, "500"),
          borderColor: isCompleted ? "#6B7280" : getColor(subjectConfig.color, "600"),
          textColor: "white",
          extendedProps: {
            subject: plan.subject,
            isCompleted,
          },
        };
      } catch (error) {
        console.error("Plan rendering error:", error, plan);
        // エラーが発生した場合はスキップ
        return null;
      }
    })
    .filter((event): event is NonNullable<typeof event> => event !== null);

  const backgroundEvents = generateWeekTimeBlocks(startOfWeek(currentWeek, { weekStartsOn: 1 }));

  const handleDateSelect = (selectInfo: any) => {
    const { start, end } = selectInfo;
    const title = prompt("予定のタイトルを入力してください:");
    
    if (title) {
      onPlanCreate({
        title,
        start: start.toISOString(),
        end: end.toISOString(),
        subject: "MATH", // デフォルト科目
      });
    }
    
    calendarRef.current?.getApi().unselect();
  };

  const handleEventChange = (changeInfo: any) => {
    const event = changeInfo.event;
    onPlanUpdate(event.id, {
      start: event.start?.toISOString(),
      end: event.end?.toISOString(),
    });
  };

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    const planId = event.id;
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) return;
    
    // 選択した予定を表示
    setSelectedPlan(plan);
  };

  const handleComplete = () => {
    if (selectedPlan && onPlanComplete) {
      // 完了状態を記録
      setCompletedPlanIds(prev => new Set(prev).add(selectedPlan.id));
      
      onPlanComplete({
        id: selectedPlan.id,
        title: selectedPlan.title,
        start: selectedPlan.start,
        end: selectedPlan.end,
        subject: selectedPlan.subject,
      });
      setSelectedPlan(null);
    }
  };

  const handleDelete = () => {
    if (selectedPlan) {
      onPlanDelete(selectedPlan.id);
      setSelectedPlan(null);
    }
  };

  // ネイティブのドラッグ&ドロップを処理
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const calendarEl = (api as any).el as HTMLElement | undefined;
    if (!calendarEl) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      
      try {
        const dragData = JSON.parse(e.dataTransfer!.getData('text/plain'));
        console.log("Dropped data:", dragData);
        
        if (!dragData.title || !dragData.subject) {
          console.log("Invalid drag data");
          return;
        }
        
        // カレンダーAPIから座標情報を取得
        const calendarApi = calendarRef.current?.getApi();
        if (!calendarApi) {
          console.log("Calendar API not available");
          return;
        }
        
        // カレンダー要素の位置を取得
        const calendarElRect = calendarEl.getBoundingClientRect();
        const x = e.clientX - calendarElRect.left;
        const y = e.clientY - calendarElRect.top;
        
        console.log("Drop coordinates:", x, y);
        
        // X座標から曜日を取得（週間ビューなので）
        const dayWidth = calendarElRect.width / 7; // 7日分の幅
        const dayIndex = Math.floor(x / dayWidth);
        
        // Y座標から曜日の列を見つける
        const weekDayEls = document.querySelectorAll('.fc-col-header-cell');
        const dateElements = document.querySelectorAll('[data-date]');
        console.log("Date elements found:", dateElements.length);
        
        // 日付を取得
        const view = calendarApi.view;
        const viewStart = view.activeStart;
        const targetDate = new Date(viewStart);
        targetDate.setDate(targetDate.getDate() + dayIndex);
        
        console.log("Target date:", targetDate);
        
        // Y座標から時刻を計算（ヘッダー高さを考慮）
        const headerEl = document.querySelector('.fc-col-header') as HTMLElement;
        const headerHeight = headerEl?.offsetHeight || 0;
        const gridHeight = calendarElRect.height - headerHeight;
        const relativeY = y - headerHeight;
        
        // Y座標から時刻を正確に計算
        // FullCalendarのtimeGridは各時間を分割して表示している
        // slotDuration="01:00:00"なので、1時間単位で計算
        const hourHeight = gridHeight / 17; // 6:00-23:00の17時間
        
        // どの時間帯に入っているかを判断
        // relativeYをhourHeightで割って、どの時間帯（0-16）に入っているか計算
        const timeSlotIndex = Math.floor(relativeY / hourHeight);
        
        // 時間帯が0から16の範囲内かチェック
        if (timeSlotIndex < 0 || timeSlotIndex > 16) {
          console.log("Time slot out of range:", timeSlotIndex);
          return;
        }
        
        // 6時からの時間を計算（6:00-22:00）
        const hours = 6 + timeSlotIndex;
        const minutes = 0; // 常に0分（1時間の始まり）
        
        // 23時の範囲外チェック
        if (hours > 23) {
          console.log("Time out of range:", hours, minutes);
          return;
        }
        
        console.log("Calculated time:", hours, ":", minutes, "from timeSlotIndex:", timeSlotIndex, "relativeY:", relativeY, "hourHeight:", hourHeight);
        
        const start = new Date(targetDate);
        start.setHours(hours, minutes, 0, 0);
        
        const end = new Date(start.getTime() + dragData.duration * 60000);
        
        console.log("Creating plan:", dragData.title, "at", start);
        
        onPlanCreate({
          title: dragData.title,
          start: start.toISOString(),
          end: end.toISOString(),
          subject: dragData.subject,
        });
      } catch (error) {
        console.error("Drop error:", error);
      }
    };

    calendarEl.addEventListener('dragover', handleDragOver);
    calendarEl.addEventListener('drop', handleDrop);

    return () => {
      calendarEl.removeEventListener('dragover', handleDragOver);
      calendarEl.removeEventListener('drop', handleDrop);
    };
  }, [onPlanCreate]);

  const handleEventReceive = (dropInfo: any) => {
    // FullCalendarのDraggableからのドロップはこちらで処理
    console.log("Event Receive:", dropInfo);
    
    const event = dropInfo.event;
    const extendedProps = event.extendedProps as any;
    
    const title = extendedProps?.title || event.title;
    const duration = extendedProps?.duration || '60';
    const subject = extendedProps?.subject || 'MATH';
    
    const start = dropInfo.event.start;
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + parseInt(duration));
    
    onPlanCreate({
      title: title,
      start: start.toISOString(),
      end: end.toISOString(),
      subject: subject as Subject,
    });
    
    event.remove();
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    calendarRef.current?.getApi().gotoDate(today);
  };

  const goToPreviousWeek = () => {
    const newWeek = addDays(currentWeek, -7);
    setCurrentWeek(newWeek);
    calendarRef.current?.getApi().prev();
  };

  const goToNextWeek = () => {
    const newWeek = addDays(currentWeek, 7);
    setCurrentWeek(newWeek);
    calendarRef.current?.getApi().next();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full calendar-container">
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="text-base font-semibold" aria-label="週間カレンダー">
          {format(currentWeek, "M月d日", { locale: ja })}週
        </h2>
        <div className="flex gap-1.5 items-center">
          {onPlanDeleteAll && plans.length > 0 && (
            <button
              onClick={onPlanDeleteAll}
              className="px-2 py-1 text-xs bg-red-500 text-white hover:bg-red-600 rounded"
              aria-label="すべての予定を削除"
              title="すべての予定を削除"
            >
              全削除
            </button>
          )}
          <button
            onClick={goToPreviousWeek}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            aria-label="前の週"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded"
            aria-label="今週に戻る"
          >
            今日
          </button>
          <button
            onClick={goToNextWeek}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            aria-label="次の週"
          >
            →
          </button>
          <button
            onClick={handlePrint}
            className="px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded"
            aria-label="印刷"
            title="印刷"
          >
            📄 印刷
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-2">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={false}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          slotDuration="01:00:00"
          slotLabelInterval="01:00:00"
          events={[...events, ...backgroundEvents]}
          selectable={true}
          selectMirror={true}
          editable={true}
          droppable={true}
          select={handleDateSelect}
          eventChange={handleEventChange}
          eventClick={handleEventClick}
          eventReceive={handleEventReceive}
          locale="ja"
          firstDay={1}
          dayHeaderFormat={{ weekday: "short" }}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          displayEventTime={false}
          allDaySlot={false}
          nowIndicator={true}
          weekends={true}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
        />
      </div>

      {/* 予定選択モーダル */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">予定の操作</h3>
            <p className="text-gray-700 mb-2">
              <strong>タイトル:</strong> {selectedPlan.title}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>時間:</strong> {format(selectedPlan.start, "M月d日 HH:mm", { locale: ja })} - {format(selectedPlan.end, "HH:mm", { locale: ja })}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleComplete}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                完了
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                削除
              </button>
              <button
                onClick={() => setSelectedPlan(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}