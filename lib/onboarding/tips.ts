export const TIPS = {
  WELCOME_MODAL: "welcome_modal_v1",
  DASHBOARD_XP_BAR: "dashboard_xp_bar",
  DASHBOARD_STREAK: "dashboard_streak",
  TRANSACTIONS_FAB: "transactions_fab",
  WALLETS_ADD_SECOND: "wallets_add_second",
  BUDGETS_FIRST: "budgets_first",
  ACHIEVEMENTS_PANEL: "achievements_panel",
} as const;

export type TipId = (typeof TIPS)[keyof typeof TIPS];
