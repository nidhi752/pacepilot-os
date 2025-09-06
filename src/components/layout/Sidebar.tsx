import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Calendar, 
  StickyNote, 
  FileText, 
  TrendingUp, 
  HelpCircle,
  MessageSquare,
  Settings,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Courses', href: '/courses', icon: BookOpen },
  { name: 'Planner', href: '/planner', icon: Calendar },
  { name: 'Notes', href: '/notes', icon: StickyNote },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Summaries', href: '/summaries', icon: TrendingUp },
  { name: 'Quizzes', href: '/quizzes', icon: HelpCircle },
  { name: 'Chatbot', href: '/chat', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { signOut, profile } = useAuthStore();

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">Student OS</h1>
        {profile && (
          <p className="text-sm text-muted-foreground mt-1">
            {profile.full_name || profile.email}
          </p>
        )}
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}