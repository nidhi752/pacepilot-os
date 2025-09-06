export interface Profile {
  id: string;
  user_id: string;
  email?: string;
  full_name?: string;
  timezone: string;
  study_goals: any;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  title: string;
  code: string;
  instructor?: string;
  schedule_json: any;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  course_id?: string;
  doc_type: 'syllabus' | 'slide' | 'handout' | 'note_image' | 'note_audio' | 'note_text' | 'exam_timetable';
  title: string;
  file_path?: string;
  extracted_text?: string;
  meta_json: any;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  course_id?: string;
  title?: string;
  content: string;
  source_type: 'asr' | 'ocr' | 'manual';
  extractions_json: any;
  lecture_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  course_id?: string;
  title: string;
  description?: string;
  due_at?: string;
  rrule?: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  estimated_minutes?: number;
  actual_minutes?: number;
  google_calendar_event_id?: string;
  links_json: any[];
  created_at: string;
  completed_at?: string;
}

export interface Exam {
  id: string;
  user_id: string;
  course_id?: string;
  exam_name: string;
  exam_date: string;
  weightage?: number;
  meta_json: any;
  created_at: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  course_id?: string;
  title: string;
  scope_type: 'day' | 'week' | 'unit' | 'random';
  scope_value?: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: 'mcq' | 'short' | 'cloze';
  question_text: string;
  options_json: string[];
  correct_answer: string;
  source_refs_json: any[];
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  answers_json: any;
  score?: number;
  total_questions?: number;
  started_at: string;
  completed_at?: string;
}

export interface Summary {
  id: string;
  user_id: string;
  course_id?: string;
  period_type: 'week' | 'month';
  start_date: string;
  end_date: string;
  summary_text?: string;
  flashcards_json: any[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  response?: string;
  context_refs_json: any[];
  created_at: string;
}

export interface StudyProfile {
  id: string;
  user_id: string;
  avg_pomodoro_minutes: number;
  target_daily_minutes: number;
  section_estimates: any;
  learning_velocity: number;
  created_at: string;
  updated_at: string;
}