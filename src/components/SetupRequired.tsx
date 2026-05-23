'use client';

import { Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface SetupRequiredProps {
  title: string;
  message?: string;
  feature?: string;
}

export default function SetupRequired({ title, message, feature }: SetupRequiredProps) {
  const router = useRouter();

  const defaultMessage = feature
    ? `${feature} requires configuration to work properly.`
    : 'This feature requires configuration to work properly.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-3xl p-12 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-full p-6">
              <AlertCircle className="w-16 h-16 text-yellow-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white text-center mb-4">
            {title}
          </h1>

          {/* Message */}
          <p className="text-xl text-gray-300 text-center mb-8 leading-relaxed">
            {message || defaultMessage}
          </p>

          {/* Info Box */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">Setup Steps:</h3>
            <ol className="text-gray-300 space-y-2 list-decimal list-inside">
              <li>Copy <code className="bg-gray-800 px-2 py-1 rounded text-sm">config.json.example</code> to <code className="bg-gray-800 px-2 py-1 rounded text-sm">config.json</code></li>
              <li>Fill in your credentials in config.json</li>
              <li>Or use the Settings page to configure via UI</li>
              <li>Restart the application</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push('/dashboard/settings')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl border border-blue-500 transition-all shadow-lg hover:shadow-blue-500/50"
            >
              <Settings className="w-5 h-5 mr-2" />
              Go to Settings
            </Button>

            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-8 rounded-xl border border-gray-600 transition-all"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Footer Hint */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          Don't have a config.json file? Check the project README for setup instructions.
        </p>
      </div>
    </div>
  );
}
