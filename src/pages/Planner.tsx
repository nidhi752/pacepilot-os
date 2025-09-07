import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Clock, User, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { format, startOfDay, endOfDay } from 'date-fns';

export default function Planner() {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_at: '',
    priority: 1,
    course_id: '',
    estimated_minutes: '',
  });

  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', user?.id, selectedDate],
    queryFn: async () => {
      const start = startOfDay(selectedDate);
      const end = endOfDay(selectedDate);
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          courses(title, code)
        `)
        .eq('user_id', user?.id)
        .gte('due_at', start.toISOString())
        .lte('due_at', end.toISOString())
        .order('due_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: typeof formData) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          user_id: user?.id,
          course_id: taskData.course_id || null,
          estimated_minutes: taskData.estimated_minutes ? parseInt(taskData.estimated_minutes) : null,
          priority: parseInt(taskData.priority.toString()),
          due_at: taskData.due_at ? new Date(taskData.due_at).toISOString() : null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        due_at: '',
        priority: 1,
        course_id: '',
        estimated_minutes: '',
      });
      toast({
        title: 'Success',
        description: 'Task created successfully!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate(formData);
  };

  const handleToggleTask = (task: any) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    toggleTaskMutation.mutate({ id: task.id, status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planner</h1>
          <p className="text-muted-foreground">Manage your tasks and schedule</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Complete Assignment 1"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task details..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_at">Due Date</Label>
                  <Input
                    id="due_at"
                    type="datetime-local"
                    value={formData.due_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_at: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estimated_minutes">Estimated Minutes</Label>
                  <Input
                    id="estimated_minutes"
                    type="number"
                    value={formData.estimated_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_minutes: e.target.value }))}
                    placeholder="60"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Low</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="course_id">Course (Optional)</Label>
                  <Select value={formData.course_id} onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No course</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Selector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Selected: {format(selectedDate, 'MMM dd, yyyy')}</p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                Tasks for {format(selectedDate, 'MMM dd, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tasks for this day</h3>
                  <p className="text-muted-foreground mb-4">
                    Add a task to get started with your planning
                  </p>
                  <Button onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-4 border rounded-lg ${
                        task.status === 'completed' ? 'bg-muted/50' : ''
                      }`}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleTask(task)}
                        className="p-0 h-auto"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </Button>
                      
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {task.courses && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.courses.code}
                            </span>
                          )}
                          {task.estimated_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.estimated_minutes}m
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full ${
                            task.priority === 3 ? 'bg-red-100 text-red-800' :
                            task.priority === 2 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority === 3 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                      </div>
                      
                      {task.due_at && (
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">
                            {format(new Date(task.due_at), 'HH:mm')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}