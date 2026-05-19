import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import axios from 'axios'; // <--- IMPORT AXIOS
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const AddJob = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    salaryMin: 0,
salaryMax: 0,
    description: '',
    category: 'Software Development',
    location: 'Remote',
    experienceLevel: 'Mid'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    if (step === 1 && (!formData.title || !formData.salaryMin)) return alert('Please fill required fields');
    if (step === 2 && !formData.description) return alert('Please add a description');
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  // REAL SUBMIT FUNCTION
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Send data to the backend
      await axios.post('http://localhost:5000/api/jobs', formData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      alert('Job Posted Successfully!');
      navigate('/employer/dashboard');
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Failed to post job');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/employer/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a New Job</h1>

          {/* Progress Bar */}
          <div className="flex items-center mb-8">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center w-full">
                <div className={`flex flex-col items-center ${step >= stepNumber ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${step >= stepNumber ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>
                    {step > stepNumber ? <CheckCircle className="w-5 h-5" /> : stepNumber}
                  </div>
                  <span className="text-xs mt-1 font-medium">
                    {stepNumber === 1 ? 'Basic Info' : stepNumber === 2 ? 'Details' : 'Preview'}
                  </span>
                </div>
                {stepNumber < 3 && <div className={`h-0.5 flex-1 mx-2 ${step > stepNumber ? 'bg-indigo-600' : 'bg-gray-300'}`} />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job Title *</label>
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Min Salary (USD) *</label>
                    <input 
                      type="number" 
                      name="salaryMin"
                      value={formData.salaryMin}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="80,000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Salary (USD)</label>
                    <input 
                      type="number" 
                      name="salaryMax"
                      value={formData.salaryMax}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="120,000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Details */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job Description *</label>
                  <div className="bg-white border border-gray-300 rounded-md shadow-sm mt-1 overflow-hidden">
                    <ReactQuill 
                      theme="snow"
                      value={formData.description}
                      onChange={(content) => setFormData({ ...formData, description: content })}
                      style={{ minHeight: '250px' }} 
                      placeholder="Describe the role, responsibilities, and requirements..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option>Software Development</option>
                      <option>AI</option>
                      <option>Marketing</option>
                      <option>Product Management</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input 
                      type="text" 
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Experience Level</label>
                  <select 
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option>Entry Level</option>
                    <option>Mid</option>
                    <option>Senior</option>
                    <option>Executive</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3: Preview */}
            {step === 3 && (
              <div className="border rounded-lg p-6 bg-gray-50 animate-fade-in">
                <h2 className="text-xl font-bold text-indigo-900">{formData.title}</h2>
                <div className="flex gap-4 text-sm text-gray-600 my-2">
                  <span>{formData.location}</span>
                  <span>•</span>
                  <span>{formData.experienceLevel}</span>
                  <span>•</span>
                  <span>${formData.salaryMin} - ${formData.salaryMax}</span>
                </div>
                <div className="text-gray-800 mt-4 ql-editor" dangerouslySetInnerHTML={{ __html: formData.description }} />
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button onClick={prevStep} disabled={step === 1} className={`px-4 py-2 rounded-md font-medium ${step === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>Back</button>
            <div className="flex gap-3">
              {step < 3 ? (
                <button onClick={nextStep} className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700">Next Step</button>
              ) : (
                <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700">Post Job</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddJob;