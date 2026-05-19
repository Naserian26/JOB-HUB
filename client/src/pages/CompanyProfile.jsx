import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployerLayout from '../components/EmployerLayout';
import { useAuth } from '../hooks/useAuth';
import { FaLinkedin, FaTwitter } from 'react-icons/fa';
import { FiCamera, FiSave } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const Spinner = () => <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />;

const CompanyProfile = () => {
  const { user } = useAuth();
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    industry: '',
    description: '',
    linkedin: '',
    twitter: '',
  });
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API}/api/company-profile/me`, { headers: getHeaders() });
        const { industry, description, linkedin, twitter, logoUrl } = res.data;
        setForm({
          industry: industry || '',
          description: description || '',
          linkedin: linkedin || '',
          twitter: twitter || '',
        });
        if (logoUrl) setLogoUrl(logoUrl);
      } catch (err) {
        if (err.response?.status !== 404) setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setUploadingLogo(true);
    try {
      const data = new FormData();
      data.append('logo', file);
      const res = await axios.post(`${API}/api/company-profile/logo`, data, {
        headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' },
      });
      setLogoUrl(res.data.logoUrl);
    } catch {
      setError('Logo upload failed.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await axios.post(`${API}/api/company-profile`, form, { headers: getHeaders() });
      setSuccess(true);
      setTimeout(() => navigate('/employer/dashboard'), 1500);
    } catch {
      setError('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'CO';

  return (
    <EmployerLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Company Profile</h1>
        <p className="text-sm text-gray-400 mb-8">This info is visible to job seekers on your listings.</p>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Spinner /> Loading...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Logo */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => fileInputRef.current.click()}
                >
                  {logoPreview || logoUrl ? (
                    <img src={logoPreview || logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-indigo-500 font-bold text-xl">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow"
                >
                  {uploadingLogo ? <Spinner /> : <FiCamera className="w-3 h-3 text-white" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Company Logo</p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP — max 5MB</p>
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
              <select
                name="industry"
                value={form.industry}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select industry</option>
                {['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Media', 'NGO / Nonprofit', 'Government', 'Other'].map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">About the company</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="What does your company do? Culture, mission, values..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Social links */}
            <div className="flex flex-col gap-3">
              <label className="block text-sm font-medium text-gray-700">Social links</label>
              <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5">
                <FaLinkedin className="text-[#0077b5] shrink-0" />
                <input
                  name="linkedin"
                  value={form.linkedin}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/company/yourcompany"
                  className="flex-1 text-sm text-gray-800 focus:outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5">
                <FaTwitter className="text-[#1da1f2] shrink-0" />
                <input
                  name="twitter"
                  value={form.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/yourcompany"
                  className="flex-1 text-sm text-gray-800 focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">Profile saved. Redirecting...</p>}

            <div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {saving ? <Spinner /> : <FiSave className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </EmployerLayout>
  );
};

export default CompanyProfile;