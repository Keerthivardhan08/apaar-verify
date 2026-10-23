import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2.5 shadow-sm text-xs sm:text-sm font-medium border-b border-amber-600 flex items-center justify-center space-x-2 select-none z-50">
      <AlertTriangle className="w-4 h-4 text-amber-950 shrink-0" />
      <span className="text-center font-semibold tracking-wide">
        ⚠️ DEMONSTRATION ENVIRONMENT — All student records and institutional data shown are synthetic. Identity responses are simulated and are NOT official APAAR verification results.
      </span>
    </div>
  );
};

export default DemoBanner;
