import React from 'react';
import { 
  Plus, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Play, 
  BarChart2,
  Calendar
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

export const SubjectsView: React.FC = () => {
  const { 
    subjects, 
    tasks, 
    focusSessions, 
    setIsSubjectModalOpen, 
    setSelectedSubjectForEdit, 
    startTimer,
    setIsTaskModalOpen,
    setSelectedTaskForEdit
  } = useStudy();

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Subjects & Courses
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize study material, set weekly goals, and track focus distribution.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedSubjectForEdit(null);
            setIsSubjectModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Subject</span>
        </button>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => {
          const subjectTasks = tasks.filter(t => t.subjectId === subject.id);
          const completedTasks = subjectTasks.filter(t => t.status === 'completed');
          const totalFocusMinutes = focusSessions
            .filter(s => s.subjectId === subject.id)
            .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
          const totalHours = (totalFocusMinutes / 60).toFixed(1);

          return (
            <div
              key={subject.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between group"
            >
              <div>
                {/* Subject Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: subject.color }}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {subject.name}
                      </h3>
                      {subject.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {subject.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSubjectForEdit(subject);
                      setIsSubjectModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Study Time
                    </span>
                    <span className="text-sm font-bold text-slate-800 font-mono">
                      {totalHours} hrs
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target / Week
                    </span>
                    <span className="text-sm font-bold text-slate-800 font-mono">
                      {subject.targetHoursPerWeek || 5} hrs
                    </span>
                  </div>
                </div>

                {/* Task Progress Bar */}
                <div className="space-y-1.5 mb-6">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Tasks Progress</span>
                    <span className="text-slate-900 font-bold">
                      {completedTasks.length} / {subjectTasks.length}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: subject.color,
                        width: `${subjectTasks.length ? Math.round((completedTasks.length / subjectTasks.length) * 100) : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedTaskForEdit(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  + Add task
                </button>

                <button
                  onClick={() => startTimer('pomodoro', 25, subject.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-2xs hover:opacity-90 transition-all"
                  style={{ backgroundColor: subject.color }}
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Focus</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
