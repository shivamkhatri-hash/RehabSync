import React, { useState } from 'react';

export default function DailyPrescriptionCalendar({
  sessions = [],
  prescriptions = [],
  calendarStatuses = {},
  todayRoutine = [],
  onStartWorkout
}) {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth(); // 0-indexed
  const todayDateStr = today.toISOString().split('T')[0];

  const [currentYear, setCurrentYear] = useState(todayYear);
  const [currentMonth, setCurrentMonth] = useState(todayMonth);
  const [selectedDateStr, setSelectedDateStr] = useState(todayDateStr);
  const [isLogOpen, setIsLogOpen] = useState(true);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Prevent navigation into future months
  const isCurrentMonthOrFuture = currentYear > todayYear || (currentYear === todayYear && currentMonth >= todayMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (isCurrentMonthOrFuture) return;
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Group sessions by date YYYY-MM-DD
  const sessionsByDate = {};
  sessions.forEach(s => {
    try {
      const dStr = new Date(s.date).toISOString().split('T')[0];
      if (!sessionsByDate[dStr]) sessionsByDate[dStr] = [];
      sessionsByDate[dStr].push(s);
    } catch (e) {}
  });

  // Calculate days in viewing month
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0: Sun, 1: Mon...
  const startDayOffset = (firstDayOfWeek + 6) % 7; // Monday start
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Selected date data
  const selectedSessions = sessionsByDate[selectedDateStr] || [];
  const selectedTotalReps = selectedSessions.reduce((acc, s) => acc + (s.reps_completed || 0), 0);

  const isSelectedToday = selectedDateStr === todayDateStr;
  const isSelectedFuture = selectedDateStr > todayDateStr;

  // Selected date status lookup
  const selectedDayStatus = calendarStatuses[selectedDateStr] || null;

  // Summary counts
  let monthCompletedDays = 0;
  let monthPartialDays = 0;
  let monthMissedDays = 0;
  let monthRestDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dStr <= todayDateStr) {
      const dayStatusObj = calendarStatuses[dStr];
      const st = dayStatusObj?.status;
      if (st === 'completed') monthCompletedDays++;
      else if (st === 'partially_completed') monthPartialDays++;
      else if (st === 'missed') monthMissedDays++;
      else monthRestDays++;
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
      
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Rehabilitation Adherence Calendar
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Turns <span className="text-emerald-600 font-bold">green</span> only when <span className="underline font-semibold">ALL</span> assigned daily exercises finish • <span className="text-slate-500 font-semibold">Future locked 🔒</span>
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-2xl">
          <button
            onClick={handlePrevMonth}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-black text-sm transition-all"
            title="Previous Month"
          >
            ‹
          </button>
          <span className="font-extrabold text-xs text-slate-800 min-w-[110px] text-center font-mono">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={isCurrentMonthOrFuture}
            className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-sm transition-all ${
              isCurrentMonthOrFuture
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title={isCurrentMonthOrFuture ? "Future months are locked" : "Next Month"}
          >
            ›
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-600 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Complete (All Done)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Partial Session</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span> Missed Assignment</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span> Rest Day</span>
        <span className="flex items-center gap-1 text-slate-400"><span className="text-[9px]">🔒</span> Future Locked</span>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
          <div key={idx} className="py-0.5">{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Empty offset padding cells */}
        {Array.from({ length: startDayOffset }).map((_, idx) => (
          <div key={`offset-${idx}`} className="h-12 rounded-xl bg-transparent opacity-0" />
        ))}

        {/* Month Day Cells */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isToday = dateStr === todayDateStr;
          const isFuture = dateStr > todayDateStr;
          const isSelected = dateStr === selectedDateStr;

          const dayStatusObj = calendarStatuses[dateStr] || null;
          const daySessions = sessionsByDate[dateStr] || [];
          const dayReps = daySessions.reduce((acc, s) => acc + (s.reps_completed || 0), 0);

          // Clinical status determination
          const status = dayStatusObj?.status || (isFuture ? 'locked_future' : (dayReps > 0 ? 'partially_completed' : 'rest_day'));
          const isCompleted = status === 'completed';
          const isPartial = status === 'partially_completed';
          const isMissed = status === 'missed';
          const isRest = status === 'rest_day' || (!isFuture && !dayStatusObj && dayReps === 0);

          let cellBgClass = 'bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 cursor-pointer shadow-2xs';
          if (isSelected) {
            cellBgClass = 'ring-2 ring-teal-500 bg-teal-50/70 border-teal-500 shadow-sm';
          } else if (isFuture) {
            cellBgClass = 'bg-slate-50/40 border border-slate-100 text-slate-300 cursor-not-allowed';
          } else if (isCompleted) {
            cellBgClass = 'bg-emerald-50/80 border border-emerald-300 text-emerald-900 hover:bg-emerald-100/70 shadow-2xs';
          } else if (isPartial) {
            cellBgClass = 'bg-amber-50/80 border border-amber-300 text-amber-900 hover:bg-amber-100/70 shadow-2xs';
          } else if (isMissed) {
            cellBgClass = 'bg-rose-50/70 border border-rose-200 text-rose-700 hover:bg-rose-100/70';
          }

          return (
            <button
              key={dateStr}
              disabled={isFuture}
              onClick={() => !isFuture && setSelectedDateStr(dateStr)}
              className={`h-12 rounded-xl p-1 flex flex-col justify-between items-center transition-all relative group text-left ${cellBgClass} ${
                isToday ? 'border-teal-500 font-black ring-1 ring-teal-400/40' : ''
              }`}
            >
              {/* Top: Day Number & indicator */}
              <div className="w-full flex justify-between items-center px-0.5">
                <span className={`text-[10.5px] font-extrabold ${
                  isToday ? 'text-teal-600 font-black' : isFuture ? 'text-slate-300' : isCompleted ? 'text-emerald-700' : 'text-slate-700'
                }`}>
                  {dayNum}
                </span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" title="Today" />
                )}
                {isFuture && (
                  <span className="text-[8px] text-slate-300">🔒</span>
                )}
              </div>

              {/* Bottom: Clinical Adherence Badge */}
              <div className="w-full flex items-center justify-center">
                {isFuture ? (
                  <span className="text-[8.5px] text-slate-300 font-mono">--</span>
                ) : isCompleted ? (
                  <span className="inline-flex items-center px-1 py-0.2 rounded bg-emerald-500 text-white text-[8px] font-black shadow-2xs">
                    ✓ All Done
                  </span>
                ) : isPartial ? (
                  <span className="inline-flex items-center px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 text-[8px] font-black">
                    ⏳ Partial
                  </span>
                ) : isMissed ? (
                  <span className="inline-flex items-center px-1 py-0.2 rounded bg-rose-500/20 text-rose-700 text-[8px] font-bold">
                    ✕ Missed
                  </span>
                ) : isToday ? (
                  <span className="inline-flex items-center px-1 py-0.2 rounded bg-teal-500/15 text-teal-700 text-[8px] font-bold">
                    Today
                  </span>
                ) : (
                  <span className="text-[8px] text-slate-300 font-mono">Rest</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Task Detail Popout Card */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800">
              📅 {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            {isSelectedToday && (
              <span className="text-[8.5px] px-1.5 py-0.5 rounded-md bg-teal-500 text-white font-extrabold uppercase">
                Today
              </span>
            )}
            {selectedDayStatus?.status === 'completed' && (
              <span className="text-[8.5px] px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold uppercase">
                ✓ 100% Adherence
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-mono font-bold">
            {selectedTotalReps} Reps Logged
          </span>
        </div>

        {/* Show exercises scheduled for this day if available */}
        {isSelectedToday && todayRoutine && todayRoutine.length > 0 ? (
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest block">
              Today's Prescribed Routine ({todayRoutine.filter(r => r.isCompleted).length}/{todayRoutine.length} Complete)
            </span>
            <div className="space-y-1.5">
              {todayRoutine.map((item, idx) => (
                <div key={item.assignmentId || idx} className="bg-white p-2.5 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800 block">{item.exerciseName}</span>
                    <span className="text-[10px] text-slate-500">
                      Target: {item.targetDailyWork} {item.targetType === 'hold_seconds' ? 'seconds hold' : 'reps'} ({item.sets}×{item.repsOrHold} × {item.sessionsPerDay}/day)
                    </span>
                  </div>
                  <div className="text-right">
                    {item.isCompleted ? (
                      <span className="text-emerald-600 font-black text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">✓ Completed</span>
                    ) : (
                      <span className="text-amber-600 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{item.completedWork} / {item.targetDailyWork} done</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
            <div>
              <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest block">Clinical Status</span>
              <span className="font-extrabold text-slate-800 text-xs">
                {selectedDayStatus?.status === 'completed' ? 'All prescribed assignments finished' :
                 selectedDayStatus?.status === 'partially_completed' ? 'Partially completed routine' :
                 selectedDayStatus?.status === 'missed' ? 'Missed routine assignment' : 'Rest or unassigned day'}
              </span>
            </div>
            {isSelectedToday && (
              <button
                onClick={() => onStartWorkout && onStartWorkout()}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-[11px] transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span>🏋️‍♂️ Open Workout Hub</span>
              </button>
            )}
          </div>
        )}

        {/* Workouts logged list */}
        {selectedSessions.length > 0 && (
          <div className="pt-2 border-t border-slate-200/60 space-y-2">
            <button
              type="button"
              onClick={() => setIsLogOpen(prev => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors py-1 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Workout Log</span>
                <span className="bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full text-[10px] border border-teal-200">
                  {selectedSessions.length} {selectedSessions.length === 1 ? 'Session' : 'Sessions'}
                </span>
              </div>
              <span className="text-[11px] text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1">
                {isLogOpen ? 'Hide Logs ▲' : 'Show Logs ▼'}
              </span>
            </button>

            {isLogOpen && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 rounded-xl">
                {selectedSessions.map((session, sIdx) => (
                  <div
                    key={session._id || sIdx}
                    className="bg-white p-2 rounded-xl border border-slate-200/70 flex items-center justify-between text-[11px] shadow-2xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                      <span className="font-bold text-slate-800 truncate max-w-[150px] sm:max-w-[200px]">
                        {session.exerciseName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-teal-600 font-black">{session.reps_completed} Reps</span>
                      <span className="text-slate-400 font-mono text-[9.5px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150">
                        {session.gamePlayed || 'Standard'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
