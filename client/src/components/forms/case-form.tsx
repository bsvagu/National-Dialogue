import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import type { Case, Submission, Department, User } from "@/types/api";

const caseFormSchema = z.object({
  submissionId: z.string().min(1, "Submission is required"),
  departmentId: z.string().min(1, "Department is required"),
  assigneeId: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  state: z.enum(["open", "investigating", "awaiting_info", "resolved"]),
  dueAt: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  resolutionNote: z.string().optional(),
});

type CaseFormData = z.infer<typeof caseFormSchema>;

interface CaseFormProps {
  case?: Case;
  onSuccess?: () => void;
}

export default function CaseForm({ case: caseData, onSuccess }: CaseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch required data for dropdowns
  const { data: submissions } = useQuery<{ submissions: Submission[]; total: number }>({
    queryKey: ["/api/submissions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/submissions?limit=100");
      return await res.json();
    },
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return await res.json();
    },
  });

  const createCaseMutation = useMutation({
    mutationFn: async (data: CaseFormData) => {
      const payload = {
        ...data,
        assigneeId: data.assigneeId || undefined,
      };
      await apiRequest("POST", "/api/cases", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      toast({
        title: "Success",
        description: "Case created successfully",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create case",
        variant: "destructive",
      });
    },
  });

  const updateCaseMutation = useMutation({
    mutationFn: async (data: CaseFormData) => {
      if (!caseData) return;
      const payload = {
        ...data,
        assigneeId: data.assigneeId || undefined,
      };
      await apiRequest("PATCH", `/api/cases/${caseData.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      toast({
        title: "Success",
        description: "Case updated successfully",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update case",
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      submissionId: caseData?.submissionId || "",
      departmentId: caseData?.departmentId || "",
      assigneeId: caseData?.assigneeId || "",
      priority: caseData?.priority || "medium",
      state: caseData?.state || "open",
      dueAt: caseData?.dueAt ? new Date(caseData.dueAt).toISOString().split('T')[0] : "",
      resolutionNote: caseData?.resolutionNote || "",
    },
  });

  const selectedSubmission = watch("submissionId");
  const selectedDepartment = watch("departmentId");
  const selectedAssignee = watch("assigneeId");
  const selectedPriority = watch("priority");
  const selectedState = watch("state");

  const onSubmit = (data: CaseFormData) => {
    if (caseData) {
      updateCaseMutation.mutate(data);
    } else {
      createCaseMutation.mutate(data);
    }
  };

  const isLoading = createCaseMutation.isPending || updateCaseMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="case-form">
      <div>
        <Label htmlFor="submissionId">Submission</Label>
        <Select 
          value={selectedSubmission} 
          onValueChange={(value) => setValue("submissionId", value)}
        >
          <SelectTrigger className="mt-1" data-testid="select-submission">
            <SelectValue placeholder="Select submission" />
          </SelectTrigger>
          <SelectContent>
            {submissions?.submissions?.map((submission) => (
              <SelectItem key={submission.id} value={submission.id}>
                {submission.text.substring(0, 60)}...
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.submissionId && (
          <p className="text-sm text-red-600 mt-1">{errors.submissionId.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="departmentId">Department</Label>
        <Select 
          value={selectedDepartment} 
          onValueChange={(value) => setValue("departmentId", value)}
        >
          <SelectTrigger className="mt-1" data-testid="select-department">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {departments?.map((department) => (
              <SelectItem key={department.id} value={department.id}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.departmentId && (
          <p className="text-sm text-red-600 mt-1">{errors.departmentId.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="assigneeId">Assignee (Optional)</Label>
        <Select 
          value={selectedAssignee || "none"} 
          onValueChange={(value) => setValue("assigneeId", value === "none" ? "" : value)}
        >
          <SelectTrigger className="mt-1" data-testid="select-assignee">
            <SelectValue placeholder="Select assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Assignee</SelectItem>
            {users?.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} ({user.roles.join(", ")})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.assigneeId && (
          <p className="text-sm text-red-600 mt-1">{errors.assigneeId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select 
            value={selectedPriority} 
            onValueChange={(value) => setValue("priority", value as any)}
          >
            <SelectTrigger className="mt-1" data-testid="select-priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          {errors.priority && (
            <p className="text-sm text-red-600 mt-1">{errors.priority.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="state">State</Label>
          <Select 
            value={selectedState} 
            onValueChange={(value) => setValue("state", value as any)}
          >
            <SelectTrigger className="mt-1" data-testid="select-state">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="awaiting_info">Awaiting Info</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="dueAt">Due Date (Optional)</Label>
        <Input
          id="dueAt"
          type="date"
          {...register("dueAt")}
          className="mt-1"
          data-testid="input-due-date"
        />
        {errors.dueAt && (
          <p className="text-sm text-red-600 mt-1">{errors.dueAt.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="resolutionNote">Resolution Note (Optional)</Label>
        <Textarea
          id="resolutionNote"
          {...register("resolutionNote")}
          className="mt-1 min-h-[100px]"
          placeholder="Enter resolution notes..."
          data-testid="textarea-resolution-note"
        />
        {errors.resolutionNote && (
          <p className="text-sm text-red-600 mt-1">{errors.resolutionNote.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isLoading}
          data-testid="button-reset"
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          data-testid="button-submit"
        >
          {isLoading ? "Saving..." : caseData ? "Update Case" : "Create Case"}
        </Button>
      </div>
    </form>
  );
}
