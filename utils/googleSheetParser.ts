import { QuizData, Question, Choice, Job, OptionJobMapItem } from '../src/types';
import { SPREADSHEET_ID } from '../config/quiz';

type Row = Record<string, unknown>;

function getValueCaseInsensitive<T = unknown>(obj: Row, key: string): T | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    const keyToFind = key.toLowerCase();
    const foundKey = Object.keys(obj).find((k) => k.toLowerCase() === keyToFind);
    return foundKey ? (obj[foundKey] as T) : undefined;
}

function sheetUrl(sheetName: string): string {
    const timestamp = Date.now();
    return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&headers=1&t=${timestamp}`;
}

/** Fetch one sheet via the gviz endpoint and return one object per non-empty row. */
export async function fetchSheetData(sheetName: string): Promise<Row[]> {
    const res = await fetch(sheetUrl(sheetName));
    // gviz returns error details in the body on 4xx, so do not throw on !res.ok
    const text = await res.text();

    const jsonString = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/s)?.[1];
    if (!jsonString) {
        if (text.includes('access_denied')) {
            throw new Error(`Could not access Google Sheet "${sheetName}". Please make sure your spreadsheet is public by going to "File" > "Share" > "Publish to web" in Google Sheets.`);
        }
        if (text.toLowerCase().includes('invalid sheet name')) {
            throw new Error(`Could not find a sheet named "${sheetName}". Please check for typos or case-sensitivity (e.g., "Options" vs "options").`);
        }
        throw new Error(`Invalid response for sheet "${sheetName}". Please check if the sheet name is correct and the spreadsheet is published to the web.`);
    }

    const data = JSON.parse(jsonString);

    if (data.status === 'error') {
        const errorMessage: string = data.errors?.[0]?.detailed_message || `An error occurred while loading sheet "${sheetName}".`;
        if (errorMessage.toLowerCase().includes('invalid sheet name')) {
            throw new Error(`Could not find a sheet named "${sheetName}". Please check for typos or case-sensitivity (e.g., "Options" vs "options").`);
        }
        throw new Error(errorMessage);
    }

    if (!data.table || !data.table.cols || data.table.cols.length === 0 || !data.table.rows) {
        return [];
    }

    const headers: string[] = data.table.cols.map((col: { label?: string }) => String(col.label || '').trim());
    const rows: Row[] = (data.table.rows || []).map((row: { c?: ({ v?: unknown } | null)[] }) => {
        const rowData: Row = {};
        (row.c || []).forEach((cell, index) => {
            const header = headers[index];
            if (header) {
                rowData[header] = cell?.v ?? null;
            }
        });
        return rowData;
    });
    return rows.filter((r) => Object.values(r).some((val) => val !== null && val !== ''));
}

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

/** Fetch all four sheets and assemble the quiz. Throws readable errors for teacher-fixable problems. */
export async function getQuizData(): Promise<QuizData> {
    const [rawQuestions, rawOptions, rawJobs, rawOptionJobMap] = await Promise.all([
        fetchSheetData('Questions'),
        fetchSheetData('Options'),
        fetchSheetData('Jobs'),
        fetchSheetData('OptionJobMap'),
    ]);

    const sheetIdError = (sheetName: string) =>
        `Failed to load any data from the '${sheetName}' sheet in the spreadsheet with ID: '${SPREADSHEET_ID}'. Please verify: 1. The sheet is named '${sheetName}' (case matters). 2. The sheet contains data.`;

    if (rawQuestions.length === 0) throw new Error(sheetIdError('Questions'));
    if (rawOptions.length === 0) throw new Error(sheetIdError('Options'));

    const jobs: Job[] = rawJobs
        .map((j) => ({
            id: str(getValueCaseInsensitive(j, 'job_id')).trim(),
            name: str(getValueCaseInsensitive(j, 'job_name')),
        }))
        .filter((j) => j.id);

    const optionJobMap: OptionJobMapItem[] = rawOptionJobMap
        .map((m) => ({
            option_id: str(getValueCaseInsensitive(m, 'option_id')).trim(),
            job_id: str(getValueCaseInsensitive(m, 'job_id')).trim(),
        }))
        .filter((m) => m.option_id && m.job_id);

    const optionsByQuestion = rawOptions.reduce<Record<string, Choice[]>>((acc, opt) => {
        const qId = str(getValueCaseInsensitive(opt, 'question_id')).trim();
        const optionId = str(getValueCaseInsensitive(opt, 'option_id')).trim();
        if (qId && optionId) {
            if (!acc[qId]) acc[qId] = [];
            const choiceText =
                getValueCaseInsensitive<string>(opt, 'option_text') ??
                getValueCaseInsensitive<string>(opt, 'text') ??
                '';
            const imageUrl = getValueCaseInsensitive<string | null>(opt, 'image_url');
            acc[qId].push({
                id: optionId,
                text: str(choiceText),
                imageUrl: imageUrl ? String(imageUrl) : undefined,
            });
        }
        return acc;
    }, {});

    const questions: Question[] = rawQuestions
        .slice()
        .sort((a, b) => Number(getValueCaseInsensitive(a, 'order')) - Number(getValueCaseInsensitive(b, 'order')))
        .map((q) => {
            const qId = str(getValueCaseInsensitive(q, 'question_id')).trim();
            return { id: qId, text: str(getValueCaseInsensitive(q, 'text')), choices: optionsByQuestion[qId] || [] };
        })
        .filter((q) => q.id)
        .filter((q) => q.choices.length > 0);

    if (questions.length === 0) {
        const questionIds = [...new Set(rawQuestions.map((q) => str(getValueCaseInsensitive(q, 'question_id')).trim()))].filter(Boolean);
        const optionQuestionIds = [...new Set(rawOptions.map((o) => str(getValueCaseInsensitive(o, 'question_id')).trim()))].filter(Boolean);
        throw new Error(
            `Failed to link questions to answers. IDs in 'Questions': [${questionIds.join(', ')}]. ` +
            `Linking IDs in 'Options': [${optionQuestionIds.join(', ')}]. ` +
            `At least one ID must match exactly, and the 'Options' sheet needs a 'question_id' column.`,
        );
    }

    return { questions, jobs, optionJobMap };
}
