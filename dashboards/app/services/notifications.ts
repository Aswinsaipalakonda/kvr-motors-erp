"use client";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  route: string;
  read: boolean;
  priority?: "high" | "normal";
  category?: string;
  details?: string;
  actionRoute?: string;
}

const STORAGE_PREFIX = "kvr_notifications_v2_";

export const getStoredNotifications = (role: string): AppNotification[] => {
  if (typeof window === "undefined") return [];
  try {
    const key = `${STORAGE_PREFIX}${role}`;
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    // Seed initial defaults only once if storage is brand new
    const initial = getDefaultNotificationsForRole(role);
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  } catch (e) {
    return [];
  }
};

export const addNotification = (role: string, title: string, message: string, route: string = "") => {
  if (typeof window === "undefined") return;
  try {
    const list = getStoredNotifications(role);
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      time: "Just now",
      timestamp: Date.now(),
      route,
      read: false,
    };
    const updated = [newNotif, ...list];
    localStorage.setItem(`${STORAGE_PREFIX}${role}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("notifications:updated", { detail: { role } }));
  } catch (e) {
    console.error("Failed adding notification:", e);
  }
};

export const markNotificationRead = (role: string, id: string): AppNotification[] => {
  if (typeof window === "undefined") return [];
  try {
    const list = getStoredNotifications(role);
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    localStorage.setItem(`${STORAGE_PREFIX}${role}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("notifications:updated", { detail: { role } }));
    return updated;
  } catch (e) {
    return [];
  }
};

export const markAllNotificationsRead = (role: string): AppNotification[] => {
  if (typeof window === "undefined") return [];
  try {
    const list = getStoredNotifications(role);
    const updated = list.map((n) => ({ ...n, read: true }));
    localStorage.setItem(`${STORAGE_PREFIX}${role}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("notifications:updated", { detail: { role } }));
    return updated;
  } catch (e) {
    return [];
  }
};

export const deleteNotification = (role: string, id: string): AppNotification[] => {
  if (typeof window === "undefined") return [];
  try {
    const list = getStoredNotifications(role);
    const updated = list.filter((n) => n.id !== id);
    localStorage.setItem(`${STORAGE_PREFIX}${role}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("notifications:updated", { detail: { role } }));
    return updated;
  } catch (e) {
    return [];
  }
};

export const clearAllNotifications = (role: string): AppNotification[] => {
  if (typeof window === "undefined") return [];
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${role}`, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("notifications:updated", { detail: { role } }));
    return [];
  } catch (e) {
    return [];
  }
};

function getDefaultNotificationsForRole(role: string): AppNotification[] {
  const now = Date.now();
  switch (role) {
    case "owner":
      return [
        { id: "init_1", title: "Branch Stock Alert", message: "Low vehicle stock reported at Visakhapatnam Godown", time: "Just now", timestamp: now, route: "/owner/stock", read: false },
        { id: "init_2", title: "Advance Booking", message: "New booking BK-8012 awaiting approval", time: "15m ago", timestamp: now - 900000, route: "/owner/bookings", read: false },
        { id: "init_3", title: "Daily Sales Reconciliation", message: "Visakhapatnam branch submitted daily sales ledger", time: "1h ago", timestamp: now - 3600000, route: "/owner/reports", read: false },
      ];
    case "supervisor":
      return [
        { id: "init_1", title: "Inter-Branch Transfer", message: "Stock transfer request TR-904 ready for dispatch", time: "5m ago", timestamp: now - 300000, route: "/supervisor/stock", read: false },
        { id: "init_2", title: "PDI Inspection Pending", message: "2 vehicle handovers scheduled for inspection", time: "20m ago", timestamp: now - 1200000, route: "/supervisor/vehicles", read: false },
        { id: "init_3", title: "Staff Attendance Logs", message: "Daily check-in logs submitted for verification", time: "1h ago", timestamp: now - 3600000, route: "/supervisor/attendance", read: false },
      ];
    case "staff":
      return [
        { id: "init_1", title: "PDI Check Scheduled", message: "Customer A. Srinivas handover checklist pending", time: "10m ago", timestamp: now - 600000, route: "/staff/pdi", read: false },
        { id: "init_2", title: "Battery Registry Sync", message: "Review FIFO battery serial tags for new stock", time: "45m ago", timestamp: now - 2700000, route: "/staff/batteries", read: false },
      ];
    case "sales":
      return [
        { id: "init_1", title: "New Lead Assigned", message: "High-intent lead assigned from Telecaller desk", time: "2m ago", timestamp: now - 120000, route: "/sales/leads", read: false },
        { id: "init_2", title: "Test Drive Follow-up", message: "Scheduled follow-up with customer Rajesh Kumar", time: "30m ago", timestamp: now - 1800000, route: "/sales/followups", read: false },
      ];
    case "telecaller":
      return [
        { id: "init_1", title: "Campaign Inquiries", message: "12 new website inquiry leads imported", time: "Just now", timestamp: now, route: "/telecaller/leads", read: false },
        { id: "init_2", title: "Callback Scheduled", message: "Customer requested callback for Kinetic E-Luna", time: "15m ago", timestamp: now - 900000, route: "/telecaller/leads", read: false },
      ];
    default:
      return [];
  }
}
