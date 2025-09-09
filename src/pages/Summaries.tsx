import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Plus, BookOpen, Calendar, Brain, RotateCcw, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function Summaries() {
  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [formData, setFormData] = useState({
    period_type: 'week' as 'week' | 'month',
    course_id: '',
    start_date: '',
    end_date: '',
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

  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['summaries', user?.id, selectedCourse],
    queryFn: async () => {
      let query = supabase
        .from('summaries')
        .select(`
          *,
          courses(title, code)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (selectedCourse !== 'all') {
        query = query.eq('course_id', selectedCourse);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createSummaryMutation = useMutation({
    mutationFn: async (summaryData: typeof formData) => {
      // Generate mock summary content for now
      const mockSummary = `This is a ${summaryData.period_type}ly summary for the period from ${summaryData.start_date} to ${summaryData.end_date}. Key topics covered include important concepts and materials from your studies.`;
      
      const mockFlashcards = [
        {
          front: "What is the main concept covered this period?",
          back: "The main concept involves understanding the key principles and their applications.",
          difficulty: 1
        },
        {
          front: "How do you apply the learned principles?",
          back: "By following the systematic approach and considering all relevant factors.",
          difficulty: 2
        }
      ];

      const { data, error } = await supabase
        .from('summaries')
        .insert({
          ...summaryData,
          user_id: user?.id,
          course_id: summaryData.course_id || null,
          summary_text: mockSummary,
          flashcards_json: mockFlashcards,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summaries'] });
      setOpen(false);
      setFormData({
        period_type: 'week',
        course_id: '',
        start_date: '',
        end_date: '',
      });
      toast({
        title: 'Success',
        description: 'Summary generated successfully!',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSummaryMutation.mutate(formData);
  };

  const handlePeriodTypeChange = (periodType: 'week' | 'month') => {
    const now = new Date();
    let startDate, endDate;
    
    if (periodType === 'week') {
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
    } else {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }
    
    setFormData(prev => ({
      ...prev,
      period_type: periodType,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
    }));
  };

  const FlashcardComponent = ({ flashcard, index }: { flashcard: any; index: number }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    
    return (
      <Card 
        className="cursor-pointer transition-transform hover:scale-105 min-h-[120px]"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <CardContent className="p-4 flex items-center justify-center text-center">
          {isFlipped ? (
            <div>
              <p className="font-medium text-sm mb-2">Answer:</p>
              <p className="text-sm">{flashcard.back}</p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-sm mb-2">Question {index + 1}:</p>
              <p className="text-sm">{flashcard.front}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Summaries</h1>
          <p className="text-muted-foreground">Generate and review study summaries with flashcards</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Summary
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New Summary</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="period_type">Period Type</Label>
                <Select 
                  value={formData.period_type} 
                  onValueChange={(value: any) => handlePeriodTypeChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Weekly Summary</SelectItem>
                    <SelectItem value="month">Monthly Summary</SelectItem>
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
                    <SelectItem value="all-courses">All courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={createSummaryMutation.isPending}>
                {createSummaryMutation.isPending ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Label htmlFor="course-filter">Filter by course:</Label>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.code} - {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div>Loading summaries...</div>
      ) : summaries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No summaries yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Generate your first summary to get insights and flashcards from your studies
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Your First Summary
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {summaries.map((summary) => (
            <Card key={summary.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {summary.period_type === 'week' ? 'Weekly' : 'Monthly'} Summary
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(summary.start_date), 'MMM dd')} - {format(new Date(summary.end_date), 'MMM dd, yyyy')}
                      </div>
                      {summary.courses && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {summary.courses.code}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(summary.created_at), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />
                    {summary.period_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {summary.summary_text && (
                  <div>
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {summary.summary_text}
                    </p>
                  </div>
                )}
                
                {summary.flashcards_json && Array.isArray(summary.flashcards_json) && summary.flashcards_json.length > 0 && (
                  <div>
                    <Separator className="mb-4" />
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Flashcards ({(summary.flashcards_json as any[]).length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(summary.flashcards_json as any[]).map((flashcard: any, index: number) => (
                        <FlashcardComponent 
                          key={index} 
                          flashcard={flashcard} 
                          index={index} 
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Click on flashcards to flip them and see the answers
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}