"use client";

import { useState } from "react";
import { resolveReport } from "@/lib/actions";
import type { User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Shield, Calendar, Users, AlertTriangle, Activity, CheckCircle, XCircle } from "lucide-react";

interface AmbassadorStats {
  totalEvents: number;
  liveEvents: number;
  totalUsers: number;
  totalCommunities: number;
  pendingReports: number;
  recentEvents: Array<{ id: string; title: string; status: string; creator_name: string; created_at: string }>;
  reports: Array<{ id: string; event_title: string; reporter_name: string; reason: string; created_at: string }>;
}

interface AmbassadorDashboardProps {
  user: User;
  stats: never;
}

export function AmbassadorDashboard({ user, stats: rawStats }: AmbassadorDashboardProps) {
  const stats = rawStats as unknown as AmbassadorStats;
  const [resolvedReports, setResolvedReports] = useState<Set<string>>(new Set());

  async function handleResolve(reportId: string, action: "dismiss" | "remove_event") {
    await resolveReport(reportId, action);
    setResolvedReports((prev) => new Set([...prev, reportId]));
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <a href="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </a>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-bricolage)" }}>
              <Shield className="w-6 h-6 text-primary" />
              Ambassador Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">{user.campus} · {user.name}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4 text-center">
              <Calendar className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{stats.totalEvents}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4 text-center">
              <Activity className="w-5 h-5 mx-auto text-live mb-1" />
              <p className="text-2xl font-bold text-live">{stats.liveEvents}</p>
              <p className="text-xs text-muted-foreground">Live Now</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 mx-auto text-chart-4 mb-1" />
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Users</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-5 h-5 mx-auto text-destructive mb-1" />
              <p className="text-2xl font-bold text-destructive">{stats.pendingReports}</p>
              <p className="text-xs text-muted-foreground">Pending Reports</p>
            </CardContent>
          </Card>
        </div>

        {/* Reports */}
        <Card className="mb-6 bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Pending Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.reports.filter((r) => !resolvedReports.has(r.id)).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No pending reports</p>
            ) : (
              <div className="space-y-3">
                {stats.reports
                  .filter((r) => !resolvedReports.has(r.id))
                  .map((report) => (
                    <div key={report.id} className="rounded-xl border border-border/50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{report.event_title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Reported by {report.reporter_name}: &quot;{report.reason}&quot;
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs rounded-lg text-muted-foreground"
                            onClick={() => handleResolve(report.id, "dismiss")}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs rounded-lg"
                            onClick={() => handleResolve(report.id, "remove_event")}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">by {event.creator_name}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {event.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
