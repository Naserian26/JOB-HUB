import { FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <h3 className="text-white text-xl font-bold mb-4">JobHub</h3>
          <p className="text-sm text-gray-400 mb-4">Connecting talent with opportunity through AI-driven matching.</p>
          <div className="flex space-x-4">
            <FaLinkedin className="h-5 w-5 hover:text-white cursor-pointer" />
            <FaTwitter className="h-5 w-5 hover:text-white cursor-pointer" />
            <FaGithub className="h-5 w-5 hover:text-white cursor-pointer" />
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Job Seekers</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-indigo-400">Resume Builder</a></li>
            <li><a href="#" className="hover:text-indigo-400">Job Listings</a></li>
            <li><a href="#" className="hover:text-indigo-400">Career Guidance</a></li>
            <li><a href="#" className="hover:text-indigo-400">Skill Development</a></li>
            <li><a href="#" className="hover:text-indigo-400">Interview Prep</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-indigo-400">FAQs</a></li>
            <li><a href="#" className="hover:text-indigo-400">Quick Start</a></li>
            <li><a href="#" className="hover:text-indigo-400">Documentation</a></li>
            <li><a href="#" className="hover:text-indigo-400">User Guide</a></li>
            <li><a href="#" className="hover:text-indigo-400">Blog</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-indigo-400">Customer Support</a></li>
            <li><a href="#" className="hover:text-indigo-400">Cookies Policy</a></li>
            <li><a href="#" className="hover:text-indigo-400">License Info</a></li>
            <li><a href="#" className="hover:text-indigo-400">Terms & Conditions</a></li>
            <li><a href="#" className="hover:text-indigo-400">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
        &copy; 2024 JobHub Inc. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;