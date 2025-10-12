import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const AdminSetup: React.FC = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const updateUserRole = useMutation(api.users.updateUserRole);

  const handleSetupAdmin = async () => {
    if (!user) {
      setMessage('Please sign in first');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      await updateUserRole({ clerkId: user.id, role: "admin" });
      setMessage('✅ Successfully made you an admin! Please refresh the page.');
    } catch (error) {
      console.error('Setup failed:', error);
      setMessage(`❌ Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Admin Setup</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please sign in to set up admin access.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-yellow-800 dark:text-yellow-200">
          🛠️ Admin Setup
        </h2>
        
        <p className="text-yellow-700 dark:text-yellow-300 mb-6">
          This will make your account an admin. Only use this if you're setting up the first admin user.
        </p>
        
        <div className="space-y-4">
          <div className="text-sm text-yellow-600 dark:text-yellow-400">
            <strong>Current User:</strong> {user.emailAddresses[0]?.emailAddress}
          </div>
          
          <button
            onClick={handleSetupAdmin}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            {isLoading ? 'Setting up...' : 'Make Me Admin'}
          </button>
          
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('✅') 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>
        
        <div className="mt-6 text-xs text-yellow-600 dark:text-yellow-400">
          <strong>Note:</strong> After setup, you can remove this component and the setupFirstAdmin function from your code.
        </div>
      </div>
    </div>
  );
};

export default AdminSetup; 