import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// Standardized Lists (Same as JobListings)
const categories = [
  "Software Development", "Cloud Computing", "Artificial Intelligence",
  "Networking", "Marketing", "Cybersecurity", "Product Management",
  "Sales Engineering", "Technical Writing", "IoT Development",
  "Quality Assurance", "Digital Marketing", "Design",
];

const locations = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu",
  "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho",
  "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale",
  "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit",
  "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi",
  "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya",
  "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana",
  "Uasin Gishu", "Vihiga", "Wajir", "West Pokot", "Remote",
];

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

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
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
    <div className="bg-dark-bg min-h-screen py-8 text-slate-100">
      <style>{`
        /* Dark Mode Overrides for ReactQuill */
        .ql-snow .ql-toolbar, .ql-snow .ql-stroke, .ql-snow .ql-fill, .ql-snow .ql-picker-label {
          stroke: #cbd5e1 !important;
        }
        .ql-snow .ql-picker {
          color: #cbd5e1 !important;
        }
        .ql-container.ql-snow {
          border-color: #334155 !important;
        }
        .ql-editor {
          background-color: #0f172a !important; /* Slate 900 */
          color: #fafaf9 !important; /* Warm white */
        }
        .ql-toolbar {
          background-color: #1e293b !important; /* Slate 800 */
          border-color: #334155 !important;
        }
        .ql-snow .ql-picker-options {
          background-color: #1e293b !important;
          border-color: #334155 !important;
          color: #cbd5e1;
        }
      `}</style>
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/employer/dashboard" className="inline-flex items-center text-lime-accent hover:text-lime-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>

        <div className="bg-dark-card border border-dark-border rounded-xl shadow-dark-md p-8">
          <h1 className="text-2xl font-bold text-slate-100 mb-6">Post a New Job</h1>

          {/* Progress Bar */}
          <div className="flex items-center mb-8">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center w-full">
                <div className={`flex flex-col items-center ${step >= stepNumber ? 'text-lime-accent' : 'text-slate-500'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${step >= stepNumber ? 'border-lime-accent bg-lime-accent/10' : 'border-dark-border bg-slate-900'}`}>
                    {step > stepNumber ? <CheckCircle className="w-5 h-5 text-lime-accent" /> : stepNumber}
                  </div>
                  <span className="text-xs mt-1 font-medium">
                    {stepNumber === 1 ? 'Basic Info' : stepNumber === 2 ? 'Details' : 'Preview'}
                  </span>
                </div>
                {stepNumber < 3 && <div className={`h-0.5 flex-1 mx-2 ${step > stepNumber ? 'bg-lime-accent' : 'bg-dark-border'}`} />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Job Title *</label>
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-dark-border bg-slate-900 text-slate-100 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-lime-accent focus:border-lime-accent outline-none transition"
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Min Salary (USD) *</label>
                    <input 
                      type="number" 
                      name="salaryMin"
                      value={formData.salaryMin}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-dark-border bg-slate-900 text-slate-100 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-lime-accent focus:border-lime-accent outline-none transition"
                      placeholder="80,000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Max Salary (USD)</label>
                    <input 
                      type="number" 
                      name="salaryMax"
                      value={formData.salaryMax}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-dark-border bg-slate-900 text-slate-100 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-lime-accent focus:border-lime-accent outline-none transition"
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
                  <label className="block text-sm font-medium text-slate-300">Job Description *</label>
                  <div className="rounded-lg mt-1 overflow-hidden border border-dark-border shadow-sm">
                    <ReactQuill 
                      theme="snow"
                      value={formData.description}
                      onChange={(content) => setFormData({ ...formData, description: content })}
                      style={{ minHeight: '250px' }} 
                      placeholder="Describe the role, responsibilities, and requirements..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Category</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-dark-border bg-slate-900 text-slate-100 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-lime-accent focus:border-lime-accent outline-none transition"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat} className="bg-slate-800 text-slate-100">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Location</label>
                    {/* Changed to Select to use standardized list */}
                    <select 
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-dark-border bg-slate-900 text-slate-100 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-lime-accent focus:border-lime-accent outline-none transition"
                    >
                      {locations.map(loc => (
                        <option key={loc} value={loc} className="bg-slate-800 text-slate-100">{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Experience Level</label>
                  <select 
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-dark-border bg-slate-900 text-slate-100 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-lime-accent focus:border-lime-accent outline-none transition"
                  >
                    <option value="Entry Level" className="bg-slate-800 text-slate-100">Entry Level</option>
                    <option value="Mid" className="bg-slate-800 text-slate-100">Mid</option>
                    <option value="Senior" className="bg-slate-800 text-slate-100">Senior</option>
                    <option value="Executive" className="bg-slate-800 text-slate-100">Executive</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3: Preview */}
            {step === 3 && (
              <div className="border border-dark-border rounded-lg p-6 bg-slate-900/50 animate-fade-in">
                <h2 className="text-xl font-bold text-slate-100">{formData.title}</h2>
                <div className="flex gap-4 text-sm text-slate-400 my-2 flex-wrap">
                  <span className="text-lime-accent font-medium">{formData.location}</span>
                  <span>•</span>
                  <span>{formData.experienceLevel}</span>
                  <span>•</span>
                  <span>${formData.salaryMin} - ${formData.salaryMax}</span>
                </div>
                <div className="ql-editor text-slate-300 mt-4" dangerouslySetInnerHTML={{ __html: formData.description }} />
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-dark-border">
            <button onClick={prevStep} disabled={step === 1} className={`px-4 py-2 rounded-lg font-medium transition ${step === 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-800'}`}>Back</button>
            <div className="flex gap-3">
              {step < 3 ? (
                <button onClick={nextStep} className="bg-lime-accent text-black px-6 py-2 rounded-lg font-bold hover:bg-lime-400 transition">Next Step</button>
              ) : (
                <button onClick={handleSubmit} className="bg-lime-accent text-black px-6 py-2 rounded-lg font-bold hover:bg-lime-400 transition">Post Job</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddJob;