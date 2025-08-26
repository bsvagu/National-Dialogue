import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import type { Submission } from "@/types/api";

const submissionFormSchema = z.object({
  channel: z.enum(["mobile", "web", "whatsapp", "social"]),
  text: z.string().min(10, "Submission text must be at least 10 characters"),
  province: z.enum([
    "eastern_cape",
    "free_state", 
    "gauteng",
    "kwazulu_natal",
    "limpopo",
    "mpumalanga",
    "northern_cape",
    "north_west",
    "western_cape"
  ]).optional(),
  mediaUrls: z.string().optional(),
});

type SubmissionFormData = z.infer<typeof submissionFormSchema>;

interface SubmissionFormProps {
  submission?: Submission;
  onSuccess?: () => void;
}

export default function SubmissionForm({ submission, onSuccess }: SubmissionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSubmissionMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      const payload = {
        ...data,
        mediaUrls: data.mediaUrls ? data.mediaUrls.split(',').map(url => url.trim()).filter(Boolean) : undefined,
      };
      await apiRequest("POST", "/api/submissions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({
        title: "Success",
        description: "Submission created successfully",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create submission",
        variant: "destructive",
      });
    },
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      if (!submission) return;
      const payload = {
        ...data,
        mediaUrls: data.mediaUrls ? data.mediaUrls.split(',').map(url => url.trim()).filter(Boolean) : undefined,
      };
      await apiRequest("PATCH", `/api/submissions/${submission.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({
        title: "Success",
        description: "Submission updated successfully",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update submission",
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
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      channel: submission?.channel as any || "web",
      text: submission?.text || "",
      province: submission?.province as any || undefined,
      mediaUrls: submission?.mediaUrls ? (submission.mediaUrls as string[]).join(', ') : "",
    },
  });

  const selectedChannel = watch("channel");
  const selectedProvince = watch("province");

  const onSubmit = (data: SubmissionFormData) => {
    if (submission) {
      updateSubmissionMutation.mutate(data);
    } else {
      createSubmissionMutation.mutate(data);
    }
  };

  const isLoading = createSubmissionMutation.isPending || updateSubmissionMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="submission-form">
      <div>
        <Label htmlFor="channel">Channel</Label>
        <Select 
          value={selectedChannel} 
          onValueChange={(value) => setValue("channel", value as any)}
        >
          <SelectTrigger className="mt-1" data-testid="select-channel">
            <SelectValue placeholder="Select channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="mobile">Mobile App</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="social">Social Media</SelectItem>
          </SelectContent>
        </Select>
        {errors.channel && (
          <p className="text-sm text-red-600 mt-1">{errors.channel.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="text">Submission Text</Label>
        <Textarea
          id="text"
          {...register("text")}
          className="mt-1 min-h-[120px]"
          placeholder="Enter the submission content..."
          data-testid="textarea-submission-text"
        />
        {errors.text && (
          <p className="text-sm text-red-600 mt-1">{errors.text.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="province">Province (Optional)</Label>
        <Select
          value={selectedProvince || "none"}
          onValueChange={(value) => setValue("province", value === "none" ? undefined : value as any)}
        >
          <SelectTrigger className="mt-1" data-testid="select-province">
            <SelectValue placeholder="Select province" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Province</SelectItem>
            <SelectItem value="eastern_cape">Eastern Cape</SelectItem>
            <SelectItem value="free_state">Free State</SelectItem>
            <SelectItem value="gauteng">Gauteng</SelectItem>
            <SelectItem value="kwazulu_natal">KwaZulu-Natal</SelectItem>
            <SelectItem value="limpopo">Limpopo</SelectItem>
            <SelectItem value="mpumalanga">Mpumalanga</SelectItem>
            <SelectItem value="northern_cape">Northern Cape</SelectItem>
            <SelectItem value="north_west">North West</SelectItem>
            <SelectItem value="western_cape">Western Cape</SelectItem>
          </SelectContent>
        </Select>
        {errors.province && (
          <p className="text-sm text-red-600 mt-1">{errors.province.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="mediaUrls">Media URLs (Optional)</Label>
        <Input
          id="mediaUrls"
          {...register("mediaUrls")}
          className="mt-1"
          placeholder="Enter URLs separated by commas"
          data-testid="input-media-urls"
        />
        <p className="text-xs text-slate-500 mt-1">
          Enter multiple URLs separated by commas
        </p>
        {errors.mediaUrls && (
          <p className="text-sm text-red-600 mt-1">{errors.mediaUrls.message}</p>
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
          {isLoading ? "Saving..." : submission ? "Update Submission" : "Create Submission"}
        </Button>
      </div>
    </form>
  );
}
