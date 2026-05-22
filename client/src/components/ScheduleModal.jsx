import { useState } from 'react';
import axios from 'axios';
import { X, Plus, Trash2, Calendar, Link, MapPin, FileText } from 'lucide-react';

const emptySlot = () => ({ date: '', startTime: '', endTime: '' });

export default function ScheduleModal({ application, onClose, onScheduled }) {
  const [slots, setSlots] = useState([emptySlot()]);
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateSlot = (i, field, value) => {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const addSlot = () => {
    if (slots.length < 5) setSlots((prev) => [...prev, emptySlot()]);
  };

  const removeSlot = (i) => {
    if (slots.length > 1) setSlots((prev) => prev.filter((_, idx) => idx !== i));
  };

  const validate = () => {
    for (const s of slots) {
      if (!s.date || !s.startTime || !s.endTime) return 'Fill in all slot fields.';
      if (s.startTime >= s.endTime) return 'Start time must be before end time.';
    }
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/interviews', {
        applicationId: application._id,
        proposedSlots: slots.map((s) => ({
          date: new Date(s.date).toISOString(),
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        location,
        meetingLink,
        notes,
      });
      onScheduled(data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to schedule interview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Schedule interview</h2>
            <p className="modal-subtitle">
              {application.applicant?.name} · {application.job?.title}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Slots */}
          <div className="section-label">
            <Calendar size={14} />
            Proposed time slots
          </div>
          <div className="slots-list">
            {slots.map((slot, i) => (
              <div key={i} className="slot-row">
                <input
                  type="date"
                  value={slot.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => updateSlot(i, 'date', e.target.value)}
                  className="slot-input date-input"
                />
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
                  className="slot-input time-input"
                />
                <span className="slot-sep">→</span>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(i, 'endTime', e.target.value)}
                  className="slot-input time-input"
                />
                {slots.length > 1 && (
                  <button className="icon-btn danger" onClick={() => removeSlot(i)} aria-label="Remove slot">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {slots.length < 5 && (
            <button className="add-slot-btn" onClick={addSlot}>
              <Plus size={14} /> Add another slot
            </button>
          )}

          {/* Optional fields */}
          <div className="optional-fields">
            <div className="field-row">
              <label className="field-label"><Link size={13} /> Meeting link</label>
              <input
                type="url"
                placeholder="https://zoom.us/j/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="field-input"
              />
            </div>
            <div className="field-row">
              <label className="field-label"><MapPin size={13} /> Location</label>
              <input
                type="text"
                placeholder="Office address or 'Remote'"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="field-input"
              />
            </div>
            <div className="field-row">
              <label className="field-label"><FileText size={13} /> Notes</label>
              <textarea
                placeholder="Anything the candidate should know..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="field-input notes-input"
                rows={3}
              />
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Sending...' : 'Send invite'}
          </button>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 1rem;
        }
        .modal-box {
          background: #fff; border-radius: 14px;
          width: 100%; max-width: 520px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          display: flex; flex-direction: column;
          max-height: 90vh; overflow: hidden;
        }
        .modal-header {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          padding: 1.25rem 1.5rem 1rem;
          border-bottom: 1px solid #f0f0f0;
        }
        .modal-title { font-size: 16px; font-weight: 600; margin: 0 0 2px; color: #111; }
        .modal-subtitle { font-size: 13px; color: #888; margin: 0; }
        .modal-body { padding: 1.25rem 1.5rem; overflow-y: auto; flex: 1; }
        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #f0f0f0;
          display: flex; gap: 10px; justify-content: flex-end;
        }
        .section-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; color: #555;
          text-transform: uppercase; letter-spacing: 0.04em;
          margin-bottom: 10px;
        }
        .slots-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
        .slot-row {
          display: flex; align-items: center; gap: 8px;
        }
        .slot-input {
          border: 1px solid #e2e2e2; border-radius: 8px;
          padding: 7px 10px; font-size: 13px; color: #222;
          outline: none; transition: border 0.15s;
        }
        .slot-input:focus { border-color: #6c63ff; }
        .date-input { flex: 1.4; }
        .time-input { flex: 1; }
        .slot-sep { font-size: 13px; color: #aaa; }
        .add-slot-btn {
          display: flex; align-items: center; gap: 5px;
          font-size: 13px; color: #6c63ff; background: none;
          border: none; cursor: pointer; padding: 4px 0;
          margin-bottom: 1.25rem;
        }
        .add-slot-btn:hover { opacity: 0.75; }
        .optional-fields { display: flex; flex-direction: column; gap: 12px; margin-top: 4px; }
        .field-row { display: flex; flex-direction: column; gap: 5px; }
        .field-label {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 600; color: #555;
        }
        .field-input {
          border: 1px solid #e2e2e2; border-radius: 8px;
          padding: 8px 12px; font-size: 13px; color: #222;
          outline: none; transition: border 0.15s;
          font-family: inherit;
        }
        .field-input:focus { border-color: #6c63ff; }
        .notes-input { resize: vertical; min-height: 72px; }
        .error-msg { font-size: 13px; color: #e53e3e; margin-top: 10px; }
        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: #999; border-radius: 6px; padding: 4px;
          display: flex; align-items: center;
        }
        .icon-btn:hover { background: #f5f5f5; color: #333; }
        .icon-btn.danger:hover { background: #fff5f5; color: #e53e3e; }
        .btn-primary {
          background: #6c63ff; color: #fff; border: none;
          border-radius: 8px; padding: 9px 20px;
          font-size: 14px; font-weight: 500; cursor: pointer;
        }
        .btn-primary:hover { background: #5a52d5; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary {
          background: #f5f5f5; color: #555; border: none;
          border-radius: 8px; padding: 9px 20px;
          font-size: 14px; font-weight: 500; cursor: pointer;
        }
        .btn-secondary:hover { background: #ebebeb; }
      `}</style>
    </div>
  );
}