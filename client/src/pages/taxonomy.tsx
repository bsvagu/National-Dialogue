import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { hasPermission } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Trash2, Hash, Grid3x3 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const taxonomySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.enum(["topic", "theme", "urgency", "classification"]),
  parentId: z.string().optional(),
});

type TaxonomyFormData = z.infer<typeof taxonomySchema>;

interface TaxonomyItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Taxonomy() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canManageTaxonomy = currentUser ? hasPermission(currentUser.roles, "manage_settings") : false;

  // Mock data for demonstration - would connect to real API
  const mockTaxonomyData: TaxonomyItem[] = [
    {
      id: "1",
      name: "Education",
      description: "Education-related topics and policies",
      category: "topic",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z"
    },
    {
      id: "2", 
      name: "Healthcare",
      description: "Healthcare services and medical topics",
      category: "topic",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z"
    },
    {
      id: "3",
      name: "Economic Policy",
      description: "Economic development and policy discussions",
      category: "theme",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z"
    },
    {
      id: "4",
      name: "High",
      description: "High priority items requiring immediate attention",
      category: "urgency",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z"
    }
  ];

  const { data: taxonomyItems, isLoading } = useQuery<TaxonomyItem[]>({
    queryKey: ["/api/taxonomy", { search, category: filterCategory }],
    queryFn: async () => {
      // Mock API call - replace with real endpoint
      return mockTaxonomyData.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) &&
        (filterCategory === "all" || item.category === filterCategory)
      );
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TaxonomyFormData>({
    resolver: zodResolver(taxonomySchema),
    defaultValues: {
      name: "",
      description: "",
      category: "topic",
    },
  });

  const createTaxonomyMutation = useMutation({
    mutationFn: async (data: TaxonomyFormData) => {
      // Mock API call - replace with real endpoint
      console.log("Creating taxonomy item:", data);
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxonomy"] });
      setShowForm(false);
      reset();
      toast({
        title: "Success",
        description: "Taxonomy item created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create taxonomy item",
        variant: "destructive",
      });
    },
  });

  const updateTaxonomyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaxonomyFormData }) => {
      // Mock API call - replace with real endpoint
      console.log("Updating taxonomy item:", id, data);
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxonomy"] });
      setShowForm(false);
      setEditingItem(null);
      reset();
      toast({
        title: "Success",
        description: "Taxonomy item updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update taxonomy item",
        variant: "destructive",
      });
    },
  });

  const deleteTaxonomyMutation = useMutation({
    mutationFn: async (id: string) => {
      // Mock API call - replace with real endpoint
      console.log("Deleting taxonomy item:", id);
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxonomy"] });
      toast({
        title: "Success",
        description: "Taxonomy item deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete taxonomy item",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaxonomyFormData) => {
    if (editingItem) {
      updateTaxonomyMutation.mutate({ id: editingItem.id, data });
    } else {
      createTaxonomyMutation.mutate(data);
    }
  };

  const handleEdit = (item: TaxonomyItem) => {
    setEditingItem(item);
    setValue("name", item.name);
    setValue("description", item.description || "");
    setValue("category", item.category as any);
    setValue("parentId", item.parentId || "");
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this taxonomy item?")) {
      deleteTaxonomyMutation.mutate(id);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "topic": return "bg-blue-100 text-blue-800";
      case "theme": return "bg-green-100 text-green-800";
      case "urgency": return "bg-red-100 text-red-800";
      case "classification": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "topic": return Hash;
      case "theme": return Grid3x3;
      case "urgency": return "!";
      case "classification": return "#";
      default: return Hash;
    }
  };

  if (!canManageTaxonomy) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to manage taxonomy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Taxonomy Management
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Organize and categorize content with topics, themes, and classifications
              </p>
            </div>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingItem(null);
                  reset();
                }} data-testid="button-add-taxonomy">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Taxonomy Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Taxonomy Item" : "Add New Taxonomy Item"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      className="mt-1"
                      data-testid="input-taxonomy-name"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      className="mt-1"
                      rows={3}
                      data-testid="textarea-taxonomy-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      {...register("category")}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      data-testid="select-taxonomy-category"
                    >
                      <option value="topic">Topic</option>
                      <option value="theme">Theme</option>
                      <option value="urgency">Urgency</option>
                      <option value="classification">Classification</option>
                    </select>
                    {errors.category && (
                      <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                      data-testid="button-cancel-taxonomy"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createTaxonomyMutation.isPending || updateTaxonomyMutation.isPending}
                      data-testid="button-save-taxonomy"
                    >
                      {editingItem ? "Update" : "Create"} Taxonomy Item
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search taxonomy items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
              data-testid="input-search-taxonomy"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 bg-white text-sm focus:border-blue-500 focus:outline-none"
              data-testid="select-filter-category"
            >
              <option value="all">All Categories</option>
              <option value="topic">Topics</option>
              <option value="theme">Themes</option>
              <option value="urgency">Urgency</option>
              <option value="classification">Classification</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Taxonomy Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : taxonomyItems?.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No taxonomy items found</h3>
            <p className="text-gray-600">Create your first taxonomy item to get started.</p>
          </div>
        ) : (
          taxonomyItems?.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow" data-testid={`taxonomy-card-${item.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    )}
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                      className="h-8 w-8"
                      data-testid={`button-edit-taxonomy-${item.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      data-testid={`button-delete-taxonomy-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}