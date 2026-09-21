/** Used when Gemini is unavailable. Pure, no imports, so it is trivially testable. */
export function buildFallbackDescription(
    studentName: string | undefined,
    topJobs: { job_name: string }[] | undefined,
): string {
    const job = topJobs?.[0]?.job_name;
    if (!job) {
        return 'You could be great at many different jobs! Keep exploring what you enjoy.';
    }
    const who = studentName?.trim() ? `${studentName.trim()}, you` : 'You';
    return `${job} — a great choice! ${who} can grow up to help people every day.`;
}
