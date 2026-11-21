import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Baby, CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, Clock, Heart, MapPin, Mic, Play, ShieldAlert, Sparkles, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Waveform } from "@/components/Shared";
import { useDemo } from "@/context/DemoContext";
import { scenarios } from "@/mock/demo";
import visitImage from "@/assets/community-visit.jpg";

const scenarioIcons = [Heart, Baby, ShieldAlert];
const scenarioTones = ["coral", "indigo", "gold"];

export default function Home() {
  const { settings, visits, followups, beneficiaries, draft, setDraft } = useDemo();
  const navigate = useNavigate();
  const dueFollowups = followups.filter((followup) => followup.status === "Upcoming");
  const confirmedVisits = visits.filter((visit) => visit.status === "Confirmed").length;
  const confirmationRate = visits.length ? Math.round((confirmedVisits / visits.length) * 100) : 0;
  const todayLabel = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  const start = (id) => {
    setDraft({ scenario: id, fields: {}, statuses: {}, corrections: {}, transcript: [], step: 0, danger: null });
    navigate({ to: "/live-visit" });
  };

  const metrics = [
    { icon: ClipboardCheck, label: "Visits recorded", value: visits.length, detail: "Confirmed care conversations", tone: "coral" },
    { icon: CalendarDays, label: "Follow-ups due", value: settings.reminders ? dueFollowups.length : 0, detail: settings.reminders ? "Need your attention" : "Reminders are off", tone: "indigo" },
    { icon: Users, label: "People supported", value: beneficiaries.length, detail: "In your registered community", tone: "green" },
    { icon: TrendingUp, label: "Records reviewed", value: `${confirmationRate}%`, detail: `${confirmedVisits} confirmed visit${confirmedVisits === 1 ? "" : "s"}`, tone: "gold" },
  ];

  return (
    <div className="page home-page">
      <section className="dashboard-intro" aria-labelledby="dashboard-title">
        <div className="dashboard-intro-copy">
          <div className="eyebrow"><Sparkles size={14} /> {todayLabel}</div>
          <h1 id="dashboard-title">Good morning, {settings.worker.split(" ")[0]}<span className="greeting-dot">.</span></h1>
          <p>Everything you need to stay present for the people in your care.</p>
        </div>
        <span className="dashboard-location"><MapPin size={14} /> {settings.area}</span>
      </section>

      <section className="dashboard-hero" aria-label="Start a community care visit">
        <div className="hero-image-wrap">
          <video autoPlay muted loop playsInline poster={visitImage} aria-label="A healthcare worker caring for a child outdoors">
            <source src="/community-care-hero.mp4" type="video/mp4" />
          </video>
          <img src={visitImage} alt="Community health worker visiting a mother and her newborn" width="1280" height="768" />
        </div>
        <div className="hero-content">
          <span className="hero-kicker"><span /> YOUR VOICE. BETTER CARE.</span>
          <h2>Care starts with a conversation.</h2>
          <p>Record a visit naturally while Sahayak keeps the important details organised.</p>
          <div className="hero-actions">
            <Button size="lg" onClick={() => start("anc")}><Mic /> Start new visit <ArrowRight /></Button>
            <Button variant="outline" size="lg" onClick={() => (draft ? navigate({ to: "/live-visit" }) : start("newborn"))}><Play /> {draft ? "Resume visit" : "Try a demo visit"}</Button>
          </div>
          <div className="hero-footnote"><Heart size={14} /> Built around the person, not the paperwork.</div>
        </div>
        <aside className="hero-voice-note"><span className="voice-note-icon"><Mic size={18} /></span><div><strong>Voice-first by design</strong><p>Speak in your preferred language. You stay in control of every saved record.</p></div></aside>
      </section>

      <section className="metrics-band" aria-label="Care overview">
        {metrics.map(({ icon: Icon, label, value, detail, tone }) => <div className="metric" key={label}><span className={`metric-icon ${tone}`}><Icon size={18} /></span><div><span>{label}</span><strong>{value}</strong></div><small>{detail}</small></div>)}
      </section>

      <section className="care-pulse" aria-label="Today's care focus">
        <div className="pulse-intro"><span className="pulse-mark"><Sparkles size={15} /></span><div><span className="section-kicker">CARE PULSE</span><strong>Today’s focus</strong></div></div>
        <div className="pulse-item"><span>01</span><p><strong>{dueFollowups.length} follow-up{dueFollowups.length === 1 ? "" : "s"} to continue</strong><small>Review upcoming care visits and choose the next conversation.</small></p></div>
        <div className="pulse-item"><span>02</span><p><strong>Voice capture is ready</strong><small>Start with a natural conversation, then review before saving.</small></p></div>
        <Button variant="ghost" onClick={() => start("anc")} className="pulse-action">Open visit workspace <ArrowRight size={16} /></Button>
      </section>

      <div className="dashboard-workspace">
        <section className="care-journeys" aria-labelledby="journeys-title">
          <div className="dashboard-section-heading"><div><span className="section-kicker">START A VISIT</span><h2 id="journeys-title">Choose a care journey</h2></div><span>Choose the situation, then speak naturally.</span></div>
          <div className="journey-list">
            {scenarios.map((scenario, index) => {
              const Icon = scenarioIcons[index];
              const isUrgent = index === 2;
              return <article className={`journey journey-${index}`} key={scenario.id}><span className={`journey-icon ${scenarioTones[index]}`}><Icon size={23} /></span><div className="journey-copy"><span>{scenario.tag}</span><h3>{scenario.title}</h3><p>{scenario.subtitle}</p></div><Button variant={isUrgent ? "outline" : "default"} onClick={() => start(scenario.id)}>{isUrgent ? "Open safety flow" : "Start visit"} <ArrowRight size={16} /></Button></article>;
            })}
          </div>
        </section>

        <aside className="dashboard-side-rail">
          <section className="followups-panel" aria-labelledby="followups-title">
            <div className="panel-heading"><div><span className="section-kicker">CARE TO CONTINUE</span><h2 id="followups-title">Upcoming follow-ups</h2></div><Link to="/follow-ups" aria-label="View all follow-ups"><ArrowUpRight size={18} /></Link></div>
            <div className="followup-list">
              {dueFollowups.slice(0, 3).map((followup, index) => <Link to="/follow-ups" className="followup-item" key={followup.id}><span className={`followup-index ${index === 0 ? "priority" : ""}`}>0{index + 1}</span><span className="followup-person"><strong>{followup.name}</strong><small>{followup.type} · {followup.village}</small></span><span className="followup-when">{followup.date}<small>{index < 2 ? "Due soon" : "Upcoming"}</small></span><ChevronRight size={16} /></Link>)}
            </div>
          </section>
          <section className="companion-panel" aria-labelledby="companion-title">
            <div className="companion-topline"><Badge tone="neutral">VOICE COMPANION</Badge><span>Demo mode</span></div>
            <h2 id="companion-title">Ready when you are.</h2><p>Explore the voice workflow before you begin a real visit.</p><Waveform />
            <Button onClick={() => start("newborn")} className="companion-action"><Mic size={17} /> Open voice demo <ArrowRight size={16} /></Button>
            <small><Clock size={13} /> Simulated session · no live connection</small>
          </section>
        </aside>
      </div>

      <section className="activity-panel" aria-labelledby="activity-title">
        <div className="panel-heading"><div><span className="section-kicker">RECENTLY CONFIRMED</span><h2 id="activity-title">Care activity</h2></div><Link to="/history" className="text-link">View history <ArrowRight size={15} /></Link></div>
        <div className="activity-list">{visits.slice(0, 3).map((visit) => <Link to="/records" className="activity-item" key={visit.id}><CheckCircle2 size={20} /><span><strong>{visit.name}</strong><small>{visit.type} · Record confirmed</small></span><time>{visit.date}</time><ChevronRight size={16} /></Link>)}</div>
      </section>
    </div>
  );
}
