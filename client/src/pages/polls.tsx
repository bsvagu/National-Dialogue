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
import { Plus, Edit, Trash2, BarChart2, Calendar, MapPin, Users } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const pollSchema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "At least 2 options required"),
  startAt: z.string().min(1, "Start date is required"),
  endAt: z.string().min(1, "End date is required"),
  targetProvince: z.string().optional(),
});

type PollFormData = z.infer<typeof pollSchema>;

interface Poll {
  id: string;
  question: string;
  options: string[];
  startAt: string;
  endAt: string;
  targetProvince?: string;
  createdAt: string;
  responses?: number;
}

export default function Polls() {
  const [showForm, setShowForm] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canManagePolls = currentUser ? hasPermission(currentUser.roles, "manage_settings") : false;

  // Mock data for demonstration - would connect to real API
  const mockPollsData: Poll[] = [
    {
      id: "1",
      question: "What is your top priority for infrastructure development in your area?",
      options: ["Roads and Transportation", "Water and Sanitation", "Electricity", "Healthcare Facilities", "Educational Facilities"],
      startAt: "2024-01-15T00:00:00Z",
      endAt: "2024-02-15T23:59:59Z",
      targetProvince: "gauteng",
      createdAt: "2024-01-10T10:00:00Z",
      responses: 1250
    },
    {
      id: "2", 
      question: "How would you rate the current state of public healthcare services?",
      options: ["Excellent", "Good", "Fair", "Poor", "Very Poor"],
      startAt: "2024-01-20T00:00:00Z",
      endAt: "2024-03-20T23:59:59Z",
      createdAt: "2024-01-18T10:00:00Z",
      responses: 890
    },
    {
      id: "3",
      question: "Which economic development initiative should receive priority funding?",
      options: ["Small Business Support", "Skills Development", "Tourism Development", "Agriculture Support", "Technology Innovation"],
      startAt: "2024-02-01T00:00:00Z",
      endAt: "2024-04-01T23:59:59Z",
      targetProvince: "western_cape",
      createdAt: "2024-01-25T10:00:00Z",
      responses: 0
    }
  ];

  const { data: polls, isLoading } = useQuery<Poll[]>({
    queryKey: ["/api/polls", { search, status: statusFilter }],
    queryFn: async () => {
      // Mock API call - replace with real endpoint
      const now = new Date();
      return mockPollsData.filter(poll => {
        const matchesSearch = poll.question.toLowerCase().includes(search.toLowerCase());
        const pollStart = new Date(poll.startAt);
        const pollEnd = new Date(poll.endAt);
        
        let matchesStatus = true;
        if (statusFilter === "active") {
          matchesStatus = now >= pollStart && now <= pollEnd;
        } else if (statusFilter === "upcoming") {
          matchesStatus = now < pollStart;
        } else if (statusFilter === "ended") {
          matchesStatus = now > pollEnd;
        }
        
        return matchesSearch && matchesStatus;
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
  } = useForm<PollFormData>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      question: "",
      options: ["", ""],
      startAt: "",
      endAt: "",
      targetProvince: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const createPollMutation = useMutation({
    mutationFn: async (data: PollFormData) => {
      // Mock API call - replace with real endpoint
      console.log("Creating poll:", data);
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      setShowForm(false);
      reset();
      toast({
        title: "Success",
        description: "Poll created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create poll",
        variant: "destructive",
      });
    },
  });

  const updatePollMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PollFormData }) => {
      // Mock API call - replace with real endpoint
      console.log("Updating poll:", id, data);
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      setShowForm(false);
      setEditingPoll(null);
      reset();
      toast({
        title: "Success",
        description: "Poll updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update poll",
        variant: "destructive",
      });
    },
  });

  const deletePollMutation = useMutation({
    mutationFn: async (id: string) => {
      // Mock API call - replace with real endpoint
      console.log("Deleting poll:", id);
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      toast({
        title: "Success",
        description: "Poll deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete poll",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PollFormData) => {
    if (editingPoll) {
      updatePollMutation.mutate({ id: editingPoll.id, data });
    } else {
      createPollMutation.mutate(data);
    }
  };

  const handleEdit = (poll: Poll) => {
    setEditingPoll(poll);
    setValue("question", poll.question);
    setValue("options", poll.options);
    setValue("startAt", poll.startAt.slice(0, 16)); // Format for datetime-local input
    setValue("endAt", poll.endAt.slice(0, 16));
    setValue("targetProvince", poll.targetProvince || "");
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this poll?")) {
      deletePollMutation.mutate(id);
    }
  };

  const getPollStatus = (poll: Poll) => {
    const now = new Date();
    const start = new Date(poll.startAt);
    const end = new Date(poll.endAt);

    if (now < start) {
      return { status: "upcoming", color: "bg-blue-100 text-blue-800", text: "Upcoming" };
    } else if (now > end) {
      return { status: "ended", color: "bg-gray-100 text-gray-800", text: "Ended" };
    } else {
      return { status: "active", color: "bg-green-100 text-green-800", text: "Active" };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!canManagePolls) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to manage polls.</p>
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
                <BarChart2 className="h-5 w-5" />
                Polls Management
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Create and manage citizen engagement polls for feedback collection
              </p>
            </div>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPoll(null);
                  reset();
                }} data-testid="button-add-poll">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Poll
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingPoll ? "Edit Poll" : "Create New Poll"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="question">Poll Question</Label>
                    <Textarea
                      id="question"
                      {...register("question")}
                      className="mt-1"
                      rows={3}
                      placeholder="What would you like to ask citizens?"
                      data-testid="textarea-poll-question"
                    />
                    {errors.question && (
                      <p className="text-sm text-red-600 mt-1">{errors.question.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Poll Options</Label>
                    <div className="space-y-2 mt-2">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center space-x-2">
                          <Input
                            {...register(`options.${index}` as const)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1"
                            data-testid={`input-poll-option-${index}`}
                          />
                          {fields.length > 2 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => remove(index)}
                              data-testid={`button-remove-option-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append("")}
                        data-testid="button-add-option"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                    {errors.options && (
                      <p className="text-sm text-red-600 mt-1">{errors.options.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startAt">Start Date & Time</Label>
                      <Input
                        id="startAt"
                        type="datetime-local"
                        {...register("startAt")}
                        className="mt-1"
                        data-testid="input-poll-start"
                      />
                      {errors.startAt && (
                        <p className="text-sm text-red-600 mt-1">{errors.startAt.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="endAt">End Date & Time</Label>
                      <Input
                        id="endAt"
                        type="datetime-local"
                        {...register("endAt")}
                        className="mt-1"
                        data-testid="input-poll-end"
                      />
                      {errors.endAt && (
                        <p className="text-sm text-red-600 mt-1">{errors.endAt.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="targetProvince">Target Province (Optional)</Label>
                    <select
                      {...register("targetProvince")}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      data-testid="select-poll-province"
                    >
                      <option value="">All Provinces</option>
                      <option value="gauteng">Gauteng</option>
                      <option value="western_cape">Western Cape</option>
                      <option value="kwazulu_natal">KwaZulu-Natal</option>
                      <option value="eastern_cape">Eastern Cape</option>
                      <option value="free_state">Free State</option>
                      <option value="limpopo">Limpopo</option>
                      <option value="mpumalanga">Mpumalanga</option>
                      <option value="northern_cape">Northern Cape</option>
                      <option value="north_west">North West</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                      data-testid="button-cancel-poll"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createPollMutation.isPending || updatePollMutation.isPending}
                      data-testid="button-save-poll"
                    >
                      {editingPoll ? "Update" : "Create"} Poll
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
              placeholder="Search polls..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
              data-testid="input-search-polls"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 bg-white text-sm focus:border-blue-500 focus:outline-none"
              data-testid="select-filter-status"
            >
              <option value="all">All Polls</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Polls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : polls?.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
            <p className="text-gray-600">Create your first poll to start collecting citizen feedback.</p>
          </div>
        ) : (
          polls?.map((poll) => {
            const status = getPollStatus(poll);
            return (
              <Card key={poll.id} className="hover:shadow-md transition-shadow" data-testid={`poll-card-${poll.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={status.color}>
                          {status.text}
                        </Badge>
                        {poll.targetProvince && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {poll.targetProvince.replace('_', ' ').toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 mb-3 line-clamp-2">{poll.question}</h3>
                      <div className="space-y-1 mb-4">
                        {poll.options.slice(0, 3).map((option, index) => (
                          <div key={index} className="text-sm text-gray-600 flex items-center">
                            <span className="w-4 h-4 border border-gray-300 rounded-sm mr-2 flex-shrink-0"></span>
                            {option}
                          </div>
                        ))}
                        {poll.options.length > 3 && (
                          <div className="text-sm text-gray-500">+{poll.options.length - 3} more options</div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(poll.startAt)} - {formatDate(poll.endAt)}
                        </div>
                        {poll.responses !== undefined && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {poll.responses} responses
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(poll)}
                        className="h-8 w-8"
                        data-testid={`button-edit-poll-${poll.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(poll.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        data-testid={`button-delete-poll-${poll.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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