import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Sparkles, 
  ArrowRight, 
  Check, 
  BookOpen, 
  Calculator, 
  Clock, 
  ChevronRight,
  Copy,
  Download,
  Flame,
  Award,
  BarChart3
} from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface StudyPlannerPageProps {
  onNavigate: (path: string) => void;
  onGetStarted: () => void;
  onLogin: () => void;
}

interface PlannedCourse {
  id: string;
  name: string;
  credits: number;
  difficulty: 'normal' | 'hard' | 'very_hard';
  weeklyHours: number;
}

export const StudyPlannerPage: React.FC<StudyPlannerPageProps> = ({
  onNavigate,
  onGetStarted,
  onLogin
}) => {
  const [courses, setCourses] = useState<PlannedCourse[]>([
    { id: '1', name: 'Calculus III & Differential Equations', credits: 4, difficulty: 'hard', weeklyHours: 10 },
    { id: '2', name: 'Organic Chemistry & Lab', credits: 4, difficulty: 'very_hard', weeklyHours: 12 },
    { id: '3', name: 'Microeconomics', credits: 3, difficulty: 'normal', weeklyHours: 6 },
    { id: '4', name: 'Academic Research & Composition', credits: 3, difficulty: 'normal', weeklyHours: 5 }
  ]);

  const [newCourseName, setNewCourseName] = useState('');
  const [newCredits, setNewCredits] = useState(3);
  const [copied, setCopied] = useState(false);

  // Day by day distribution
  const [schedule, setSchedule] = useState<Record<string, number>>({
    Monday: 5,
    Tuesday: 5.5,
    Wednesday: 5,
    Thursday: 5.5,
    Friday: 4,
    Saturday: 4,
    Sunday: 4
  });

  const difficultyMultipliers = {
    normal: 2.0,     // 2 hrs per credit
    hard: 2.5,       // 2.5 hrs per credit
    very_hard: 3.0   // 3 hrs per credit
  };

  const addCourse = () => {
    if (!newCourseName.trim()) return;
    const defaultHours = newCredits * 2;
    const newCourse: PlannedCourse = {
      id: Date.now().toString(),
      name: newCourseName.trim(),
      credits: newCredits,
      difficulty: 'normal',
      weeklyHours: defaultHours
    };
    setCourses([...courses, newCourse]);
    setNewCourseName('');
    setNewCredits(3);
  };

  const removeCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const updateDifficulty = (id: string, diff: 'normal' | 'hard' | 'very_hard') => {
    setCourses(courses.map(c => {
      if (c.id === id) {
        const mult = difficultyMultipliers[diff];
        return { ...c, difficulty: diff, weeklyHours: Math.round(c.credits * mult) };
      }
      return c;
    }));
  };

  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  const recommendedWeeklyHours = courses.reduce((sum, c) => sum + c.weeklyHours, 0);
  const totalAllocatedDailyHours = (Object.values(schedule) as number[]).reduce((sum: number, h: number) => sum + h, 0);

  const copyScheduleText = () => {
    const text = `Weekly Academic Study Plan (Focus Flow - focusflow.in)
Total Credits: ${totalCredits}
Recommended Study Budget: ${recommendedWeeklyHours} hours/week

Course Breakdown:
${courses.map(c => `- ${c.name} (${c.credits} credits): ${c.weeklyHours} hrs/week [${c.difficulty.replace('_', ' ')}]`).join('\n')}

Daily Schedule:
${Object.entries(schedule).map(([day, hrs]) => `- ${day}: ${hrs} hours`).join('\n')}
Total Weekly Planned: ${totalAllocatedDailyHours} hours`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://focusflow.in/study-planner#webapp",
        "name": "Academic Study Planner & Weekly Budget Calculator — Focus Flow",
        "url": "https://focusflow.in/study-planner",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "All",
        "description": "Free interactive college and student study planner. Calculates optimal weekly study hours based on course credit loads, allocates daily schedules, and prevents cramming.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://focusflow.in/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Study Planner",
            "item": "https://focusflow.in/study-planner"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white font-sans antialiased">
      <SEOHead
        title="Academic Study Planner & Weekly Budget Calculator | Focus Flow"
        description="Free interactive college study planner tool. Calculate credit-hour study loads, build balanced weekly schedules, and eliminate exam cramming with Focus Flow."
        canonicalUrl="https://focusflow.in/study-planner"
        schemaJson={jsonLd}
        keywords={[
          'study planner online',
          'college study schedule calculator',
          'weekly study budget planner',
          'student semester planner',
          'credit hour study calculator',
          'focus flow study planner'
        ]}
      />

      <PublicHeader
        currentPath="/study-planner"
        onNavigate={onNavigate}
        onGetStarted={onGetStarted}
        onLogin={onLogin}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-xs text-slate-400">
            <li>
              <button onClick={() => onNavigate('/')} className="hover:text-emerald-400 transition-colors">
                Home
              </button>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5" /></li>
            <li className="text-slate-200 font-medium" aria-current="page">
              Study Planner & Calculator
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-xs font-semibold text-emerald-300 mb-4">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Academic Load Calibration</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Academic Study Planner & Weekly Budget Matrix
          </h1>
          <p className="text-base text-slate-400 leading-relaxed">
            Enter your semester courses to calculate the scientifically optimal weekly study hours, distribute your daily schedule, and eliminate last-minute cramming.
          </p>
        </header>

        {/* Interactive Planner Widget */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl mb-16 relative overflow-hidden" aria-label="Interactive Study Planner Calculator">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enrolled Load</span>
              <div className="text-3xl font-mono font-black text-white mt-1">
                {totalCredits} <span className="text-sm font-sans font-medium text-slate-400">Credits</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Full-time undergraduate load</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Recommended Weekly Study</span>
              <div className="text-3xl font-mono font-black text-emerald-400 mt-1">
                {recommendedWeeklyHours} <span className="text-sm font-sans font-medium text-slate-400">Hrs/Wk</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Based on course difficulty multipliers</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Planned Daily Allocation</span>
              <div className="text-3xl font-mono font-black text-indigo-400 mt-1">
                {totalAllocatedDailyHours} <span className="text-sm font-sans font-medium text-slate-400">Hrs/Wk</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {totalAllocatedDailyHours >= recommendedWeeklyHours ? '✅ Target pace satisfied' : '⚠️ Under target by ' + (recommendedWeeklyHours - totalAllocatedDailyHours) + 'h'}
              </p>
            </div>
          </div>

          {/* Course List & Customizer */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Your Active Courses & Difficulty Weightings</span>
              </h2>
            </div>

            <div className="space-y-3">
              {courses.map(course => (
                <div 
                  key={course.id}
                  className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{course.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{course.credits} credit hours</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Difficulty selector */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                      {(['normal', 'hard', 'very_hard'] as const).map(d => (
                        <button
                          key={d}
                          onClick={() => updateDifficulty(course.id, d)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            course.difficulty === d 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {d === 'normal' ? 'Standard (2x)' : d === 'hard' ? 'Heavy (2.5x)' : 'Intense (3x)'}
                        </button>
                      ))}
                    </div>

                    <div className="text-right min-w-[70px]">
                      <div className="text-sm font-mono font-bold text-emerald-400">{course.weeklyHours} hrs</div>
                      <div className="text-[10px] text-slate-500">per week</div>
                    </div>

                    <button
                      onClick={() => removeCourse(course.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                      title="Remove course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Course Form */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newCourseName}
                onChange={e => setNewCourseName(e.target.value)}
                placeholder="Add new course (e.g. Physics II Mechanics)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <select
                value={newCredits}
                onChange={e => setNewCredits(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={1}>1 Credit</option>
                <option value={2}>2 Credits</option>
                <option value={3}>3 Credits</option>
                <option value={4}>4 Credits</option>
                <option value={5}>5 Credits</option>
              </select>
              <button
                onClick={addCourse}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add Course</span>
              </button>
            </div>
          </div>

          {/* Daily Schedule Allocation Bar */}
          <div className="pt-6 border-t border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Weekly Daily Hour Distribution</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
              {Object.entries(schedule).map(([day, hours]) => (
                <div key={day} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">{day.slice(0, 3)}</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="14"
                    value={hours}
                    onChange={e => setSchedule({ ...schedule, [day]: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-2 py-1 text-center font-mono font-bold text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">hrs</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={copyScheduleText}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Schedule Copied to Clipboard!' : 'Copy Plan Breakdown'}</span>
              </button>

              <button
                onClick={onGetStarted}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
              >
                <span>Sync with Focus Flow Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Deep Educational Guide to Academic Planning */}
        <article className="prose prose-invert max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-4">
              The 2-to-1 Credit Hour Rule in Higher Education
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              In academic pedagogy across North American and European collegiate systems, standard institutional accreditation requires approximately <strong>2 to 3 hours of independent study for every 1 credit hour of lecture</strong> each week. For a full-time 15-credit semester schedule, this translates to 30 to 45 hours of weekly out-of-classroom preparation—equivalent to a full-time career.
            </p>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed mt-3">
              Students who fail to budget this time predictably encounter acute panic during midterm and finals weeks. By calculating and anchoring your course study budgets at the start of each semester, learning happens incrementally through spaced repetition rather than exhausting cram sessions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-6">
              4 Rules for a Bulletproof Semester Study Schedule
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-2">1. Front-Load the Week</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Schedule heavier 5-hour study blocks on Monday through Wednesday. If unexpected assignments or personal events arise on Friday or the weekend, your momentum remains safely intact.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-2">2. Respect Course Difficulty Weightings</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Not all 4-credit courses require identical effort. Problem-heavy STEM courses (Calculus, Organic Chemistry, Algorithms) demand 3x hours for active problem-solving compared to discussion seminars.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-2">3. Interleaved Subject Practice</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instead of dedicating an entire 6-hour Saturday to a single class, split the day into two 2.5-hour blocks across different subjects. Interleaving forces the brain to actively switch problem-solving schemas.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-2">4. Build Buffer Days</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Keep at least half of Sunday unscheduled. Use it as a dedicated review and reflection buffer to organize upcoming assignment deadlines on Focus Flow.
                </p>
              </div>
            </div>
          </section>

          {/* Internal Linking Hub */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-white mb-4">Integrated Study Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => onNavigate('/study-timer')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 text-left transition-all group"
              >
                <div className="text-sm font-bold text-white group-hover:text-emerald-400 flex items-center justify-between">
                  <span>Online Study Timer</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Time your study blocks with calming soundscapes.</p>
              </button>

              <button 
                onClick={() => onNavigate('/pomodoro-timer')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 text-left transition-all group"
              >
                <div className="text-sm font-bold text-white group-hover:text-emerald-400 flex items-center justify-between">
                  <span>Pomodoro Timer (25/5)</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Execute your planned hours with 25-minute sprints.</p>
              </button>

              <button 
                onClick={() => onNavigate('/focus-timer')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 text-left transition-all group"
              >
                <div className="text-sm font-bold text-white group-hover:text-emerald-400 flex items-center justify-between">
                  <span>Deep Work Shield</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Eliminate digital distractions and lock in focus.</p>
              </button>
            </div>
          </section>

          {/* Account Upgrade CTA */}
          <section className="rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-800/50 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              Automate Your Study Budgets with Focus Flow
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6">
              Create your free account on Focus Flow to create subjects, link homework assignments, log live focus sessions against each course budget, and visualize weekly completion rates in real time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onGetStarted}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                <span>Launch Focus Flow Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onLogin}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm border border-slate-800 transition-all"
              >
                <span>Log In</span>
              </button>
            </div>
          </section>
        </article>
      </main>

      <PublicFooter
        onNavigate={onNavigate}
        onGetStarted={onGetStarted}
        onLogin={onLogin}
      />
    </div>
  );
};
