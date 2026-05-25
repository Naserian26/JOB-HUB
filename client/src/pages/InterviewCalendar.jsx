import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ChevronLeft, ChevronRight, Clock, MapPin,
  User, X, Plus, Calendar, Video, FileText, Trash2
} from 'lucide-react';
import EmployerLayout from '../components/EmployerLayout';

// ─── Constants ────────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const STATUS_STYLES = {
  confirmed:   { bg: 'rgba(249,115,22,0.15)',  border: '#f97316', color: '#f97316', label: 'Confirmed' },
  proposed:    { bg: 'rgba(249,115,22,0.15)',  border: '#f97316', color: '#f97316', label: 'Pending' },
  rescheduled: { bg: 'rgba(245,158,11,0.15)',  border: '#f59e0b', color: '#fbbf24', label: 'Rescheduled' },
  cancelled:   { bg: 'rgba(239,68,68,0.15)',   border: '#ef4444', color: '#f87171', label: 'Cancelled' },
  completed:   { bg: 'rgba(34,197,94,0.15)',   border: '#22c55e', color: '#4ade80', label: 'Completed' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getWeekStart = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};

const sameDay = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString();

const timeToMinutes = (t) => {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return h * 60 + m;
};

const pad = (n) => String(n).padStart(2, '0');

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ selected, onSelect }) {
  const [view, setView] = useState(new Date(selected));
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  return (
    <div className="mini-cal">
      <div className="mini-cal-header">
        <button className="mini-nav" onClick={() => setView(new Date(year, month - 1, 1))}>
          <ChevronLeft size={13} />
        </button>
        <span className="mini-month">{MONTHS[month].slice(0, 3)} {year}</span>
        <button className="mini-nav" onClick={() => setView(new Date(year, month + 1, 1))}>
          <ChevronRight size={13} />
        </button>
      </div>
      <div className="mini-cal-grid">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="mini-day-name">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const date = new Date(year, month, day);
          const isSel = sameDay(date, selected);
          const isNow = sameDay(date, new Date());
          return (
            <button
              key={i}
              className={`mini-day ${isSel ? 'selected' : ''} ${isNow && !isSel ? 'today' : ''}`}
              onClick={() => onSelect(date)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Schedule Modal ───────────────────────────────────────────────────────────
function ScheduleModal({ date, hour, applications, onClose, onSave }) {
  const defaultDate = date ? new Date(date) : new Date();
  const [form, setForm] = useState({
    applicationId: '',
    date: defaultDate.toISOString().split('T')[0],
    startTime: hour != null ? `${pad(hour)}:00` : '09:00',
    endTime:   hour != null ? `${pad(Math.min(hour + 1, 18))}:00` : '10:00',
    location: '',
    meetingLink: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.applicationId) return setError('Please select a candidate.');
    if (!form.date || !form.startTime || !form.endTime) return setError('Date and time are required.');
    setSaving(true);
    setError('');
    try {
      await onSave({
        applicationId: form.applicationId,
        proposedSlots: [{
          date: new Date(form.date).toISOString(),
          startTime: form.startTime,
          endTime: form.endTime,
        }],
        location: form.location,
        meetingLink: form.meetingLink,
        notes: form.notes,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule interview.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title-row">
            <Calendar size={16} className="modal-icon" />
            <h3 className="modal-title">Schedule Interview</h3>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label className="field-label"><User size={12} /> Candidate</label>
            <select
              className="field-input"
              value={form.applicationId}
              onChange={e => update('applicationId', e.target.value)}
            >
              <option value="">Select a candidate…</option>
              {applications.map(app => (
                <option key={app._id} value={app._id}>
                  {app.seekerId?.name} — {app.jobId?.title}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label"><Calendar size={12} /> Date</label>
            <input
              type="date"
              className="field-input"
              value={form.date}
              onChange={e => update('date', e.target.value)}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label"><Clock size={12} /> Start</label>
              <input
                type="time"
                className="field-input"
                value={form.startTime}
                onChange={e => update('startTime', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label"><Clock size={12} /> End</label>
              <input
                type="time"
                className="field-input"
                value={form.endTime}
                onChange={e => update('endTime', e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label"><MapPin size={12} /> Location (optional)</label>
            <input
              type="text"
              className="field-input"
              placeholder="e.g. Nairobi CBD Office, Room 3B"
              value={form.location}
              onChange={e => update('location', e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label"><Video size={12} /> Meeting Link (optional)</label>
            <input
              type="url"
              className="field-input"
              placeholder="https://meet.google.com/..."
              value={form.meetingLink}
              onChange={e => update('meetingLink', e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label"><FileText size={12} /> Notes (optional)</label>
            <textarea
              className="field-input field-textarea"
              placeholder="Anything the candidate should know…"
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              rows={3}
            />
          </div>

          {error && <div className="modal-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Scheduling…' : 'Schedule Interview'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ interview, onClose, onCancel }) {
  const slot = interview.confirmedSlot || interview.proposedSlots?.[0];
  const style = STATUS_STYLES[interview.status] || STATUS_STYLES.proposed;
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await onCancel(interview._id);
      onClose();
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="status-dot" style={{ background: style.border }} />
          <h3 className="detail-title">Interview Details</h3>
        </div>
        <button className="icon-btn" onClick={onClose}><X size={15} /></button>
      </div>

      <div className="detail-body">
        <div className="detail-job">{interview.job?.title}</div>

        <div className="detail-row">
          <User size={13} className="detail-icon" />
          <div>
            <div className="detail-val">{interview.candidate?.name}</div>
            <div className="detail-sub">{interview.candidate?.email}</div>
          </div>
        </div>

        <div className="detail-row">
          <Clock size={13} className="detail-icon" />
          <div>
            {slot ? (
              <>
                <div className="detail-val">
                  {new Date(slot.date).toLocaleDateString('en-KE', {
                    weekday: 'short', month: 'short', day: 'numeric'
                  })}
                </div>
                <div className="detail-sub">{slot.startTime} – {slot.endTime}</div>
              </>
            ) : (
              <div className="detail-val muted">No slot set</div>
            )}
          </div>
        </div>

        {interview.location && (
          <div className="detail-row">
            <MapPin size={13} className="detail-icon" />
            <div className="detail-val">{interview.location}</div>
          </div>
        )}

        {interview.meetingLink && (
          <div className="detail-row">
            <Video size={13} className="detail-icon" />
            <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="detail-link">
              Join Meeting
            </a>
          </div>
        )}

        {interview.notes && (
          <div className="detail-notes">{interview.notes}</div>
        )}

        <span
          className="status-badge"
          style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
        >
          {style.label}
        </span>
      </div>

      {!['cancelled', 'completed'].includes(interview.status) && (
        <div className="detail-footer">
          <button className="btn-danger-sm" onClick={handleCancel} disabled={cancelling}>
            <Trash2 size={13} />
            {cancelling ? 'Cancelling…' : 'Cancel Interview'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InterviewCalendar() {
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Load interviews whenever the week changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const from = weekStart.toISOString().split('T')[0];
        const toDate = new Date(weekStart);
        toDate.setDate(toDate.getDate() + 6);
        const to = toDate.toISOString().split('T')[0];
        const { data } = await axios.get(`/api/interviews?from=${from}&to=${to}`, { headers });
        if (!cancelled) setInterviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setInterviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load employer applications for the schedule modal dropdown
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get('/api/applications/employer/all', { headers });
        // Only show applications that are at interview stage
        const eligible = Array.isArray(data)
          ? data.filter(a => a.status === 'interview')
          : [];
        setApplications(eligible);
      } catch {
        setApplications([]);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const jumpToDate = (date) => setWeekStart(getWeekStart(date));

  const getDayInterviews = (dayOffset) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + dayOffset);
    return interviews.filter((iv) => {
      const slot = iv.confirmedSlot || iv.proposedSlots?.[0];
      return slot && sameDay(slot.date, day);
    });
  };

  const getTopPercent = (startTime) => {
    const mins = timeToMinutes(startTime) - 8 * 60;
    return (mins / (10 * 60)) * 100;
  };

  const getHeightPercent = (startTime, endTime) => {
    const dur = timeToMinutes(endTime) - timeToMinutes(startTime);
    return Math.max((dur / (10 * 60)) * 100, 4);
  };

  const formatWeekRange = () => {
    const opts = { month: 'short', day: 'numeric' };
    const s = weekStart.toLocaleDateString('en-KE', opts);
    const e = weekEnd.toLocaleDateString('en-KE', { ...opts, year: 'numeric' });
    return `${s} – ${e}`;
  };

  const isToday = (offset) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + offset);
    return d.toDateString() === new Date().toDateString();
  };

  const handleSave = async (payload) => {
    await axios.post('/api/interviews', payload, { headers });
    const from = weekStart.toISOString().split('T')[0];
    const toDate = new Date(weekStart);
    toDate.setDate(toDate.getDate() + 6);
    const to = toDate.toISOString().split('T')[0];
    const { data } = await axios.get(`/api/interviews?from=${from}&to=${to}`, { headers });
    setInterviews(Array.isArray(data) ? data : []);
  };

  const handleCancel = async (id) => {
    await axios.patch(`/api/interviews/${id}/cancel`, {}, { headers });
    setInterviews(prev => prev.map(iv =>
      iv._id === id ? { ...iv, status: 'cancelled' } : iv
    ));
  };

  const handleCellClick = (dayOffset, hour) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + dayOffset);
    setModal({ date: day, hour });
  };

  return (
    <EmployerLayout>
      <div className="cal-page">

        {/* ── Sidebar ── */}
        <div className="cal-sidebar">
          <button className="schedule-btn" onClick={() => setModal({ date: new Date(), hour: 9 })}>
            <Plus size={15} /> Schedule Interview
          </button>

          <MiniCalendar selected={weekStart} onSelect={jumpToDate} />

          <div className="legend-section">
            <div className="legend-title">Status</div>
            {Object.entries(STATUS_STYLES).map(([key, s]) => (
              <div key={key} className="legend-row">
                <span className="legend-dot" style={{ background: s.border }} />
                <span className="legend-label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="upcoming-section">
            <div className="legend-title">This Week</div>
            {interviews.length === 0 ? (
              <div className="upcoming-empty">No interviews scheduled</div>
            ) : interviews.slice(0, 5).map(iv => {
              const slot = iv.confirmedSlot || iv.proposedSlots?.[0];
              const s = STATUS_STYLES[iv.status] || STATUS_STYLES.proposed;
              return (
                <div key={iv._id} className="upcoming-item" onClick={() => setSelected(iv)}>
                  <span className="upcoming-dot" style={{ background: s.border }} />
                  <div>
                    <div className="upcoming-name">{iv.candidate?.name}</div>
                    <div className="upcoming-time">
                      {slot ? `${slot.startTime} – ${slot.endTime}` : 'Pending'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main ── */}
        <div className="cal-main">
          <div className="cal-topbar">
            <div className="cal-nav">
              <button className="nav-btn" onClick={prevWeek}><ChevronLeft size={15} /></button>
              <button className="today-btn" onClick={() => setWeekStart(getWeekStart(new Date()))}>Today</button>
              <button className="nav-btn" onClick={nextWeek}><ChevronRight size={15} /></button>
              <span className="week-range">{formatWeekRange()}</span>
            </div>
            <div className="topbar-right">
              {loading && <span className="loading-text">Syncing…</span>}
              <button className="schedule-btn-sm" onClick={() => setModal({ date: new Date(), hour: 9 })}>
                <Plus size={13} /> New
              </button>
            </div>
          </div>

          <div className="cal-grid-wrap">
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

            <div className="time-grid">
              <div className="hour-labels">
                {HOURS.map((h) => (
                  <div key={h} className="hour-label">
                    {h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}
                  </div>
                ))}
              </div>

              {DAYS.map((_, dayOffset) => {
                const dayInterviews = getDayInterviews(dayOffset);
                return (
                  <div
                    key={dayOffset}
                    className={`day-col ${isToday(dayOffset) ? 'today-col' : ''}`}
                  >
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        className="hour-cell"
                        onClick={() => handleCellClick(dayOffset, h)}
                      >
                        <span className="cell-add"><Plus size={11} /></span>
                      </div>
                    ))}

                    {dayInterviews.map((iv) => {
                      const slot = iv.confirmedSlot || iv.proposedSlots?.[0];
                      if (!slot?.startTime) return null;
                      const s = STATUS_STYLES[iv.status] || STATUS_STYLES.proposed;
                      const top = getTopPercent(slot.startTime);
                      const height = getHeightPercent(slot.startTime, slot.endTime);
                      return (
                        <div
                          key={iv._id}
                          className="iv-chip"
                          style={{
                            top: `${top}%`,
                            height: `${height}%`,
                            background: s.bg,
                            borderLeft: `3px solid ${s.border}`,
                          }}
                          onClick={(e) => { e.stopPropagation(); setSelected(iv); }}
                        >
                          <div className="chip-name">{iv.candidate?.name}</div>
                          <div className="chip-time" style={{ color: s.color }}>
                            {slot.startTime} – {slot.endTime}
                          </div>
                          <div className="chip-job">{iv.job?.title}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {selected && (
          <DetailPanel
            interview={selected}
            onClose={() => setSelected(null)}
            onCancel={handleCancel}
          />
        )}
      </div>

      {modal && (
        <ScheduleModal
          date={modal.date}
          hour={modal.hour}
          applications={applications}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <style>{`
        * { box-sizing: border-box; }

        .cal-page {
          display: flex; height: calc(100vh - 64px);
          background: #0c0a09; color: #fafaf9;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          position: relative; overflow: hidden;
        }

        /* Sidebar */
        .cal-sidebar {
          width: 220px; flex-shrink: 0;
          border-right: 1px solid #292524;
          display: flex; flex-direction: column; gap: 20px;
          padding: 16px 14px; overflow-y: auto;
        }
        .schedule-btn {
          display: flex; align-items: center; gap: 8px;
          background: #f97316; color: #0c0a09; border: none; border-radius: 10px;
          padding: 10px 14px; font-size: 13px; font-weight: 600;
          cursor: pointer; width: 100%; transition: background 0.15s;
        }
        .schedule-btn:hover { background: #ea580c; }

        /* Mini Cal */
        .mini-cal-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .mini-month { font-size: 12px; font-weight: 600; color: #a8a29e; }
        .mini-nav {
          background: none; border: none; color: #a8a29e;
          cursor: pointer; padding: 2px; display: flex; align-items: center;
          border-radius: 4px;
        }
        .mini-nav:hover { color: #fafaf9; background: #292524; }
        .mini-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .mini-day-name {
          font-size: 10px; color: #a8a29e; text-align: center;
          padding: 2px 0; font-weight: 600;
        }
        .mini-day {
          background: none; border: none; color: #a8a29e;
          font-size: 11px; cursor: pointer; border-radius: 5px;
          padding: 4px 0; text-align: center; width: 100%;
          transition: background 0.1s, color 0.1s;
        }
        .mini-day:hover { background: #292524; color: #fafaf9; }
        .mini-day.today { color: #f97316; font-weight: 700; }
        .mini-day.selected { background: #f97316; color: #0c0a09; }

        /* Legend */
        .legend-title {
          font-size: 10px; font-weight: 700; color: #a8a29e;
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;
        }
        .legend-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .legend-label { font-size: 12px; color: #a8a29e; }

        /* Upcoming */
        .upcoming-empty { font-size: 12px; color: #a8a29e; font-style: italic; }
        .upcoming-item {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 6px 8px; border-radius: 8px; cursor: pointer;
          transition: background 0.1s; margin-bottom: 4px;
        }
        .upcoming-item:hover { background: #1c1917; }
        .upcoming-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
        .upcoming-name { font-size: 12px; color: #fafaf9; font-weight: 500; }
        .upcoming-time { font-size: 11px; color: #a8a29e; margin-top: 1px; }

        /* Topbar */
        .cal-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .cal-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px; border-bottom: 1px solid #292524; flex-shrink: 0;
        }
        .cal-nav { display: flex; align-items: center; gap: 6px; }
        .nav-btn {
          background: #292524; border: 1px solid #292524; border-radius: 8px;
          padding: 6px 9px; cursor: pointer; display: flex; align-items: center;
          color: #a8a29e; transition: all 0.1s;
        }
        .nav-btn:hover { border-color: #f97316; color: #fafaf9; }
        .today-btn {
          background: #292524; border: 1px solid #292524; border-radius: 8px;
          padding: 6px 12px; font-size: 12px; font-weight: 600;
          cursor: pointer; color: #a8a29e; transition: all 0.1s;
        }
        .today-btn:hover { border-color: #f97316; color: #fafaf9; }
        .week-range { font-size: 14px; font-weight: 600; color: #fafaf9; margin-left: 8px; }
        .topbar-right { display: flex; align-items: center; gap: 10px; }
        .loading-text { font-size: 11px; color: #a8a29e; }
        .schedule-btn-sm {
          display: flex; align-items: center; gap: 6px;
          background: transparent; border: 1px solid #292524; border-radius: 8px;
          padding: 6px 12px; font-size: 12px; font-weight: 600;
          cursor: pointer; color: #a8a29e; transition: all 0.1s;
        }
        .schedule-btn-sm:hover { border-color: #f97316; color: #f97316; }

        /* Grid */
        .cal-grid-wrap { flex: 1; overflow-y: auto; }
        .day-headers {
          display: grid; grid-template-columns: 52px repeat(7, 1fr);
          position: sticky; top: 0; background: #0c0a09; z-index: 10;
          border-bottom: 1px solid #292524;
        }
        .time-gutter { border-right: 1px solid #292524; }
        .day-header {
          display: flex; flex-direction: column; align-items: center;
          padding: 10px 0; border-right: 1px solid #24201e;
        }
        .day-header.today { background: rgba(249,115,22,0.05); }
        .day-name { font-size: 10px; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
        .day-num { font-size: 18px; font-weight: 500; color: #a8a29e; line-height: 1.3; }
        .today-num {
          background: #f97316; color: #0c0a09; border-radius: 50%;
          width: 30px; height: 30px; display: flex; align-items: center;
          justify-content: center; font-size: 14px; font-weight: 700;
        }
        .time-grid { display: grid; grid-template-columns: 52px repeat(7, 1fr); }
        .hour-labels { border-right: 1px solid #24201e; }
        .hour-label {
          height: 60px; font-size: 10px; color: #a8a29e;
          padding: 4px 6px 0; text-align: right; flex-shrink: 0;
        }
        .day-col { border-right: 1px solid #24201e; position: relative; }
        .day-col.today-col { background: rgba(249,115,22,0.02); }
        .hour-cell {
          height: 60px; border-bottom: 1px solid #24201e;
          cursor: pointer; position: relative; transition: background 0.1s;
        }
        .hour-cell:hover { background: rgba(249,115,22,0.06); }
        .cell-add {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          color: #a8a29e; opacity: 0; transition: opacity 0.1s;
        }
        .hour-cell:hover .cell-add { opacity: 1; }
        .iv-chip {
          position: absolute; left: 3px; right: 3px; border-radius: 6px;
          padding: 4px 7px; cursor: pointer; z-index: 2; overflow: hidden;
          transition: filter 0.15s, transform 0.1s;
        }
        .iv-chip:hover { filter: brightness(1.15); transform: scaleX(1.01); }
        .chip-name { font-size: 11px; font-weight: 600; color: #fafaf9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chip-time { font-size: 10px; margin-top: 1px; }
        .chip-job { font-size: 10px; color: #a8a29e; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Detail Panel */
        .detail-panel {
          position: absolute; right: 16px; top: 70px;
          background: #1c1917; border-radius: 14px; border: 1px solid #292524;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5); width: 272px; z-index: 20;
          animation: slideIn 0.15s ease;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .detail-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px 12px; border-bottom: 1px solid #292524;
        }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .detail-title { font-size: 13px; font-weight: 700; margin: 0; color: #fafaf9; }
        .detail-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
        .detail-job { font-size: 14px; font-weight: 600; color: #fafaf9; }
        .detail-row { display: flex; align-items: flex-start; gap: 10px; }
        .detail-icon { color: #a8a29e; flex-shrink: 0; margin-top: 2px; }
        .detail-val { font-size: 13px; color: #fafaf9; }
        .detail-sub { font-size: 11px; color: #a8a29e; margin-top: 2px; }
        .detail-link { font-size: 13px; color: #f97316; text-decoration: none; }
        .detail-link:hover { color: #ea580c; }
        .detail-notes {
          font-size: 12px; color: #d6d3d1; background: #292524;
          border-radius: 8px; padding: 10px 12px; line-height: 1.5;
        }
        .status-badge {
          display: inline-block; font-size: 11px; font-weight: 600;
          padding: 4px 12px; border-radius: 20px; width: fit-content;
        }
        .detail-footer { padding: 10px 16px 14px; border-top: 1px solid #292524; }
        .btn-danger-sm {
          display: flex; align-items: center; gap: 6px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
          color: #ef4444; border-radius: 8px; padding: 7px 12px;
          font-size: 12px; font-weight: 500; cursor: pointer; width: 100%;
          transition: all 0.15s;
        }
        .btn-danger-sm:hover { background: rgba(239,68,68,0.18); border-color: #ef4444; }
        .btn-danger-sm:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Modal */
        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; backdrop-filter: blur(4px); animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal {
          background: #1c1917; border-radius: 16px; border: 1px solid #292524;
          width: 480px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6); animation: modalIn 0.2s ease;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px 14px; border-bottom: 1px solid #292524;
        }
        .modal-title-row { display: flex; align-items: center; gap: 8px; }
        .modal-icon { color: #f97316; }
        .modal-title { font-size: 15px; font-weight: 700; margin: 0; color: #fafaf9; }
        .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 14px 20px; border-top: 1px solid #292524;
        }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field-label {
          font-size: 11px; font-weight: 600; color: #a8a29e;
          text-transform: uppercase; letter-spacing: 0.06em;
          display: flex; align-items: center; gap: 5px;
        }
        .field-input {
          background: #292524; border: 1px solid #292524; border-radius: 9px;
          padding: 9px 12px; font-size: 13px; color: #fafaf9;
          outline: none; width: 100%; transition: border-color 0.15s;
          font-family: inherit;
        }
        .field-input:focus { border-color: #f97316; }
        .field-input option { background: #292524; }
        .field-textarea { resize: vertical; min-height: 72px; }
        .modal-error {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444; border-radius: 8px; padding: 10px 12px; font-size: 12px;
        }
        .btn-ghost {
          background: transparent; border: 1px solid #292524; border-radius: 9px;
          padding: 9px 18px; font-size: 13px; font-weight: 500;
          color: #a8a29e; cursor: pointer; transition: all 0.15s;
        }
        .btn-ghost:hover { border-color: #f97316; color: #f97316; }
        .btn-primary {
          background: #f97316; border: none; border-radius: 9px;
          padding: 9px 20px; font-size: 13px; font-weight: 600;
          color: #0c0a09; cursor: pointer; transition: background 0.15s;
        }
        .btn-primary:hover { background: #ea580c; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: #a8a29e; padding: 5px; border-radius: 6px; display: flex;
          transition: all 0.1s;
        }
        .icon-btn:hover { background: #292524; color: #fafaf9; }
        .muted { color: #a8a29e !important; font-style: italic; }

        /* Scrollbars */
        .cal-grid-wrap::-webkit-scrollbar,
        .cal-sidebar::-webkit-scrollbar { width: 4px; }
        .cal-grid-wrap::-webkit-scrollbar-track,
        .cal-sidebar::-webkit-scrollbar-track { background: transparent; }
        .cal-grid-wrap::-webkit-scrollbar-thumb,
        .cal-sidebar::-webkit-scrollbar-thumb { background: #292524; border-radius: 4px; }
      `}</style>
    </EmployerLayout>
  );
}