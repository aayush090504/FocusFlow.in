import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  Calendar as CalendarIcon, 
  Clock, 
  Play, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Tag, 
  BookOpen, 
  Check, 
  ListFilter,
  LayoutList,
  CalendarDays,
  X
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useGamification } from '../../context/GamificationContext';
import { useAriaAnnounce } from '../common/AriaLiveAnnouncer';
import { MiniCalendar, formatLocalDateToKey, parseLocalKeyToDate } from '../common/MiniCalendar';
import { Task, Priority, TaskStatus } from '../../types';

export const TasksView: React.FC = () => {
  const { 
    tasks, 
    subjects, 
    toggleTaskCompletion, 
    deleteTask, 
    startTimer, 
    setIsTaskModalOpen, 
    setSelectedTaskForEdit 
  } = useStudy();
  const { awardTaskCompletionXp } = useGamification();

  const { announce } = useAriaAnnounce();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  const getSubject = (id?: string) => subjects.find(s => s.id === id);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Date filter from calendar selection
      if (selectedDateFilter) {
        const taskDate = task.dueDate?.split('T')[0];
        if (taskDate !== selectedDateFilter) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchDesc = task.description?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }
      // Subject filter
      if (selectedSubjectFilter !== 'all') {
        if (task.subjectId !== selectedSubjectFilter) return false;
      }
      // Status filter
      if (statusFilter !== 'all') {
        if (task.status !== statusFilter) return false;
      }
      // Priority filter
      if (priorityFilter !== 'all') {
        if (task.priority !== priorityFilter) return false;
      }
      return true;
    }).sort((a, b) => {
      // Incomplete first, then by priority
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      const pMap = { high: 0, medium: 1, low: 2 };
      return pMap[a.priority] - pMap[b.priority];
    });
  }, [tasks, selectedDateFilter, searchQuery, selectedSubjectFilter, statusFilter, priorityFilter]);

  const activeCount = tasks.filter(t => t.status !== 'completed').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

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

  const handleToggle = (task: Task) => {
    const isNowCompleting = task.status !== 'completed';
    toggleTaskCompletion(task.id);
    if (isNowCompleting) {
      awardTaskCompletionXp(task.id, task.priority);
    }
    announce(task.status === 'completed' ? `Marked ${task.title} as incomplete` : `Completed ${task.title}`);
  };

  // Human readable date string for active date filter
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateFilter) return '';
    try {
      const d = parseLocalKeyToDate(selectedDateFilter);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(d);
    } catch {
      return selectedDateFilter;
    }
  }, [selectedDateFilter]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Study Tasks & Schedule
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Organize coursework, track deadlines, and schedule focused study blocks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div 
            className="flex items-center p-1 rounded-xl border shrink-0"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                announce('Switched to task list view');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list' ? 'shadow-2xs' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: viewMode === 'list' ? 'var(--color-accent-primary)' : 'transparent',
                color: viewMode === 'list' ? 'var(--color-accent-fg)' : 'var(--color-text-secondary)'
              }}
              aria-label="List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('calendar');
                announce('Switched to calendar schedule view');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar' ? 'shadow-2xs' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: viewMode === 'calendar' ? 'var(--color-accent-primary)' : 'transparent',
                color: viewMode === 'calendar' ? 'var(--color-accent-fg)' : 'var(--color-text-secondary)'
              }}
              aria-label="Calendar View"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedTaskForEdit(null);
              setIsTaskModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 shrink-0 touch-target"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color: 'var(--color-accent-fg)'
            }}
            aria-label="Add New Study Task (t)"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Calendar View Mode */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Top: Interactive Mini Calendar */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-4">
            <MiniCalendar
              selectedDate={selectedDateFilter}
              onSelectDate={(date) => {
                setSelectedDateFilter(date);
              }}
              showTaskDetails={false}
            />

            {/* Quick Summary Pill */}
            <div 
              className="p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-accent-primary)' }} />
                <span>{activeCount} active tasks remaining</span>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="font-bold underline hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-accent-primary)' }}
              >
                View Full List
              </button>
            </div>
          </div>

          {/* Right: Scheduled Tasks Agenda for the Selected Date */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-4">
            <div 
              className="p-5 rounded-2xl border shadow-xs"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border-default)'
              }}
            >
              <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: 'var(--color-border-default)' }}>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Selected Date Agenda
                  </div>
                  <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {selectedDateFilter ? formattedSelectedDate : 'All Scheduled Tasks'}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {selectedDateFilter && (
                    <button
                      type="button"
                      onClick={() => setSelectedDateFilter(null)}
                      className="px-2.5 py-1 rounded-lg border text-xs font-semibold transition-opacity hover:opacity-80 flex items-center gap-1"
                      style={{
                        backgroundColor: 'var(--color-bg-subtle)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-secondary)'
                      }}
                    >
                      <X className="w-3 h-3" />
                      <span>Show All Dates</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTaskForEdit(null);
                      setIsTaskModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--color-accent-primary)',
                      color: 'var(--color-accent-fg)'
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Task</span>
                  </button>
                </div>
              </div>

              {/* Tasks matching selected date */}
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                    style={{
                      backgroundColor: 'var(--color-accent-subtle)',
                      color: 'var(--color-accent-primary)'
                    }}
                  >
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {selectedDateFilter ? 'No tasks scheduled for this day' : 'No tasks match current filters'}
                  </h3>
                  <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedDateFilter 
                      ? 'Take advantage of this open time or schedule study milestones in advance.'
                      : 'Create a new study task or clear filters to see your schedule.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTaskForEdit(null);
                      setIsTaskModalOpen(true);
                    }}
                    className="mt-2 inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--color-accent-primary)',
                      color: 'var(--color-accent-fg)'
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Schedule Task</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                  {filteredTasks.map(task => {
                    const subject = getSubject(task.subjectId);
                    const isCompleted = task.status === 'completed';

                    return (
                      <div
                        key={task.id}
                        className="p-3.5 sm:p-4 rounded-xl border flex items-start justify-between gap-3 transition-all"
                        style={{
                          backgroundColor: isCompleted ? 'rgba(0,0,0,0.02)' : 'var(--color-bg-subtle)',
                          borderColor: 'var(--color-border-default)',
                          opacity: isCompleted ? 0.7 : 1
                        }}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggle(task)}
                            className="mt-0.5 transition-colors shrink-0 touch-target flex items-center justify-center"
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
                            <div className="flex items-center gap-2">
                              <span 
                                className="text-xs sm:text-sm font-bold text-left block truncate"
                                style={{
                                  textDecoration: isCompleted ? 'line-through' : 'none',
                                  color: isCompleted ? 'var(--color-text-muted)' : 'var(--color-text-primary)'
                                }}
                              >
                                {task.title}
                              </span>
                            </div>

                            {task.description && (
                              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
                                {task.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
                              {subject && (
                                <span 
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold"
                                  style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                                  {subject.name}
                                </span>
                              )}

                              <span className={`px-2 py-0.5 rounded-md font-semibold border ${getPriorityStyle(task.priority)}`}>
                                {task.priority}
                              </span>

                              {task.dueDate && (
                                <span className="inline-flex items-center gap-1 font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                                  <CalendarIcon className="w-3 h-3" />
                                  {task.dueDate}
                                </span>
                              )}

                              {task.estimatedMinutes && (
                                <span className="inline-flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                                  <Clock className="w-3 h-3" />
                                  {task.estimatedMinutes}m est.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!isCompleted && (
                            <button
                              onClick={() => startTimer('pomodoro', task.estimatedMinutes || 25, task.subjectId, task.id)}
                              title="Start Pomodoro on this task"
                              className="p-2 rounded-xl transition-all shadow-2xs touch-target flex items-center justify-center"
                              style={{
                                backgroundColor: 'var(--color-accent-subtle)',
                                color: 'var(--color-accent-primary)'
                              }}
                              aria-label={`Start Pomodoro for ${task.title}`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedTaskForEdit(task);
                              setIsTaskModalOpen(true);
                            }}
                            className="p-2 rounded-xl transition-colors touch-target flex items-center justify-center hover:opacity-80"
                            style={{ color: 'var(--color-text-secondary)' }}
                            aria-label={`Edit task ${task.title}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              deleteTask(task.id);
                              announce(`Deleted task ${task.title}`);
                            }}
                            className="p-2 rounded-xl transition-colors text-rose-500 hover:bg-rose-500/10 touch-target flex items-center justify-center"
                            aria-label={`Delete task ${task.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List View Mode */}
      {viewMode === 'list' && (
        <>
          {/* Active Date Filter Alert Bar (if date was selected via calendar) */}
          {selectedDateFilter && (
            <div 
              className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)'
              }}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
                <span>
                  Filtering tasks scheduled for: <strong>{formattedSelectedDate}</strong> ({filteredTasks.length} found)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDateFilter(null)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <X className="w-3 h-3" />
                <span>Clear Date Filter</span>
              </button>
            </div>
          )}

          {/* Filter Toolbar */}
          <div 
            className="p-4 rounded-2xl border shadow-xs space-y-3"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <label htmlFor="tasks-search-input" className="sr-only">Search tasks</label>
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  id="tasks-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks by title or topic..."
                  className="w-full pl-9 pr-3.5 py-2.5 border rounded-xl text-xs touch-target focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>

              {/* Subject Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <label htmlFor="tasks-subject-filter" className="sr-only">Filter by subject</label>
                <select
                  id="tasks-subject-filter"
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="w-full md:w-48 px-3 py-2.5 border rounded-xl text-xs touch-target focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="all">All Subjects ({subjects.length})</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                {/* Priority Filter */}
                <label htmlFor="tasks-priority-filter" className="sr-only">Filter by priority</label>
                <select
                  id="tasks-priority-filter"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="w-full md:w-36 px-3 py-2.5 border rounded-xl text-xs touch-target focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t overflow-x-auto no-scrollbar" style={{ borderColor: 'var(--color-border-default)' }}>
              <div className="flex items-center gap-2 shrink-0" role="tablist" aria-label="Task Status Filters">
                <button
                  role="tab"
                  aria-selected={statusFilter === 'all'}
                  onClick={() => setStatusFilter('all')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 touch-target"
                  style={{
                    backgroundColor: statusFilter === 'all' ? 'var(--color-accent-primary)' : 'var(--color-bg-subtle)',
                    color: statusFilter === 'all' ? 'var(--color-accent-fg)' : 'var(--color-text-secondary)',
                  }}
                >
                  All ({tasks.length})
                </button>
                <button
                  role="tab"
                  aria-selected={statusFilter === 'todo'}
                  onClick={() => setStatusFilter('todo')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 touch-target"
                  style={{
                    backgroundColor: statusFilter === 'todo' ? 'var(--color-accent-primary)' : 'var(--color-bg-subtle)',
                    color: statusFilter === 'todo' ? 'var(--color-accent-fg)' : 'var(--color-text-secondary)',
                  }}
                >
                  Pending ({activeCount})
                </button>
                <button
                  role="tab"
                  aria-selected={statusFilter === 'completed'}
                  onClick={() => setStatusFilter('completed')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 touch-target"
                  style={{
                    backgroundColor: statusFilter === 'completed' ? 'var(--color-accent-primary)' : 'var(--color-bg-subtle)',
                    color: statusFilter === 'completed' ? 'var(--color-accent-fg)' : 'var(--color-text-secondary)',
                  }}
                >
                  Completed ({completedCount})
                </button>
              </div>

              {/* Quick Calendar Mode Link */}
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:opacity-90"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Open Mini Calendar</span>
              </button>
            </div>
          </div>

          {/* Task List */}
          <div 
            className="rounded-2xl border shadow-xs divide-y overflow-hidden"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{
                    backgroundColor: 'var(--color-accent-subtle)',
                    color: 'var(--color-accent-primary)'
                  }}
                >
                  <ListFilter className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>No tasks found</h3>
                <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                  {searchQuery || selectedSubjectFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || selectedDateFilter
                    ? 'Try adjusting your filters, search terms, or date selection.'
                    : 'Get started by creating your first study task.'}
                </p>
                <button
                  onClick={() => {
                    setSelectedTaskForEdit(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold transition-opacity touch-target hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--color-accent-primary)',
                    color: 'var(--color-accent-fg)'
                  }}
                >
                  + Create New Task
                </button>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const subject = getSubject(task.subjectId);
                const isCompleted = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    className="p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors group"
                    style={{
                      backgroundColor: isCompleted ? 'rgba(0,0,0,0.02)' : 'transparent',
                      borderColor: 'var(--color-border-default)'
                    }}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Completion toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggle(task)}
                        className="mt-0.5 transition-colors shrink-0 touch-target flex items-center justify-center"
                        style={{ color: isCompleted ? '#10b981' : 'var(--color-text-muted)' }}
                        aria-label={isCompleted ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 fill-emerald-500/20 text-emerald-500" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTaskForEdit(task);
                              setIsTaskModalOpen(true);
                            }}
                            className="text-sm font-bold text-left cursor-pointer transition-colors focus-visible:underline"
                            style={{
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              color: isCompleted ? 'var(--color-text-muted)' : 'var(--color-text-primary)'
                            }}
                            aria-label={`Edit task: ${task.title}`}
                          >
                            {task.title}
                          </button>
                        </div>

                        {task.description && (
                          <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          {subject && (
                            <span 
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold"
                              style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                              {subject.name}
                            </span>
                          )}

                          <span className={`px-2 py-0.5 rounded-md font-semibold border ${getPriorityStyle(task.priority)}`}>
                            {task.priority}
                          </span>

                          {task.dueDate && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDateFilter(task.dueDate || null);
                                announce(`Filtered by due date: ${task.dueDate}`);
                              }}
                              className="inline-flex items-center gap-1 font-mono hover:underline cursor-pointer" 
                              style={{ color: 'var(--color-text-secondary)' }}
                              title="Filter tasks for this date"
                            >
                              <CalendarIcon className="w-3 h-3" />
                              {task.dueDate}
                            </button>
                          )}

                          {task.estimatedMinutes && (
                            <span className="inline-flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                              <Clock className="w-3 h-3" />
                              {task.estimatedMinutes}m est.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!isCompleted && (
                        <button
                          onClick={() => startTimer('pomodoro', task.estimatedMinutes || 25, task.subjectId, task.id)}
                          title="Start Pomodoro on this task"
                          className="p-2.5 rounded-xl transition-all shadow-2xs touch-target flex items-center justify-center"
                          style={{
                            backgroundColor: 'var(--color-accent-subtle)',
                            color: 'var(--color-accent-primary)'
                          }}
                          aria-label={`Start Pomodoro for ${task.title}`}
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedTaskForEdit(task);
                          setIsTaskModalOpen(true);
                        }}
                        className="p-2.5 rounded-xl transition-colors touch-target flex items-center justify-center hover:opacity-80"
                        style={{
                          color: 'var(--color-text-secondary)'
                        }}
                        aria-label={`Edit task ${task.title}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          deleteTask(task.id);
                          announce(`Deleted task ${task.title}`);
                        }}
                        className="p-2.5 rounded-xl transition-colors text-rose-500 hover:bg-rose-500/10 touch-target flex items-center justify-center"
                        aria-label={`Delete task ${task.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
