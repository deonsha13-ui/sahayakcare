import { House, Mic, ClipboardList, Users, CalendarCheck, History, Settings } from "lucide-react";
export const navigation = [
  { to: "/", label: "Home", icon: House },
  { to: "/live-visit", label: "Live Voice Visit", icon: Mic },
  { to: "/records", label: "Visit Records", icon: ClipboardList },
  { to: "/beneficiaries", label: "Beneficiary Profiles", icon: Users },
  { to: "/follow-ups", label: "Follow-up Management", icon: CalendarCheck },
  { to: "/history", label: "Session History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];
