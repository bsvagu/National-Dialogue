import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Inbox, Briefcase, Heart, TrendingUp, ArrowUp, Clock } from "lucide-react";
import type { AnalyticsSummary } from "@/types/api";

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const submissionsGrowth = analytics?.submissions.growth || 0;
  const overdueCases = analytics?.cases.overdue || 0;
  const avgSentiment = analytics?.sentiment.avgSentiment || 0;

  return (
    <div className="space-y-6" data-testid="dashboard-view">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Submissions"
          value={analytics?.submissions.total || 0}
          subtitle={`+${submissionsGrowth.toFixed(0)}% from last week`}
          icon={<Inbox className="h-6 w-6 text-blue-600" />}
          trend={{ value: `${submissionsGrowth.toFixed(0)}%`, isPositive: submissionsGrowth > 0 }}
        />

        <StatsCard
          title="Active Cases"
          value={analytics?.cases.active || 0}
          subtitle={`${overdueCases} overdue`}
          icon={<Briefcase className="h-6 w-6 text-amber-600" />}
        />

        <StatsCard
          title="Avg. Sentiment"
          value={`${Math.round((avgSentiment + 1) * 50)}%`}
          subtitle="Mostly positive"
          icon={<Heart className="h-6 w-6 text-emerald-600" />}
          trend={{ value: "Positive", isPositive: avgSentiment > 0 }}
        />

        <StatsCard
          title="Response Rate"
          value="89%"
          subtitle="+5% this month"
          icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
          trend={{ value: "5%", isPositive: true }}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Submissions Over Time</CardTitle>
              <Select defaultValue="7d">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
              <p className="text-slate-500">Chart visualization would go here</p>
            </div>
          </CardContent>
        </Card>

        {/* Province Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>By Province</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.provinces.slice(0, 5).map((province, index) => {
                const percentage = analytics.provinces.length > 0 
                  ? (province.count / analytics.provinces[0].count) * 100 
                  : 0;
                
                return (
                  <div key={province.province} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 capitalize">
                      {province.province?.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {province.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & SLA Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Submissions</CardTitle>
              <a href="/submissions" className="text-sm text-blue-600 hover:text-blue-700">
                View all
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 border border-slate-100 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 truncate">
                    Pothole on Main Road causing accidents, needs urgent attention
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary">Gauteng</Badge>
                    <span className="text-xs text-slate-500">2 min ago</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 border border-slate-100 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 truncate">
                    Healthcare clinic understaffed in Soweto area
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary">Gauteng</Badge>
                    <span className="text-xs text-slate-500">5 min ago</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border border-slate-100 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 truncate">
                    Thank you for the new library in our community
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary">Western Cape</Badge>
                    <span className="text-xs text-slate-500">8 min ago</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SLA Performance */}
        <Card>
          <CardHeader>
            <CardTitle>SLA Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Health</p>
                  <p className="text-xs text-slate-500">72h SLA</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">87%</p>
                    <p className="text-xs text-slate-500">3 overdue</p>
                  </div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Transport</p>
                  <p className="text-xs text-slate-500">120h SLA</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">92%</p>
                    <p className="text-xs text-slate-500">1 overdue</p>
                  </div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Safety & Security</p>
                  <p className="text-xs text-slate-500">120h SLA</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">76%</p>
                    <p className="text-xs text-slate-500">8 overdue</p>
                  </div>
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
