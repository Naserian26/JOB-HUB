import { useEffect, useState } from 'react';
import axios from 'axios';
import { Briefcase, MapPin, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import SeekerLayout from '../components/SeekerLayout';

const STATUS_COLORS = {
  pending:   { bg: '#faeeda', color: '#854f0b', label: 'Applied' },
  reviewed:  { bg: '#eeedfe', color: '#3c3489', label: 'Reviewed' },
  interview: { bg: '#e6f1fb', color: '#185fa5', label: 'Interview' },
  offered:   { bg: 'rgba(249,115,22,0.15)', color: '#f97316', label: 'Offered' },
  rejected:  { bg: '#fcebeb', color: '#a32d2d', label: 'Rejected' },
  withdrawn: { bg: '#f1efe8', color: '#5f5e5a', label: 'Withdrawn' },
};

const INTERVIEW_STATUS = {
  proposed:    { bg: '#eeedfe', color: '#3c3489', label: 'Pick a slot' },
  rescheduled: { bg: '#faeeda', color: '#854f0b', label: 'New slots available' },
  confirmed:   { bg: 'rgba(249,115,22,0.15)', color: '#f97316', label: 'Confirmed' },
  cancelled:   { bg: '#fcebeb', color: '#a32d2d', label: 'Cancelled' },
  completed:   { bg: '#f1efe8', color: '#5f5e5a', label: 'Completed' },
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

export default function SeekerApplications() {
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState({});   // keyed by applicationId
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null); // interviewId being confirmed

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, ivsRes] = await Promise.all([
          axios.get('/api/applications/my'),
          axios.get('/api/interviews'),
        ]);
        setApplications(appsRes.data);

        // Map interviews by applicationId for quick lookup
        const ivMap = {};
        ivsRes.data.forEach((iv) => {
          ivMap[iv.application._id || iv.application] = iv;
        });
        setInterviews(ivMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const confirmSlot = async (interview, slotId) => {
    setConfirmingId(interview._id);
    try {
      const { data } = await axios.patch(`/api/interviews/${interview._id}/confirm`, { slotId });
      setInterviews((prev) => ({
        ...prev,
        [data.application._id || data.application]: data,
      }));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to confirm slot.');
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <SeekerLayout>
        <div className="sa-loading">Loading your applications...</div>
      </SeekerLayout>
    );
  }

  return (
    <SeekerLayout>
      <div className="sa-page">
        <div className="sa-header">
          <h1 className="sa-title">My applications</h1>
          <span className="sa-count">{applications.length} total</span>
        </div>

        {applications.length === 0 ? (
          <div className="sa-empty">
            <Briefcase size={40} className="empty-icon" />
            <p>You haven't applied to any jobs yet.</p>
          </div>
        ) : (
          <div className="sa-list">
            {applications.map((app) => {
              const interview = interviews[app._id];
              const appStatus = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
              return (
                <div key={app._id} className="app-card">
                  {/* Card header */}
                  <div className="app-card-header">
                    <div className="app-info">
                      <h2 className="job-title">{app.job?.title}</h2>
                      <div className="job-meta">
                        <span className="meta-item">
                          <Briefcase size={12} /> {app.job?.company || 'Company'}
                        </span>
                        {app.job?.location && (
                          <span className="meta-item">
                            <MapPin size={12} /> {app.job.location}
                          </span>
                        )}
                        <span className="meta-item">
                          <Clock size={12} /> Applied {formatDate(app.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span
                      className="status-pill"
                      style={{ background: appStatus.bg, color: appStatus.color }}
                    >
                      {appStatus.label}
                    </span>
                  </div>

                  {/* Interview panel — only shown when one exists */}
                  {interview && (
                    <div className="interview-panel">
                      <div className="iv-panel-header">
                        <Calendar size={14} />
                        <span className="iv-panel-title">Interview invitation</span>
                        <span
                          className="iv-status-pill"
                          style={{
                            background: INTERVIEW_STATUS[interview.status]?.bg,
                            color: INTERVIEW_STATUS[interview.status]?.color,
                          }}
                        >
                          {INTERVIEW_STATUS[interview.status]?.label}
                        </span>
                      </div>

                      {/* Employer details */}
                      {interview.meetingLink && (
                        <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="iv-link">
                          Join meeting →
                        </a>
                      )}
                      {interview.location && (
                        <p className="iv-location"><MapPin size={12} /> {interview.location}</p>
                      )}
                      {interview.notes && (
                        <p className="iv-notes">{interview.notes}</p>
                      )}

                      {/* Slot picker — only for proposed/rescheduled */}
                      {['proposed', 'rescheduled'].includes(interview.status) && (
                        <div className="slots-section">
                          <p className="slots-label">Choose a time that works for you:</p>
                          <div className="slots-grid">
                            {interview.proposedSlots.map((slot) => (
                              <button
                                key={slot._id}
                                className="slot-btn"
                                disabled={confirmingId === interview._id}
                                onClick={() => confirmSlot(interview, slot._id)}
                              >
                                <span className="slot-date">{formatDate(slot.date)}</span>
                                <span className="slot-time">{slot.startTime} – {slot.endTime}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Confirmed slot display */}
                      {interview.status === 'confirmed' && interview.confirmedSlot && (
                        <div className="confirmed-slot">
                          <CheckCircle size={15} className="confirmed-icon" />
                          <div>
                            <span className="confirmed-date">
                              {formatDate(interview.confirmedSlot.date)}
                            </span>
                            <span className="confirmed-time">
                              {interview.confirmedSlot.startTime} – {interview.confirmedSlot.endTime}
                            </span>
                          </div>
                        </div>
                      )}

                      {interview.status === 'cancelled' && (
                        <div className="cancelled-notice">
                          <XCircle size={14} />
                          <span>
                            This interview was cancelled.
                            {interview.cancelReason ? ` Reason: ${interview.cancelReason}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .sa-page { padding: 24px; max-width: 760px; margin: 0 auto; }
        .sa-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 24px; }
        .sa-title { font-size: 22px; font-weight: 600; color: #111; margin: 0; }
        .sa-count { font-size: 13px; color: #999; }
        .sa-loading { padding: 40px; text-align: center; color: #888; }
        .sa-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 60px 20px; color: #aaa; font-size: 14px;
        }
        .empty-icon { opacity: 0.3; }

        .sa-list { display: flex; flex-direction: column; gap: 16px; }

        .app-card {
          background: #fff; border-radius: 14px;
          border: 1px solid #eee;
          overflow: hidden;
        }
        .app-card-header {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          padding: 18px 20px;
          gap: 12px;
        }
        .app-info { flex: 1; min-width: 0; }
        .job-title { font-size: 15px; font-weight: 600; color: #111; margin: 0 0 6px; }
        .job-meta { display: flex; flex-wrap: wrap; gap: 10px; }
        .meta-item {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: #888;
        }
        .status-pill {
          font-size: 12px; font-weight: 500;
          padding: 4px 12px; border-radius: 20px;
          white-space: nowrap; flex-shrink: 0;
        }

        .interview-panel {
          border-top: 1px solid #f5f5f5;
          padding: 16px 20px;
          background: #fafafa;
          display: flex; flex-direction: column; gap: 10px;
        }
        .iv-panel-header {
          display: flex; align-items: center; gap: 8px;
          color: #555;
        }
        .iv-panel-title { font-size: 13px; font-weight: 600; flex: 1; }
        .iv-status-pill {
          font-size: 11px; font-weight: 500;
          padding: 3px 10px; border-radius: 20px;
        }
        .iv-link { font-size: 13px; color: #f97316; text-decoration: none; }
        .iv-link:hover { text-decoration: underline; }
        .iv-location { font-size: 12px; color: #888; margin: 0; display: flex; align-items: center; gap: 4px; }
        .iv-notes { font-size: 13px; color: #666; margin: 0; line-height: 1.5; }

        .slots-section { display: flex; flex-direction: column; gap: 8px; }
        .slots-label { font-size: 12px; font-weight: 600; color: #555; margin: 0; }
        .slots-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .slot-btn {
          display: flex; flex-direction: column; align-items: flex-start;
          gap: 2px; padding: 10px 14px;
          border: 1.5px solid #e2e2e2; border-radius: 10px;
          background: #fff; cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .slot-btn:hover { border-color: #f97316; background: rgba(249,115,22,0.08); }
        .slot-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .slot-date { font-size: 12px; font-weight: 600; color: #222; }
        .slot-time { font-size: 12px; color: #f97316; }

        .confirmed-slot {
          display: flex; align-items: center; gap: 10px;
          background: rgba(249,115,22,0.15); border-radius: 10px; padding: 10px 14px;
        }
        .confirmed-icon { color: #f97316; flex-shrink: 0; }
        .confirmed-date { font-size: 13px; font-weight: 600; color: #f97316; display: block; }
        .confirmed-time { font-size: 12px; color: #f97316; }

        .cancelled-notice {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: #a32d2d;
          background: #fcebeb; border-radius: 10px; padding: 10px 14px;
        }
      `}</style>
    </SeekerLayout>
  );
}