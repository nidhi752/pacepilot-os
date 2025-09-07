import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HelpCircle, Plus, BookOpen, Clock, CheckCircle2, XCircle, Trophy, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Quizzes() {
  const [open, setOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: '',
    scope_type: 'week' as 'day' | 'week' | 'unit' | 'random',
    scope_value: '',
    course_id: '',
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

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ['quizzes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          courses(title, code)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: quizQuestions = [] } = useQuery({
    queryKey: ['quiz-questions', selectedQuiz?.id],
    queryFn: async () => {
      if (!selectedQuiz) return [];
      
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', selectedQuiz.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedQuiz,
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ['quiz-attempts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes(title, courses(code))
        `)
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createQuizMutation = useMutation({
    mutationFn: async (quizData: typeof formData) => {
      // First create the quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          ...quizData,
          user_id: user?.id,
          course_id: quizData.course_id || null,
        })
        .select()
        .single();
      
      if (quizError) throw quizError;

      // Generate sample questions
      const sampleQuestions = [
        {
          quiz_id: quiz.id,
          question_type: 'mcq',
          question_text: 'What is the main principle discussed in this scope?',
          options_json: ['Principle A', 'Principle B', 'Principle C', 'Principle D'],
          correct_answer: 'Principle A',
          source_refs_json: [],
        },
        {
          quiz_id: quiz.id,
          question_type: 'short',
          question_text: 'Explain the key concept from your studies.',
          options_json: [],
          correct_answer: 'The key concept involves understanding the fundamental principles and their practical applications.',
          source_refs_json: [],
        },
        {
          quiz_id: quiz.id,
          question_type: 'cloze',
          question_text: 'The _____ principle is essential for understanding the topic.',
          options_json: [],
          correct_answer: 'fundamental',
          source_refs_json: [],
        },
      ];

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(sampleQuestions);
      
      if (questionsError) throw questionsError;
      
      return quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      setOpen(false);
      setFormData({
        title: '',
        scope_type: 'week',
        scope_value: '',
        course_id: '',
      });
      toast({
        title: 'Success',
        description: 'Quiz created successfully!',
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

  const submitQuizMutation = useMutation({
    mutationFn: async ({ quizId, answers }: { quizId: string; answers: Record<string, string> }) => {
      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = quizQuestions.length;
      
      quizQuestions.forEach((question) => {
        if (answers[question.id] === question.correct_answer) {
          correctAnswers++;
        }
      });
      
      const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user?.id,
          answers_json: answers,
          score,
          total_questions: totalQuestions,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, correctAnswers, totalQuestions };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      setSelectedQuiz(null);
      setQuizAnswers({});
      toast({
        title: 'Quiz Completed!',
        description: `You scored ${result.correctAnswers}/${result.totalQuestions} (${Math.round(result.score)}%)`,
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
    createQuizMutation.mutate(formData);
  };

  const handleSubmitQuiz = () => {
    if (selectedQuiz) {
      submitQuizMutation.mutate({ 
        quizId: selectedQuiz.id, 
        answers: quizAnswers 
      });
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const getScopeLabel = (scopeType: string) => {
    switch (scopeType) {
      case 'day': return 'Daily';
      case 'week': return 'Weekly';
      case 'unit': return 'Unit';
      case 'random': return 'Random';
      default: return scopeType;
    }
  };

  if (selectedQuiz && quizQuestions.length > 0) {
    const answeredQuestions = Object.keys(quizAnswers).length;
    const progress = (answeredQuestions / quizQuestions.length) * 100;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{selectedQuiz.title}</h1>
            <p className="text-muted-foreground">
              {quizQuestions.length} questions • {getScopeLabel(selectedQuiz.scope_type)} scope
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedQuiz(null)}>
            Back to Quizzes
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Progress</CardTitle>
              <span className="text-sm text-muted-foreground">
                {answeredQuestions} of {quizQuestions.length} answered
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {quizQuestions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="font-medium">{question.question_text}</p>
                  
                  {question.question_type === 'mcq' && (
                    <RadioGroup
                      value={quizAnswers[question.id] || ''}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                    >
                      {(question.options_json as string[]).map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                          <Label htmlFor={`${question.id}-${optionIndex}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  
                  {(question.question_type === 'short' || question.question_type === 'cloze') && (
                    <Input
                      placeholder="Enter your answer..."
                      value={quizAnswers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleSubmitQuiz}
              className="w-full"
              disabled={answeredQuestions < quizQuestions.length || submitQuizMutation.isPending}
            >
              {submitQuizMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
            </Button>
            {answeredQuestions < quizQuestions.length && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                Please answer all questions before submitting
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge with generated quizzes</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Week 3 Database Quiz"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="scope_type">Quiz Scope</Label>
                <Select value={formData.scope_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, scope_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily Quiz</SelectItem>
                    <SelectItem value="week">Weekly Quiz</SelectItem>
                    <SelectItem value="unit">Unit Quiz</SelectItem>
                    <SelectItem value="random">Random Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="scope_value">Scope Value</Label>
                <Input
                  id="scope_value"
                  value={formData.scope_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, scope_value: e.target.value }))}
                  placeholder="e.g., Week 3, Unit 1, etc."
                />
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
              
              <Button type="submit" className="w-full" disabled={createQuizMutation.isPending}>
                {createQuizMutation.isPending ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Create Quiz
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Available Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading quizzes...</div>
              ) : quizzes.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No quizzes yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first quiz to test your knowledge
                  </p>
                  <Button onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quiz
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{quiz.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {quiz.courses && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {quiz.courses.code}
                            </div>
                          )}
                          <Badge variant="outline">
                            {getScopeLabel(quiz.scope_type)}
                          </Badge>
                          {quiz.scope_value && (
                            <span>{quiz.scope_value}</span>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(quiz.created_at), 'MMM dd')}
                          </div>
                        </div>
                      </div>
                      
                      <Button onClick={() => setSelectedQuiz(quiz)}>
                        Take Quiz
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              {quizAttempts.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No attempts yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizAttempts.slice(0, 5).map((attempt) => (
                    <div key={attempt.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {attempt.quizzes?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {attempt.quizzes?.courses?.code}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`flex items-center gap-1 ${
                            (attempt.score || 0) >= 70 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(attempt.score || 0) >= 70 ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            <span className="text-xs font-medium">
                              {Math.round(attempt.score || 0)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(attempt.started_at), 'MMM dd')}
                          </p>
                        </div>
                      </div>
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