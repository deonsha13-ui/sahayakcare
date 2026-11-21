export const beneficiaries = [
  {
    id: "BEN-1042",
    name: "Priya Sharma",
    age: "26 years",
    type: "ANC Home Visit",
    village: "Rampur",
    initials: "PS",
    gestation: "28 weeks",
    weight: "56 kg",
    bp: "118/76 mmHg",
    last: "06 Nov 2026",
    next: "20 Nov 2026",
  },
  {
    id: "BEN-1043",
    name: "Baby of Meena Devi",
    age: "12 days",
    type: "Newborn Visit",
    village: "Rampur",
    initials: "MD",
    weight: "2.6 kg",
    last: "10 Nov 2026",
    next: "14 Nov 2026",
  },
  {
    id: "BEN-1038",
    name: "Anjali Verma",
    age: "24 years",
    type: "ANC Home Visit",
    village: "Chandpur",
    initials: "AV",
    gestation: "32 weeks",
    weight: "59 kg",
    bp: "120/80 mmHg",
    last: "11 Nov 2026",
    next: "13 Nov 2026",
  },
  {
    id: "BEN-1035",
    name: "Baby of Sunita",
    age: "6 days",
    type: "Newborn Visit",
    village: "Chandpur",
    initials: "BS",
    weight: "3.1 kg",
    last: "12 Nov 2026",
    next: "13 Nov 2026",
  },
  {
    id: "BEN-1029",
    name: "Kavita Singh",
    age: "29 years",
    type: "ANC Home Visit",
    village: "Rampur",
    initials: "KS",
    gestation: "24 weeks",
    weight: "54 kg",
    bp: "116/74 mmHg",
    last: "09 Nov 2026",
    next: "16 Nov 2026",
  },
];
export const initialVisits = beneficiaries.map((b, i) => ({
  id: `VIS-00${i + 1}`,
  beneficiary: b.id,
  name: b.name,
  type: b.type,
  date: b.last,
  weight: b.weight,
  vaccinations: i % 2 ? "BCG, OPV-0" : "TT dose 2",
  next: b.next,
  age: b.age,
  gestation: b.gestation || "Not applicable",
  bp: b.bp || "Not applicable",
  tt: b.type.startsWith("ANC") ? "Dose 1 completed" : "Not applicable",
  danger: false,
  status: "Confirmed",
  duration: `${6 + i}:24`,
}));
export const initialFollowups = beneficiaries
  .slice(1)
  .map((b, i) => ({
    id: `FU-${i}`,
    name: b.name,
    beneficiary: b.id,
    type: b.type,
    date: b.next,
    village: b.village,
    status: i === 2 ? "Completed" : "Upcoming",
    priority: i === 0 ? "High" : "Routine",
  }));
export const scenarios = [
  {
    id: "anc",
    title: "ANC Home Visit",
    subtitle: "A healthier pregnancy, one visit at a time.",
    tag: "MATERNAL CARE",
    icon: "heart",
    person: "Priya Sharma",
    type: "ANC Home Visit",
  },
  {
    id: "newborn",
    title: "Newborn Visit",
    subtitle: "A gentle check-in for the newest arrival.",
    tag: "NEWBORN CARE",
    icon: "baby",
    person: "Baby of Meena Devi",
    type: "Newborn Visit",
  },
  {
    id: "bleeding",
    title: "Danger Sign",
    subtitle: "Recognise a concern. Make a timely referral.",
    tag: "PRIORITY CARE",
    icon: "shield",
    person: "Priya Sharma",
    type: "ANC Home Visit",
  },
];
export const fieldLabels = {
  beneficiary: "Beneficiary ID",
  name: "Name",
  age: "Age",
  type: "Visit type",
  weight: "Weight",
  vaccinations: "Vaccinations due",
  next: "Next visit date",
  gestation: "Gestation",
  bp: "Blood pressure",
  tt: "TT dose",
};
export const mandatoryFields = [
  "beneficiary",
  "name",
  "age",
  "type",
  "weight",
  "vaccinations",
  "next",
];
export function makeSteps(scenario) {
  const baby = scenario === "newborn" || scenario === "fever";
  return [
    {
      worker: baby
        ? "This is baby of Meena Devi, beneficiary BEN-1043, 12 days old."
        : "Visiting Priya Sharma, beneficiary BEN-1042, age 26, 28 weeks pregnant.",
      agent: "Beneficiary identified. What is the visit type?",
      values: {
        beneficiary: baby ? "BEN-1043" : "BEN-1042",
        name: baby ? "Baby of Meena Devi" : "Priya Sharma",
        age: baby ? "12 days" : "26 years",
        gestation: baby ? "Not applicable" : "28 weeks",
      },
    },
    {
      worker: baby
        ? "This is a newborn home visit. Baby weight is 2.3 kg."
        : "ANC home visit. Weight is 56 kg and blood pressure is 118 over 76.",
      agent: "Visit and weight captured.",
      values: {
        type: baby ? "Newborn Visit" : "ANC Home Visit",
        weight: baby ? "2.3 kg" : "56 kg",
        bp: baby ? "Not applicable" : "118/76 mmHg",
        tt: baby ? "Not applicable" : "Dose 1 completed",
      },
    },
    baby
      ? {
          worker: "No, weight is 2.8 kilo.",
          agent: "Weight corrected from 2.3 kg to 2.8 kg.",
          values: { weight: "2.8 kg" },
          corrected: "weight",
        }
      : {
          worker: "TT dose two is due.",
          agent: "Did you say TT dose 2? Please clarify the vaccination field.",
          values: { vaccinations: "TT dose 2" },
          uncertain: "vaccinations",
        },
    {
      worker: baby
        ? "BCG and OPV zero are due. Next visit on 20 November 2026."
        : "Yes, TT dose 2. Next visit on 20 November 2026.",
      agent: "All mandatory fields are captured. Please review and confirm the visit.",
      values: { vaccinations: baby ? "BCG, OPV-0" : "TT dose 2", next: "20 Nov 2026" },
    },
    ...(["bleeding", "fever"].includes(scenario)
      ? [
          {
            worker:
              scenario === "bleeding"
                ? "She reports bleeding during pregnancy."
                : "The newborn has high fever.",
            agent:
              "Danger sign detected. Refer immediately to the nearest Primary Health Centre. Contact the PHC and arrange urgent referral.",
            values: {},
            danger:
              scenario === "bleeding" ? "Bleeding during pregnancy" : "High fever in a newborn",
          },
        ]
      : []),
  ];
}
