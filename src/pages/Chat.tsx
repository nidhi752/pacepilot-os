import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, User, Bot, BookOpen, FileText, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Chat() {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chatMessages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time feel
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      // Simulate typing delay
      setIsTyping(true);
      
      // Generate a mock AI response based on the message
      const generateMockResponse = (msg: string) => {
        const lowerMsg = msg.toLowerCase();
        
        if (lowerMsg.includes('dbms') || lowerMsg.includes('database')) {
          return {
            response: "Based on your DBMS course materials, I can help you with database concepts. Here are some key points from your recent notes: Database normalization helps reduce redundancy, and ACID properties ensure transaction reliability. Would you like me to elaborate on any specific topic?",
            context_refs: [{ type: 'course', name: 'DBMS', id: '1' }, { type: 'note', title: 'Database Fundamentals', id: '2' }]
          };
        } else if (lowerMsg.includes('quiz') || lowerMsg.includes('question')) {
          return {
            response: "I can generate quiz questions based on your study materials. Here are some sample questions from your recent topics: 1) What is the difference between SQL and NoSQL databases? 2) Explain the concept of database indexing. Would you like more questions on a specific topic?",
            context_refs: [{ type: 'quiz', title: 'Database Quiz', id: '3' }]
          };
        } else if (lowerMsg.includes('summary') || lowerMsg.includes('week')) {
          return {
            response: "From your weekly summaries, you've been focusing on database design principles and normalization. Your study velocity indicates you're progressing well through the syllabus. Key topics covered this week include ER diagrams and SQL joins.",
            context_refs: [{ type: 'summary', title: 'Week 4 Summary', id: '4' }]
          };
        } else {
          return {
            response: "I'm here to help you with your studies! I can answer questions about your courses, generate quiz questions, explain concepts from your notes, or provide summaries of your progress. What would you like to know?",
            context_refs: []
          };
        }
      };

      // Wait a bit to simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResponse = generateMockResponse(messageText);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user?.id,
          message: messageText,
          response: mockResponse.response,
          context_refs_json: mockResponse.context_refs,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
      setMessage('');
      setIsTyping(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsTyping(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatMessages, isTyping]);

  const getContextIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-3 w-3" />;
      case 'note':
        return <FileText className="h-3 w-3" />;
      case 'quiz':
        return <Brain className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-3xl font-bold">Study Assistant</h1>
          <p className="text-muted-foreground">AI-powered chatbot with access to your study materials</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 min-h-0">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Loading chat history...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Ask me about your courses, request quiz questions, or get explanations about your study materials.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((chatMessage) => (
                    <div key={chatMessage.id} className="space-y-4">
                      {/* User Message */}
                      <div className="flex justify-end">
                        <div className="flex items-start gap-3 max-w-[80%]">
                          <div className="bg-primary text-primary-foreground rounded-lg p-3 rounded-br-sm">
                            <p className="text-sm">{chatMessage.message}</p>
                          </div>
                          <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                            <User className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      {/* AI Response */}
                      {chatMessage.response && (
                        <div className="flex justify-start">
                          <div className="flex items-start gap-3 max-w-[80%]">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-2">
                              <div className="bg-muted rounded-lg p-3 rounded-bl-sm">
                                <p className="text-sm">{chatMessage.response}</p>
                              </div>
                              
                              {/* Context References */}
                              {chatMessage.context_refs_json && Array.isArray(chatMessage.context_refs_json) && chatMessage.context_refs_json.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-xs text-muted-foreground">Sources:</span>
                                  {(chatMessage.context_refs_json as any[]).map((ref: any, index: number) => (
                                    <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                                      {getContextIcon(ref.type)}
                                      {ref.name || ref.title}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg p-3 rounded-bl-sm">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
            
            <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me about your studies..."
                disabled={sendMessageMutation.isPending}
              />
              <Button 
                type="submit" 
                disabled={!message.trim() || sendMessageMutation.isPending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="w-80">
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setMessage("What did we cover in the last DBMS class?")}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Recent class content
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setMessage("Generate quiz questions from Week 4")}
            >
              <Brain className="h-4 w-4 mr-2" />
              Generate quiz
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setMessage("Explain database normalization")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Explain concept
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setMessage("Show my study progress this week")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Study progress
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}