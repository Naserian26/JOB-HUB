import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Calendar, Clock, MapPin, Video, FileText,
  CheckCircle, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import SeekerLayout from '../components/SeekerLayout';

const STATUS_STYLES = {
  proposed:    { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', color: 'text-yellow-400', label: 'Awaiting Your Confirmation' },
  confirmed:   { bg: 'bg-green-500/10',  border: 'border-green-500/30',  color: 'text-green-400',  label: 'Confirmed' },
  rescheduled: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', color: 'text-orange-400', label: 'Rescheduled — Please Confirm' },
  cancelled:   { bg: 'bg-red-500/10',    border: 'border-red-500/30',    color: 'text-red-400',    label: 'Cancelled' },
  completed:   { bg: 'bg-lime-500/10',   border: 'border-lime-500/30',   color: 'text-lime-400',   label: 'Completed' },
};

function InterviewCard({ interview, onConfirm, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const style = STATUS_STYLES[interview.status] || STATUS_STYLES.proposed;
  const slot = interview.confirmedSlot || interview.proposedSlots?.[0];
  const canAct = ['proposed', 'rescheduled'].includes(interview.status);

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setConfirming(true);
    try {
      await onConfirm(interview._id, selectedSlot);
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await onCancel(interview._id);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden transition-all`}>
      {/* Card Header */}
      <div
        className="flex items-start justify-between p-5 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-lime-500/10 flex items-center justify-center flex-
          shrink-0 mt-0.5">
            <Calendar className="w-5 h-5 text-lime-500" />
          </div>
          <div>
            <h3 className="text-dark-primary font-semibold text-[15px]">{interview.job?.title}</h3>
            <p className="text-dark-secondary text-[13px] mt-0.5">{interview.employer?.name}</p>
            {slot && (
              <p className="text-dark-secondary text-[12px] mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {new Date(slot.date).toLocaleDateString('en-KE', {
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                })} · {slot.startTime} – {slot.endTime}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-600 px-3 py-1 rounded-full border ${style.border} ${style.color} ${style.bg} whitespace-nowrap`}>
            {style.label}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-dark-secondary" /> : <ChevronDown className="w-4 h-4 text-dark-secondary" />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">

          {/* Proposed Slots */}
          {canAct && interview.proposedSlots?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-dark-secondary uppercase tracking-wider mb-2">
                Select a Time Slot
              </p>
              <div className="space-y-2">
                {interview.proposedSlots.map(s => (
                  <button
                    key={s._id}
                    onClick={() => setSelectedSlot(s._id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition text-[13px]
                      ${selectedSlot === s._id
                        ? 'border-lime-500 bg-lime-500/10 text-lime-400'
                        : 'border-dark-border bg-dark-bg text-dark-secondary hover:border-lime-500/50'
                      }`}
                  >
                    <span className="font-medium">
                      {new Date(s.date).toLocaleDateString('en-KE', {
                        weekday: 'long', month: 'long', day: 'numeric'
                      })}
                    </span>
                    <span className="ml-2 text-dark-secondary">{s.startTime} – {s.endTime}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Confirmed slot */}
          {interview.confirmedSlot && (
            <div className="flex items-center gap-2 text-green-400 text-[13px]">
              <CheckCircle className="w-4 h-4" />
              Confirmed for {new Date(interview.confirmedSlot.date).toLocaleDateString('en-KE', {
                weekday: 'long', month: 'long', day: 'numeric'
              })} at {interview.confirmedSlot.startTime}
            </div>
          )}

          {/* Location */}
          {interview.location && (
            <div className="flex items-center gap-2 text-dark-secondary text-[13px]">
              <MapPin className="w-4 h-4 text-dark-secondary/60" />
              {interview.location}
            </div>
          )}

          {/* Meeting Link */}
          {interview.meetingLink && (
            <div className="flex items-center gap-2 text-[13px]">
              <Video className="w-4 h-4 text-dark-secondary/60" />
              <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="text-lime-500 hover:text-lime-400">
                Join Meeting
              </a>
            </div>
          )}

          {/* Notes */}
          {interview.notes && (
            <div className="flex items-start gap-2 text-[13px] text-dark-secondary">
              <FileText className="w-4 h-4 text-dark-secondary/60 mt-0.5" />
              <span>{interview.notes}</span>
            </div>
          )}

          {/* Actions */}
          {canAct && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirm}
                disabled={!selectedSlot || confirming}
                className="flex items-center gap-2 px-4 py-2 bg-lime-500 text-dark-bg rounded-lg text-[13px] font-semibold hover:bg-lime-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                {confirming ? 'Confirming…' : 'Confirm Slot'}
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-[13px] font-medium hover:bg-red-500/10 transition disabled:opacity-40"
              >
                <XCircle className="w-4 h-4" />
                {cancelling ? 'Declining…' : 'Decline'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SeekerInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get('/api/interviews', { headers });
        setInterviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setInterviews([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = async (id, slotId) => {
    await axios.patch(`/api/interviews/${id}/confirm`, { slotId }, { headers });
    setInterviews(prev => prev.map(iv =>
      iv._id === id ? { ...iv, status: 'confirmed', confirmedSlot: iv.proposedSlots.find(s => s._id === slotId) } : iv
    ));
  };

  const handleCancel = async (id) => {
    await axios.patch(`/api/interviews/${id}/cancel`, {}, { headers });
    setInterviews(prev => prev.map(iv =>
      iv._id === id ? { ...iv, status: 'cancelled' } : iv
    ));
  };

  const filters = ['all', 'proposed', 'rescheduled', 'confirmed', 'cancelled', 'completed'];

  const filtered = filter === 'all'
    ? interviews
    : interviews.filter(iv => iv.status === filter);

  const pending = interviews.filter(iv => ['proposed', 'rescheduled'].includes(iv.status)).length;

  return (
    <SeekerLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark-primary">My Interviews</h1>
            <p className="text-dark-secondary text-sm mt-1">
              {pending > 0
                ? `You have ${pending} interview${pending > 1 ? 's' : ''} awaiting confirmation`
                : 'All interviews up to date'}
            </p>
          </div>
          {pending > 0 && (
            <span className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold px-3 py-1.5 rounded-full">
              {pending} pending
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium capitalize transition
                ${filter === f
                  ? 'bg-lime-500 text-dark-bg'
                  : 'bg-dark-card border border-dark-border text-dark-secondary hover:text-dark-primary'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-dark-secondary text-sm">
            Loading interviews…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="w-12 h-12 text-dark-border mb-4" />
            <p className="text-dark-primary font-medium">No interviews yet</p>
            <p className="text-dark-secondary text-sm mt-1">
              When an employer invites you to interview, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(iv => (
              <InterviewCard
                key={iv._id}
                interview={iv}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>
    </SeekerLayout>
  );
}