import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_URL as API } from '../config';

export default function useSavedJobs(token) {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');
  const [updatingJobIds, setUpdatingJobIds] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;
    const fetchSavedJobs = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API}/saved-jobs`, { headers });
        if (!cancelled) setSavedJobs(response.data);
      } catch (requestError) {
        console.error('Failed to load saved jobs', requestError);
        if (!cancelled) setError('Saved jobs could not be loaded. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSavedJobs();
    return () => { cancelled = true; };
  }, [headers, reloadKey, token]);

  const savedJobIds = useMemo(
    () => new Set((token ? savedJobs : []).map(job => String(job._id))),
    [savedJobs, token]
  );

  const toggleSavedJob = useCallback(async (job) => {
    const jobId = String(job._id);
    if (updatingJobIds.includes(jobId)) return;

    setUpdatingJobIds(previous => [...previous, jobId]);
    setError('');
    try {
      if (savedJobIds.has(jobId)) {
        await axios.delete(`${API}/saved-jobs/${jobId}`, { headers });
        setSavedJobs(previous => previous.filter(savedJob => String(savedJob._id) !== jobId));
      } else {
        await axios.post(`${API}/saved-jobs/${jobId}`, {}, { headers });
        setSavedJobs(previous => previous.some(savedJob => String(savedJob._id) === jobId)
          ? previous
          : [job, ...previous]);
      }
    } catch (requestError) {
      console.error(`Failed to update saved job ${jobId}`, requestError);
      setError('Could not update saved jobs. Please try again.');
    } finally {
      setUpdatingJobIds(previous => previous.filter(id => id !== jobId));
    }
  }, [headers, savedJobIds, updatingJobIds]);

  return {
    savedJobs: token ? savedJobs : [],
    savedJobIds,
    loading: token ? loading : false,
    error: token ? error : '',
    updatingJobIds: new Set(updatingJobIds),
    toggleSavedJob,
    retry: () => setReloadKey(previous => previous + 1),
  };
}
