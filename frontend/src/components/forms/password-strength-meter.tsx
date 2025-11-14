'use client';

import { useMemo } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import zxcvbn from 'zxcvbn';
import { checkPasswordRequirements } from '@/schemas/authSchemas';

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
  showFeedback?: boolean;
}

const STRENGTH_LABELS = [
  { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-700' },
  { label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-700' },
  { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
  { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700' },
  { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-700' },
];

export function PasswordStrengthMeter({
  password,
  showRequirements = true,
  showFeedback = true,
}: PasswordStrengthMeterProps) {
  // Use zxcvbn for advanced password strength analysis
  const analysis = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        feedback: { warning: '', suggestions: [] },
        crackTimeDisplay: '',
      };
    }
    return zxcvbn(password);
  }, [password]);

  // Check basic requirements
  const requirements = useMemo(() => checkPasswordRequirements(password), [password]);

  const strength = STRENGTH_LABELS[analysis.score];
  const allRequirementsMet = requirements.every((req) => req.met);

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      {password && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">Password Strength</span>
            <span className={`font-semibold ${strength.textColor}`}>{strength.label}</span>
          </div>
          <div className="flex h-2 gap-1 overflow-hidden rounded-full">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className={`flex-1 transition-all duration-300 ${
                  index <= analysis.score ? strength.color : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          {analysis.feedback.crackTimesDisplay && (
            <p className="text-xs text-muted-foreground">
              Estimated crack time: {analysis.feedback.crackTimesDisplay.offlineSlowHashing1e4PerSecond}
            </p>
          )}
        </div>
      )}

      {/* zxcvbn Feedback */}
      {showFeedback && password && (analysis.feedback.warning || analysis.feedback.suggestions.length > 0) && (
        <div className="rounded-md border border-warning/20 bg-warning/10 p-3 space-y-2">
          {analysis.feedback.warning && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warning-foreground">{analysis.feedback.warning}</p>
            </div>
          )}
          {analysis.feedback.suggestions.length > 0 && (
            <ul className="space-y-1 text-xs text-muted-foreground ml-6 list-disc">
              {analysis.feedback.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Requirements:</p>
          <div className="space-y-1.5">
            {requirements.map((req) => (
              <div key={req.id} className="flex items-center gap-2 text-xs">
                {req.met ? (
                  <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <X className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                )}
                <span className={req.met ? 'text-green-700' : 'text-muted-foreground'}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
          {allRequirementsMet && (
            <div className="flex items-center gap-2 pt-1 text-xs text-green-700 font-medium">
              <Check className="h-4 w-4" aria-hidden="true" />
              All requirements met!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
