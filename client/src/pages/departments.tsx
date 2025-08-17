import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { hasPermission } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Building, Clock, Mail } from "lucide-react";
import { z } from "zod";
import type { Department } from "@/types/api";

const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  jurisdiction: z.enum(["national", "provincial", "municipal"]),
  province: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  slaHours: z.number().min(1, "SLA hours must be at least 1"),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

export default function Departments() {
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [search, setSearch] = useState("");

  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canManageDepartments = currentUser ? hasPermission(currentUser.roles, "manage_departments") : false;

  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/departments");
      return await res.json();
    },
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormData) => {
      await apiRequest("POST", "/api/departments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setShowForm(false);
      reset();
      toast({
        title: "Success",
        description: "Department created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create department",
        variant: "destructive",
      });
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DepartmentFormData }) => {
      await apiRequest("PATCH", `/api/departments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setShowForm(false);
      setEditingDepartment(null);
      reset();
      toast({
        title: "Success",
        description: "Department updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update department",
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      jurisdiction: "national",
      province: "",
      email: "",
      slaHours: 72,
    },
  });

  const jurisdiction = watch("jurisdiction");

  const handleCreateDepartment = () => {
    setEditingDepartment(null);
    reset();
    setShowForm(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setValue("name", department.name);
    setValue("jurisdiction", department.jurisdiction as any);
    setValue("province", department.province || "");
    setValue("email", department.email || "");
    setValue("slaHours", department.slaHours);
    setShowForm(true);
  };

  const onSubmit = (data: DepartmentFormData) => {
    if (editingDepartment) {
      updateDepartmentMutation.mutate({ id: editingDepartment.id, data });
    } else {
      createDepartmentMutation.mutate(data);
    }
  };

  const getJurisdictionColor = (jurisdiction: string) => {
    switch (jurisdiction) {
      case "national": return "bg-blue-100 text-blue-800";
      case "provincial": return "bg-green-100 text-green-800";
      case "municipal": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSLAStatus = (slaHours: number) => {
    if (slaHours <= 48) return { label: "Fast", color: "text-green-600" };
    if (slaHours <= 96) return { label: "Standard", color: "text-blue-600" };
    return { label: "Extended", color: "text-amber-600" };
  };

  const filteredDepartments = departments?.filter(dept =>
    dept.name.toLowerCase().includes(search.toLowerCase()) ||
    dept.jurisdiction.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="departments-view">
      {/* Page Header - Material Design 3 Typography */}
      <div className="mb-6 sm:mb-8">
        <h1 className="md-headline-medium sm:md-headline-large text-md-surface-on mb-2">Departments</h1>
        <p className="md-body-medium sm:md-body-large text-md-surface-on-variant">Manage government departments and their configurations</p>
      </div>
      {/* Header */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col space-y-4 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3">
              <Input
                placeholder="Search departments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
                data-testid="input-search-departments"
              />
              {canManageDepartments && (
                <Dialog open={showForm} onOpenChange={setShowForm}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={handleCreateDepartment}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="button-create-department"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingDepartment ? "Edit Department" : "Create New Department"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Department Name</Label>
                        <Input
                          id="name"
                          {...register("name")}
                          className="mt-1"
                          data-testid="input-department-name"
                        />
                        {errors.name && (
                          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="jurisdiction">Jurisdiction</Label>
                        <Select 
                          value={jurisdiction} 
                          onValueChange={(value) => setValue("jurisdiction", value as any)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="national">National</SelectItem>
                            <SelectItem value="provincial">Provincial</SelectItem>
                            <SelectItem value="municipal">Municipal</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.jurisdiction && (
                          <p className="text-sm text-red-600 mt-1">{errors.jurisdiction.message}</p>
                        )}
                      </div>

                      {jurisdiction === "provincial" && (
                        <div>
                          <Label htmlFor="province">Province</Label>
                          <Select onValueChange={(value) => setValue("province", value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select province" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gauteng">Gauteng</SelectItem>
                              <SelectItem value="western_cape">Western Cape</SelectItem>
                              <SelectItem value="kwazulu_natal">KwaZulu-Natal</SelectItem>
                              <SelectItem value="eastern_cape">Eastern Cape</SelectItem>
                              <SelectItem value="free_state">Free State</SelectItem>
                              <SelectItem value="limpopo">Limpopo</SelectItem>
                              <SelectItem value="mpumalanga">Mpumalanga</SelectItem>
                              <SelectItem value="northern_cape">Northern Cape</SelectItem>
                              <SelectItem value="north_west">North West</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="email">Contact Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          className="mt-1"
                          data-testid="input-department-email"
                        />
                        {errors.email && (
                          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="slaHours">SLA (Hours)</Label>
                        <Input
                          id="slaHours"
                          type="number"
                          {...register("slaHours", { valueAsNumber: true })}
                          className="mt-1"
                          data-testid="input-department-sla"
                        />
                        {errors.slaHours && (
                          <p className="text-sm text-red-600 mt-1">{errors.slaHours.message}</p>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowForm(false)}
                          data-testid="button-cancel-department"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
                          data-testid="button-save-department"
                        >
                          {editingDepartment ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments?.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No departments found</h3>
            <p className="text-slate-600">
              {search ? "Try adjusting your search terms" : "Get started by creating your first department"}
            </p>
          </div>
        ) : (
          filteredDepartments?.map((department) => {
            const slaStatus = getSLAStatus(department.slaHours);
            
            return (
              <Card key={department.id} className="hover:shadow-md transition-shadow" data-testid={`department-card-${department.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{department.name}</CardTitle>
                        <Badge className={`${getJurisdictionColor(department.jurisdiction)} mt-1 capitalize`}>
                          {department.jurisdiction}
                        </Badge>
                      </div>
                    </div>
                    {canManageDepartments && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditDepartment(department)}
                        className="text-slate-400 hover:text-slate-600"
                        data-testid={`button-edit-department-${department.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {department.province && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-500">Province:</span>
                      <span className="text-sm font-medium text-slate-900 capitalize">
                        {department.province.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-500">SLA:</span>
                    <span className="text-sm font-medium text-slate-900">
                      {department.slaHours}h
                    </span>
                    <span className={`text-sm font-medium ${slaStatus.color}`}>
                      ({slaStatus.label})
                    </span>
                  </div>

                  {department.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600 truncate">
                        {department.email}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      Created: {new Date(department.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
