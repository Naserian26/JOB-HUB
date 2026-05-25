import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
  Save, Briefcase, MapPin, Award, FileText,
  Upload, User, Camera, X, FileCheck, Sparkles, CheckCircle, Loader2,
} from 'lucide-react';

const API = 'http://localhost:5000/api';

const SeekerProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null); // extracted data pending confirmation

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
      } catch (error) {
        if (error.response && error.response.status !== 404) {
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

  // Auto-fill: send CV to backend parser, show results for confirmation
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
      alert(err.response?.data?.message || err.response?.data?.error || 'CV parsing failed. Make sure the AI service is running.');
    } finally {
      setParsing(false);
    }
  };

  // Apply parsed data into form
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
        skills: formData.skills.split(',').map((s) => s.trim()).filter((s) => s.length > 0),
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

      navigate('/seeker/dashboard');
    } catch (error) {
      console.error('Error saving profile', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white p-8 shadow-md">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500">Improve your AI Match Score</p>
          </div>

          {/* AUTO-FILL BANNER */}
          <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-indigo-800">Auto-fill from CV</p>
                <p className="mt-0.5 text-xs text-indigo-600">Upload your PDF CV and we'll extract your skills, experience, location, and bio automatically.</p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => parseCvInputRef.current.click()}
                    disabled={parsing}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {parsing ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Parsing CV...</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5" /> Auto-fill from CV</>
                    )}
                  </button>
                  <span className="text-xs text-indigo-400">PDF only · Max 10MB</span>
                </div>
                <input
                  ref={parseCvInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleParseCv}
                />
              </div>
            </div>
          </div>

          {/* PARSED RESULTS CONFIRMATION */}
          {parsed && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold text-green-800">CV parsed successfully — review before applying</p>
              </div>
              <div className="space-y-2 text-xs text-green-700">
                {parsed.skills?.length > 0 && (
                  <p><span className="font-semibold">Skills:</span> {parsed.skills.join(', ')}</p>
                )}
                {parsed.experience && (
                  <p><span className="font-semibold">Experience:</span> {parsed.experience}</p>
                )}
                {parsed.location && (
                  <p><span className="font-semibold">Location:</span> {parsed.location}</p>
                )}
                {parsed.bio && (
                  <p><span className="font-semibold">Bio:</span> {parsed.bio.slice(0, 120)}...</p>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={applyParsed}
                  className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition"
                >
                  Apply to profile
                </button>
                <button
                  type="button"
                  onClick={() => setParsed(null)}
                  className="rounded-lg border border-green-300 px-4 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* PHOTO */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-900">Profile Photo</label>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-indigo-200 bg-indigo-50">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-indigo-300" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current.click()}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current.click()}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  <p className="mt-1 text-xs text-gray-500">JPG, PNG or WEBP. Max 5MB.</p>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                    className="ml-auto text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* CV */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-900">CV / Resume</label>
              <div
                onClick={() => cvInputRef.current.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30"
              >
                {cvName ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileCheck className="h-8 w-8 text-indigo-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">{cvName}</p>
                      <p className="text-xs text-gray-500">Click to replace</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCvFile(null); setCvName(''); setExistingCvUrl(''); }}
                      className="ml-4 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">Click to upload your CV</p>
                    <p className="mt-1 text-xs text-gray-500">PDF, DOC or DOCX. Max 10MB.</p>
                  </div>
                )}
              </div>
              {existingCvUrl && (
                <a
                  href={existingCvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" /> View current CV
                </a>
              )}
              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleCvChange}
              />
            </div>

            {/* SKILLS + EXPERIENCE */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">Skills (Comma Separated)</label>
                <div className="relative">
                  <Award className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    rows="3"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="react, node.js, python, design..."
                    className="block w-full rounded-md border border-gray-300 p-3 pl-10 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">These skills are matched against job descriptions by AI.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">Experience Level</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="block w-full rounded-md border border-gray-300 p-3 pl-10 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                <label className="mb-2 block text-sm font-medium text-gray-900">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Nairobi, Kenya"
                    className="block w-full rounded-md border border-gray-300 p-3 pl-10 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">Salary Expectation (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.salaryExpectation}
                    onChange={(e) => setFormData({ ...formData, salaryExpectation: e.target.value })}
                    placeholder="80000"
                    className="block w-full rounded-md border border-gray-300 p-3 pl-8 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* BIO */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Professional Bio</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  rows="4"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Describe your career achievements..."
                  className="block w-full rounded-md border border-gray-300 p-3 pl-10 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* SUBMIT */}
            <div className="flex gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => navigate('/seeker/dashboard')}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 font-bold text-gray-600 transition hover:bg-gray-50"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : (<><Save className="h-4 w-4" /> Save Profile</>)}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default SeekerProfile;