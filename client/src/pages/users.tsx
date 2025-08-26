import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { hasPermission } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Search, Plus, Edit, Trash2, UserCheck, UserX, Check, Ban, Key } from "lucide-react";
import UserForm from "@/components/forms/user-form";
import RoleManagementSection from "@/components/role-management";
import type { User } from "@/types/api";

export default function Users() {
  const [filters, setFilters] = useState({
    role: "",
    active: "",
    search: "",
  });
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canManageUsers = currentUser ? hasPermission(currentUser.roles, "manage_users") : false;

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await apiRequest("GET", `/api/users?${params}`);
      return await res.json();
    },
    enabled: canManageUsers,
  });

  const { data: roles } = useQuery({
    queryKey: ["/api/roles"],
    enabled: canManageUsers,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      await apiRequest("PATCH", `/api/users/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deactivated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate user",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleToggleActive = (user: User) => {
    updateUserMutation.mutate({
      id: user.id,
      updates: { isActive: !user.isActive },
    });
  };

  const handleDeactivateUser = (user: User) => {
    if (confirm(`Are you sure you want to deactivate ${user.name}?`)) {
      updateUserMutation.mutate({
        id: user.id,
        updates: { isActive: false },
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SuperAdmin": return "bg-purple-100 text-purple-800";
      case "Admin": return "bg-blue-100 text-blue-800";
      case "Moderator": return "bg-amber-100 text-amber-800";
      case "Analyst": return "bg-green-100 text-green-800";
      case "DeptOfficer": return "bg-orange-100 text-orange-800";
      case "Citizen": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Ban className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-40 bg-slate-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="users-view">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Users & Roles</h2>
              <p className="text-sm text-slate-600 mt-1">Manage system users and their permissions</p>
            </div>
            <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleCreateUser}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-create-user"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? "Edit User" : "Create New User"}
                  </DialogTitle>
                </DialogHeader>
                <UserForm
                  user={editingUser}
                  onSuccess={() => {
                    setShowUserForm(false);
                    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>System Users</CardTitle>
              <div className="flex items-center space-x-3">
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-48"
                  data-testid="input-search-users"
                />
                <Select 
                  value={filters.role} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Moderator">Moderator</SelectItem>
                    <SelectItem value="Analyst">Analyst</SelectItem>
                    <SelectItem value="DeptOfficer">Dept Officer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              {users?.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  No users found
                </div>
              ) : (
                users?.map((user) => (
                  <div key={user.id} className="p-6 hover:bg-slate-50" data-testid={`user-row-${user.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{user.name}</h4>
                          <p className="text-sm text-slate-600">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {user.roles.map((role) => (
                              <Badge key={role} className={getRoleColor(role)}>
                                {role}
                              </Badge>
                            ))}
                            <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit User"
                          data-testid={`button-edit-user-${user.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-amber-600 hover:text-amber-700"
                          title="Reset Password"
                          data-testid={`button-reset-password-${user.id}`}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(user)}
                          className={user.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                          title={user.isActive ? "Deactivate" : "Activate"}
                          data-testid={`button-toggle-active-${user.id}`}
                        >
                          {user.isActive ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Roles & Permissions */}
        <RoleManagementSection />
      </div>
    </div>
  );
}
