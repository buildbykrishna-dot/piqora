import React from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  ExternalLink, 
  ArrowRight, 
  CheckCircle2, 
  Info,
  Sparkles,
  Layers
} from 'lucide-react';
import { downloadCsvTemplate, downloadExcelTemplate, TEMPLATE_SAMPLE_DATA } from '../lib/spreadsheetHelper';
import { useToast } from '../context/ToastContext';

interface TemplatesPageProps {
  onNavigate: (path: string) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ onNavigate }) => {
  const toast = useToast();

  const handleDownloadCsv = () => {
    downloadCsvTemplate();
    toast.success('Downloaded piqora_questions_template.csv');
  };

  const handleDownloadExcel = () => {
    downloadExcelTemplate();
    toast.success('Downloaded piqora_questions_template.xlsx');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2 border border-emerald-200">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Standardized Format</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Download Question Templates
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Prepare large question sets in Microsoft Excel or Google Sheets. Import dozens of questions into Piqora in a single click.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Template</span>
          </button>
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel (XLSX)</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Workflow Guide */}
      <div className="bg-gradient-to-br from-violet-50/50 via-white to-slate-50 p-6 rounded-2xl border border-violet-100 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-200 shrink-0">
            <ExternalLink className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">How to use with Google Sheets</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              1. Download either the <strong>CSV</strong> or <strong>Excel</strong> template above.<br />
              2. Open <strong>Google Sheets</strong> (sheets.google.com) and click <em>File → Import → Upload</em> to open the template.<br />
              3. Fill in your college lecture questions, options A–D, and correct answer (A, B, C, or D).<br />
              4. When ready, click <em>File → Download → Comma Separated Values (.csv)</em> and upload it to Piqora.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('/dashboard/import')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <span>Go to Question Import Wizard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Column Specifications & Sample Rows Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Template Columns & Sample Data</h4>
            <p className="text-xs text-slate-500">Each row represents one question in your quiz</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            9 Required & Optional Columns
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Question</th>
                <th className="px-3 py-3">Option A</th>
                <th className="px-3 py-3">Option B</th>
                <th className="px-3 py-3">Option C</th>
                <th className="px-3 py-3">Option D</th>
                <th className="px-3 py-3 text-center">Correct</th>
                <th className="px-3 py-3 text-center">Time (s)</th>
                <th className="px-3 py-3 text-center">Points</th>
                <th className="px-4 py-3">Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {TEMPLATE_SAMPLE_DATA.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs">{row.Question}</td>
                  <td className="px-3 py-3 text-slate-600">{row['Option A']}</td>
                  <td className="px-3 py-3 text-slate-600">{row['Option B']}</td>
                  <td className="px-3 py-3 text-slate-600">{row['Option C']}</td>
                  <td className="px-3 py-3 text-slate-600">{row['Option D']}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full font-bold bg-violet-100 text-violet-800">
                      {row['Correct Answer']}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-slate-500">{row['Time Limit']}s</td>
                  <td className="px-3 py-3 text-center font-mono text-slate-500">{row.Points}</td>
                  <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">{row.Explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-violet-600" />
            <span>Time Limit defaults to 20s and Points default to 1000 if left blank.</span>
          </div>
          <button
            onClick={handleDownloadCsv}
            className="text-violet-700 font-bold hover:underline"
          >
            Download piqora_questions_template.csv →
          </button>
        </div>
      </div>
    </div>
  );
};
