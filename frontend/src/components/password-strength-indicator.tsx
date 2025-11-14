import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordRequirement {
  label: string;
  regex: RegExp;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', regex: /.{8,}/ },
  { label: 'One uppercase letter', regex: /[A-Z]/ },
  { label: 'One lowercase letter', regex: /[a-z]/ },
  { label: 'One number', regex: /[0-9]/ },
  { label: 'One special character (@$!%*?&)', regex: /[@$!%*?&]/ },
];

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const requirements = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map((req) => ({
      ...req,
      met: req.regex.test(password),
    }));
  }, [password]);

  const strength = useMemo(() => {
    const metCount = requirements.filter((r) => r.met).length;
    const percentage = (metCount / requirements.length) * 100;

    if (percentage === 100) return { label: 'Strong', color: 'bg-green-500' };
    if (percentage >= 60) return { label: 'Medium', color: 'bg-yellow-500' };
    if (percentage >= 40) return { label: 'Weak', color: 'bg-orange-500' };
    return { label: 'Very Weak', color: 'bg-red-500' };
  }, [requirements]);

  const metCount = requirements.filter((r) => r.met).length;

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Password Strength</span>
          <span className="font-medium">{strength.label}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{
              width: `${(metCount / requirements.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-700">Requirements:</p>
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <X className="h-3.5 w-3.5 text-gray-400" />
            )}
            <span className={req.met ? 'text-green-700' : 'text-gray-500'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
