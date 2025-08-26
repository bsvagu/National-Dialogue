import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Check, Ban } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const roleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

// Permission mapping for display purposes
const rolePermissions: Record<string, string[]> = {
  'SuperAdmin': ['Manage users', 'Manage departments', 'View analytics', 'Manage settings', 'All permissions'],
  'Admin': ['Manage users', 'Manage departments', 'View analytics', 'Manage settings'],
  'Analyst': ['View analytics', 'Export data'],
  'Moderator': ['Review submissions', 'Manage cases'],
  'DeptOfficer': ['Manage assigned cases', 'View department data'],
  'Citizen': ['Create submissions', 'View own submissions']
};

export default function RoleManagementSection() {
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canManageRoles = currentUser ? hasPermission(currentUser.roles, "manage_users") : false;

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/roles");
      return await res.json();
    },
    enabled: canManageRoles,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      const res = await apiRequest("POST", "/api/roles", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setShowForm(false);
      reset();
      toast({
        title: "Success",
        description: "Role created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RoleFormData }) => {
      const res = await apiRequest("PATCH", `/api/roles/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setShowForm(false);
      setEditingRole(null);
      reset();
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RoleFormData) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    reset({
      name: role.name,
      description: role.description || "",
    });
    setShowForm(true);
  };

  const handleDelete = (role: Role) => {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  if (!canManageRoles) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">Loading roles...</div>
        ) : roles?.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No roles found</div>
        ) : (
          roles?.map((role) => (
            <div key={role.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900">{role.name}</h4>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => handleEdit(role)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {role.name !== 'SuperAdmin' && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(role)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {role.description && (
                <p className="text-sm text-slate-600 mb-3">{role.description}</p>
              )}
              <div className="space-y-1">
                {rolePermissions[role.name]?.map((permission, index) => (
                  <div key={index} className="flex items-center text-xs text-slate-500">
                    <Check className="h-3 w-3 text-green-500 mr-2" />
                    <span>{permission}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
      <div className="p-6 border-t border-slate-200">
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setEditingRole(null);
                reset();
              }}
              data-testid="button-create-role"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Edit Role" : "Create New Role"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter role name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Enter role description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                >
                  {editingRole ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
