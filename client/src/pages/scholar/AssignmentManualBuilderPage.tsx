import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assignmentService, Assignment, Question } from '../../services/assignmentService';

const blankQuestion = (): Question => ({ type: 'mcq', prompt: '', options: ['', '', '', ''], answer: 0 });

const AssignmentManualBuilderPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'quiz' | 'essay' | 'short-answer' | 'multi-part'>('quiz');
  const [questions, setQuestions] = useState<Question[]>([blankQuestion()]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!isEdit || !id) return;
      const res = await assignmentService.get(id);
      const a = res.assignment;
      setTitle(a.title || '');
      setDescription(a.description || '');
      setType(a.type);
      setQuestions((a.questions || []) as any);
    }
    load();
  }, [id, isEdit]);

  const updateQuestion = (idx: number, q: Partial<Question>) => {
    setQuestions(prev => prev.map((qq, i) => i === idx ? { ...qq, ...q } : qq));
  };

  const addQuestion = () => setQuestions(prev => [...prev, blankQuestion()]);
  const removeQuestion = (idx: number) => setQuestions(prev => prev.filter((_, i) => i !== idx));

  const onTypeChange = (idx: number, t: Question['type']) => {
    const base: Question = { type: t, prompt: '', options: [], answer: undefined } as any;
    if (t === 'mcq') base.options = ['', '', '', ''], base.answer = 0;
  if (t === 'true-false') base.options = ['True', 'False'], base.answer = 0;
    updateQuestion(idx, base);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: Partial<Assignment> = {
        title,
        description,
        type,
        questions,
      } as any;
      if (isEdit && id) {
        await assignmentService.update(id, payload as any);
        navigate('/scholar/assignments');
      } else {
        await assignmentService.create(payload as any);
        navigate('/scholar/assignments');
      }
    } catch {
      alert('Failed to save assignment');
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-4">{isEdit ? 'Edit Assignment' : 'Create Assignment Manually'}</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900">
              <option value="quiz">Quiz</option>
              <option value="short-answer">Short-answer set</option>
              <option value="essay">Essay set</option>
              <option value="multi-part">Mixed</option>
            </select>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={idx} className="rounded border p-4 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Question {idx+1}</div>
                  <button onClick={() => removeQuestion(idx)} className="text-sm text-red-600">Remove</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select value={q.type} onChange={e => onTypeChange(idx, e.target.value as any)} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900">
                      <option value="mcq">MCQ</option>
                      <option value="true-false">True/False</option>
                      <option value="short-answer">Q/A</option>
                      <option value="essay">Essay</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium mb-1">Prompt</label>
                    <input value={q.prompt} onChange={e => updateQuestion(idx, { prompt: e.target.value })} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
                  </div>
                </div>

                {(q.type === 'mcq' || q.type === 'true-false') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {(q.options || []).map((opt, i) => (
                      <div key={i}>
                        <label className="block text-xs mb-1">Option {i+1}</label>
                        <input value={opt} onChange={e => {
                          const options = [...(q.options || [])];
                          options[i] = e.target.value;
                          updateQuestion(idx, { options });
                        }} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
                      </div>
                    ))}
                    <div className="md:col-span-2">
                      <label className="block text-xs mb-1">Correct Answer</label>
                      <select value={q.answer as any} onChange={e => updateQuestion(idx, { answer: parseInt(e.target.value) })} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900">
                        {(q.options || []).map((_, i) => (<option key={i} value={i}>{i+1}</option>))}
                      </select>
                    </div>
                  </div>
                )}

                {q.type === 'short-answer' && (
                  <div className="mt-3">
                    <label className="block text-xs mb-1">Expected Answer (optional)</label>
                    <input value={(q.answer as any) || ''} onChange={e => updateQuestion(idx, { answer: e.target.value })} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
                  </div>
                )}

                {q.type === 'essay' && (
                  <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">Essay will be graded by rubric or manual override.</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button onClick={addQuestion} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">Add Question</button>
            <button onClick={save} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => navigate('/scholar/assignments')} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">Cancel</button>
          </div>
        </div>
    </div>
  );
};

export default AssignmentManualBuilderPage;
