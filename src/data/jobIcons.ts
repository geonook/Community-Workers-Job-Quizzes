/**
 * Presentation-only: job_id (from the Jobs sheet) → lucide-react icon export name.
 * Unknown ids get DEFAULT_JOB_ICON so a new sheet row never breaks the UI.
 */
export const DEFAULT_JOB_ICON = 'Briefcase';

export const JOB_ICONS: Record<string, string> = {
    t: 'GraduationCap',   // Teacher
    l: 'BookOpen',        // Librarian
    do: 'Stethoscope',    // Doctor
    de: 'Smile',          // Dentist
    f: 'Flame',           // Fire Fighter
    b: 'Hammer',          // Builder
    p: 'Shield',          // Police Officer
    mc: 'Mail',           // Mail Carrier
    dd: 'Bike',           // Food Delivery Driver
    a: 'Ambulance',       // Ambulance Driver
    n: 'HeartPulse',      // Nurse
    me: 'Wrench',         // Mechanic
    r: 'Trash2',          // Refuse Collector
};

export function getJobIconName(jobId: string): string {
    return JOB_ICONS[jobId] ?? DEFAULT_JOB_ICON;
}
