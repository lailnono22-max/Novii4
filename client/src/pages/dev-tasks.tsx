import Layout from "@/components/layout";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Generating 100 dummy tasks
const tasks = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  title: `Development Task #${i + 1}: ${[
    "Optimize rendering performance",
    "Fix accessibility issues in navigation",
    "Implement dark mode for all components",
    "Add unit tests for utility functions",
    "Refactor user authentication flow",
    "Update dependency packages",
    "Create new icon set for sidebar",
    "Improve SEO meta tags",
    "Add localization support for Spanish",
    "Fix layout shift on image load",
    "Implement push notifications",
    "Add gesture support for mobile",
    "Optimize database queries",
    "Create documentation for API",
    "Design new landing page hero",
    "Add skeleton loading states",
    "Implement drag and drop for tasks",
    "Fix z-index issues in modals",
    "Add keyboard shortcuts",
    "Optimize bundle size"
  ][i % 20]}`,
  status: i < 35 ? "completed" : i < 45 ? "in-progress" : "pending",
  priority: i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low"
}));

export default function DevTasks() {
  const [taskList, setTaskList] = useState(tasks);

  const toggleTask = (id: number) => {
    setTaskList(prev => prev.map(t => 
      t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t
    ));
  };

  return (
    <Layout>
      <div className="w-full min-h-screen bg-background p-4 md:p-8">
        <div className="flex flex-col gap-2 mb-6">
            <h1 className="text-3xl font-display font-bold">Development Roadmap</h1>
            <p className="text-muted-foreground">100 Active Tasks for Novii Platform Development</p>
            <div className="flex gap-4 text-sm mt-2">
                <div className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="w-4 h-4" /> 
                    <span className="font-bold">{taskList.filter(t => t.status === "completed").length} Completed</span>
                </div>
                <div className="flex items-center gap-1 text-orange-500">
                    <Clock className="w-4 h-4" /> 
                    <span className="font-bold">{taskList.filter(t => t.status === "in-progress").length} In Progress</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                    <Circle className="w-4 h-4" /> 
                    <span className="font-bold">{taskList.filter(t => t.status === "pending").length} Pending</span>
                </div>
            </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)] border border-border rounded-xl bg-card">
            <div className="divide-y divide-border">
                {taskList.map((task) => (
                    <div 
                        key={task.id} 
                        className={cn(
                            "p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors cursor-pointer group",
                            task.status === "completed" && "bg-muted/30"
                        )}
                        onClick={() => toggleTask(task.id)}
                    >
                        <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                            task.status === "completed" ? "bg-green-500 border-green-500" : "border-muted-foreground group-hover:border-primary"
                        )}>
                            {task.status === "completed" && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        
                        <div className="flex-1">
                            <div className={cn(
                                "font-medium transition-all",
                                task.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"
                            )}>
                                {task.title}
                            </div>
                            <div className="flex gap-2 mt-1">
                                <span className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                    task.priority === "High" ? "bg-red-500/10 text-red-500" : 
                                    task.priority === "Medium" ? "bg-yellow-500/10 text-yellow-500" : 
                                    "bg-blue-500/10 text-blue-500"
                                )}>
                                    {task.priority}
                                </span>
                                <span className="text-[10px] text-muted-foreground px-2 py-0.5">ID: NOV-{task.id}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </div>
    </Layout>
  );
}
