import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hasPermission } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock, 
  Download, 
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Ban
} from "lucide-react";
import type { AnalyticsSummary } from "@/types/api";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [provinceFilter, setProvinceFilter] = useState("");
  
  const { user: currentUser } = useAuth();
  const canViewAnalytics = currentUser ? hasPermission(currentUser.roles, "view_analytics") : false;

  const { data: analytics, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary", { range: timeRange }],
    enabled: canViewAnalytics,
  });

  if (!canViewAnalytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Ban className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">You don't have permission to view analytics.</p>
        </div>
      </div>
    );
  }

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
  const avgSentiment = analytics?.sentiment.avgSentiment || 0;
  const totalSentimentResponses = (analytics?.sentiment.positiveCount || 0) + 
                                  (analytics?.sentiment.neutralCount || 0) + 
                                  (analytics?.sentiment.negativeCount || 0);

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="analytics-view">
      {/* Page Header - Material Design 3 Typography */}
      <div className="mb-6 sm:mb-8">
        <h1 className="md-headline-medium sm:md-headline-large text-md-surface-on mb-2">Analytics</h1>
        <p className="md-body-medium sm:md-body-large text-md-surface-on-variant">Comprehensive insights and data visualization</p>
      </div>
      {/* Controls */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col space-y-4 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3">
              <h2 className="md-title-large text-md-surface-on">Analytics Dashboard</h2>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Provinces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  <SelectItem value="gauteng">Gauteng</SelectItem>
                  <SelectItem value="western_cape">Western Cape</SelectItem>
                  <SelectItem value="kwazulu_natal">KwaZulu-Natal</SelectItem>
                  <SelectItem value="eastern_cape">Eastern Cape</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button variant="outline" data-testid="button-export-analytics">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export Report</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Advanced Filters</span>
                <span className="sm:hidden">Filters</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Submissions"
          value={analytics?.submissions.total || 0}
          subtitle={`+${submissionsGrowth.toFixed(1)}% vs previous period`}
          icon={<MessageSquare className="h-6 w-6 text-blue-600" />}
          trend={{ value: `${submissionsGrowth.toFixed(1)}%`, isPositive: submissionsGrowth > 0 }}
        />

        <StatsCard
          title="Active Cases"
          value={analytics?.cases.active || 0}
          subtitle={`${analytics?.cases.overdue || 0} overdue`}
          icon={<Activity className="h-6 w-6 text-amber-600" />}
        />

        <StatsCard
          title="Avg Response Time"
          value="68h"
          subtitle="12h better than target"
          icon={<Clock className="h-6 w-6 text-green-600" />}
          trend={{ value: "12h better", isPositive: true }}
        />

        <StatsCard
          title="Sentiment Score"
          value={`${Math.round((avgSentiment + 1) * 50)}%`}
          subtitle={`${totalSentimentResponses} responses analyzed`}
          icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
          trend={{ value: avgSentiment > 0 ? "Positive" : "Negative", isPositive: avgSentiment > 0 }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Submissions Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">Time series chart showing submission volumes</p>
                <p className="text-xs text-slate-400 mt-1">Chart implementation would connect to real data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-slate-600">Positive</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">{analytics?.sentiment.positiveCount || 0}</span>
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: totalSentimentResponses > 0 
                          ? `${((analytics?.sentiment.positiveCount || 0) / totalSentimentResponses) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-amber-500 rounded"></div>
                  <span className="text-sm text-slate-600">Neutral</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">{analytics?.sentiment.neutralCount || 0}</span>
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full" 
                      style={{ 
                        width: totalSentimentResponses > 0 
                          ? `${((analytics?.sentiment.neutralCount || 0) / totalSentimentResponses) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm text-slate-600">Negative</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">{analytics?.sentiment.negativeCount || 0}</span>
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ 
                        width: totalSentimentResponses > 0 
                          ? `${((analytics?.sentiment.negativeCount || 0) / totalSentimentResponses) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  🗺️
                </div>
                <p className="text-slate-500">Interactive map showing submission distribution</p>
                <p className="text-xs text-slate-400 mt-1">Map visualization would be implemented here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Provinces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.provinces.slice(0, 6).map((province, index) => {
                const percentage = analytics.provinces.length > 0 
                  ? (province.count / analytics.provinces[0].count) * 100 
                  : 0;
                
                return (
                  <div key={province.province} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 capitalize">
                      {province.province?.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 w-8 text-right">
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

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Health</p>
                  <p className="text-sm text-slate-500">72h SLA</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">87%</p>
                  <p className="text-sm text-slate-500">On-time rate</p>
                  <Badge className="bg-green-100 text-green-800 mt-1">Good</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Transport</p>
                  <p className="text-sm text-slate-500">120h SLA</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">92%</p>
                  <p className="text-sm text-slate-500">On-time rate</p>
                  <Badge className="bg-green-100 text-green-800 mt-1">Excellent</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Safety & Security</p>
                  <p className="text-sm text-slate-500">120h SLA</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">76%</p>
                  <p className="text-sm text-slate-500">On-time rate</p>
                  <Badge className="bg-amber-100 text-amber-800 mt-1">Needs Attention</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Mobile App</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "65%" }} />
                  </div>
                  <span className="text-sm font-medium text-slate-900">1,845</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">WhatsApp</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "25%" }} />
                  </div>
                  <span className="text-sm font-medium text-slate-900">712</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Web Portal</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: "8%" }} />
                  </div>
                  <span className="text-sm font-medium text-slate-900">234</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Social Media</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div className="bg-pink-500 h-2 rounded-full" style={{ width: "2%" }} />
                  </div>
                  <span className="text-sm font-medium text-slate-900">56</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
