import { FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-dark-sidebar text-dark-secondary py-12 border-t border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <h3 className="text-dark-primary text-xl font-bold mb-4">JobHub</h3>
          <p className="text-sm text-dark-secondary mb-4">Connecting talent with opportunity through AI-driven matching.</p>
          <div className="flex space-x-4">
            <FaLinkedin className="h-5 w-5 hover:text-lime-500 cursor-pointer transition" />
            <FaTwitter className="h-5 w-5 hover:text-lime-500 cursor-pointer transition" />
            <FaGithub className="h-5 w-5 hover:text-lime-500 cursor-pointer transition" />
          </div>
        </div>

        <div>
          <h4 className="text-dark-primary font-semibold mb-4">Job Seekers</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-lime-500 transition">Resume Builder</a></li>
            <li><a href="#" className="hover:text-lime-500 transition">Job Listings</a></li>
            <li><a href="#" className="hover:text-lime-500 transition">Career Guidance</a></li>
            <li><a href="#" className="hover:text-lime-500 transition">Skill Development</a></li>
            <li><a href="#" className="hover:text-lime-500 transition">Interview Prep</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-dark-primary font-semibold mb-4">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-lime-500 transition">FAQs</a></li>
            <li><a href="#" className="hover:text-lime-500 transition">Quick Start</a></li>
            <li><a href="#" className="hover:text-lime-500 transition">Documentation</a></li>
            <li><a href="#" className="hover:text-lime-500 transition">User Guide</a></li>
            <li><a href="#" className="hover:text-lime-500 transition">Blog</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-dark-primary font-semibold mb-4">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-lime-500 transition">Customer Support</a></li>
            <li><a href="#" className="hover:text-lime-500 transition">Cookies Policy</a></li>
            <li><a href="#" className="hover:text-lime-500 transition">License Info</a></li>
            <li><a href="#" className="hover:text-lime-500 transition">Terms & Conditions</a></li>
            <li><a href="#" className="hover:text-lime-500 transition">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-dark-border text-center text-sm text-dark-secondary">
        &copy; 2024 JobHub Inc. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;