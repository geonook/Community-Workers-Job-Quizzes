import React from 'react';
import { ScoringResults } from '../src/types';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    studentClass: string;
    results: ScoringResults;
    geminiDescription: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
    isOpen,
    onClose,
    studentName,
    studentClass,
    results,
    geminiDescription
}) => {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    const topJobText = results.topJobs.length > 0
        ? results.topJobs.map(j => j.job_name).join(' / ')
        : 'N/A';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 printable-area print:bg-white print:items-start print:p-0 p-4">
            <div className="bg-white text-gray-800 p-6 md:p-10 rounded-2xl shadow-2xl max-w-xl md:max-w-3xl w-full max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-full print:h-full print:rounded-none">
                <div id="printable-report">
                    {/* Report Header */}
                    <div className="text-center mb-6 md:mb-8">
                        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Career Explorer Report</h2>
                        <div className="w-20 h-1 bg-indigo-600 mx-auto rounded-full"></div>
                    </div>

                    {/* Student Info */}
                    <div className="bg-gray-50 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:text-base">
                            <div>
                                <p className="text-gray-500 text-xs md:text-sm mb-1">Student Name</p>
                                <p className="font-semibold text-gray-900">{studentName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs md:text-sm mb-1">Class</p>
                                <p className="font-semibold text-gray-900">{studentClass}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-gray-500 text-xs md:text-sm mb-1">Report Date</p>
                                <p className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 md:space-y-8 text-sm md:text-base">
                        {/* Top Job Suggestion */}
                        <div>
                            <h3 className="font-bold text-gray-900 text-base md:text-xl mb-3 flex items-center gap-2">
                                <span className="text-2xl">🎯</span>
                                Top Job Suggestion(s)
                            </h3>
                            <div className="p-4 md:p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                                <p className="text-base md:text-lg font-semibold text-indigo-700">{topJobText}</p>
                            </div>
                        </div>

                        {/* Full Score Report */}
                        <div>
                            <h3 className="font-bold text-gray-900 text-base md:text-xl mb-3 flex items-center gap-2">
                                <span className="text-2xl">📊</span>
                                Full Score Report
                            </h3>
                            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3 md:p-4 font-semibold text-gray-700 text-sm md:text-base">Job / Career</th>
                                            <th className="p-3 md:p-4 font-semibold text-gray-700 text-sm md:text-base text-right">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.sortedScores.map((scoreItem, index) => (
                                            <tr
                                                key={scoreItem.job_id}
                                                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                            >
                                                <td className="p-3 md:p-4 text-gray-800 border-t border-gray-200">
                                                    {scoreItem.job_name}
                                                </td>
                                                <td className="p-3 md:p-4 text-gray-800 border-t border-gray-200 text-right font-semibold">
                                                    {scoreItem.score}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Personalized Insight */}
                        <div>
                            <h3 className="font-bold text-gray-900 text-base md:text-xl mb-3 flex items-center gap-2">
                                <span className="text-2xl">💡</span>
                                Personalized Insight
                            </h3>
                            <div className="p-4 md:p-5 bg-gray-50 rounded-xl border-l-4 border-indigo-500">
                                <p className="text-gray-700 leading-relaxed">{geminiDescription}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 mt-6 md:mt-8 print:hidden">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all transform hover:scale-105 text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-gray-300"
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all transform hover:scale-105 text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-indigo-300"
                    >
                        Print Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
