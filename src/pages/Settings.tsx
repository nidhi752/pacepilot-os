import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, User, Bell, Calendar, Palette, Shield, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { user, profile, updateProfile } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    timezone: profile?.timezone || 'UTC',
  });

  const [studySettings, setStudySettings] = useState({
    target_daily_minutes: 240,
    avg_pomodoro_minutes: 25,
    learning_velocity: 1.0,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_reminders: true,
    push_notifications: true,
    daily_summary: true,
    quiz_reminders: false,
  });

  const { data: studyProfile } = useQuery({
    queryKey: ['study-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setStudySettings({
          target_daily_minutes: data.target_daily_minutes || 240,
          avg_pomodoro_minutes: data.avg_pomodoro_minutes || 25,
          learning_velocity: data.learning_velocity || 1.0,
        });
      }
      
      return data;
    },
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const { error } = await updateProfile(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
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

  const updateStudyProfileMutation = useMutation({
    mutationFn: async (data: typeof studySettings) => {
      const { error } = await supabase
        .from('study_profiles')
        .upsert({
          user_id: user?.id,
          ...data,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-profile'] });
      toast({
        title: 'Success',
        description: 'Study preferences updated!',
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

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handleStudySettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudyProfileMutation.mutate(studySettings);
  };

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and study preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed from this interface
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={profileForm.timezone} 
                    onValueChange={(value) => setProfileForm(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Study Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Study Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStudySettingsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target_daily_minutes">Target Daily Study Time (minutes)</Label>
                  <Input
                    id="target_daily_minutes"
                    type="number"
                    min="30"
                    max="600"
                    value={studySettings.target_daily_minutes}
                    onChange={(e) => setStudySettings(prev => ({ 
                      ...prev, 
                      target_daily_minutes: parseInt(e.target.value) || 240 
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Current: {Math.floor(studySettings.target_daily_minutes / 60)}h {studySettings.target_daily_minutes % 60}m
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="avg_pomodoro_minutes">Average Pomodoro Duration (minutes)</Label>
                  <Input
                    id="avg_pomodoro_minutes"
                    type="number"
                    min="15"
                    max="60"
                    value={studySettings.avg_pomodoro_minutes}
                    onChange={(e) => setStudySettings(prev => ({ 
                      ...prev, 
                      avg_pomodoro_minutes: parseInt(e.target.value) || 25 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="learning_velocity">Learning Velocity</Label>
                  <Select 
                    value={studySettings.learning_velocity.toString()} 
                    onValueChange={(value) => setStudySettings(prev => ({ 
                      ...prev, 
                      learning_velocity: parseFloat(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">Slow (0.5x)</SelectItem>
                      <SelectItem value="0.75">Below Average (0.75x)</SelectItem>
                      <SelectItem value="1.0">Average (1.0x)</SelectItem>
                      <SelectItem value="1.25">Above Average (1.25x)</SelectItem>
                      <SelectItem value="1.5">Fast (1.5x)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Affects how the system estimates your study pace
                  </p>
                </div>
                
                <Button type="submit" disabled={updateStudyProfileMutation.isPending}>
                  {updateStudyProfileMutation.isPending ? 'Updating...' : 'Update Preferences'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Reminders</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive email notifications for important deadlines
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.email_reminders}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, email_reminders: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Get browser notifications for tasks and reminders
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.push_notifications}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, push_notifications: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Summary</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive daily progress summaries
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.daily_summary}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, daily_summary: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Quiz Reminders</Label>
                  <p className="text-xs text-muted-foreground">
                    Get reminded to take periodic quizzes
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.quiz_reminders}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, quiz_reminders: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Google Calendar</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Sync your tasks and deadlines
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Connect Google Calendar
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <Label>Export Data</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Download your study data
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Export All Data
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select defaultValue="system">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" size="sm" className="w-full">
                Change Password
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Two-Factor Auth
              </Button>
              <Button variant="destructive" size="sm" className="w-full">
                Delete Account
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" size="sm" className="w-full">
                Help Center
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Send Feedback
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}