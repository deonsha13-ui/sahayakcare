import { createContext, useContext, useEffect, useState } from "react";
import { visitService } from "@/services/visitService";
import { beneficiaryService } from "@/services/beneficiaryService";
import { followupService } from "@/services/followupService";
import {
  beneficiaries as mockBeneficiaries,
  initialVisits as mockVisits,
  initialFollowups as mockFollowups,
} from "@/mock/demo";

const Context = createContext(null);

const defaults = () => ({
  visits: mockVisits,
  beneficiaries: mockBeneficiaries,
  followups: mockFollowups,
  settings: {
    language: "Hindi",
    spokenAlerts: true,
    reminders: true,
    worker: "Sunita Devi",
    area: "Rampur · Block 04",
  },
  draft: null,
});

export function DemoProvider({ children }) {
  const [data, setData] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");

  // Load backend data on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [bens, visits, followups] = await Promise.all([
          beneficiaryService.list(),
          visitService.list(),
          followupService.list(),
        ]);
        setData((prev) => ({
          ...prev,
          beneficiaries: bens.length > 0 ? bens : prev.beneficiaries,
          visits: visits.length > 0 ? visits : prev.visits,
          followups: followups.length > 0 ? followups : prev.followups,
        }));
      } catch (err) {
        console.warn("Error loading backend data in DemoProvider:", err);
      } finally {
        setReady(true);
      }
    }
    loadBackendData();
  }, []);

  useEffect(() => {
    if (notice) {
      const timeout = setTimeout(() => setNotice(""), 3500);
      return () => clearTimeout(timeout);
    }
  }, [notice]);

  const updateSettings = (patch) =>
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));

  const setDraft = (draft) => setData((d) => ({ ...d, draft }));

  const refreshData = async () => {
    try {
      const [bens, visits, followups] = await Promise.all([
        beneficiaryService.list(),
        visitService.list(),
        followupService.list(),
      ]);
      setData((prev) => ({
        ...prev,
        beneficiaries: bens,
        visits,
        followups,
      }));
    } catch {}
  };

  const save = async (record) => {
    setData((d) => ({
      ...d,
      visits: [
        {
          ...record,
          id: `VIS-${Date.now()}`,
          date: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          status: "Confirmed",
          duration: "3:40",
        },
        ...d.visits,
      ],
      draft: null,
    }));
    setNotice("Visit confirmed and saved to official registry.");
    refreshData();
  };

  const updateFollowup = async (id, status, date) => {
    await followupService.update(id, status);
    setData((d) => ({
      ...d,
      followups: d.followups.map((row) =>
        row.id === id ? { ...row, status, ...(date ? { date } : {}) } : row
      ),
    }));
    setNotice(`Follow-up marked ${status.toLowerCase()}.`);
  };

  return (
    <Context.Provider
      value={{
        ...data,
        notice,
        notify: setNotice,
        updateSettings,
        setDraft,
        save,
        refreshData,
        updateFollowup,
        reset: () => {
          setData(defaults());
          setNotice("Demo data reset.");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useDemo() {
  return useContext(Context);
}
