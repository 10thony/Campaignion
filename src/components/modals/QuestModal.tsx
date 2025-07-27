import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { QuestFormData, questSchema, DND_QUEST_STATUSES } from "@/lib/validation/schemas"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface Quest {
  _id: string
  name: string
  description?: string
  campaignId?: string
  status: string
  locationId?: string
  completionXP?: number
  rewards?: {
    xp?: number
    gold?: number
    itemIds?: string[]
  }
  createdAt?: number
  creatorId?: string
}

interface QuestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit" | "view"
  quest?: Quest
  onSuccess?: () => void
}

export function QuestModal({
  open,
  onOpenChange,
  mode,
  quest,
  onSuccess,
}: QuestModalProps) {
  const createQuest = useMutation(api.quests.createQuest)
  const campaigns = useQuery(api.campaigns.getMyCampaigns)
  
  const form = useForm<QuestFormData>({
    resolver: zodResolver(questSchema),
    defaultValues: {
      name: quest?.name || "",
      description: quest?.description || "",
      campaignId: quest?.campaignId || "",
      status: quest?.status as any || "idle",
      completionXP: quest?.completionXP || undefined,
      rewards: {
        xp: quest?.rewards?.xp || undefined,
        gold: quest?.rewards?.gold || undefined,
        itemIds: quest?.rewards?.itemIds || [],
      },
    },
  })

  React.useEffect(() => {
    if (quest && (mode === "edit" || mode === "view")) {
      form.reset({
        name: quest.name,
        description: quest.description || "",
        campaignId: quest.campaignId || "",
        status: quest.status as any,
        completionXP: quest.completionXP || undefined,
        rewards: {
          xp: quest.rewards?.xp || undefined,
          gold: quest.rewards?.gold || undefined,
          itemIds: quest.rewards?.itemIds || [],
        },
      })
    } else if (mode === "create") {
      form.reset({
        name: "",
        description: "",
        campaignId: "",
        status: "idle",
        completionXP: undefined,
        rewards: {
          xp: undefined,
          gold: undefined,
          itemIds: [],
        },
      })
    }
  }, [quest, mode, form])

  const onSubmit = async (data: QuestFormData) => {
    try {
      if (mode === "create") {
        await createQuest(data)
      }
      // TODO: Add edit functionality when mutation is available
      
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error("Failed to save quest:", error)
      // TODO: Show toast notification for error
    }
  }

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Create Quest"
      case "edit":
        return "Edit Quest"
      case "view":
        return "Quest Details"
      default:
        return "Quest"
    }
  }

  const getDescription = () => {
    switch (mode) {
      case "create":
        return "Create a new quest for your D&D campaign."
      case "edit":
        return "Edit quest details and progress."
      case "view":
        return "View quest information and progress."
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
                    <FormLabel>Quest Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter quest name..."
                        {...field}
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for your quest (3-100 characters)
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
                        placeholder="Describe the quest objectives, story, and important details..."
                        className="min-h-[120px]"
                        {...field}
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed description of the quest (max 1000 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="campaignId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a campaign..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No Campaign</SelectItem>
                          {campaigns?.map((campaign) => (
                            <SelectItem key={campaign._id} value={campaign._id}>
                              {campaign.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Optional campaign assignment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DND_QUEST_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Current quest status
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="completionXP"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completion XP</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Experience points for completing this quest..."
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ""}
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormDescription>
                      Experience points awarded for quest completion
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Rewards</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rewards.xp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bonus XP</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Additional XP..."
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ""}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional experience points
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rewards.gold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gold Reward</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Gold pieces..."
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ""}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormDescription>
                          Gold pieces reward
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
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
                  {mode === "create" ? "Create Quest" : "Save Changes"}
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