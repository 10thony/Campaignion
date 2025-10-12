import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle, 
  Clock, 
  XCircle,
  Users,
  MapPin,
  Package,
  Target,
  ArrowRight,
  AlertTriangle
} from "lucide-react"

import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { questTaskSchema, QuestTaskFormData } from "../../lib/validation/schemas"
import { useAuthenticationGuard } from "../../hooks/useAuthenticationGuard"

// D&D 5e Quest Task Types with appropriate icons
const QUEST_TASK_TYPES = [
  { value: "Fetch", label: "Fetch Quest", icon: Package, description: "Retrieve specific items or objects" },
  { value: "Kill", label: "Elimination", icon: Target, description: "Defeat enemies or creatures" },
  { value: "Speak", label: "Dialogue", icon: Users, description: "Communicate with specific NPCs" },
  { value: "Explore", label: "Exploration", icon: MapPin, description: "Discover new locations or areas" },
  { value: "Puzzle", label: "Puzzle", icon: Circle, description: "Solve riddles or mechanical puzzles" },
  { value: "Deliver", label: "Delivery", icon: ArrowRight, description: "Transport items to destinations" },
  { value: "Escort", label: "Escort", icon: Users, description: "Protect and guide NPCs safely" },
  { value: "Custom", label: "Custom Task", icon: Target, description: "Custom objective defined by DM" },
] as const

const TASK_STATUS_OPTIONS = [
  { value: "NotStarted", label: "Not Started", icon: Circle, variant: "outline" as const },
  { value: "InProgress", label: "In Progress", icon: Clock, variant: "secondary" as const },
  { value: "Completed", label: "Completed", icon: CheckCircle, variant: "default" as const },
  { value: "Failed", label: "Failed", icon: XCircle, variant: "destructive" as const },
] as const

interface QuestTask {
  _id: Id<"questTasks">
  questId: Id<"quests">
  title: string
  description?: string
  type: "Fetch" | "Kill" | "Speak" | "Explore" | "Puzzle" | "Deliver" | "Escort" | "Custom"
  status: "NotStarted" | "InProgress" | "Completed" | "Failed"
  dependsOn?: Id<"questTasks">[]
  assignedTo?: Id<"characters">[]
  locationId?: Id<"locations">
  targetNpcId?: Id<"characters">
  requiredItemIds?: Id<"items">[]
  completionNotes?: string
  createdAt?: number
  updatedAt?: number
}

interface QuestTaskManagerProps {
  questId?: Id<"quests">
  mode: "read" | "create" | "edit"
  readOnly?: boolean
}

export function QuestTaskManager({ questId, mode, readOnly = false }: QuestTaskManagerProps) {
  const { user } = useAuthenticationGuard()
  
  const [selectedTask, setSelectedTask] = useState<QuestTask | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskMode, setTaskMode] = useState<"create" | "edit" | "view">("create")
  
  // Convex queries and mutations
  const questTasks = useQuery(
    api.questTasks.getQuestTasks,
    questId ? { questId } : "skip"
  )
  const characters = useQuery(api.characters.getCharacters)
  const locations = useQuery(api.locations.getLocations)
  const items = useQuery(api.items.getItems)
  
  const createQuestTask = useMutation(api.questTasks.createQuestTask)
  const updateQuestTask = useMutation(api.questTasks.updateQuestTask)
  const deleteQuestTask = useMutation(api.questTasks.deleteQuestTask)
  
  // Form for task creation/editing
  const taskForm = useForm<QuestTaskFormData>({
    resolver: zodResolver(questTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "Custom",
      status: "NotStarted",
      dependsOn: [],
      assignedTo: [],
      locationId: undefined,
      targetNpcId: undefined,
      requiredItemIds: [],
      completionNotes: "",
    },
  })

  React.useEffect(() => {
    if (selectedTask && (taskMode === "edit" || taskMode === "view")) {
      taskForm.reset({
        title: selectedTask.title,
        description: selectedTask.description || "",
        type: selectedTask.type,
        status: selectedTask.status,
        dependsOn: selectedTask.dependsOn || [],
        assignedTo: selectedTask.assignedTo || [],
        locationId: selectedTask.locationId || undefined,
        targetNpcId: selectedTask.targetNpcId || undefined,
        requiredItemIds: selectedTask.requiredItemIds || [],
        completionNotes: selectedTask.completionNotes || "",
      })
    } else if (taskMode === "create") {
      taskForm.reset({
        title: "",
        description: "",
        type: "Custom",
        status: "NotStarted",
        dependsOn: [],
        assignedTo: [],
        locationId: undefined,
        targetNpcId: undefined,
        requiredItemIds: [],
        completionNotes: "",
      })
    }
  }, [selectedTask, taskMode, taskForm])

  const handleCreateTask = () => {
    setSelectedTask(null)
    setTaskMode("create")
    setIsTaskModalOpen(true)
  }

  const handleEditTask = (task: QuestTask) => {
    setSelectedTask(task)
    setTaskMode("edit")
    setIsTaskModalOpen(true)
  }

  const handleViewTask = (task: QuestTask) => {
    setSelectedTask(task)
    setTaskMode("view")
    setIsTaskModalOpen(true)
  }

  const handleDeleteTask = async (taskId: Id<"questTasks">) => {
    try {
      await deleteQuestTask({ id: taskId })
      toast.success("Task deleted successfully!")
    } catch (error) {
      console.error("Failed to delete task:", error)
      toast.error("Failed to delete task. Please try again.")
    }
  }

  const onTaskSubmit = async (data: QuestTaskFormData) => {
    if (!questId) {
      toast.error("Quest ID is required to create tasks")
      return
    }

    try {
      if (taskMode === "create") {
        await createQuestTask({ questId, ...data })
        toast.success("Task created successfully!")
      } else if (taskMode === "edit" && selectedTask) {
        await updateQuestTask({ id: selectedTask._id, ...data })
        toast.success("Task updated successfully!")
      }
      
      setIsTaskModalOpen(false)
      taskForm.reset()
    } catch (error) {
      console.error("Failed to save task:", error)
      toast.error("Failed to save task. Please try again.")
    }
  }

  const getTaskTypeIcon = (type: string) => {
    const taskType = QUEST_TASK_TYPES.find(t => t.value === type)
    return taskType ? taskType.icon : Target
  }

  const getStatusInfo = (status: string) => {
    return TASK_STATUS_OPTIONS.find(s => s.value === status) || TASK_STATUS_OPTIONS[0]
  }

  const canEditTasks = !readOnly && (mode === "create" || mode === "edit")

  // Check for dependency cycles
  const hasDependencyCycle = (taskId: Id<"questTasks">, dependsOn: Id<"questTasks">[]): boolean => {
    const visited = new Set<string>()
    
    const checkCycle = (currentId: string, dependencies: Id<"questTasks">[]): boolean => {
      if (visited.has(currentId)) return true
      visited.add(currentId)
      
      for (const depId of dependencies) {
        const depTask = questTasks?.find(t => t._id === depId)
        if (depTask && checkCycle(depId, depTask.dependsOn || [])) {
          return true
        }
      }
      
      visited.delete(currentId)
      return false
    }
    
    return checkCycle(taskId, dependsOn)
  }

  if (!questId) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">Quest Required</p>
        <p className="text-sm">Save the quest first to manage tasks</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Task Creation Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Quest Tasks</h3>
          <p className="text-sm text-muted-foreground">
            Break down the quest into manageable tasks
          </p>
        </div>
        {canEditTasks && (
          <Button onClick={handleCreateTask} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {questTasks?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Tasks Yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Break this quest down into specific tasks to track progress
              </p>
              {canEditTasks && (
                <Button onClick={handleCreateTask} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Task
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          questTasks?.map((task) => {
            const TaskIcon = getTaskTypeIcon(task.type)
            const statusInfo = getStatusInfo(task.status)
            const StatusIcon = statusInfo.icon
            
            return (
              <Card key={task._id} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        <TaskIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium truncate">{task.title}</h4>
                          <Badge variant={statusInfo.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {QUEST_TASK_TYPES.find(t => t.value === task.type)?.label}
                          </Badge>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {task.assignedTo && task.assignedTo.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {task.assignedTo.length} assigned
                            </span>
                          )}
                          {task.locationId && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Location set
                            </span>
                          )}
                          {task.dependsOn && task.dependsOn.length > 0 && (
                            <span className="flex items-center gap-1">
                              <ArrowRight className="h-3 w-3" />
                              {task.dependsOn.length} dependencies
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewTask(task)}
                      >
                        View
                      </Button>
                      {canEditTasks && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{task.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Task Creation/Edit Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {taskMode === "create" ? "Create Task" : taskMode === "edit" ? "Edit Task" : "Task Details"}
            </DialogTitle>
            <DialogDescription>
              {taskMode === "create" ? "Add a new task to this quest" : 
               taskMode === "edit" ? "Modify task details" : "View task information"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4">
              <FormField
                control={taskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={taskMode === "view"}
                        placeholder="Enter task title..." 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={taskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        disabled={taskMode === "view"}
                        placeholder="Describe what needs to be done..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={taskForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={taskMode === "view"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {QUEST_TASK_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={taskForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={taskMode === "view"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TASK_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {taskMode === "view" && selectedTask?.completionNotes && (
                <div>
                  <Label>Completion Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded">
                    {selectedTask.completionNotes}
                  </p>
                </div>
              )}
              
              {taskMode !== "view" && (
                <FormField
                  control={taskForm.control}
                  name="completionNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completion Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Notes about task completion..."
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
          
          <DialogFooter>
            {taskMode === "view" ? (
              <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={taskForm.handleSubmit(onTaskSubmit)}>
                  {taskMode === "create" ? "Create Task" : "Save Changes"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}