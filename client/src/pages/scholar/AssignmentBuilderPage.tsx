import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentService, Assignment, Question } from '../../services/assignmentService';

const emptyQ: Question = { type: 'mcq', prompt: '', options: ['', '', '', ''], answer: 0 } as any;

const AssignmentBuilderPage: React.FC = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [newQ, setNewQ] = useState<Question>({ ...emptyQ });
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!id) return;
      const res = await assignmentService.get(id);
      setAssignment(res.assignment);
      setLoading(false);
    }
    load();
  }, [id]);

  const addQuestion = async () => {
    if (!id) return;
    if (!newQ.prompt.trim()) return alert('Prompt required');
    await assignmentService.addQuestion(id, newQ);
    setNewQ({ ...emptyQ });
    const res = await assignmentService.get(id);
    setAssignment(res.assignment);
  };

  const updateQuestion = async (qid: string, q: Partial<Question>) => {
    if (!id) return;
    await assignmentService.updateQuestion(id, qid, q);
    const res = await assignmentService.get(id);
    setAssignment(res.assignment);
  };

  const deleteQuestion = async (qid: string) => {
    if (!id) return;
    await assignmentService.deleteQuestion(id, qid);
    const res = await assignmentService.get(id);
    setAssignment(res.assignment);
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!assignment) return <div className="p-6">Assignment not found.</div>;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">Edit Assignment</h1>
        <button onClick={() => navigate('/scholar/assignments')} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700">Back</button>
      </div>
      <div className="rounded border p-4 mb-6 bg-white dark:bg-gray-900">
        <div className="font-semibold mb-2">Add Question</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={newQ.type} onChange={e => setNewQ({ ...newQ, type: e.target.value as any })} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900">
              <option value="mcq">MCQ</option>
              <option value="short-answer">Short Answer</option>
              <option value="true-false">True/False</option>
              <option value="essay">Essay</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prompt</label>
            <input value={newQ.prompt} onChange={e => setNewQ({ ...newQ, prompt: e.target.value })} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
          </div>
        </div>
        {newQ.type === 'mcq' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {(newQ.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="newq_correct" checked={newQ.answer === i} onChange={() => setNewQ({ ...newQ, answer: i })} />
                <input value={opt} onChange={e => {
                  const options = [...(newQ.options || [])];
                  options[i] = e.target.value;
                  setNewQ({ ...newQ, options });
                }} className="flex-1 border rounded px-3 py-2 bg-white dark:bg-gray-900" />
              </div>
            ))}
          </div>
        )}
        {newQ.type === 'true-false' && (
          <div className="flex items-center gap-6 mt-3">
            <label className="flex items-center gap-2"><input type="radio" name="tf" checked={newQ.answer === true} onChange={() => setNewQ({ ...newQ, answer: true })} /> True</label>
            <label className="flex items-center gap-2"><input type="radio" name="tf" checked={newQ.answer === false} onChange={() => setNewQ({ ...newQ, answer: false })} /> False</label>
          </div>
        )}
        {newQ.type === 'short-answer' && (
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">Correct Answer (optional)</label>
            <input value={newQ.answer || ''} onChange={e => setNewQ({ ...newQ, answer: e.target.value })} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
          </div>
        )}
        <div className="mt-4">
          <button onClick={addQuestion} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Add</button>
        </div>
      </div>

      <div className="space-y-3">
        {(assignment.questions || []).map(q => (
          <div key={q._id} className="rounded border p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{q.type.toUpperCase()}</div>
              <button onClick={() => deleteQuestion(q._id!)} className="px-3 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">Prompt</label>
              <input defaultValue={q.prompt} onBlur={e => updateQuestion(q._id!, { prompt: e.target.value })} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
            </div>
            {q.type === 'mcq' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {(q.options || []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name={`q_${q._id}_correct`} defaultChecked={q.answer === i} onChange={() => updateQuestion(q._id!, { answer: i })} />
                    <input defaultValue={opt} onBlur={e => {
                      const options = [...(q.options || [])];
                      options[i] = e.target.value;
                      updateQuestion(q._id!, { options });
                    }} className="flex-1 border rounded px-3 py-2 bg-white dark:bg-gray-900" />
                  </div>
                ))}
              </div>
            )}
            {q.type === 'true-false' && (
              <div className="flex items-center gap-6 mt-3">
                <label className="flex items-center gap-2"><input type="radio" name={`tf_${q._id}`} defaultChecked={q.answer === true} onChange={() => updateQuestion(q._id!, { answer: true })} /> True</label>
                <label className="flex items-center gap-2"><input type="radio" name={`tf_${q._id}`} defaultChecked={q.answer === false} onChange={() => updateQuestion(q._id!, { answer: false })} /> False</label>
              </div>
            )}
            {q.type === 'short-answer' && (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">Correct Answer (optional)</label>
                <input defaultValue={q.answer || ''} onBlur={e => updateQuestion(q._id!, { answer: e.target.value })} className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignmentBuilderPage;
