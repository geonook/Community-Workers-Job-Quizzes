export const JOB_KEYS = [
  'musician',
  'police',
  'hairdresser',
  'firefighter',
  'zookeeper',
  'farmer',
  'pilot',
  'baker',
  'artist',
  'dancer',
  'doctor',
] as const;

export type JobKey = typeof JOB_KEYS[number];

export interface Job {
  key: JobKey;
  /** Full sentence shown on the selection card (vocab reinforcement). */
  sentence: string;
  /** Short button label shown on primary CTA. */
  cta: string;
  /** Display name sent to backend in `recommendedJobs`. */
  displayName: string;
  /** Lucide icon component name. */
  icon: string;
}

export const JOBS: readonly Job[] = [
  { key: 'musician',    sentence: 'I want to be a musician and play music.',           cta: 'I want to be a musician!',    displayName: 'Musician',       icon: 'Music' },
  { key: 'police',      sentence: 'I want to be a police officer and help people.',    cta: 'I want to be a police!',      displayName: 'Police Officer', icon: 'Shield' },
  { key: 'hairdresser', sentence: 'I want to be a hairdresser and cut hair.',          cta: 'I want to be a hairdresser!', displayName: 'Hairdresser',    icon: 'Scissors' },
  { key: 'firefighter', sentence: 'I want to be a firefighter and put out fires.',     cta: 'I want to be a firefighter!', displayName: 'Firefighter',    icon: 'Flame' },
  { key: 'zookeeper',   sentence: 'I want to be a zookeeper and take care of animals.',cta: 'I want to be a zookeeper!',   displayName: 'Zookeeper',      icon: 'PawPrint' },
  { key: 'farmer',      sentence: 'I want to be a farmer and grow plants.',            cta: 'I want to be a farmer!',      displayName: 'Farmer',         icon: 'Sprout' },
  { key: 'pilot',       sentence: 'I want to be a pilot and fly airplanes.',           cta: 'I want to be a pilot!',       displayName: 'Pilot',          icon: 'Plane' },
  { key: 'baker',       sentence: 'I want to be a baker and bake bread.',              cta: 'I want to be a baker!',       displayName: 'Baker',          icon: 'CookingPot' },
  { key: 'artist',      sentence: 'I want to be an artist and paint pictures.',        cta: 'I want to be an artist!',     displayName: 'Artist',         icon: 'Palette' },
  { key: 'dancer',      sentence: 'I want to be a dancer and dance on stage.',         cta: 'I want to be a dancer!',      displayName: 'Dancer',         icon: 'Sparkles' },
  { key: 'doctor',      sentence: 'I want to be a doctor and help sick people.',       cta: 'I want to be a doctor!',      displayName: 'Doctor',         icon: 'Stethoscope' },
] as const;

export function getJobByKey(key: JobKey | string): Job | undefined {
  return JOBS.find((j) => j.key === key);
}
