import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import type { User } from "@/types/api";

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  province: z.string().optional(),
  isActive: z.boolean().default(true),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: User | null;
  onSuccess?: () => void;
}

export default function UserForm({ user, onSuccess }: UserFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles } = useQuery({
    queryKey: ["/api/roles"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const payload = {
        ...data,
        passwordHash: data.password, // Server expects passwordHash
      };
      delete payload.password;
      await apiRequest("POST", "/api/users", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const payload = { ...data };
      if (!payload.password) {
        delete payload.password;
      } else {
        payload.passwordHash = payload.password;
        delete payload.password;
      }
      await apiRequest("PATCH", `/api/users/${user!.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user",
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
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      province: user?.province || "",
      isActive: user?.isActive ?? true,
      roles: user?.roles || [],
      password: "",
    },
  });

  const selectedRoles = watch("roles");
  const isActive = watch("isActive");

  const onSubmit = (data: UserFormData) => {
    if (user) {
      updateUserMutation.mutate(data);
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    const currentRoles = selectedRoles || [];
    if (checked) {
      setValue("roles", [...currentRoles, roleId]);
    } else {
      setValue("roles", currentRoles.filter(id => id !== roleId));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="user-form">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          {...register("name")}
          className="mt-1"
          data-testid="input-user-name"
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          className="mt-1"
          data-testid="input-user-email"
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <Input
          id="phone"
          {...register("phone")}
          className="mt-1"
          placeholder="+27..."
          data-testid="input-user-phone"
        />
        {errors.phone && (
          <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
        )}
      </div>

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

      <div>
        <Label htmlFor="password">
          {user ? "New Password (leave blank to keep current)" : "Password"}
        </Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          className="mt-1"
          data-testid="input-user-password"
        />
        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <Label>Roles</Label>
        <div className="mt-2 space-y-2">
          {roles?.map((role: any) => (
            <div key={role.id} className="flex items-center space-x-2">
              <Checkbox
                id={`role-${role.id}`}
                checked={selectedRoles?.includes(role.name) || false}
                onCheckedChange={(checked) => handleRoleChange(role.name, checked as boolean)}
                data-testid={`checkbox-role-${role.name}`}
              />
              <Label htmlFor={`role-${role.id}`} className="text-sm">
                {role.name}
              </Label>
            </div>
          ))}
        </div>
        {errors.roles && (
          <p className="text-sm text-red-600 mt-1">{errors.roles.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setValue("isActive", checked as boolean)}
          data-testid="checkbox-user-active"
        />
        <Label htmlFor="isActive" className="text-sm">
          Active User
        </Label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => reset()}
          data-testid="button-reset-user-form"
        >
          Reset
        </Button>
        <Button 
          type="submit"
          disabled={createUserMutation.isPending || updateUserMutation.isPending}
          data-testid="button-save-user"
        >
          {user ? "Update User" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
