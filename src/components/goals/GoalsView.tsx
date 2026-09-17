import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  BookOpen, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  Award, 
  Sparkles,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStudy } from '../../context/StudyContext';
import { useGamification } from '../../context/GamificationContext';
import { Goal } from '../../types';

export const GoalsView: React.FC = () => {
  const { 
    goals, 
    activeGoals, 
    completedGoals, 
    subjects, 
    deleteGoal, 
    toggleGoalCompletion, 
    incrementGoalProgress,
    updateGoal,
    setIsGoalModalOpen, 
    setSelectedGoalForEdit 
  } = useStudy();
  const { awardGoalCompletionXp } = useGamification();

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [customEditingGoalId, setCustomEditingGoalId] = useState<string | null>(null);
  const [customValueInput, setCustomValueInput] = useState<string>('');

  // Filter goals
  const filteredGoals = goals.filter(g => {
    if (filterStatus === 'active' && g.status === 'completed') return false;
    if (filterStatus === 'completed' && g.status !== 'completed') return false;
    if (selectedSubjectFilter !== 'all' && g.subjectId !== selectedSubjectFilter) return false;
    return true;
  });

  const handleCompleteToggle = async (goal: Goal) => {
    const nextCompleted = goal.status !== 'completed';
    if (nextCompleted) {
      // Trigger celebratory confetti
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
      await awardGoalCompletionXp(goal.id);
    }
    await toggleGoalCompletion(goal.id);
  };

  const handleSaveCustomValue = async (goalId: string) => {
    const val = Number(customValueInput);
    if (!isNaN(val) && val >= 0) {
      const goal = goals.find(g => g.id === goalId);
      const isNowComplete = goal ? val >= goal.targetValue : false;
      await updateGoal(goalId, {
        currentValue: val,
        status: isNowComplete ? 'completed' : 'active',
        completedAt: isNowComplete ? new Date().toISOString() : '',
      });
      if (isNowComplete && goal?.status !== 'completed') {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    }
    setCustomEditingGoalId(null);
  };

  const getDaysRemainingText = (targetDateStr?: string, isCompleted?: boolean) => {
    if (isCompleted) return { text: 'Goal Achieved', colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (!targetDateStr) return { text: 'No deadline', colorClass: 'text-slate-600 bg-slate-50 border-slate-200' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        text: `Overdue by ${Math.abs(diffDays)}d`, 
        colorClass: 'text-rose-700 bg-rose-50 border-rose-200' 
      };
    } else if (diffDays === 0) {
      return { 
        text: 'Due today', 
        colorClass: 'text-amber-700 bg-amber-50 border-amber-200 font-bold' 
      };
    } else if (diffDays === 1) {
      return { 
        text: 'Due tomorrow', 
        colorClass: 'text-indigo-700 bg-indigo-50 border-indigo-200' 
      };
    } else {
      return { 
        text: `${diffDays} days left`, 
        colorClass: 'text-slate-700 bg-slate-50 border-slate-200' 
      };
    }
  };

  const totalGoals = goals.length;
  const completedCount = completedGoals.length;
  const activeCount = activeGoals.length;
  const overallProgressAvg = totalGoals > 0
    ? Math.round(
        goals.reduce((sum, g) => sum + Math.min(100, Math.round(((g.currentValue || 0) / g.targetValue) * 100)), 0) / totalGoals
      )
    : 0;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Study Goals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Set measurable targets, track weekly milestones, and celebrate study completions.
          </p>
        </div>

        <button
          id="create-goal-button"
          onClick={() => {
            setSelectedGoalForEdit(null);
            setIsGoalModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Goal</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Active Goals</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{activeCount}</span>
            <span className="text-xs text-slate-500 font-medium">in progress</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Targeted academic milestones</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Completed Goals</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">{completedCount}</span>
            <span className="text-xs text-slate-500 font-medium">achieved</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Successfully reached targets</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Average Completion</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-600 font-mono">{overallProgressAvg}%</span>
            <span className="text-xs text-slate-500 font-medium">overall</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Across all recorded goals</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'all'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({goals.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'active'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'completed'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {filterStatus === 'completed' ? 'No completed goals yet' : 'No study goals found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filterStatus === 'completed'
              ? 'Keep making progress on your active goals! Once you complete a target, it will appear here.'
              : 'Create measurable study goals to stay on top of exams, assignments, and revision targets.'}
          </p>
          {filterStatus !== 'completed' && (
            <button
              onClick={() => {
                setSelectedGoalForEdit(null);
                setIsGoalModalOpen(true);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Goal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const isCompleted = goal.status === 'completed';
            const current = goal.currentValue ?? 0;
            const target = goal.targetValue;
            const percent = Math.min(100, Math.round((current / target) * 100));
            const subject = subjects.find(s => s.id === goal.subjectId);
            const deadline = getDaysRemainingText(goal.targetDate, isCompleted);
            const isEditingValue = customEditingGoalId === goal.id;

            return (
              <div
                key={goal.id}
                id={`goal-card-${goal.id}`}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                  isCompleted 
                    ? 'border-emerald-200 bg-emerald-50/20' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {subject ? (
                        <span 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                          style={{
                            backgroundColor: `${subject.color}15`,
                            color: subject.color,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                          {subject.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700">
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          General Study
                        </span>
                      )}

                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${deadline.colorClass}`}>
                        <Calendar className="w-2.5 h-2.5" />
                        {deadline.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedGoalForEdit(goal);
                          setIsGoalModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                        title="Edit Goal"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Goal Title */}
                  <h3 className={`text-sm sm:text-base font-bold tracking-tight mb-1 ${isCompleted ? 'text-slate-700 line-through' : 'text-slate-900'}`}>
                    {goal.title}
                  </h3>

                  {goal.notes && (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                      {goal.notes}
                    </p>
                  )}

                  {/* Progress Bar & Numeric Target */}
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="font-mono text-sm">{current}</span>
                        <span className="text-slate-400">/</span>
                        <span className="font-mono text-sm text-slate-600">{target}</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase">{goal.unit}</span>
                      </div>
                      <span className={`font-mono font-bold text-xs ${isCompleted ? 'text-emerald-700' : 'text-indigo-700'}`}>
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Progress Controls & Complete Button */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {/* Increment Buttons or Custom Edit */}
                  {isEditingValue ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={customValueInput}
                        onChange={(e) => setCustomValueInput(e.target.value)}
                        className="w-20 px-2 py-1 text-xs border border-indigo-300 rounded-lg focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveCustomValue(goal.id)}
                        className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                      >
                        Set
                      </button>
                      <button
                        onClick={() => setCustomEditingGoalId(null)}
                        className="px-2 py-1 text-slate-500 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => incrementGoalProgress(goal.id, 1)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        title="Add 1"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => incrementGoalProgress(goal.id, 5)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        title="Add 5"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => {
                          setCustomEditingGoalId(goal.id);
                          setCustomValueInput(String(current));
                        }}
                        className="px-2 py-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-[11px] font-medium transition-colors"
                        title="Edit value"
                      >
                        Custom...
                      </button>
                    </div>
                  )}

                  {/* Mark Complete Action */}
                  <button
                    onClick={() => handleCompleteToggle(goal)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-600 fill-emerald-600/20' : 'text-indigo-600'}`} />
                    <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
