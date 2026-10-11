import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ArrowRight, 
  ArrowLeft,
  Trash2,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ImportedQuestionRow, Question, Quiz, QuestionSet } from '../types';
import { 
  parseAndValidateRawData, 
  convertImportedRowsToQuestions, 
  downloadCsvTemplate, 
  downloadExcelTemplate 
} from '../lib/spreadsheetHelper';
import { saveQuiz, saveQuestionSet, getTeacherQuestionSets } from '../lib/dbService';
import { getSafeFirestoreErrorMessage } from '../lib/firebase';

interface ImportPageProps {
  onNavigate: (path: string) => void;
}

export const ImportPage: React.FC<ImportPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const toast = useToast();
  const teacherId = user?.uid || 'demo_teacher';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ImportedQuestionRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Destination Options
  const [destination, setDestination] = useState<'new_quiz' | 'question_set'>('new_quiz');
  const [newQuizTitle, setNewQuizTitle] = useState('Imported Lecture Questions');
  const [newQuizSubject, setNewQuizSubject] = useState('Computer Science');
  const [newQuizCourse, setNewQuizCourse] = useState('');
  
  // Existing Question Sets for pool destination
  const [existingSets, setExistingSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState('');
  const [appendMode, setAppendMode] = useState<'append' | 'replace'>('append');

  // Load question sets if user switches to Question Set destination
  React.useEffect(() => {
    getTeacherQuestionSets(teacherId).then((sets) => {
      setExistingSets(sets);
      if (sets.length > 0) setSelectedSetId(sets[0].id);
    });
  }, [teacherId]);

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
      toast.error('Please upload a valid CSV or Excel (.xlsx, .xls) file.');
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validated = parseAndValidateRawData(results.data as Record<string, any>[]);
          setParsedRows(validated);
          setIsProcessing(false);
          toast.success(`Parsed ${validated.length} rows from CSV`);
        },
        error: (err) => {
          toast.error('Failed to parse CSV: ' + err.message);
          setIsProcessing(false);
        }
      });
    } else {
      // XLSX
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
          const validated = parseAndValidateRawData(json);
          setParsedRows(validated);
          toast.success(`Parsed ${validated.length} rows from Excel`);
        } catch (err) {
          toast.error('Failed to parse Excel spreadsheet');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleConfirmImport = async () => {
    if (isProcessing) return; // Prevent concurrent submissions
    if (validRows.length === 0) {
      toast.error('No valid questions to import.');
      return;
    }

    const convertedQuestions = convertImportedRowsToQuestions(validRows);
    setIsProcessing(true);

    try {
      const ownerUid = user?.uid || teacherId;
      if (destination === 'new_quiz') {
        const newQuizId = `quiz_${Date.now()}`;
        const newQuiz: Quiz = {
          id: newQuizId,
          ownerId: ownerUid,
          teacherId: ownerUid,
          title: newQuizTitle.trim() || 'Imported Quiz',
          description: `Imported from ${fileName || 'spreadsheet'} on ${new Date().toLocaleDateString()}`,
          subject: newQuizSubject.trim() || 'General',
          courseLabel: newQuizCourse.trim() || '',
          coverColor: '#059669', // Emerald
          isPublished: true,
          isPublic: true,
          questionsCount: convertedQuestions.length,
          questions: convertedQuestions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await saveQuiz(newQuiz);
        toast.success(
          invalidRows.length > 0
            ? `Successfully created new quiz with ${convertedQuestions.length} questions! (${invalidRows.length} invalid rows were skipped)`
            : `Successfully created new quiz with ${convertedQuestions.length} questions!`
        );
        onNavigate(`/dashboard/quizzes/${newQuizId}`);
      } else {
        // Into Question Set
        let targetSet: QuestionSet;
        if (!selectedSetId || selectedSetId === 'new_set') {
          // Create new set
          targetSet = {
            id: `qset_${Date.now()}`,
            ownerId: ownerUid,
            teacherId: ownerUid,
            title: newQuizTitle.trim() || 'Imported Question Pool',
            description: `Imported from ${fileName || 'spreadsheet'}`,
            subject: newQuizSubject.trim() || 'General',
            questionCount: convertedQuestions.length,
            questions: convertedQuestions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } else {
          const existing = existingSets.find((s) => s.id === selectedSetId);
          if (!existing) {
            targetSet = {
              id: selectedSetId,
              ownerId: ownerUid,
              teacherId: ownerUid,
              title: newQuizTitle.trim() || 'Imported Question Pool',
              description: `Imported from ${fileName || 'spreadsheet'}`,
              subject: newQuizSubject.trim() || 'General',
              questionCount: convertedQuestions.length,
              questions: convertedQuestions,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          } else {
            const finalQuestions = appendMode === 'append' 
              ? [...(existing.questions || []), ...convertedQuestions]
              : convertedQuestions;

            targetSet = {
              ...existing,
              ownerId: existing.ownerId || ownerUid,
              teacherId: existing.teacherId || ownerUid,
              questions: finalQuestions,
              questionCount: finalQuestions.length,
              updatedAt: new Date().toISOString()
            };
          }
        }

        await saveQuestionSet(targetSet);
        toast.success(
          invalidRows.length > 0
            ? `Saved ${convertedQuestions.length} questions to Question Bank! (${invalidRows.length} invalid rows were skipped)`
            : `Saved ${convertedQuestions.length} questions to Question Bank!`
        );
        onNavigate('/dashboard/question-sets');
      }
    } catch (err: any) {
      console.error('Error saving imported questions:', err);
      const safeMsg = getSafeFirestoreErrorMessage(err);
      toast.error(safeMsg || 'Error saving imported questions. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">Spreadsheet Wizard</span>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              Import Questions from CSV / Excel
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadCsvTemplate}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Template</span>
          </button>
          <button
            onClick={downloadExcelTemplate}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel Template</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      {parsedRows.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="bg-white rounded-3xl border-2 border-dashed border-slate-300 hover:border-violet-500 p-12 text-center transition-all cursor-pointer shadow-xs group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            accept=".csv, .xlsx, .xls"
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 group-hover:bg-violet-100 transition-all">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Drag & drop your question spreadsheet here
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Supports CSV and Microsoft Excel (.xlsx, .xls) files. Files are parsed instantly in your browser with automated validation.
          </p>

          <button
            type="button"
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Select File from Computer</span>
          </button>
        </div>
      ) : (
        /* Preview & Validation Results */
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{fileName}</p>
                <div className="flex items-center gap-3 text-xs mt-0.5">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {validRows.length} Valid Questions
                  </span>
                  {invalidRows.length > 0 && (
                    <span className="flex items-center gap-1 text-rose-600 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {invalidRows.length} Invalid Rows (skipped)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setParsedRows([]);
                setFileName('');
              }}
              className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Choose different file</span>
            </button>
          </div>

          {/* Destination Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Import Destination</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  destination === 'new_quiz' 
                    ? 'border-violet-600 bg-violet-50/40 ring-1 ring-violet-500' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="destination"
                  checked={destination === 'new_quiz'}
                  onChange={() => setDestination('new_quiz')}
                  className="w-4 h-4 text-violet-600"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Create a New Quiz</p>
                  <p className="text-[11px] text-slate-500">Ready to host live in lecture immediately</p>
                </div>
              </label>

              <label 
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  destination === 'question_set' 
                    ? 'border-violet-600 bg-violet-50/40 ring-1 ring-violet-500' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="destination"
                  checked={destination === 'question_set'}
                  onChange={() => setDestination('question_set')}
                  className="w-4 h-4 text-violet-600"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Save to Question Bank</p>
                  <p className="text-[11px] text-slate-500">Reusable pool across future quizzes</p>
                </div>
              </label>
            </div>

            {destination === 'new_quiz' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Quiz Title *</label>
                  <input
                    type="text"
                    value={newQuizTitle}
                    onChange={(e) => setNewQuizTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Subject / Discipline *</label>
                  <input
                    type="text"
                    value={newQuizSubject}
                    onChange={(e) => setNewQuizSubject(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Course Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. CS201"
                    value={newQuizCourse}
                    onChange={(e) => setNewQuizCourse(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Question Set</label>
                  <select
                    value={selectedSetId}
                    onChange={(e) => setSelectedSetId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    {existingSets.map((s) => (
                      <option key={s.id} value={s.id}>{s.title} ({s.questionCount || 0} questions)</option>
                    ))}
                    <option value="new_set">+ Create New Question Set Pool</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Conflict Mode</label>
                  <select
                    value={appendMode}
                    onChange={(e) => setAppendMode(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="append">Append to existing questions</option>
                    <option value="replace">Replace all existing questions in set</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Parsed Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">Spreadsheet Rows Preview</span>
              <span className="text-[11px] text-slate-500">
                Showing {parsedRows.length} total rows
              </span>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5">Row</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Question Prompt</th>
                    <th className="px-3 py-2.5">Option A</th>
                    <th className="px-3 py-2.5">Option B</th>
                    <th className="px-3 py-2.5">Option C</th>
                    <th className="px-3 py-2.5">Option D</th>
                    <th className="px-2 py-2.5 text-center">Key</th>
                    <th className="px-2 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {parsedRows.map((row) => (
                    <tr 
                      key={row.rowNumber}
                      className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}
                    >
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{row.rowNumber}</td>
                      <td className="px-3 py-2">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span 
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full"
                          >
                            <AlertCircle className="w-3 h-3" /> Error
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 max-w-xs text-slate-900">
                        <div className="truncate font-semibold">{row.text || '(empty prompt)'}</div>
                        {!row.isValid && row.errors.length > 0 && (
                          <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                            {row.errors.join(' • ')}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 max-w-xs truncate text-slate-600">{row.optionA || '-'}</td>
                      <td className="px-3 py-2 max-w-xs truncate text-slate-600">{row.optionB || '-'}</td>
                      <td className="px-3 py-2 max-w-xs truncate text-slate-600">{row.optionC || '-'}</td>
                      <td className="px-3 py-2 max-w-xs truncate text-slate-600">{row.optionD || '-'}</td>
                      <td className="px-2 py-2 text-center font-bold text-violet-700">{row.correctAnswer || '-'}</td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => setParsedRows(prev => prev.filter(r => r.rowNumber !== row.rowNumber))}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Exclude this row from import"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                {validRows.length} questions will be imported into {destination === 'new_quiz' ? 'new quiz' : 'question bank'}.
              </span>
              <button
                onClick={handleConfirmImport}
                disabled={isProcessing || validRows.length === 0}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isProcessing ? 'Importing...' : `Confirm & Save ${validRows.length} Questions`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
