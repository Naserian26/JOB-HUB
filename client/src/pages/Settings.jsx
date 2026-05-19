import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import SeekerLayout from '../components/SeekerLayout';
import EmployerLayout from '../components/EmployerLayout';
import {
  Lock, Mail, Bell, UserMinus, Trash2,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';

const API = 'http://localhost:5000/api/auth';

const Alert = ({ type, message, onClose }) => {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
      isSuccess
        ? 'border-green-200 bg-green-50 text-green-800'
        : 'border-red-200 bg-red-50 text-red-800'
    }`}>
      {isSuccess
        ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
        : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
};

const Toggle = ({ label, description, checked, onChange, disabled }) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <div>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-indigo-600' : 'bg-gray-200'
      } disabled:opacity-60`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

const Section = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            {icon}
          </div>
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-gray-400" />
          : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="border-t border-gray-100 px-6 py-5">{children}</div>}
    </div>
  );
};

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Toggle settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [toggleSaving, setToggleSaving] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordAlert, setPasswordAlert] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Change email
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailAlert, setEmailAlert] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Deactivate
  const [deactivateAlert, setDeactivateAlert] = useState(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Delete
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteAlert, setDeleteAlert] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const headers = { Authorization: `Bearer ${user?.token}` };

  useEffect(() => {
    if (!user?.token) return;
    const authHeaders = { Authorization: `Bearer ${user.token}` };
    const loadSettings = async () => {
      try {
        const res = await axios.get(`${API}/settings`, { headers: authHeaders });
        setEmailNotifications(res.data.emailNotifications ?? true);
        setProfileVisible(res.data.profileVisible ?? true);
      } catch {
        // silently fail
      }
    };
    loadSettings();
  }, [user?.token]);

  const saveToggles = async (field, value) => {
    setToggleSaving(true);
    try {
      await axios.post(`${API}/settings`, { emailNotifications, profileVisible, [field]: value }, { headers });
    } catch {
      // silently fail
    } finally {
      setToggleSaving(false);
    }
  };

  const handleToggle = (field, value) => {
    if (field === 'emailNotifications') setEmailNotifications(value);
    if (field === 'profileVisible') setProfileVisible(value);
    saveToggles(field, value);
  };

  const handleChangePassword = async () => {
    setPasswordAlert(null);
    if (!currentPassword || !newPassword || !confirmPassword)
      return setPasswordAlert({ type: 'error', message: 'All fields are required.' });
    if (newPassword !== confirmPassword)
      return setPasswordAlert({ type: 'error', message: 'New passwords do not match.' });
    if (newPassword.length < 6)
      return setPasswordAlert({ type: 'error', message: 'Password must be at least 6 characters.' });

    setPasswordLoading(true);
    try {
      const res = await axios.post(`${API}/change-password`, { currentPassword, newPassword }, { headers });
      setPasswordAlert({ type: 'success', message: res.data.message });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPasswordAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailAlert(null);
    if (!newEmail || !emailPassword)
      return setEmailAlert({ type: 'error', message: 'All fields are required.' });

    setEmailLoading(true);
    try {
      const res = await axios.post(`${API}/change-email`, { newEmail, password: emailPassword }, { headers });
      setEmailAlert({ type: 'success', message: res.data.message });
      setNewEmail(''); setEmailPassword('');
    } catch (err) {
      setEmailAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update email.' });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivateAlert(null);
    setDeactivateLoading(true);
    try {
      await axios.post(`${API}/deactivate`, {}, { headers });
      logout();
      navigate('/login');
    } catch (err) {
      setDeactivateAlert({ type: 'error', message: err.response?.data?.message || 'Failed to deactivate account.' });
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteAlert(null);
    if (!deletePassword)
      return setDeleteAlert({ type: 'error', message: 'Please enter your password to confirm.' });
    if (deleteConfirm !== 'DELETE')
      return setDeleteAlert({ type: 'error', message: 'Type DELETE to confirm.' });

    setDeleteLoading(true);
    try {
      await axios.delete(`${API}/delete-account`, {
        headers,
        data: { password: deletePassword },
      });
      logout();
      navigate('/');
    } catch (err) {
      setDeleteAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete account.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100';

  const btnPrimary =
    'rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed';

  const content = (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account preferences and security.</p>
      </div>

      {/* Notifications & Visibility */}
      <Section title="Notifications & Privacy" icon={<Bell className="h-4 w-4" />} defaultOpen>
        <div className="divide-y divide-gray-100">
          <Toggle
            label="Email Notifications"
            description="Receive updates about applications and activity via email."
            checked={emailNotifications}
            onChange={(val) => handleToggle('emailNotifications', val)}
            disabled={toggleSaving}
          />
          {user?.role === 'seeker' && (
            <Toggle
              label="Profile Visibility"
              description="Allow employers to find and view your profile."
              checked={profileVisible}
              onChange={(val) => handleToggle('profileVisible', val)}
              disabled={toggleSaving}
            />
          )}
        </div>
      </Section>

      {/* Change Password */}
      <Section title="Change Password" icon={<Lock className="h-4 w-4" />}>
        <div className="space-y-3 max-w-md">
          <Alert
            type={passwordAlert?.type}
            message={passwordAlert?.message}
            onClose={() => setPasswordAlert(null)}
          />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className={inputClass}
            />
          </div>
          <button onClick={handleChangePassword} disabled={passwordLoading} className={btnPrimary}>
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </Section>

      {/* Change Email */}
      <Section title="Change Email" icon={<Mail className="h-4 w-4" />}>
        <div className="space-y-3 max-w-md">
          <Alert
            type={emailAlert?.type}
            message={emailAlert?.message}
            onClose={() => setEmailAlert(null)}
          />
          <p className="text-xs text-gray-500">Current email: <span className="font-medium text-gray-700">{user?.email}</span></p>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">New Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Enter new email"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Confirm Password</label>
            <input
              type="password"
              value={emailPassword}
              onChange={e => setEmailPassword(e.target.value)}
              placeholder="Enter your password"
              className={inputClass}
            />
          </div>
          <button onClick={handleChangeEmail} disabled={emailLoading} className={btnPrimary}>
            {emailLoading ? 'Updating...' : 'Update Email'}
          </button>
        </div>
      </Section>

      {/* Deactivate */}
      <Section title="Deactivate Account" icon={<UserMinus className="h-4 w-4" />}>
        <div className="max-w-md space-y-3">
          <Alert
            type={deactivateAlert?.type}
            message={deactivateAlert?.message}
            onClose={() => setDeactivateAlert(null)}
          />
          <p className="text-sm text-gray-600">
            Deactivating hides your profile and pauses all activity. Your data is kept and you can reactivate anytime by logging back in.
          </p>
          <button
            onClick={handleDeactivate}
            disabled={deactivateLoading}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deactivateLoading ? 'Deactivating...' : 'Deactivate My Account'}
          </button>
        </div>
      </Section>

      {/* Delete */}
      <Section title="Delete Account" icon={<Trash2 className="h-4 w-4" />}>
        <div className="max-w-md space-y-3">
          <Alert
            type={deleteAlert?.type}
            message={deleteAlert?.message}
            onClose={() => setDeleteAlert(null)}
          />
          <p className="text-sm text-gray-600">
            This is permanent. All your data, applications, and profile will be deleted and cannot be recovered.
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Enter your password</label>
            <input
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              placeholder="Your password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className={inputClass}
            />
          </div>
          <button
            onClick={handleDelete}
            disabled={deleteLoading || deleteConfirm !== 'DELETE'}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deleteLoading ? 'Deleting...' : 'Permanently Delete Account'}
          </button>
        </div>
      </Section>
    </div>
  );

  if (user?.role === 'employer') {
    return <EmployerLayout>{content}</EmployerLayout>;
  }

  return <SeekerLayout>{content}</SeekerLayout>;
};

export default Settings;