import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import Button from '../components/ui/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 mb-6 shadow-xs">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">404</h1>
      <h2 className="mt-2 text-xl font-semibold text-gray-800">Page Not Found</h2>
      <p className="mt-2 text-sm text-gray-500 max-w-md">
        The requested resource or regulatory page could not be located on the APAAR Verify system.
      </p>
      <div className="mt-6">
        <Button
          variant="primary"
          onClick={() => navigate('/')}
          icon={<Home className="w-4 h-4" />}
        >
          Return to Portal
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
