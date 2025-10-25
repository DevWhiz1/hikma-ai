#!/usr/bin/env python
import sys, json, os, time, importlib

USE_GEMINI = False
TRY_CREW = False
Agent = Task = Crew = None
try:
    import google.generativeai as genai
    USE_GEMINI = True
except Exception:
    pass

try:
    if os.getenv('CREWAI_ENABLED', '').lower() in ('1', 'true', 'yes'):
        crew_mod = importlib.import_module('crewai')
        Agent = getattr(crew_mod, 'Agent', None)
        Task = getattr(crew_mod, 'Task', None)
        Crew = getattr(crew_mod, 'Crew', None)
        if Agent and Task and Crew:
            TRY_CREW = True
except Exception:
    pass


def main():
    start = time.time()
    try:
        payload = json.loads(sys.stdin.read() or '{}')
    except Exception as e:
        print(json.dumps({"error": f"invalid input: {e}"}))
        return

    model_name = payload.get('model') or os.getenv('GEMINI_MODEL') or 'gemini-2.5-flash'
    assignment = payload.get('assignment') or {}
    submission = payload.get('submission') or {}
    questions = assignment.get('questions') or []
    answers = submission.get('answers') or []

    per_question = []
    total = 0
    feedback = ''

    # Try CrewAI first if enabled
    if TRY_CREW and Agent and Task and Crew:
        try:
            instruction = (
                "You are a fair grader. Given questions and student's answers, return ONLY a JSON object "
                "with keys: perQuestion (array of {questionId, score (0-10), feedback}), totalScore (0-100 number), feedback (string)."
            )
            grader = Agent(name='AssignmentGrader', role='Grader', goal='Produce JSON grading', verbose=False)
            desc = instruction + "\nQuestions: " + json.dumps(questions) + "\nAnswers: " + json.dumps(answers)
            task = Task(description=desc, agent=grader)
            crew = Crew(agents=[grader], tasks=[task])
            result = crew.kickoff()
            text = str(result)
            s = text.find('{')
            e = text.rfind('}')
            if s != -1 and e != -1:
                data = json.loads(text[s:e+1])
                per_question = data.get('perQuestion') or []
                total = data.get('totalScore') or 0
                feedback = data.get('feedback') or 'AI grading completed.'
        except Exception:
            pass

    if not per_question and USE_GEMINI and os.getenv('GEMINI_API_KEY'):
        try:
            genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
            model = genai.GenerativeModel(model_name)
            # Build a grading prompt
            prompt = {
                'instruction': 'Grade the submission fairly and return JSON with scoring per question (0-10) and overall percent 0-100.',
                'questions': questions,
                'answers': answers,
            }
            resp = model.generate_content(json.dumps(prompt))
            text = resp.text or ''
            # Try parse JSON
            start_idx = text.find('{')
            end_idx = text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                data = json.loads(text[start_idx:end_idx+1])
                per_question = data.get('perQuestion') or []
                total = data.get('totalScore') or 0
                feedback = data.get('feedback') or 'AI grading completed.'
            else:
                feedback = 'AI grading completed.'
        except Exception as e:
            feedback = 'Fallback grading due to AI error.'
    else:
        feedback = 'Mock grading (Gemini not configured).'

    if not per_question:
        # Heuristic mock: give full score if answer exists
        for q in questions:
            qid = q.get('_id') or q.get('id')
            ans = next((a for a in answers if str(a.get('questionId')) == str(qid)), None)
            score = 10 if ans and (ans.get('answerText') or ans.get('selectedOption') is not None) else 0
            per_question.append({ 'questionId': qid, 'score': score, 'feedback': 'Answered' if score else 'No answer' })
        total = round(100 * sum(p['score'] for p in per_question) / (10 * max(1, len(per_question))), 2)

    out = {
        'perQuestion': per_question,
        'totalScore': total,
        'feedback': feedback,
        'model': model_name,
        'version': 'v0.1',
        'latencyMs': int((time.time() - start) * 1000)
    }
    print(json.dumps(out))

if __name__ == '__main__':
    main()
