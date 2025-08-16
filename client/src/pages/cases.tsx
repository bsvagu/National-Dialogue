import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Clock, AlertTriangle } from "lucide-react";
import type { Case, Department, User } from "@/types/api";

interface CasesResponse {
  cases: Case[];
  total: number;
}

interface CaseWithDetails extends Case {
  department?: Department;
  assignee?: User;
  submission?: { text: string };
}

export default function Cases() {
  const [filters, setFilters] = useState({
    state: "",
    department: "",
    priority: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: casesData, isLoading } = useQuery<CasesResponse>({
    queryKey: ["/api/cases", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await apiRequest("GET", `/api/cases?${params}`);
      return await res.json();
    },
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const updateCaseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Case> }) => {
      await apiRequest("PATCH", `/api/cases/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      toast({
        title: "Success",
        description: "Case updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update case",
        variant: "destructive",
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "open": return "bg-blue-100 text-blue-800";
      case "investigating": return "bg-purple-100 text-purple-800";
      case "awaiting_info": return "bg-orange-100 text-orange-800";
      case "resolved": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDueStatus = (dueAt?: string) => {
    if (!dueAt) return null;
    
    const due = new Date(dueAt);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Overdue by ${Math.abs(diffDays)} days`, color: "text-red-500" };
    } else if (diffDays === 0) {
      return { label: "Due today", color: "text-orange-500" };
    } else if (diffDays <= 2) {
      return { label: `Due in ${diffDays} days`, color: "text-amber-500" };
    } else {
      return { label: `Due in ${diffDays} days`, color: "text-slate-500" };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const groupedCases = {
    open: casesData?.cases.filter(c => c.state === "open") || [],
    investigating: casesData?.cases.filter(c => c.state === "investigating") || [],
    awaiting_info: casesData?.cases.filter(c => c.state === "awaiting_info") || [],
    resolved: casesData?.cases.filter(c => c.state === "resolved") || [],
  };

  const CaseCard = ({ caseItem }: { caseItem: Case }) => {
    const dueStatus = getDueStatus(caseItem.dueAt);
    
    return (
      <div 
        className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 cursor-pointer transition-colors"
        data-testid={`case-card-${caseItem.id}`}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="text-sm font-medium text-slate-900">
            #{caseItem.id.slice(-8)}
          </span>
          <Badge className={`${getPriorityColor(caseItem.priority)} capitalize`}>
            {caseItem.priority}
          </Badge>
        </div>
        
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
          Case from submission - Details would be loaded from API
        </p>
        
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-500">
            Department: {departments?.find(d => d.id === caseItem.departmentId)?.name || 'Unknown'}
          </span>
          {dueStatus && (
            <span className={dueStatus.color}>{dueStatus.label}</span>
          )}
        </div>
        
        {caseItem.assigneeId && (
          <div className="flex items-center mt-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">
              A
            </div>
            <span className="text-xs text-slate-600">Assigned</span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-40 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="cases-view">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center gap-3">
              <Select 
                value={filters.state} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All States</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="awaiting_info">Awaiting Info</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.department} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.priority} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-case">
              <Plus className="mr-2 h-4 w-4" />
              New Case
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cases Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Open Cases */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Open Cases</CardTitle>
              <Badge variant="secondary">{groupedCases.open.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {groupedCases.open.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No open cases</p>
            ) : (
              groupedCases.open.map((caseItem) => (
                <CaseCard key={caseItem.id} caseItem={caseItem} />
              ))
            )}
          </CardContent>
        </Card>

        {/* In Progress Cases */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Investigating</CardTitle>
              <Badge variant="secondary">{groupedCases.investigating.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {groupedCases.investigating.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No cases in progress</p>
            ) : (
              groupedCases.investigating.map((caseItem) => (
                <CaseCard key={caseItem.id} caseItem={caseItem} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Awaiting Info Cases */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Awaiting Info</CardTitle>
              <Badge variant="secondary">{groupedCases.awaiting_info.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {groupedCases.awaiting_info.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No cases awaiting info</p>
            ) : (
              groupedCases.awaiting_info.map((caseItem) => (
                <CaseCard key={caseItem.id} caseItem={caseItem} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Resolved Cases */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Resolved</CardTitle>
              <Badge variant="secondary">{groupedCases.resolved.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {groupedCases.resolved.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No resolved cases</p>
            ) : (
              groupedCases.resolved.map((caseItem) => (
                <CaseCard key={caseItem.id} caseItem={caseItem} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
