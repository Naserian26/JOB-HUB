import { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Clock, MapPin, Link, User } from 'lucide-react';
import EmployerLayout from '../components/EmployerLayout';

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8am–6pm
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_STYLES = {
  confirmed:   { bg: '#eaf3de', color: '#3b6d11', label: 'Confirmed' },
  proposed:    { bg: '#eeedfe', color: '#3c3489', label: 'Pending' },
  rescheduled: { bg: '#faeeda', color: '#854f0b', label: 'Rescheduled' },
  cancelled:   { bg: '#fcebeb', color: '#a32d2d', label: 'Cancelled' },
  completed:   { bg: '#e8f5e9', color: '#2e7d32', label: 'Completed' },
};

const getWeekStart = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};

const sameDay = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString();

const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export default function InterviewCalendar() {
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const from = weekStart.toISOString().split('T')[0];
        const end = new Date(weekStart);
        end.setDate(end.getDate() + 6);
        const to = end.toISOString().split('T')[0];
        const { data } = await axios.get(`/api/interviews?from=${from}&to=${to}`);
        if (!cancelled) setInterviews(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [weekStart]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToday = () => setWeekStart(getWeekStart(new Date()));

  // Get interviews for a specific day
  const getDayInterviews = (dayOffset) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + dayOffset);
    return interviews.filter((iv) => {
      const slot = iv.confirmedSlot || iv.proposedSlots?.[0];
      return slot && sameDay(slot.date, day);
    });
  };

  // Position chip on the grid by time
  const getTopPercent = (startTime) => {
    const mins = timeToMinutes(startTime) - 8 * 60; // offset from 8am
    return (mins / (10 * 60)) * 100; // 10hr window
  };

  const getHeightPercent = (startTime, endTime) => {
    const dur = timeToMinutes(endTime) - timeToMinutes(startTime);
    return (dur / (10 * 60)) * 100;
  };

  const formatWeekRange = () => {
    const opts = { month: 'short', day: 'numeric' };
    const s = weekStart.toLocaleDateString('en-US', opts);
    const e = weekEnd.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
    return `${s} – ${e}`;
  };

  const isToday = (offset) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + offset);
    return d.toDateString() === new Date().toDateString();
  };

  return (
    <EmployerLayout>
      <div className="cal-page">
        {/* Header */}
        <div className="cal-topbar">
          <div className="cal-nav">
            <button className="nav-btn" onClick={prevWeek}><ChevronLeft size={16} /></button>
            <button className="today-btn" onClick={goToday}>Today</button>
            <button className="nav-btn" onClick={nextWeek}><ChevronRight size={16} /></button>
            <span className="week-range">{formatWeekRange()}</span>
          </div>
          <div className="cal-legend">
            {Object.entries(STATUS_STYLES).map(([key, s]) => (
              <span key={key} className="legend-pill" style={{ background: s.bg, color: s.color }}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="cal-grid-wrap">
          {/* Day headers */}
          <div className="day-headers">
            <div className="time-gutter" />
            {DAYS.map((day, i) => {
              const d = new Date(weekStart);
              d.setDate(weekStart.getDate() + i);
              return (
                <div key={day} className={`day-header ${isToday(i) ? 'today' : ''}`}>
                  <span className="day-name">{day}</span>
                  <span className={`day-num ${isToday(i) ? 'today-num' : ''}`}>
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="time-grid">
            {/* Hour rows */}
            <div className="hour-labels">
              {HOURS.map((h) => (
                <div key={h} className="hour-label">
                  {h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((_, dayOffset) => {
              const dayInterviews = getDayInterviews(dayOffset);
              return (
                <div key={dayOffset} className={`day-col ${isToday(dayOffset) ? 'today-col' : ''}`}>
                  {HOURS.map((h) => <div key={h} className="hour-cell" />)}

                  {/* Interview chips */}
                  {dayInterviews.map((iv) => {
                    const slot = iv.confirmedSlot || iv.proposedSlots?.[0];
                    if (!slot?.startTime) return null;
                    const style = STATUS_STYLES[iv.status] || STATUS_STYLES.proposed;
                    const top = getTopPercent(slot.startTime);
                    const height = Math.max(getHeightPercent(slot.startTime, slot.endTime), 5);
                    return (
                      <div
                        key={iv._id}
                        className="iv-chip"
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          background: style.bg,
                          borderLeft: `3px solid ${style.color}`,
                        }}
                        onClick={() => setSelected(iv)}
                      >
                        <div className="chip-name">{iv.candidate?.name}</div>
                        <div className="chip-time" style={{ color: style.color }}>
                          {slot.startTime} – {slot.endTime}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {loading && <div className="loading-overlay">Loading...</div>}

        {/* Detail panel */}
        {selected && (
          <div className="detail-panel">
            <div className="detail-header">
              <h3 className="detail-title">Interview details</h3>
              <button className="icon-btn" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="detail-body">
              <div className="detail-row">
                <User size={14} />
                <span>{selected.candidate?.name}</span>
              </div>
              <div className="detail-row">
                <Clock size={14} />
                <span>
                  {selected.confirmedSlot
                    ? `${selected.confirmedSlot.startTime} – ${selected.confirmedSlot.endTime}`
                    : 'Awaiting confirmation'}
                </span>
              </div>
              {selected.location && (
                <div className="detail-row">
                  <MapPin size={14} />
                  <span>{selected.location}</span>
                </div>
              )}
              {selected.meetingLink && (
                <div className="detail-row">
                  <Link size={14} />
                  <a href={selected.meetingLink} target="_blank" rel="noreferrer" className="detail-link">
                    Join meeting
                  </a>
                </div>
              )}
              {selected.notes && (
                <p className="detail-notes">{selected.notes}</p>
              )}
              <span
                className="status-badge"
                style={{
                  background: STATUS_STYLES[selected.status]?.bg,
                  color: STATUS_STYLES[selected.status]?.color,
                }}
              >
                {STATUS_STYLES[selected.status]?.label}
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .cal-page { display: flex; flex-direction: column; height: calc(100vh - 64px); position: relative; }
        .cal-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
        }
        .cal-nav { display: flex; align-items: center; gap: 8px; }
        .nav-btn {
          background: #f5f5f5; border: none; border-radius: 8px;
          padding: 6px 10px; cursor: pointer; display: flex; align-items: center;
          color: #555;
        }
        .nav-btn:hover { background: #ebebeb; }
        .today-btn {
          background: #f5f5f5; border: none; border-radius: 8px;
          padding: 6px 14px; font-size: 13px; font-weight: 500;
          cursor: pointer; color: #333;
        }
        .today-btn:hover { background: #ebebeb; }
        .week-range { font-size: 14px; font-weight: 500; color: #222; margin-left: 4px; }
        .cal-legend { display: flex; gap: 8px; flex-wrap: wrap; }
        .legend-pill {
          font-size: 11px; font-weight: 500; padding: 3px 10px;
          border-radius: 20px;
        }
        .cal-grid-wrap { flex: 1; overflow-y: auto; }
        .day-headers {
          display: grid;
          grid-template-columns: 56px repeat(7, 1fr);
          position: sticky; top: 0; background: #fff; z-index: 10;
          border-bottom: 1px solid #f0f0f0;
        }
        .time-gutter { border-right: 1px solid #f0f0f0; }
        .day-header {
          display: flex; flex-direction: column; align-items: center;
          padding: 10px 0; border-right: 1px solid #f0f0f0;
        }
        .day-header.today { background: #f7f5ff; }
        .day-name { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.05em; }
        .day-num { font-size: 20px; font-weight: 500; color: #333; line-height: 1.2; }
        .today-num {
          background: #6c63ff; color: #fff;
          border-radius: 50%; width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .time-grid {
          display: grid;
          grid-template-columns: 56px repeat(7, 1fr);
          position: relative;
        }
        .hour-labels { display: flex; flex-direction: column; border-right: 1px solid #f0f0f0; }
        .hour-label {
          height: 60px; font-size: 11px; color: #bbb;
          padding: 4px 6px 0; text-align: right; flex-shrink: 0;
        }
        .day-col {
          border-right: 1px solid #f0f0f0;
          position: relative;
        }
        .day-col.today-col { background: #faf9ff; }
        .hour-cell {
          height: 60px; border-bottom: 1px solid #f7f7f7;
        }
        .iv-chip {
          position: absolute; left: 4px; right: 4px;
          border-radius: 6px; padding: 4px 6px;
          cursor: pointer; z-index: 2; overflow: hidden;
          transition: filter 0.15s;
        }
        .iv-chip:hover { filter: brightness(0.95); }
        .chip-name { font-size: 12px; font-weight: 500; color: #222; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chip-time { font-size: 11px; margin-top: 1px; }
        .loading-overlay {
          position: absolute; inset: 0; background: rgba(255,255,255,0.7);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; color: #888;
        }
        .detail-panel {
          position: fixed; right: 24px; top: 50%;
          transform: translateY(-50%);
          background: #fff; border-radius: 14px;
          border: 1px solid #eee;
          box-shadow: 0 4px 24px rgba(0,0,0,0.1);
          width: 280px; z-index: 20;
        }
        .detail-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px 10px;
          border-bottom: 1px solid #f0f0f0;
        }
        .detail-title { font-size: 14px; font-weight: 600; margin: 0; }
        .detail-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
        .detail-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #333; }
        .detail-link { color: #6c63ff; font-size: 13px; }
        .detail-notes { font-size: 13px; color: #666; margin: 0; line-height: 1.5; }
        .status-badge {
          display: inline-block; font-size: 12px; font-weight: 500;
          padding: 4px 12px; border-radius: 20px; width: fit-content;
        }
        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: #999; padding: 4px; border-radius: 6px;
        }
        .icon-btn:hover { background: #f5f5f5; color: #333; }
      `}</style>
    </EmployerLayout>
  );
}