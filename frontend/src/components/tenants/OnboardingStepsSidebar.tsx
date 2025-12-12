'use client';

/**
 * OnboardingStepsSidebar - Editorial Timeline Design
 * A refined vertical timeline stepper with elegant animations and premium aesthetics
 */

import { useCallback } from 'react';
import { CheckCircle2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStep {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface OnboardingStepsSidebarProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

export function OnboardingStepsSidebar({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: OnboardingStepsSidebarProps) {
  const isStepClickable = useCallback(
    (step: number) => completedSteps.includes(step) || currentStep >= step,
    [completedSteps, currentStep]
  );

  const isStepCompleted = useCallback(
    (step: number) => completedSteps.includes(step) || currentStep > step,
    [completedSteps, currentStep]
  );

  return (
    <div className="sticky top-8">
      {/* Outer container with noise texture overlay */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-b from-card via-card to-primary/[0.03] shadow-xl">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIiBmaWxsPSJyZ2JhKDAsIDAsIDAsIDAuMDMpIi8+Cjwvc3ZnPg==')] opacity-50" />
        <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />

        {/* Header */}
        <div className="relative border-b border-primary/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center">
              {/* Animated ring */}
              <div className="absolute inset-0 animate-[spin_8s_linear_infinite] rounded-full border border-dashed border-primary/30" />
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary/20 to-primary/5" />
              <span className="relative text-xs font-bold text-primary">
                {currentStep}/{steps.length}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Onboarding Journey</h3>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Step by step
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-700 ease-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Timeline Steps */}
        <div className="relative px-5 py-4">
          {/* Vertical timeline line */}
          <div className="absolute left-[29px] top-6 bottom-6 w-px bg-gradient-to-b from-border via-border to-transparent" />

          {/* Animated progress line overlay */}
          <div
            className="absolute left-[29px] top-6 w-px bg-gradient-to-b from-primary via-primary to-primary/50 transition-all duration-700 ease-out"
            style={{
              height: `calc(${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100)}% - 24px)`,
              maxHeight: 'calc(100% - 48px)',
            }}
          />

          <nav className="relative space-y-1">
            {steps.map(({ step, title, description, icon: Icon }, index) => {
              const isActive = currentStep === step;
              const isCompleted = isStepCompleted(step);
              const isClickable = isStepClickable(step);
              const isLast = index === steps.length - 1;

              return (
                <button
                  key={step}
                  onClick={() => isClickable && onStepClick(step)}
                  disabled={!isClickable}
                  className={cn(
                    'group relative flex w-full items-start gap-4 rounded-xl p-3 text-left transition-all duration-300',
                    isActive && 'bg-primary/5',
                    isClickable && !isActive && 'hover:bg-muted/50',
                    !isClickable && 'cursor-not-allowed opacity-40'
                  )}
                >
                  {/* Step indicator */}
                  <div className="relative z-10 flex-shrink-0">
                    {/* Glow effect for active */}
                    {isActive && (
                      <div className="absolute inset-0 animate-pulse rounded-full bg-primary/30 blur-md" />
                    )}

                    {/* Main circle */}
                    <div
                      className={cn(
                        'relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300',
                        isCompleted
                          ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : isActive
                            ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                            : 'border-muted-foreground/20 bg-background text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span
                          className={cn(
                            'font-mono text-sm font-bold tabular-nums',
                            isActive && 'text-primary-foreground'
                          )}
                        >
                          {step}
                        </span>
                      )}
                    </div>

                    {/* Connecting dot for non-last items */}
                    {!isLast && (
                      <div
                        className={cn(
                          'absolute left-1/2 top-full mt-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full transition-colors duration-300',
                          isCompleted ? 'bg-primary' : 'bg-muted-foreground/20'
                        )}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-sm font-semibold transition-colors duration-200',
                          isActive
                            ? 'text-primary'
                            : isCompleted
                              ? 'text-foreground'
                              : 'text-foreground/80'
                        )}
                      >
                        {title}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-emerald-600">
                          Done
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {description}
                    </p>
                  </div>

                  {/* Icon indicator */}
                  <div
                    className={cn(
                      'flex-shrink-0 pt-1 transition-all duration-200',
                      isActive
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-90 group-hover:opacity-60 group-hover:scale-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  </div>

                  {/* Active indicator line */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer with quick stats */}
        <div className="relative border-t border-primary/10 px-5 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground/70">
              {completedSteps.length} of {steps.length} completed
            </span>
            <div className="flex gap-1">
              {steps.map(({ step }) => (
                <div
                  key={step}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-all duration-300',
                    isStepCompleted(step)
                      ? 'bg-emerald-500'
                      : currentStep === step
                        ? 'bg-primary scale-125'
                        : 'bg-muted-foreground/20'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
