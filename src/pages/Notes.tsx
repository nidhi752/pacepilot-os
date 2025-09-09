import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StickyNote, Plus, BookOpen, Calendar, FileText, Mic, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Notes() {
  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    course_id: '',
    lecture_date: '',
    source_type: 'manual' as 'manual' | 'asr' | 'ocr',
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

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', user?.id, selectedCourse],
    queryFn: async () => {
      let query = supabase
        .from('notes')
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

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: typeof formData) => {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          ...noteData,
          user_id: user?.id,
          course_id: noteData.course_id || null,
          lecture_date: noteData.lecture_date || null,
          extractions_json: {},
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setOpen(false);
      setFormData({
        title: '',
        content: '',
        course_id: '',
        lecture_date: '',
        source_type: 'manual',
      });
      toast({
        title: 'Success',
        description: 'Note created successfully!',
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
    createNoteMutation.mutate(formData);
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'asr':
        return <Mic className="h-4 w-4" />;
      case 'ocr':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'asr':
        return 'Audio';
      case 'ocr':
        return 'Image';
      default:
        return 'Manual';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Capture and organize your study notes</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Note Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Database Design Principles"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your notes here..."
                  className="min-h-[200px]"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course_id">Course (Optional)</Label>
                  <Select value={formData.course_id} onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-course">No course</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lecture_date">Lecture Date</Label>
                  <Input
                    id="lecture_date"
                    type="date"
                    value={formData.lecture_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, lecture_date: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source_type">Source Type</Label>
                <Select value={formData.source_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, source_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                    <SelectItem value="asr">Audio Recording</SelectItem>
                    <SelectItem value="ocr">Image/OCR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full" disabled={createNoteMutation.isPending}>
                {createNoteMutation.isPending ? 'Creating...' : 'Create Note'}
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
        <div>Loading notes...</div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No notes yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding your first note to capture important information
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {note.title || 'Untitled Note'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getSourceIcon(note.source_type)}
                      {getSourceLabel(note.source_type)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {note.courses && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {note.courses.code}
                    </div>
                  )}
                  {note.lecture_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(note.lecture_date), 'MMM dd')}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.content}
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  Created {format(new Date(note.created_at), 'MMM dd, yyyy')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}