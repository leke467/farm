import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-gray-50 to-green-50 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <Link to="/">
          <div className="flex justify-center mb-4">
            <img
              src="https://placehold.co/80x80/2F855A/FFFFFF?text=FM"
              alt="Farm Manager"
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg shadow-md"
            />
          </div>
          <h2 className="text-center text-2xl sm:text-3xl font-display font-bold text-primary-600">
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
            <Link to="/" className="font-medium text-primary-500 hover:text-primary-600">
              Return to Home Page
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default AuthLayout;