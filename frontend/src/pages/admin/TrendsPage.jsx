import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, Users, CheckCircle, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getAllLoans } from "../../services/loanService";

// ─── Helpers ──────────────────────────────────────────────────
function formatDay(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function buildDailyData(loans) {
  const map = {};
  loans.forEach((loan) => {
    const day = loan.createdAt?.slice(0, 10);
    if (!day) return;
    if (!map[day]) map[day] = { day, count: 0, totalProb: 0, LOW: 0, MEDIUM: 0, HIGH: 0 };
    map[day].count++;
    map[day].totalProb += loan.defaultProbability ?? 0;
    const tier = loan.riskTier?.toUpperCase();
    if (tier === "LOW" || tier === "MEDIUM" || tier === "HIGH") map[day][tier]++;
  });
  return Object.values(map)
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((d) => ({
      ...d,
      label:   formatDay(d.day),
      avgProb: d.count > 0 ? +((d.totalProb / d.count) * 100).toFixed(1) : 0,
    }));
}

// ─── Custom Tooltip ───────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border-strong)", borderRadius: 10, padding: "0.6rem 1rem", fontSize: "0.82rem", boxShadow: "var(--shadow-card)" }}>
      <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--text-primary)" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ margin: 0, color: p.color }}>
          {p.name}: <strong>{p.value}{p.name === "Avg Default %" ? "%" : ""}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16, boxShadow: "var(--shadow-card)" }}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              {label}
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={16} color={color} />
            </div>
          </div>
          <p style={{ fontFamily: "'Times New Roman', serif", fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1 }}>
            {value}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function TrendsPage() {
  const [loans, setLoans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    getAllLoans()
      .then((data) => setLoans(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) return (
    <div className="flex items-center justify-center py-20">
      <p style={{ color: "#ef4444", fontSize: "0.9rem" }}>Error: {error}</p>
    </div>
  );

  const daily   = buildDailyData(loans);
  const total   = loans.length;
  const avgProb = total ? ((loans.reduce((s, l) => s + (l.defaultProbability ?? 0), 0) / total) * 100).toFixed(1) : 0;
  const approved = loans.filter((l) => l.riskTier?.toUpperCase() === "LOW").length;
  const rejected = loans.filter((l) => l.riskTier?.toUpperCase() === "HIGH").length;

  const statCards = [
    { icon: Users,       label: "Total Applications", value: total,         color: "#0ea5e9" },
    { icon: TrendingUp,  label: "Avg Default Risk",   value: `${avgProb}%`, color: "#6366f1" },
    { icon: CheckCircle, label: "Approved (LOW)",      value: approved,      color: "#10b981" },
    { icon: XCircle,     label: "Rejected (HIGH)",     value: rejected,      color: "#ef4444" },
  ];

  const axisProps = {
    tick: { fill: "var(--text-muted)", fontSize: 11, fontFamily: "DM Sans" },
    axisLine: false,
    tickLine: false,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Page Title ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 style={{ fontFamily: "'Times New Roman', serif", fontSize: "1.7rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Trends
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>
          Historical analysis of loan evaluation patterns
        </p>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16 }}>
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-24 mb-4" style={{ background: "var(--ll-border)" }} />
                  <Skeleton className="h-8 w-16" style={{ background: "var(--ll-border)" }} />
                </CardContent>
              </Card>
            ))
          : statCards.map((card, i) => (
              <StatCard key={card.label} {...card} delay={i * 0.08} />
            ))
        }
      </div>

      {/* ── Charts via Tabs ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
        <Tabs defaultValue="applications">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <TabsList style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", padding: 4 }}>
              <TabsTrigger value="applications" style={{ fontSize: "0.82rem", fontFamily: "Arial, sans-serif" }}>
                Applications / Day
              </TabsTrigger>
              <TabsTrigger value="probability" style={{ fontSize: "0.82rem", fontFamily: "Arial, sans-serif" }}>
                Avg Default Prob
              </TabsTrigger>
              <TabsTrigger value="breakdown" style={{ fontSize: "0.82rem", fontFamily: "Arial, sans-serif" }}>
                Risk Breakdown
              </TabsTrigger>
            </TabsList>
            <Badge variant="outline" style={{ borderColor: "var(--ll-border-strong)", color: "var(--text-muted)", fontSize: "0.72rem" }}>
              {daily.length} day{daily.length !== 1 ? "s" : ""} of data
            </Badge>
          </div>

          {/* Applications per day */}
          <TabsContent value="applications">
            <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16, boxShadow: "var(--shadow-card)" }}>
              <CardHeader className="px-6 pt-5 pb-2">
                <CardTitle style={{ fontFamily: "'Times New Roman', serif", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Applications Per Day
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {loading ? (
                  <Skeleton className="h-56 w-full" style={{ background: "var(--ll-border)" }} />
                ) : daily.length === 0 ? (
                  <div className="flex items-center justify-center h-56" style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={daily} margin={{ top: 4, right: 16, bottom: 4, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ll-border)" />
                      <XAxis dataKey="label" {...axisProps} />
                      <YAxis allowDecimals={false} {...axisProps} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="count" name="Applications" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4, fill: "#0ea5e9" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avg default probability */}
          <TabsContent value="probability">
            <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16, boxShadow: "var(--shadow-card)" }}>
              <CardHeader className="px-6 pt-5 pb-2">
                <CardTitle style={{ fontFamily: "'Times New Roman', serif", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Avg Default Probability Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {loading ? (
                  <Skeleton className="h-56 w-full" style={{ background: "var(--ll-border)" }} />
                ) : daily.length === 0 ? (
                  <div className="flex items-center justify-center h-56" style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={daily} margin={{ top: 4, right: 16, bottom: 4, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ll-border)" />
                      <XAxis dataKey="label" {...axisProps} />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} {...axisProps} />
                      <Tooltip content={<CustomTooltip />} formatter={(v) => [`${v}%`, "Avg Default %"]} />
                      <Line type="monotone" dataKey="avgProb" name="Avg Default %" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: "#f59e0b" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk breakdown */}
          <TabsContent value="breakdown">
            <Card style={{ background: "var(--bg-card)", border: "1px solid var(--ll-border)", borderRadius: 16, boxShadow: "var(--shadow-card)" }}>
              <CardHeader className="px-6 pt-5 pb-2">
                <CardTitle style={{ fontFamily: "'Times New Roman', serif", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Risk Tier Breakdown Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {loading ? (
                  <Skeleton className="h-56 w-full" style={{ background: "var(--ll-border)" }} />
                ) : daily.length === 0 ? (
                  <div className="flex items-center justify-center h-56" style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={daily} margin={{ top: 4, right: 16, bottom: 4, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ll-border)" />
                      <XAxis dataKey="label" {...axisProps} />
                      <YAxis allowDecimals={false} {...axisProps} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "0.78rem", color: "var(--text-muted)", paddingTop: 8 }} />
                      <Bar dataKey="LOW"    name="Low Risk"    fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="MEDIUM" name="Medium Risk" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="HIGH"   name="High Risk"   fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}