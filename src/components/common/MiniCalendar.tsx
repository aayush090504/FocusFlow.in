import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Play, 
  Edit3, 
  X,
  Sparkles,
  ListTodo
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useAriaAnnounce } from './AriaLiveAnnouncer';
import { Task, Priority } from '../../types';

interface MiniCalendarProps {
  onSelectDate?: (dateStr: string | null) => void;
  selectedDate?: string | null;
  className?: string;
  compact?: boolean;
  showTaskDetails?: boolean;
}

// Format Date object to local YYYY-MM-DD
export function formatLocalDateToKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse YYYY-MM-DD safely into local Date
export function parseLocalKeyToDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  onSelectDate,
  selectedDate: controlledSelectedDate,
  className = '',
  compact = false,
  showTaskDetails = true,
}) => {
  const { 
    tasks, 
    subjects, 
    toggleTaskCompletion, 
    startTimer, 
    setIsTaskModalOpen, 
    setSelectedTaskForEdit 
  } = useStudy();

  const { announce } = useAriaAnnounce();

  // Internal state for current viewing year and month
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatLocalDateToKey(today), [today]);

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-indexed (0 = Jan, 11 = Dec)
  const [internalSelectedDate, setInternalSelectedDate] = useState<string | null>(todayKey);

  const selectedDate = controlledSelectedDate !== undefined ? controlledSelectedDate : internalSelectedDate;

  // Map tasks by their due date (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      if (task.dueDate) {
        // Support YYYY-MM-DD directly or extract ISO date string portion
        const dateKey = task.dueDate.split('T')[0];
        const existing = map.get(dateKey) || [];
        existing.push(task);
        map.set(dateKey, existing);
      }
    });
    return map;
  }, [tasks]);

  // Subject lookup helper
  const getSubject = (subjectId?: string) => {
    return subjects.find(s => s.id === subjectId);
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    const nowKey = formatLocalDateToKey(now);
    handleDateClick(nowKey);
  };

  const handleDateClick = (dateKey: string) => {
    if (selectedDate === dateKey) {
      // Toggle off or keep selected
      if (onSelectDate) onSelectDate(null);
      setInternalSelectedDate(null);
      announce('Cleared date selection');
    } else {
      if (onSelectDate) onSelectDate(dateKey);
      setInternalSelectedDate(dateKey);
      const count = tasksByDate.get(dateKey)?.length || 0;
      announce(`Selected ${dateKey}. ${count} tasks scheduled.`);
    }
  };

  // Calendar Grid Matrix Generation
  const calendarDays = useMemo(() => {
    // First day of current month (0 = Sun, 1 = Mon, ..., 6 = Sat)
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    
    // Number of days in current month (handles leap years automatically)
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Number of days in previous month
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      tasks: Task[];
    }> = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const d = new Date(prevYear, prevMonth, dayNum);
      const key = formatLocalDateToKey(d);
      days.push({
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: key === todayKey,
        tasks: tasksByDate.get(key) || [],
      });
    }

    // 2. Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const d = new Date(currentYear, currentMonth, dayNum);
      const key = formatLocalDateToKey(d);
      days.push({
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: key === todayKey,
        tasks: tasksByDate.get(key) || [],
      });
    }

    // 3. Next month leading days to complete grid (multiples of 7: 35 or 42 cells)
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const d = new Date(nextYear, nextMonth, dayNum);
      const key = formatLocalDateToKey(d);
      days.push({
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: key === todayKey,
        tasks: tasksByDate.get(key) || [],
      });
    }

    return days;
  }, [currentYear, currentMonth, todayKey, tasksByDate]);

  // Formatted Month Header
  const monthName = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(currentYear, currentMonth, 1)
    );
  }, [currentYear, currentMonth]);

  // Tasks for the selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasksByDate.get(selectedDate) || [];
  }, [selectedDate, tasksByDate]);

  // Formatted Selected Date Title
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    try {
      const d = parseLocalKeyToDate(selectedDate);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(d);
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const getPriorityStyle = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'low':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div 
      className={`rounded-2xl border shadow-xs overflow-hidden transition-all ${className}`}
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-default)'
      }}
    >
      {/* Calendar Header */}
      <div 
        className="p-4 sm:p-5 flex items-center justify-between border-b"
        style={{ borderColor: 'var(--color-border-default)' }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--color-accent-subtle)',
              color: 'var(--color-accent-primary)'
            }}
          >
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              {monthName}
            </h2>
            <div className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {tasks.length} total tasks scheduled
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-secondary)'
            }}
            title="Jump to today"
            aria-label="Jump to current date"
          >
            Today
          </button>

          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div 
        className="grid grid-cols-7 text-center text-[11px] font-bold py-2 border-b uppercase tracking-wider"
        style={{ 
          borderColor: 'var(--color-border-default)',
          backgroundColor: 'var(--color-bg-subtle)',
          color: 'var(--color-text-muted)'
        }}
      >
        {WEEKDAYS.map((wd, i) => (
          <div key={wd} className={i === 0 || i === 6 ? 'opacity-80' : ''}>
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 p-2.5 sm:p-3">
        {calendarDays.map((cell) => {
          const isSelected = selectedDate === cell.dateKey;
          const hasTasks = cell.tasks.length > 0;
          const hasIncompleteTasks = cell.tasks.some(t => t.status !== 'completed');

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => handleDateClick(cell.dateKey)}
              aria-label={`${cell.dateKey}, ${cell.tasks.length} tasks`}
              className={`relative flex flex-col items-center justify-between p-1.5 rounded-xl text-xs transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                compact ? 'min-h-[44px]' : 'min-h-[50px] sm:min-h-[56px]'
              }`}
              style={{
                backgroundColor: isSelected 
                  ? 'var(--color-accent-primary)' 
                  : cell.isToday 
                  ? 'var(--color-accent-subtle)' 
                  : 'transparent',
                color: isSelected 
                  ? 'var(--color-accent-fg)' 
                  : cell.isCurrentMonth 
                  ? 'var(--color-text-primary)' 
                  : 'var(--color-text-muted)',
                opacity: cell.isCurrentMonth ? 1 : 0.45,
                border: cell.isToday && !isSelected ? '1px dashed var(--color-accent-primary)' : '1px solid transparent',
              }}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between w-full px-1">
                <span className={`text-[12px] font-bold ${cell.isToday && !isSelected ? 'text-indigo-500 font-extrabold' : ''}`}>
                  {cell.dayNumber}
                </span>

                {/* Today Pill */}
                {cell.isToday && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-accent-primary)' }} />
                )}
              </div>

              {/* Task Indicator Dots */}
              <div className="flex items-center justify-center gap-0.5 mt-auto pt-1 w-full overflow-hidden">
                {hasTasks ? (
                  <div className="flex items-center gap-0.5">
                    {cell.tasks.slice(0, 3).map((task, idx) => {
                      const subject = getSubject(task.subjectId);
                      const dotColor = isSelected 
                        ? 'var(--color-accent-fg)' 
                        : subject?.color || (task.priority === 'high' ? '#f43f5e' : 'var(--color-accent-primary)');
                      return (
                        <span
                          key={task.id || idx}
                          className="w-1.5 h-1.5 rounded-full transition-transform"
                          style={{
                            backgroundColor: dotColor,
                            opacity: task.status === 'completed' ? 0.4 : 1,
                          }}
                          title={task.title}
                        />
                      );
                    })}
                    {cell.tasks.length > 3 && (
                      <span 
                        className="text-[9px] font-bold leading-none"
                        style={{ color: isSelected ? 'var(--color-accent-fg)' : 'var(--color-text-secondary)' }}
                      >
                        +{cell.tasks.length - 3}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-1.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Date Tasks Drawer / Details Panel */}
      {showTaskDetails && selectedDate && (
        <div 
          className="border-t p-4 sm:p-5 space-y-3"
          style={{ 
            borderColor: 'var(--color-border-default)',
            backgroundColor: 'var(--color-bg-subtle)'
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-accent-primary)' }} />
              <h3 className="text-xs sm:text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Tasks for {formattedSelectedDate}
              </h3>
              <span 
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-default)'
                }}
              >
                {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedTaskForEdit(null);
                  setIsTaskModalOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95"
                style={{
                  backgroundColor: 'var(--color-accent-primary)',
                  color: 'var(--color-accent-fg)'
                }}
                title="Add task for this date"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Task</span>
              </button>

              <button
                type="button"
                onClick={() => handleDateClick(selectedDate)}
                className="p-1 rounded-lg hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-text-muted)' }}
                aria-label="Close date details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scheduled Tasks List */}
          {selectedDateTasks.length === 0 ? (
            <div 
              className="p-5 rounded-xl border text-center space-y-2"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border-default)'
              }}
            >
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto"
                style={{
                  backgroundColor: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent-primary)'
                }}
              >
                <ListTodo className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                No tasks scheduled for this day.
              </p>
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                Plan ahead by adding an assignment, exam review, or reading target.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedTaskForEdit(null);
                  setIsTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold mt-1 transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent-primary)'
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Task</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selectedDateTasks.map(task => {
                const subject = getSubject(task.subjectId);
                const isCompleted = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border flex items-center justify-between gap-3 transition-all"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-default)',
                      opacity: isCompleted ? 0.7 : 1
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          toggleTaskCompletion(task.id);
                          announce(isCompleted ? `Marked ${task.title} incomplete` : `Completed ${task.title}`);
                        }}
                        className="transition-colors shrink-0"
                        style={{ color: isCompleted ? '#10b981' : 'var(--color-text-muted)' }}
                        aria-label={isCompleted ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 fill-emerald-500/20 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div 
                          className="text-xs font-bold truncate"
                          style={{
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            color: isCompleted ? 'var(--color-text-muted)' : 'var(--color-text-primary)'
                          }}
                        >
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                          {subject && (
                            <span 
                              className="inline-flex items-center gap-1 font-semibold"
                              style={{ color: subject.color }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                              {subject.name}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.2 rounded font-semibold border ${getPriorityStyle(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.estimatedMinutes && (
                            <span className="inline-flex items-center gap-0.5" style={{ color: 'var(--color-text-muted)' }}>
                              <Clock className="w-3 h-3" />
                              {task.estimatedMinutes}m
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => startTimer('pomodoro', task.estimatedMinutes || 25, task.subjectId, task.id)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{
                            backgroundColor: 'var(--color-accent-subtle)',
                            color: 'var(--color-accent-primary)'
                          }}
                          title="Start focus timer for this task"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTaskForEdit(task);
                          setIsTaskModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                        style={{ color: 'var(--color-text-secondary)' }}
                        title="Edit task"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
