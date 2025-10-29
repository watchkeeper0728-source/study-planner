import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { EventT, ParticipantT } from "../lib/types";
import { calculateSplitBill } from "../lib/calc";
import { encodeEvent, decodeEvent, generateShareLink, generateShareCode } from "../lib/codecs";

// ストアの状態の型定義
interface StoreState {
  events: EventT[];
  currentEvent: EventT | null;
}

// ストアのアクションの型定義
interface StoreActions {
  // イベント管理
  addEvent: (event: Omit<EventT, "id" | "createdAt" | "updatedAt" | "results">) => string;
  updateEvent: (id: string, updates: Partial<EventT>) => void;
  removeEvent: (id: string) => void;
  duplicateEvent: (id: string) => string;
  getEvent: (id: string) => EventT | undefined;
  
  // 参加者管理
  addParticipant: (eventId: string, participant: Omit<ParticipantT, "id">) => void;
  updateParticipant: (eventId: string, participantId: string, updates: Partial<ParticipantT>) => void;
  removeParticipant: (eventId: string, participantId: string) => void;
  reorderParticipants: (eventId: string, fromIndex: number, toIndex: number) => void;
  
  // 計算
  calculateEvent: (eventId: string) => void;
  recalculateAllEvents: () => void;
  
  // 共有機能
  exportEventAsCode: (eventId: string) => string;
  exportEventAsLink: (eventId: string) => string;
  importEvent: (shareData: string) => string;
  
  // 現在のイベント管理
  setCurrentEvent: (event: EventT | null) => void;
  clearCurrentEvent: () => void;
  
  // ユーティリティ
  getEventsByDate: (sortOrder?: "asc" | "desc") => EventT[];
  getEventsByTotal: (sortOrder?: "asc" | "desc") => EventT[];
  getEventsByParticipantCount: (sortOrder?: "asc" | "desc") => EventT[];
  searchEvents: (query: string) => EventT[];
  getEventSummary: () => {
    totalEvents: number;
    totalAmount: number;
    averageAmount: number;
    totalParticipants: number;
    averageParticipants: number;
  };
}

// ストアの型定義
type Store = StoreState & StoreActions;

// デフォルトの参加者を作成
const createDefaultParticipant = (name: string): ParticipantT => ({
  id: nanoid(),
  name,
  weight: 1.0,
});

// デフォルトのイベントを作成
const createDefaultEvent = (): Omit<EventT, "id" | "createdAt" | "updatedAt" | "results"> => ({
  title: "未タイトル",
  total: 0,
  participants: [],
  roundUnit: 1,
  roundMode: "round",
  remainderMode: "largest_remainder",
});

// Zustandストアの作成
export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // 初期状態
      events: [],
      currentEvent: null,

      // イベント管理
      addEvent: (eventData) => {
        const id = nanoid();
        const now = new Date().toISOString();
        const newEvent: EventT = {
          ...eventData,
          id,
          createdAt: now,
          updatedAt: now,
          results: [],
        };
        
        // 計算を実行
        newEvent.results = calculateSplitBill(newEvent);
        
        set((state) => ({
          events: [newEvent, ...state.events].slice(0, 100), // 最新100件まで保持
        }));
        
        return id;
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((event) => {
            if (event.id === id) {
              const updatedEvent = {
                ...event,
                ...updates,
                updatedAt: new Date().toISOString(),
              };
              // 計算を再実行
              updatedEvent.results = calculateSplitBill(updatedEvent);
              return updatedEvent;
            }
            return event;
          }),
        }));
      },

      removeEvent: (id) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
          currentEvent: state.currentEvent?.id === id ? null : state.currentEvent,
        }));
      },

      duplicateEvent: (id) => {
        const event = get().events.find((e) => e.id === id);
        if (!event) {
          throw new Error("イベントが見つかりません");
        }

        const newId = nanoid();
        const now = new Date().toISOString();
        const duplicatedEvent: EventT = {
          ...event,
          id: newId,
          title: `${event.title} (コピー)`,
          createdAt: now,
          updatedAt: now,
          results: [],
        };
        
        // 計算を実行
        duplicatedEvent.results = calculateSplitBill(duplicatedEvent);
        
        set((state) => ({
          events: [duplicatedEvent, ...state.events].slice(0, 100),
        }));
        
        return newId;
      },

      getEvent: (id) => {
        return get().events.find((event) => event.id === id);
      },

      // 参加者管理
      addParticipant: (eventId, participantData) => {
        const participant: ParticipantT = {
          ...participantData,
          id: nanoid(),
        };
        
        set((state) => ({
          events: state.events.map((event) => {
            if (event.id === eventId) {
              const updatedEvent = {
                ...event,
                participants: [...event.participants, participant],
                updatedAt: new Date().toISOString(),
              };
              // 計算を再実行
              updatedEvent.results = calculateSplitBill(updatedEvent);
              return updatedEvent;
            }
            return event;
          }),
        }));
      },

      updateParticipant: (eventId, participantId, updates) => {
        set((state) => ({
          events: state.events.map((event) => {
            if (event.id === eventId) {
              const updatedEvent = {
                ...event,
                participants: event.participants.map((participant) => {
                  if (participant.id === participantId) {
                    return { ...participant, ...updates };
                  }
                  return participant;
                }),
                updatedAt: new Date().toISOString(),
              };
              // 計算を再実行
              updatedEvent.results = calculateSplitBill(updatedEvent);
              return updatedEvent;
            }
            return event;
          }),
        }));
      },

      removeParticipant: (eventId, participantId) => {
        set((state) => ({
          events: state.events.map((event) => {
            if (event.id === eventId) {
              const updatedEvent = {
                ...event,
                participants: event.participants.filter((p) => p.id !== participantId),
                updatedAt: new Date().toISOString(),
              };
              // 計算を再実行
              updatedEvent.results = calculateSplitBill(updatedEvent);
              return updatedEvent;
            }
            return event;
          }),
        }));
      },

      reorderParticipants: (eventId, fromIndex, toIndex) => {
        set((state) => ({
          events: state.events.map((event) => {
            if (event.id === eventId) {
              const participants = [...event.participants];
              const [moved] = participants.splice(fromIndex, 1);
              participants.splice(toIndex, 0, moved);
              
              const updatedEvent = {
                ...event,
                participants,
                updatedAt: new Date().toISOString(),
              };
              // 計算を再実行
              updatedEvent.results = calculateSplitBill(updatedEvent);
              return updatedEvent;
            }
            return event;
          }),
        }));
      },

      // 計算
      calculateEvent: (eventId) => {
        set((state) => ({
          events: state.events.map((event) => {
            if (event.id === eventId) {
              const updatedEvent = {
                ...event,
                results: calculateSplitBill(event),
                updatedAt: new Date().toISOString(),
              };
              return updatedEvent;
            }
            return event;
          }),
        }));
      },

      recalculateAllEvents: () => {
        set((state) => ({
          events: state.events.map((event) => ({
            ...event,
            results: calculateSplitBill(event),
            updatedAt: new Date().toISOString(),
          })),
        }));
      },

      // 共有機能
      exportEventAsCode: (eventId) => {
        const event = get().events.find((e) => e.id === eventId);
        if (!event) {
          throw new Error("イベントが見つかりません");
        }
        return generateShareCode(event);
      },

      exportEventAsLink: (eventId) => {
        const event = get().events.find((e) => e.id === eventId);
        if (!event) {
          throw new Error("イベントが見つかりません");
        }
        return generateShareLink(event);
      },

      importEvent: (shareData) => {
        try {
          const event = decodeEvent(shareData);
          const newId = nanoid();
          const now = new Date().toISOString();
          
          const importedEvent: EventT = {
            ...event,
            id: newId,
            title: `${event.title} (インポート)`,
            createdAt: now,
            updatedAt: now,
            results: calculateSplitBill(event),
          };
          
          set((state) => ({
            events: [importedEvent, ...state.events].slice(0, 100),
          }));
          
          return newId;
        } catch (error) {
          throw new Error("イベントデータのインポートに失敗しました");
        }
      },

      // 現在のイベント管理
      setCurrentEvent: (event) => {
        set({ currentEvent: event });
      },

      clearCurrentEvent: () => {
        set({ currentEvent: null });
      },

      // ユーティリティ
      getEventsByDate: (sortOrder = "desc") => {
        const events = [...get().events];
        return events.sort((a, b) => {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });
      },

      getEventsByTotal: (sortOrder = "desc") => {
        const events = [...get().events];
        return events.sort((a, b) => {
          return sortOrder === "asc" ? a.total - b.total : b.total - a.total;
        });
      },

      getEventsByParticipantCount: (sortOrder = "desc") => {
        const events = [...get().events];
        return events.sort((a, b) => {
          const countA = a.participants.length;
          const countB = b.participants.length;
          return sortOrder === "asc" ? countA - countB : countB - countA;
        });
      },

      searchEvents: (query) => {
        const events = get().events;
        const lowerQuery = query.toLowerCase();
        return events.filter((event) => 
          event.title.toLowerCase().includes(lowerQuery) ||
          event.participants.some((p) => p.name.toLowerCase().includes(lowerQuery))
        );
      },

      getEventSummary: () => {
        const events = get().events;
        const totalEvents = events.length;
        const totalAmount = events.reduce((sum, event) => sum + event.total, 0);
        const totalParticipants = events.reduce((sum, event) => sum + event.participants.length, 0);
        
        return {
          totalEvents,
          totalAmount,
          averageAmount: totalEvents > 0 ? Math.round(totalAmount / totalEvents) : 0,
          totalParticipants,
          averageParticipants: totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0,
        };
      },
    }),
    {
      name: "splitfair/v1",
      partialize: (state) => ({
        events: state.events,
      }),
    }
  )
);

// 便利なフック
export const useEvents = () => useStore((state) => state.events);
export const useCurrentEvent = () => useStore((state) => state.currentEvent);
export const useEventActions = () => useStore((state) => ({
  addEvent: state.addEvent,
  updateEvent: state.updateEvent,
  removeEvent: state.removeEvent,
  duplicateEvent: state.duplicateEvent,
  getEvent: state.getEvent,
}));
export const useParticipantActions = () => useStore((state) => ({
  addParticipant: state.addParticipant,
  updateParticipant: state.updateParticipant,
  removeParticipant: state.removeParticipant,
  reorderParticipants: state.reorderParticipants,
}));
export const useCalculationActions = () => useStore((state) => ({
  calculateEvent: state.calculateEvent,
  recalculateAllEvents: state.recalculateAllEvents,
}));
export const useShareActions = () => useStore((state) => ({
  exportEventAsCode: state.exportEventAsCode,
  exportEventAsLink: state.exportEventAsLink,
  importEvent: state.importEvent,
}));

