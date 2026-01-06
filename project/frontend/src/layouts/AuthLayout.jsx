import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/">
          <div className="flex justify-center">
            <img
              src="https://placehold.co/80x80/2F855A/FFFFFF?text=FM"
              alt="Farm Manager"
              className="h-20 w-20 rounded-lg"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-display font-bold text-primary-600">
            Farm Manager
          </h2>
        </Link>
        <p className="mt-2 text-center text-sm text-gray-600">
          Professional farm management solution
        </p>
      </div>

      <motion.div 
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
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