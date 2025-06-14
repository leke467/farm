import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBarChart2, FiUsers, FiCalendar, FiCloud } from 'react-icons/fi';

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-green-50 to-green-200">
      {/* Hero Section */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="https://placehold.co/40x40/2F855A/FFFFFF?text=TT"
              alt="Terra Track"
              className="h-10 w-10 rounded-lg"
            />
            <span className="ml-3 text-xl font-display font-bold text-green-700">Terra Track</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-green-700 hover:text-green-800">Sign In</Link>
            <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl lg:text-6xl font-display font-bold text-green-900 leading-tight">
              Modern Farm
              <span className="block text-green-700 mt-2">Management Solution</span>
            </h1>
            <p className="mt-6 text-xl text-green-800 leading-relaxed">
              Transform your agricultural operations with our comprehensive farm management system. 
              Track livestock, manage crops, and optimize your farm's performance all in one place.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
              <Link
                to="/register"
                className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4 rounded-lg transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                to="/login"
                className="border-2 border-green-600 text-green-700 hover:bg-green-50 text-lg px-8 py-4 rounded-lg transition-colors"
              >
                Learn More
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 lg:mt-0"
          >
            <img
              src="https://images.pexels.com/photos/2132180/pexels-photo-2132180.jpeg"
              alt="Farm Management"
              className="rounded-xl shadow-2xl"
            />
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-green-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-green-900 sm:text-4xl">
              Everything you need to manage your farm
            </h2>
            <p className="mt-4 text-xl text-green-700">
              Streamline your operations with our comprehensive suite of tools
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-lg p-8 border border-green-100"
              >
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                  <FiUsers size={24} />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-3">Livestock Management</h3>
                <p className="text-green-700">Track animal health, breeding cycles, and productivity with ease.</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-lg p-8 border border-green-100"
              >
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                  <FiBarChart2 size={24} />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-3">Crop Planning</h3>
                <p className="text-green-700">Optimize your harvests with intelligent planning and monitoring tools.</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-lg p-8 border border-green-100"
              >
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                  <FiCalendar size={24} />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-3">Task Management</h3>
                <p className="text-green-700">Stay organized with our comprehensive task scheduling system.</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-lg p-8 border border-green-100"
              >
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                  <FiCloud size={24} />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-3">Weather Integration</h3>
                <p className="text-green-700">Make informed decisions with real-time weather updates and forecasts.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-green-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-white sm:text-4xl">
              Ready to transform your farm management?
            </h2>
            <p className="mt-4 text-xl text-green-100">
              Join thousands of farmers who are already using Terra Track
            </p>
            <div className="mt-8">
              <Link
                to="/register"
                className="bg-white text-green-700 hover:bg-green-50 text-lg px-8 py-4 rounded-lg transition-colors"
              >
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-green-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-green-300 uppercase tracking-wider">Product</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-green-100 hover:text-white">Features</a></li>
                <li><a href="#" className="text-base text-green-100 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-base text-green-100 hover:text-white">Updates</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-green-300 uppercase tracking-wider">Company</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-green-100 hover:text-white">About</a></li>
                <li><a href="#" className="text-base text-green-100 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-base text-green-100 hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-green-300 uppercase tracking-wider">Support</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-green-100 hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-base text-green-100 hover:text-white">Contact</a></li>
                <li><a href="#" className="text-base text-green-100 hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-green-300 uppercase tracking-wider">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-green-100 hover:text-white">Privacy</a></li>
                <li><a href="#" className="text-base text-green-100 hover:text-white">Terms</a></li>
                <li><a href="#" className="text-base text-green-100 hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-green-800 pt-8">
            <p className="text-base text-green-400 text-center">
              © 2024 Terra Track. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;