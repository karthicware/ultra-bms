'use client';

/**
 * ComplianceCalendar Component
 * Story 7.3: Compliance and Inspection Tracking
 * AC #39: Calendar view component for compliance schedules and inspections
 *
 * Displays compliance schedules and inspections in a monthly calendar view
 * with color-coded status indicators and navigation to details.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, CalendarIcon, ClipboardCheck, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComplianceScheduleListItem, InspectionListItem, ComplianceScheduleStatus, InspectionStatus } from '@/types/compliance';

// =============================================================================
// TYPES
// =============================================================================

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'schedule' | 'inspection';
  status: ComplianceScheduleStatus | InspectionStatus;
  propertyName: string;
  category?: string;
}

interface ComplianceCalendarProps {
  schedules: ComplianceScheduleListItem[];
  inspections: InspectionListItem[];
  isLoading?: boolean;
  onMonthChange?: (date: Date) => void;
}

// =============================================================================
// STATUS COLORS
// =============================================================================

const scheduleStatusColors: Record<ComplianceScheduleStatus, string> = {
  UPCOMING: 'bg-blue-500',
  DUE: 'bg-yellow-500',
  OVERDUE: 'bg-red-500',
  COMPLETED: 'bg-green-500',
  EXEMPT: 'bg-gray-400',
};

const inspectionStatusColors: Record<InspectionStatus, string> = {
  SCHEDULED: 'bg-blue-500',
  IN_PROGRESS: 'bg-yellow-500',
  PASSED: 'bg-green-500',
  FAILED: 'bg-red-500',
  CANCELLED: 'bg-gray-400',
};

const scheduleStatusBadgeVariants: Record<ComplianceScheduleStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  UPCOMING: 'default',
  DUE: 'secondary',
  OVERDUE: 'destructive',
  COMPLETED: 'outline',
  EXEMPT: 'outline',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ComplianceCalendar({
  schedules,
  inspections,
  isLoading = false,
  onMonthChange,
}: ComplianceCalendarProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  // Convert schedules and inspections to calendar events
  const events = React.useMemo(() => {
    const eventMap = new Map<string, CalendarEvent[]>();

    // Add schedules
    schedules.forEach((schedule) => {
      const dateKey = schedule.dueDate.split('T')[0];
      const event: CalendarEvent = {
        id: schedule.id,
        date: schedule.dueDate,
        title: schedule.requirementName,
        type: 'schedule',
        status: schedule.status,
        propertyName: schedule.propertyName,
        category: schedule.category,
      };

      const existing = eventMap.get(dateKey) || [];
      eventMap.set(dateKey, [...existing, event]);
    });

    // Add inspections
    inspections.forEach((inspection) => {
      const dateKey = inspection.scheduledDate.split('T')[0];
      const event: CalendarEvent = {
        id: inspection.id,
        date: inspection.scheduledDate,
        title: inspection.requirementName,
        type: 'inspection',
        status: inspection.status,
        propertyName: inspection.propertyName,
      };

      const existing = eventMap.get(dateKey) || [];
      eventMap.set(dateKey, [...existing, event]);
    });

    return eventMap;
  }, [schedules, inspections]);

  // Get events for selected date
  const selectedDateEvents = React.useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toISOString().split('T')[0];
    return events.get(dateKey) || [];
  }, [selectedDate, events]);

  // Get dates with events for highlighting
  const datesWithEvents = React.useMemo(() => {
    const dates: Date[] = [];
    events.forEach((_, dateKey) => {
      dates.push(new Date(dateKey));
    });
    return dates;
  }, [events]);

  // Get dates with overdue schedules
  const overdueScheduleDates = React.useMemo(() => {
    return schedules
      .filter((s) => s.status === 'OVERDUE')
      .map((s) => new Date(s.dueDate.split('T')[0]));
  }, [schedules]);

  // Get dates with due schedules
  const dueScheduleDates = React.useMemo(() => {
    return schedules
      .filter((s) => s.status === 'DUE')
      .map((s) => new Date(s.dueDate.split('T')[0]));
  }, [schedules]);

  // Navigate to event details
  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'schedule') {
      router.push(`/property-manager/compliance/schedules/${event.id}`);
    } else {
      router.push(`/property-manager/compliance/inspections/${event.id}`);
    }
  };

  // Handle month navigation
  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  // Get status icon
  const getStatusIcon = (event: CalendarEvent) => {
    if (event.type === 'inspection') {
      return <ClipboardCheck className="h-4 w-4" />;
    }
    if (event.status === 'OVERDUE') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (event.status === 'COMPLETED') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <CalendarIcon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card data-testid="compliance-calendar-loading">
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading calendar...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="compliance-calendar">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Compliance Calendar
            </CardTitle>
            <CardDescription>
              View schedules and inspections by date
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              data-testid="calendar-prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-32 text-center">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              data-testid="calendar-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              modifiers={{
                hasEvent: datesWithEvents,
                overdue: overdueScheduleDates,
                due: dueScheduleDates,
              }}
              modifiersClassNames={{
                hasEvent: 'font-bold',
                overdue: 'bg-red-100 dark:bg-red-900/30 rounded-full',
                due: 'bg-yellow-100 dark:bg-yellow-900/30 rounded-full',
              }}
              className="rounded-md border"
              data-testid="calendar-view"
            />

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Due Soon</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Upcoming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Completed</span>
              </div>
            </div>
          </div>

          {/* Selected Date Events */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {selectedDate
                    ? selectedDate.toLocaleDateString('default', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Select a date'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80" data-testid="calendar-events-list">
                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No events on this date
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateEvents.map((event) => (
                        <button
                          key={`${event.type}-${event.id}`}
                          onClick={() => handleEventClick(event)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                          data-testid={`calendar-event-${event.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full mt-2',
                                event.type === 'schedule'
                                  ? scheduleStatusColors[event.status as ComplianceScheduleStatus]
                                  : inspectionStatusColors[event.status as InspectionStatus]
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(event)}
                                <span className="font-medium truncate">{event.title}</span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {event.propertyName}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  variant={
                                    event.type === 'schedule'
                                      ? scheduleStatusBadgeVariants[event.status as ComplianceScheduleStatus]
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {event.status.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {event.type === 'schedule' ? 'Schedule' : 'Inspection'}
                                </Badge>
                                {event.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {event.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ComplianceCalendar;
