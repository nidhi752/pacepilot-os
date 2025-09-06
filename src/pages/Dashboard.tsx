import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, BookOpen, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { format, isToday, isTomorrow } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: todayTasks = [] } = useQuery({
    queryKey: ['today-tasks', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('tasks')
        .select('*, courses(title)')
        .eq('user_id', user?.id)
        .gte('due_at', today)
        .lte('due_at', today + 'T23:59:59')
        .order('due_at');
      return data || [];
    },
    enabled: !!user,
  });

  const { data: upcomingExams = [] } = useQuery({
    queryKey: ['upcoming-exams', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString();
      const { data } = await supabase
        .from('exams')
        .select('*, courses(title)')
        .eq('user_id', user?.id)
        .gte('exam_date', today)
        .order('exam_date')
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: recentNotes = [] } = useQuery({
    queryKey: ['recent-notes', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notes')
        .select('*, courses(title)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: studyStats } = useQuery({
    queryKey: ['study-stats', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [completedTasks, totalMinutes] = await Promise.all([
        supabase
          .from('tasks')
          .select('count')
          .eq('user_id', user?.id)
          .eq('status', 'completed')
          .gte('completed_at', today)
          .single(),
        supabase
          .from('tasks')
          .select('actual_minutes')
          .eq('user_id', user?.id)
          .eq('status', 'completed')
          .gte('completed_at', today)
      ]);

      const minutesToday = totalMinutes.data?.reduce((sum, task) => 
        sum + (task.actual_minutes || 0), 0
      ) || 0;

      return {
        completedToday: completedTasks.data?.count || 0,
        minutesToday,
        targetMinutes: 240 // Default target, should come from study profile
      };
    },
    enabled: !!user,
  });

  const getExamDateLabel = (examDate: string) => {
    const date = new Date(examDate);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to your Study OS</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studyStats?.completedToday || 0}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((studyStats?.minutesToday || 0) / 60 * 10) / 10}h
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {Math.round((studyStats?.targetMinutes || 240) / 60)}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground">Due today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingExams.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="text-muted-foreground">No tasks due today</p>
            ) : (
              <div className="space-y-3">
                {todayTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {task.courses?.title || 'Personal'}
                      </p>
                    </div>
                    <Badge variant={task.priority > 3 ? 'destructive' : 'secondary'}>
                      Priority {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingExams.length === 0 ? (
              <p className="text-muted-foreground">No upcoming exams</p>
            ) : (
              <div className="space-y-3">
                {upcomingExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{exam.exam_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {exam.courses?.title || 'General'}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {getExamDateLabel(exam.exam_date)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentNotes.length === 0 ? (
            <p className="text-muted-foreground">No recent notes</p>
          ) : (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <div key={note.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{note.title || 'Untitled Note'}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{note.source_type.toUpperCase()}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), 'MMM d')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {note.content}
                  </p>
                  {note.courses && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {note.courses.title}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}