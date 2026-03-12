import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Tab {
    id: string;
    label: string;
    href: string;
    icon: string;
}

interface TabState {
    tabs: Tab[];
    activeTabId: string | null;
    addTab: (tab: Tab) => void;
    removeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    clearTabs: () => void;
}

export const useTabStore = create<TabState>()(
    persist(
        (set) => ({
            tabs: [],
            activeTabId: null,
            addTab: (tab) => set((state) => {
                const exists = state.tabs.find((t) => t.href === tab.href);
                if (exists) {
                    return { activeTabId: exists.id };
                }
                const newTabs = [...state.tabs, tab];
                return { tabs: newTabs, activeTabId: tab.id };
            }),
            removeTab: (id) => set((state) => {
                const newTabs = state.tabs.filter((t) => t.id !== id);
                let newActiveId = state.activeTabId;
                if (state.activeTabId === id) {
                    newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
                }
                return { tabs: newTabs, activeTabId: newActiveId };
            }),
            setActiveTab: (id) => set({ activeTabId: id }),
            clearTabs: () => set({ tabs: [], activeTabId: null }),
        }),
        {
            name: 'dashboard-tabs',
        }
    )
);
