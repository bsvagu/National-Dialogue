import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, Eye, Download, Filter } from "lucide-react";
import type { Submission } from "@/types/api";

interface SubmissionsResponse {
  submissions: Submission[];
  total: number;
}

export default function Submissions() {
  const [filters, setFilters] = useState({
    status: "all",
    province: "all",
    channel: "all",
    search: "",
  });
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SubmissionsResponse>({
    queryKey: ["/api/submissions", filters, pagination],
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Submission> }) => {
      await apiRequest("PATCH", `/api/submissions/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({
        title: "Success",
        description: "Submission updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update submission",
        variant: "destructive",
      });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map(id => 
          apiRequest("PATCH", `/api/submissions/${id}`, { status: "moderated" })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      setSelectedIds([]);
      toast({
        title: "Success",
        description: `${selectedIds.length} submissions approved`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve submissions",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: string) => {
    updateSubmissionMutation.mutate({ id, updates: { status: "moderated" } });
  };

  const handleReject = (id: string) => {
    updateSubmissionMutation.mutate({ id, updates: { status: "declined" } });
  };

  const handleBulkApprove = () => {
    if (selectedIds.length > 0) {
      bulkApproveMutation.mutate(selectedIds);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data?.submissions.map(s => s.id) || []);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectSubmission = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const getSentimentColor = (sentiment?: number) => {
    if (!sentiment) return "bg-gray-400";
    if (sentiment > 0.1) return "bg-emerald-400";
    if (sentiment < -0.1) return "bg-red-400";
    return "bg-amber-400";
  };

  const getSentimentLabel = (sentiment?: number) => {
    if (!sentiment) return "Neutral";
    if (sentiment > 0.1) return "Positive";
    if (sentiment < -0.1) return "Negative";
    return "Neutral";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-red-100 text-red-800";
      case "moderated": return "bg-yellow-100 text-yellow-800";
      case "routed": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-purple-100 text-purple-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "declined": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const columns = [
    {
      key: "select",
      title: "",
      render: (submission: Submission) => (
        <Checkbox
          checked={selectedIds.includes(submission.id)}
          onCheckedChange={(checked) => 
            handleSelectSubmission(submission.id, checked as boolean)
          }
          data-testid={`checkbox-submission-${submission.id}`}
        />
      ),
      className: "w-12",
    },
    {
      key: "content",
      title: "Content",
      render: (submission: Submission) => (
        <div className="max-w-md">
          <p className="text-sm text-slate-900 truncate" title={submission.text}>
            {submission.text}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="secondary" className="text-xs">
              {submission.channel}
            </Badge>
            {submission.province && (
              <Badge variant="outline" className="text-xs capitalize">
                {submission.province.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (submission: Submission) => (
        <Badge className={`${getStatusColor(submission.status)} capitalize`}>
          {submission.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: "sentiment",
      title: "Sentiment",
      render: (submission: Submission) => (
        <div className="flex items-center">
          <div className={`w-4 h-4 ${getSentimentColor(submission.sentiment)} rounded-full mr-2`} />
          <span className="text-sm text-slate-600">
            {getSentimentLabel(submission.sentiment)}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      title: "Date",
      render: (submission: Submission) => (
        <span className="text-sm text-slate-600">
          {new Date(submission.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (submission: Submission) => (
        <div className="flex items-center space-x-2">
          {submission.status === "new" && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleApprove(submission.id)}
                className="text-green-600 hover:text-green-700"
                title="Approve"
                data-testid={`button-approve-${submission.id}`}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleReject(submission.id)}
                className="text-red-600 hover:text-red-700"
                title="Reject"
                data-testid={`button-reject-${submission.id}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-blue-600 hover:text-blue-700"
            title="View Details"
            data-testid={`button-view-${submission.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" data-testid="submissions-view">
      {/* Page Header - Material Design 3 Typography */}
      <div className="mb-8">
        <h1 className="md-headline-large text-md-surface-on mb-2">Submissions</h1>
        <p className="md-body-large text-md-surface-on-variant">Manage and moderate citizen submissions</p>
      </div>
      {/* Filters and Actions - Material Design 3 */}
      <Card className="bg-md-surface-container border-md-outline-variant shadow-md-1">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center gap-3">
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-40 bg-md-surface border-md-outline-variant hover:bg-md-surface-container-high">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="moderated">Moderated</SelectItem>
                  <SelectItem value="routed">Routed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.province} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, province: value }))}
              >
                <SelectTrigger className="w-40">
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

              <Select 
                value={filters.channel} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, channel: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="mobile">Mobile App</SelectItem>
                  <SelectItem value="web">Web Portal</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Search submissions..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-64"
                data-testid="input-search-submissions"
              />
            </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={handleBulkApprove}
                disabled={selectedIds.length === 0 || bulkApproveMutation.isPending}
                className="bg-md-primary hover:bg-md-primary-container text-md-primary-on hover:text-md-primary-on-container md-label-large"
                data-testid="button-bulk-approve"
              >
                <Check className="mr-2 h-4 w-4" />
                Bulk Approve ({selectedIds.length})
              </Button>
              <Button variant="outline" className="border-md-outline hover:bg-md-surface-container-high md-label-large" data-testid="button-export">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table - Material Design 3 */}
      <Card className="bg-md-surface-container border-md-outline-variant shadow-md-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="md-title-large text-md-surface-on">Submissions Queue</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={
                  data?.submissions.length > 0 && 
                  selectedIds.length === data?.submissions.length
                }
                onCheckedChange={handleSelectAll}
                data-testid="checkbox-select-all"
              />
              <span className="text-sm text-slate-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={data?.submissions || []}
            columns={columns}
            loading={isLoading}
            pagination={{
              total: data?.total || 0,
              limit: pagination.limit,
              offset: pagination.offset,
              onPageChange: (offset) => setPagination(prev => ({ ...prev, offset })),
            }}
            emptyMessage="No submissions found"
          />
        </CardContent>
      </Card>
    </div>
  );
}
