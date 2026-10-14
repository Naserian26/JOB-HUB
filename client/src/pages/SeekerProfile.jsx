import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  Save, Briefcase, MapPin, Award, FileText,
  Upload, User, Camera, X, FileCheck, Sparkles, CheckCircle, Loader2,
  Pencil, DollarSign, 
} from 'lucide-react';
import SeekerLayout from '../components/SeekerLayout';

const API = 'http://localhost:5000/api';

// ─── View Mode Card ───────────────────────────────────────────────────────────

const ProfileView = ({ profile, photoPreview, cvUrl, cvName, onEdit }) => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold" style={{ color: '#fafaf9' }}>My Profile</h1>
      <button
        onClick={onEdit}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition"
        style={{ backgroundColor: '#f97316', color: '#1c1917' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ea580c'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f97316'}
      >
        <Pencil className="h-3.5 w-3.5" /> Edit Profile
      </button>
    </div>

    {/* Identity */}
    <div
      className="rounded-xl p-5 flex items-center gap-5"
      style={{ backgroundColor: '#292524', border: '1px solid #44403c' }}
    >
      <div className="h-16 w-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(249,115,22,0.15)', border: '2px solid #f97316' }}
      >
        {photoPreview
          ? <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
          : <User className="h-7 w-7" style={{ color: '#f97316' }} />
        }
      </div>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          {profile.experience && (
            <span
              className="flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#fb923c' }}
            >
              <Briefcase className="h-3 w-3" /> {profile.experience} Level
            </span>
          )}
          {profile.location && (
            <span className="flex items-center gap-1 text-sm" style={{ color: '#d6d3d1' }}>
              <MapPin className="h-3.5 w-3.5" style={{ color: '#78716c' }} /> {profile.location}
            </span>
          )}
          {profile.salaryExpectation && (
            <span className="flex items-center gap-1 text-sm" style={{ color: '#d6d3d1' }}>
              <DollarSign className="h-3.5 w-3.5" style={{ color: '#78716c' }} />
              ${Number(profile.salaryExpectation).toLocaleString()}/yr
            </span>
          )}
        </div>
      </div>
    </div>

    {/* Skills */}
    {profile.skills?.length > 0 && (
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: '#292524', border: '1px solid #44403c' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
          style={{ color: '#78716c' }}>
          <Award className="h-3.5 w-3.5" /> Skills
        </p>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill, i) => (
            <span
              key={i}
              className="rounded-lg px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: '#44403c', color: '#e7e5e4' }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Bio */}
    {profile.bio && (
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: '#292524', border: '1px solid #44403c' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
          style={{ color: '#78716c' }}>
          <FileText className="h-3.5 w-3.5" /> Professional Bio
        </p>
        <p className="text-sm leading-relaxed" style={{ color: '#d6d3d1' }}>{profile.bio}</p>
      </div>
    )}

    {/* CV - FIXED: Added missing <a> opening tag */}
    {cvUrl && (
      <div
        className="rounded-xl p-5 flex items-center gap-3"
        style={{ backgroundColor: '#292524', border: '1px solid #44403c' }}
      >
        <FileCheck className="h-5 w-5 shrink-0" style={{ color: '#f97316' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: '#fafaf9' }}>CV / Resume</p>
          <p className="text-xs truncate" style={{ color: '#78716c' }}>{cvName}</p>
        </div>
        <a
          href={cvUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#fb923c' }}
        >
          View CV
        </a>
      </div>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SeekerProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [profileExists, setProfileExists] = useState(false);

  const [formData, setFormData] = useState({
    skills: '',
    experience: '',
    location: '',
    salaryExpectation: '',
    bio: '',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const photoInputRef = useRef();

  const [cvFile, setCvFile] = useState(null);
  const [cvName, setCvName] = useState('');
  const [existingCvUrl, setExistingCvUrl] = useState('');
  const cvInputRef = useRef();
  const parseCvInputRef = useRef();

  useEffect(() => {
    if (!user?.token) return;
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API}/profiles/me`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = res.data;
        setFormData({
          skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
          experience: data.experience || '',
          location: data.location || '',
          salaryExpectation: data.salaryExpectation || '',
          bio: data.bio || '',
        });
        if (data.photoUrl) setPhotoPreview(data.photoUrl);
        if (data.cvUrl) {
          setExistingCvUrl(data.cvUrl);
          setCvName(data.cvUrl.split('/').pop());
        }
        const hasData = data.skills?.length > 0 || data.bio || data.location;
        setProfileExists(hasData);
        setIsEditing(!hasData);
      } catch (error) {
        if (error.response?.status === 404) {
          setIsEditing(true);
        } else {
          console.error('Error fetching profile', error);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCvFile(file);
    setCvName(file.name);
    setExistingCvUrl('');
  };

  const handleParseCv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParsing(true);
    setParsed(null);
    try {
      const form = new FormData();
      form.append('cv', file);
      const res = await axios.post(`${API}/profiles/parse-cv`, form, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setParsed(res.data);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'CV parsing failed.');
    } finally {
      setParsing(false);
    }
  };

  const applyParsed = () => {
    if (!parsed) return;
    setFormData(prev => ({
      ...prev,
      skills: parsed.skills?.length ? parsed.skills.join(', ') : prev.skills,
      experience: parsed.experience || prev.experience,
      location: parsed.location || prev.location,
      bio: parsed.bio || prev.bio,
    }));
    setParsed(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = user?.token;
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0),
      };
      await axios.post(`${API}/profiles`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (photoFile) {
        const photoForm = new FormData();
        photoForm.append('photo', photoFile);
        await axios.post(`${API}/profiles/photo`, photoForm, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
      }
      if (cvFile) {
        const cvForm = new FormData();
        cvForm.append('cv', cvFile);
        await axios.post(`${API}/profiles/cv`, cvForm, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
      }
      setProfileExists(true);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const viewProfile = {
    ...formData,
    skills: formData.skills
      ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
      : [],
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen" style={{ color: '#d6d3d1' }}>
      Loading...
    </div>
  );

  return (
    <SeekerLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div
          className="rounded-xl p-8"
          style={{ backgroundColor: '#1c1917', border: '1px solid #44403c' }}
        >
          {/* ── VIEW MODE ── */}
          {!isEditing && profileExists && (
            <ProfileView
              profile={viewProfile}
              photoPreview={photoPreview}
              cvUrl={existingCvUrl}
              cvName={cvName}
              onEdit={() => setIsEditing(true)}
            />
          )}

          {/* ── EDIT MODE ── */}
          {isEditing && (
            <>
              <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold" style={{ color: '#fafaf9' }}>
                  {profileExists ? 'Edit Profile' : 'My Profile'}
                </h1>
                <p className="text-sm" style={{ color: '#78716c' }}>Improve your AI Match Score</p>
              </div>

              {/* AUTO-FILL BANNER */}
              <div
                className="mb-6 rounded-xl p-4"
                style={{ backgroundColor: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#f97316' }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#fb923c' }}>Auto-fill from CV</p>
                    <p className="mt-0.5 text-xs" style={{ color: '#f97316' }}>
                      Upload your PDF CV and we'll extract your skills, experience, location, and bio automatically.
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => parseCvInputRef.current.click()}
                        disabled={parsing}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition disabled:opacity-60"
                        style={{ backgroundColor: '#f97316', color: '#1c1917' }}
                      >
                        {parsing
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Parsing CV...</>
                          : <><Sparkles className="h-3.5 w-3.5" /> Auto-fill from CV</>
                        }
                      </button>
                      <span className="text-xs" style={{ color: '#78716c' }}>PDF only · Max 10MB</span>
                    </div>
                    <input ref={parseCvInputRef} type="file" accept=".pdf" className="hidden" onChange={handleParseCv} />
                  </div>
                </div>
              </div>

              {/* PARSED RESULTS */}
              {parsed && (
                <div
                  className="mb-6 rounded-xl p-4"
                  style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5" style={{ color: '#22c55e' }} />
                    <p className="text-sm font-semibold" style={{ color: '#86efac' }}>
                      CV parsed successfully — review before applying
                    </p>
                  </div>
                  <div className="space-y-2 text-xs" style={{ color: '#86efac' }}>
                    {parsed.skills?.length > 0 && <p><span className="font-semibold">Skills:</span> {parsed.skills.join(', ')}</p>}
                    {parsed.experience && <p><span className="font-semibold">Experience:</span> {parsed.experience}</p>}
                    {parsed.location && <p><span className="font-semibold">Location:</span> {parsed.location}</p>}
                    {parsed.bio && <p><span className="font-semibold">Bio:</span> {parsed.bio.slice(0, 120)}...</p>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={applyParsed}
                      className="rounded-lg px-4 py-1.5 text-xs font-semibold transition"
                      style={{ backgroundColor: '#22c55e', color: '#1c1917' }}
                    >
                      Apply to profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setParsed(null)}
                      className="rounded-lg px-4 py-1.5 text-xs font-semibold transition"
                      style={{ border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">

                {/* PHOTO */}
                <div>
                  <label className="mb-3 block text-sm font-medium" style={{ color: '#fafaf9' }}>Profile Photo</label>
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div
                        className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full"
                        style={{ border: '2px solid #f97316', backgroundColor: 'rgba(249,115,22,0.1)' }}
                      >
                        {photoPreview
                          ? <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                          : <User className="h-8 w-8" style={{ color: '#f97316' }} />
                        }
                      </div>
                      <button
                        type="button"
                        onClick={() => photoInputRef.current.click()}
                        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition"
                        style={{ backgroundColor: '#f97316', color: '#1c1917', border: '2px solid #1c1917' }}
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => photoInputRef.current.click()}
                        className="rounded-lg px-4 py-2 text-sm font-medium transition"
                        style={{ border: '1px solid #44403c', color: '#d6d3d1', backgroundColor: 'transparent' }}
                      >
                        {photoPreview ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      <p className="mt-1 text-xs" style={{ color: '#78716c' }}>JPG, PNG or WEBP. Max 5MB.</p>
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                        className="ml-auto transition"
                        style={{ color: '#78716c' }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* CV */}
                <div>
                  <label className="mb-3 block text-sm font-medium" style={{ color: '#fafaf9' }}>CV / Resume</label>
                  <div
                    onClick={() => cvInputRef.current.click()}
                    className="cursor-pointer rounded-xl p-6 text-center transition"
                    style={{ border: '2px dashed #44403c' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#f97316'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#44403c'}
                  >
                    {cvName ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileCheck className="h-8 w-8" style={{ color: '#f97316' }} />
                        <div className="text-left">
                          <p className="text-sm font-medium" style={{ color: '#fafaf9' }}>{cvName}</p>
                          <p className="text-xs" style={{ color: '#78716c' }}>Click to replace</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCvFile(null); setCvName(''); setExistingCvUrl(''); }}
                          className="ml-4 transition"
                          style={{ color: '#78716c' }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto mb-2 h-8 w-8" style={{ color: '#78716c' }} />
                        <p className="text-sm font-medium" style={{ color: '#d6d3d1' }}>Click to upload your CV</p>
                        <p className="mt-1 text-xs" style={{ color: '#78716c' }}>PDF, DOC or DOCX. Max 10MB.</p>
                      </div>
                    )}
                  </div>
                  {/* FIXED: Added missing <a> opening tag */}
                  {existingCvUrl && (
                    <a
                      href={existingCvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs"
                      style={{ color: '#f97316' }}
                    >
                      <FileText className="h-3.5 w-3.5" /> View current CV
                    </a>
                  )}
                  <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCvChange} />
                </div>

                {/* SKILLS + EXPERIENCE */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium" style={{ color: '#fafaf9' }}>Skills (Comma Separated)</label>
                    <div className="relative">
                      <Award className="absolute left-3 top-3 h-5 w-5" style={{ color: '#78716c' }} />
                      <textarea
                        rows="3"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        placeholder="react, node.js, python..."
                        className="block w-full rounded-md p-3 pl-10 text-sm outline-none transition"
                        style={{
                          backgroundColor: '#292524',
                          border: '1px solid #44403c',
                          color: '#fafaf9',
                          caretColor: '#f97316',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
                        onBlur={e => e.target.style.borderColor = '#44403c'}
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs" style={{ color: '#78716c' }}>These skills are matched against job descriptions by AI.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium" style={{ color: '#fafaf9' }}>Experience Level</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-5 w-5" style={{ color: '#78716c' }} />
                      <select
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        className="block w-full rounded-md p-3 pl-10 text-sm outline-none transition"
                        style={{
                          backgroundColor: '#292524',
                          border: '1px solid #44403c',
                          color: '#fafaf9',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
                        onBlur={e => e.target.style.borderColor = '#44403c'}
                      >
                        <option value="">Select level...</option>
                        <option value="Entry">Entry Level</option>
                        <option value="Mid">Mid Level</option>
                        <option value="Senior">Senior</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* LOCATION + SALARY */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium" style={{ color: '#fafaf9' }}>Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5" style={{ color: '#78716c' }} />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Nairobi, Kenya"
                        className="block w-full rounded-md p-3 pl-10 text-sm outline-none transition"
                        style={{
                          backgroundColor: '#292524',
                          border: '1px solid #44403c',
                          color: '#fafaf9',
                          caretColor: '#f97316',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
                        onBlur={e => e.target.style.borderColor = '#44403c'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium" style={{ color: '#fafaf9' }}>Salary Expectation (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-sm" style={{ color: '#78716c' }}>$</span>
                      <input
                        type="number"
                        value={formData.salaryExpectation}
                        onChange={(e) => setFormData({ ...formData, salaryExpectation: e.target.value })}
                        placeholder="80000"
                        className="block w-full rounded-md p-3 pl-8 text-sm outline-none transition"
                        style={{
                          backgroundColor: '#292524',
                          border: '1px solid #44403c',
                          color: '#fafaf9',
                          caretColor: '#f97316',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
                        onBlur={e => e.target.style.borderColor = '#44403c'}
                      />
                    </div>
                  </div>
                </div>

                {/* BIO */}
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: '#fafaf9' }}>Professional Bio</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5" style={{ color: '#78716c' }} />
                    <textarea
                      rows="4"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Describe your career achievements..."
                      className="block w-full rounded-md p-3 pl-10 text-sm outline-none transition"
                      style={{
                        backgroundColor: '#292524',
                        border: '1px solid #44403c',
                        color: '#fafaf9',
                        caretColor: '#f97316',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
                      onBlur={e => e.target.style.borderColor = '#44403c'}
                      required
                    />
                  </div>
                </div>

                {/* ACTIONS */}
                <div
                  className="flex gap-3 pt-4"
                  style={{ borderTop: '1px solid #44403c' }}
                >
                  <button
                    type="button"
                    onClick={() => profileExists ? setIsEditing(false) : navigate('/seeker/dashboard')}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold transition"
                    style={{ border: '1px solid #44403c', color: '#d6d3d1' }}
                  >
                    <X className="h-4 w-4" /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold transition disabled:opacity-60"
                    style={{ backgroundColor: '#f97316', color: '#1c1917' }}
                  >
                    {saving ? 'Saving...' : <><Save className="h-4 w-4" /> Save Profile</>}
                  </button>
                </div>

              </form>
            </>
          )}
        </div>
      </div>
    </SeekerLayout>
  );
};

export default SeekerProfile;