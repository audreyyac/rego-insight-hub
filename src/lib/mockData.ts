export type Profile = {
  id: string;
  name: string;
  deviceClass: "I" | "II" | "III";
  market: string;
  status: "Active" | "Draft" | "Under review";
  updated: string;
  documents: number;
};

export const profiles: Profile[] = [
  { id: "p1", name: "Cardiac Monitor X1", deviceClass: "II", market: "FDA · CE", status: "Active", updated: "2 days ago", documents: 14 },
  { id: "p2", name: "InsulinPump Pro", deviceClass: "III", market: "FDA", status: "Under review", updated: "5 hours ago", documents: 22 },
  { id: "p3", name: "Glucose Sensor G2", deviceClass: "II", market: "CE · PMDA", status: "Active", updated: "1 week ago", documents: 9 },
  { id: "p4", name: "OrthoScan Imaging", deviceClass: "II", market: "FDA", status: "Draft", updated: "3 weeks ago", documents: 4 },
];

export type AlertItem = {
  id: string;
  title: string;
  source: string;
  severity: "risk" | "watch" | "advantage";
  date: string;
  profile: string;
};

export const alerts: AlertItem[] = [
  { id: "a1", title: "FDA issues final guidance on cybersecurity in medical devices", source: "FDA · Guidance", severity: "watch", date: "Mar 12", profile: "Cardiac Monitor X1" },
  { id: "a2", title: "EU MDR Annex II clarification affects Class III submissions", source: "EU Commission", severity: "risk", date: "Mar 10", profile: "InsulinPump Pro" },
  { id: "a3", title: "510(k) pathway expanded for AI/ML enabled devices", source: "FDA · CDRH", severity: "advantage", date: "Mar 08", profile: "Glucose Sensor G2" },
  { id: "a4", title: "PMDA accepting eSTAR format submissions starting Q3", source: "PMDA Japan", severity: "advantage", date: "Mar 04", profile: "Glucose Sensor G2" },
  { id: "a5", title: "MDR vigilance reporting timeline reduced to 10 days", source: "EU Commission", severity: "watch", date: "Feb 28", profile: "Cardiac Monitor X1" },
];
