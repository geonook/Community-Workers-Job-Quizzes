import React from 'react';
import * as LucideIcons from 'lucide-react';
import ProcessingStatus from './ProcessingStatus';
import { TopJob } from '../src/types';
import { getJobIconName } from '../src/data/jobIcons';

export interface ResultsScreenProps {
    studentName: string;
    topJobs: TopJob[];
    description: string;
    recordId: string;
    onRestart: () => void;
}

const iconFor = (jobId: string): React.ComponentType<any> => {
    const name = getJobIconName(jobId);
    return (LucideIcons as Record<string, React.ComponentType<any>>)[name] ?? LucideIcons.Briefcase;
};

const ResultsScreen: React.FC<ResultsScreenProps> = ({
    studentName,
    topJobs,
    description,
    recordId,
    onRestart,
}) => {
    const jobNames = topJobs.map((j) => j.job_name).join(' or ');
    const heading = jobNames
        ? `${studentName}, you'd be a great ${jobNames}!`
        : `${studentName}, you'd be great at many jobs!`;

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex flex-col items-center px-4 py-6">
            <div className="w-full max-w-md md:max-w-2xl space-y-6">
                <header className="bg-clay-surface rounded-clay shadow-clay p-6 md:p-8 text-center">
                    <h1 className="font-heading font-bold text-clay-ink text-2xl md:text-3xl leading-snug">
                        {heading}
                    </h1>
                </header>

                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Recommended jobs">
                    {topJobs.map((job) => {
                        const Icon = iconFor(job.job_id);
                        return (
                            <div
                                key={job.job_id}
                                data-testid="job-card"
                                className="bg-clay-surface rounded-clay shadow-clay p-6 flex flex-col items-center gap-3"
                            >
                                <Icon size={64} strokeWidth={2.5} className="text-clay-primary" aria-hidden />
                                <p className="font-heading font-bold text-clay-ink text-xl text-center">{job.job_name}</p>
                            </div>
                        );
                    })}
                </section>

                <section className="bg-clay-surface rounded-clay shadow-clay p-6" aria-label="About this job">
                    <p className="font-body text-clay-ink text-base md:text-lg leading-relaxed">{description}</p>
                </section>

                <ProcessingStatus recordId={recordId} onRestart={onRestart} />

                <div className="pb-8">
                    <button
                        type="button"
                        onClick={onRestart}
                        className="clay-press-fx w-full inline-flex items-center justify-center gap-3 rounded-full bg-clay-primary text-white font-heading font-bold text-lg py-5 shadow-clay hover:bg-clay-primary-press"
                    >
                        <LucideIcons.RotateCcw size={24} strokeWidth={2.5} aria-hidden />
                        Next student
                    </button>
                </div>
            </div>
        </main>
    );
};

export default ResultsScreen;
