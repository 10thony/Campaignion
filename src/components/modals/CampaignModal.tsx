import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { CampaignFormData, campaignSchema } from "@/lib/validation/schemas"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface Campaign {
  _id: string
  name: string
  description?: string
  worldSetting?: string
  isPublic: boolean
  createdAt?: number
  dmId?: string
}

interface CampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit" | "view"
  campaign?: Campaign
  onSuccess?: () => void
}

export function CampaignModal({
  open,
  onOpenChange,
  mode,
  campaign,
  onSuccess,
}: CampaignModalProps) {
  const createCampaign = useMutation(api.campaigns.createCampaign)
  
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: campaign?.name || "",
      description: campaign?.description || "",
      worldSetting: campaign?.worldSetting || "",
      isPublic: campaign?.isPublic || false,
    },
  })

  React.useEffect(() => {
    if (campaign && (mode === "edit" || mode === "view")) {
      form.reset({
        name: campaign.name,
        description: campaign.description || "",
        worldSetting: campaign.worldSetting || "",
        isPublic: campaign.isPublic,
      })
    } else if (mode === "create") {
      form.reset({
        name: "",
        description: "",
        worldSetting: "",
        isPublic: false,
      })
    }
  }, [campaign, mode, form])

  const onSubmit = async (data: CampaignFormData) => {
    try {
      if (mode === "create") {
        await createCampaign(data)
      }
      // TODO: Add edit functionality when mutation is available
      
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error("Failed to save campaign:", error)
      // TODO: Show toast notification for error
    }
  }

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Create Campaign"
      case "edit":
        return "Edit Campaign"
      case "view":
        return "Campaign Details"
      default:
        return "Campaign"
    }
  }

  const getDescription = () => {
    switch (mode) {
      case "create":
        return "Create a new D&D campaign to manage your adventures."
      case "edit":
        return "Edit your campaign details."
      case "view":
        return "View campaign information."
      default:
        return ""
    }
  }

  const isReadOnly = mode === "view"
  const isSubmitting = form.formState.isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter campaign name..."
                        {...field}
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormDescription>
                      A unique name for your campaign (3-100 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your campaign's story, setting, or goals..."
                        className="min-h-[100px]"
                        {...field}
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description of your campaign (max 500 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="worldSetting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>World Setting</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Forgotten Realms, Homebrew, Eberron..."
                        {...field}
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormDescription>
                      The world or setting where your campaign takes place (max 200 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={isReadOnly}
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Public Campaign</FormLabel>
                      <FormDescription>
                        Allow other users to view and potentially join this campaign
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {!isReadOnly && (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "create" ? "Create Campaign" : "Save Changes"}
                </Button>
              </DialogFooter>
            )}

            {isReadOnly && (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 