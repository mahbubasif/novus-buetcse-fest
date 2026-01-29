import React from 'react';
import { FlaskConical, Sparkles, Wrench } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function LabGenerator() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25 mb-6">
        <FlaskConical className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Lab Generator</h1>
      <p className="text-gray-500 max-w-md mb-8">
        AI-powered lab exercise generator. Create interactive coding exercises based on your course materials.
      </p>
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg">
        <Wrench className="w-5 h-5" />
        <span className="text-sm font-medium">Coming Soon</span>
      </div>
    </div>
  );
}

export default LabGenerator;
