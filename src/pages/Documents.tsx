import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Upload, BookOpen, Calendar, File, Image, FileAudio, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Documents() {
  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    doc_type: 'handout' as 'syllabus' | 'slide' | 'handout' | 'note_image' | 'note_audio' | 'note_text' | 'exam_timetable',
    course_id: '',
    file: null as File | null,
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

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', user?.id, selectedCourse],
    queryFn: async () => {
      let query = supabase
        .from('documents')
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

  const createDocumentMutation = useMutation({
    mutationFn: async (docData: typeof formData) => {
      let filePath = null;
      
      // Upload file if provided
      if (docData.file) {
        const fileExt = docData.file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, docData.file);
        
        if (uploadError) throw uploadError;
        filePath = uploadData.path;
      }

      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: docData.title,
          doc_type: docData.doc_type,
          user_id: user?.id,
          course_id: docData.course_id || null,
          file_path: filePath,
          meta_json: {},
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setOpen(false);
      setFormData({
        title: '',
        doc_type: 'handout',
        course_id: '',
        file: null,
      });
      toast({
        title: 'Success',
        description: 'Document uploaded successfully!',
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
    createDocumentMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  const getDocIcon = (docType: string) => {
    switch (docType) {
      case 'syllabus':
        return <BookOpen className="h-4 w-4" />;
      case 'slide':
        return <FileText className="h-4 w-4" />;
      case 'note_image':
        return <Image className="h-4 w-4" />;
      case 'note_audio':
        return <FileAudio className="h-4 w-4" />;
      case 'exam_timetable':
        return <Calendar className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getDocTypeLabel = (docType: string) => {
    switch (docType) {
      case 'syllabus':
        return 'Syllabus';
      case 'slide':
        return 'Slide';
      case 'handout':
        return 'Handout';
      case 'note_image':
        return 'Note Image';
      case 'note_audio':
        return 'Note Audio';
      case 'note_text':
        return 'Note Text';
      case 'exam_timetable':
        return 'Exam Timetable';
      default:
        return docType;
    }
  };

  const getDocTypeColor = (docType: string) => {
    switch (docType) {
      case 'syllabus':
        return 'bg-blue-100 text-blue-800';
      case 'slide':
        return 'bg-green-100 text-green-800';
      case 'exam_timetable':
        return 'bg-red-100 text-red-800';
      case 'note_audio':
        return 'bg-purple-100 text-purple-800';
      case 'note_image':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Upload and manage your study materials</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Database Design Slides"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="doc_type">Document Type</Label>
                <Select value={formData.doc_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, doc_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="syllabus">Syllabus</SelectItem>
                    <SelectItem value="slide">Slides</SelectItem>
                    <SelectItem value="handout">Handout</SelectItem>
                    <SelectItem value="note_image">Note Image</SelectItem>
                    <SelectItem value="note_audio">Note Audio</SelectItem>
                    <SelectItem value="note_text">Note Text</SelectItem>
                    <SelectItem value="exam_timetable">Exam Timetable</SelectItem>
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
                <Label htmlFor="file">File Upload</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.jpg,.jpeg,.png,.mp3,.wav,.m4a"
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, PPT, DOC, TXT, Images, Audio files
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={createDocumentMutation.isPending}>
                {createDocumentMutation.isPending ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
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
        <div>Loading documents...</div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload your first document to start organizing your study materials
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Your First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getDocIcon(doc.doc_type)}
                    <span className="line-clamp-2">{doc.title}</span>
                  </CardTitle>
                  <Badge className={getDocTypeColor(doc.doc_type)}>
                    {getDocTypeLabel(doc.doc_type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {doc.courses && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {doc.courses.code}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(doc.created_at), 'MMM dd, yyyy')}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {doc.extracted_text && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {doc.extracted_text}
                  </p>
                )}
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    View
                  </Button>
                  {doc.file_path && (
                    <Button size="sm" variant="outline" className="flex-1">
                      Download
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}