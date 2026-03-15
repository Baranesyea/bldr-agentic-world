export interface TrialStatus {
  isOnTrial: boolean;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export interface TrialInfo {
  code: string;
  startDate: string;
  durationDays: number;
  active: boolean;
}

export function checkTrialStatus(): TrialStatus {
  if (typeof window === "undefined") {
    return { isOnTrial: false, daysRemaining: 0, isExpired: false, isExpiringSoon: false };
  }

  const raw = localStorage.getItem("bldr_trial");
  if (!raw) {
    return { isOnTrial: false, daysRemaining: 0, isExpired: false, isExpiringSoon: false };
  }

  try {
    const trial: TrialInfo = JSON.parse(raw);
    if (!trial.active) {
      return { isOnTrial: false, daysRemaining: 0, isExpired: true, isExpiringSoon: false };
    }

    const start = new Date(trial.startDate);
    const end = new Date(start.getTime() + trial.durationDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const msRemaining = end.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

    if (daysRemaining <= 0) {
      return { isOnTrial: true, daysRemaining: 0, isExpired: true, isExpiringSoon: false };
    }

    return {
      isOnTrial: true,
      daysRemaining,
      isExpired: false,
      isExpiringSoon: daysRemaining <= 3,
    };
  } catch {
    return { isOnTrial: false, daysRemaining: 0, isExpired: false, isExpiringSoon: false };
  }
}
