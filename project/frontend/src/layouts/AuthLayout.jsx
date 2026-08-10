import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-gray-50 to-green-50 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="block group">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 transition-transform duration-300 group-hover:scale-105">
              <Logo size={64} className="drop-shadow-md" />
            </div>
          </div>
          <h2 className="text-center text-2xl sm:text-3xl font-display font-bold text-emerald-800 tracking-tight">
            Farm Manager
          </h2>
        </Link>
        <p className="mt-2 text-center text-xs sm:text-sm text-gray-600">
          Professional farm management solution
        </p>
      </div>

      <motion.div 
        className="mt-8 mx-auto w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white py-6 px-4 sm:py-8 sm:px-8 shadow-lg rounded-lg sm:rounded-xl border border-gray-100">
          <Outlet />
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            <Link to="/" className="font-medium text-emerald-600 hover:text-emerald-700">
              Return to Home Page
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default AuthLayout;