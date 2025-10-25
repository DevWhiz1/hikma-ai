#!/usr/bin/env python
import sys, json, os, time, importlib

# Optional: use google-generativeai if available and CrewAI if enabled
use_gemini = False
try_crew = False
Agent = Task = Crew = None  # placeholders for dynamic import
try:
    import google.generativeai as genai  # type: ignore
    use_gemini = True
except Exception:
    use_gemini = False
try:
    if os.getenv('CREWAI_ENABLED', '').lower() in ('1', 'true', 'yes'):
        crew_mod = importlib.import_module('crewai')
        Agent = getattr(crew_mod, 'Agent', None)
        Task = getattr(crew_mod, 'Task', None)
        Crew = getattr(crew_mod, 'Crew', None)
        if Agent and Task and Crew:
            try_crew = True
except Exception:
    try_crew = False


def main():
    start = time.time()
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw or '{}')
    except Exception as e:
        print(json.dumps({"error": f"invalid input: {e}"}))
        return

    model_name = payload.get('model') or os.getenv('GEMINI_MODEL') or 'gemini-2.5-flash'
    ai_spec = payload.get('aiSpec') or {}
    topic = ai_spec.get('topic') or payload.get('title') or 'General Islamic Studies'
    num_questions = int(ai_spec.get('numQuestions') or 5)
    mcq_count = ai_spec.get('mcqCount')
    short_count = ai_spec.get('shortAnswerCount')
    tf_count = ai_spec.get('trueFalseCount')
    essay_count = ai_spec.get('essayCount')

    questions = []
    sources = []

    # Try CrewAI first if enabled
    if try_crew and Agent and Task and Crew:
        try:
            counts_text = f"Target counts -> mcq: {mcq_count}, true-false: {tf_count}, short-answer: {short_count}, essay: {essay_count}."
            instructions = (
                f"Create {num_questions} concise questions about '{topic}'. {counts_text} "
                "Return ONLY a JSON array of objects: {type, prompt, options(for mcq or true-false), answer(index or text)}. "
                "MCQs must have exactly 4 options with one correct index. true-false must have options ['True','False'] and correct index."
            )
            creator = Agent(name='AssignmentCreator', role='Question Crafter', goal='Produce valid JSON questions', verbose=False)
            task = Task(description=instructions, agent=creator)
            crew = Crew(agents=[creator], tasks=[task])
            result = crew.kickoff()
            text = str(result)
            start_idx = text.find('[')
            end_idx = text.rfind(']')
            if start_idx != -1 and end_idx != -1:
                arr = json.loads(text[start_idx:end_idx+1])
                for q in arr:
                    qtype = q.get('type') or 'mcq'
                    questions.append({
                        'type': 'mcq' if qtype not in ['mcq','short-answer','true-false','essay'] else qtype,
                        'prompt': q.get('prompt', ''),
                        'options': q.get('options', [])[:4],
                        'answer': q.get('answer')
                    })
        except Exception:
            pass

    if not questions and use_gemini and os.getenv('GEMINI_API_KEY'):
        try:
            genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
            model = genai.GenerativeModel(model_name)
            counts = [mcq_count, short_count, tf_count, essay_count]
            counts_text = f" Aim for counts -> mcq: {mcq_count}, true-false: {tf_count}, short-answer: {short_count}, essay: {essay_count}." if any([c for c in counts if isinstance(c, int) and c>=0]) else ""
            prompt = (
                "Create {} concise, fair questions about '{}' for Islamic education.\n"
                "Use JSON array of objects: type (mcq|short-answer|true-false|essay), prompt, options (for mcq or true-false), answer (index or text).\n"
                "MCQs must include exactly 4 options and specify the correct answer index. For true-false, options should be ['True','False'] and answer an index (0 or 1).{}"
            ).format(num_questions, topic, counts_text)
            resp = model.generate_content(prompt)
            text = resp.text or ''
            # naive attempt: try to parse JSON array from text
            start_idx = text.find('[')
            end_idx = text.rfind(']')
            if start_idx != -1 and end_idx != -1:
                arr = json.loads(text[start_idx:end_idx+1])
                for q in arr:
                    qtype = q.get('type') or 'mcq'
                    questions.append({
                        'type': 'mcq' if qtype not in ['mcq','short-answer','true-false','essay'] else qtype,
                        'prompt': q.get('prompt', ''),
                        'options': q.get('options', [])[:4],
                        'answer': q.get('answer')
                    })
        except Exception as e:
            # fallback to mock below
            pass

    if not questions:
        # Fallback mock questions honoring counts if provided
        remaining = num_questions
        m = mcq_count if isinstance(mcq_count, int) else num_questions
        t = tf_count if isinstance(tf_count, int) else 0
        s = short_count if isinstance(short_count, int) else 0
        e = essay_count if isinstance(essay_count, int) else 0
        if m + t + s + e != num_questions:
            # normalize
            m = min(m, remaining); remaining -= m
            t = min(t, remaining); remaining -= t
            s = min(s, remaining); remaining -= s
            e = min(e, remaining); remaining -= e
            m += remaining
        # Add MCQs
        for i in range(m):
            questions.append({
                'type': 'mcq',
                'prompt': f"MCQ {i+1} on {topic}: Which option is correct?",
                'options': ['Option A', 'Option B', 'Option C', 'Option D'],
                'answer': 0
            })
        # Add short-answer
        for i in range(s):
            questions.append({
                'type': 'short-answer',
                'prompt': f"Short answer {i+1} on {topic}: Provide a brief answer.",
            })
        # Add essay
        for i in range(e):
            questions.append({
                'type': 'essay',
                'prompt': f"Essay {i+1} on {topic}: Write a detailed response with references.",
            })
        # Add true/false
        if t:
            # insert TF near the top but after some MCQs
            tf_qs = []
            for i in range(t):
                tf_qs.append({
                    'type': 'true-false',
                    'prompt': f"True/False {i+1} on {topic}: This statement is true.",
                    'options': ['True','False'],
                    'answer': 0
                })
            questions.extend(tf_qs)
        sources = [
            'Quran 2:255',
            'Sahih Bukhari',
        ]

    out = {
        'questions': questions,
        'sources': sources,
        'model': model_name,
        'version': 'v0.1',
        'latencyMs': int((time.time() - start) * 1000)
    }
    print(json.dumps(out))

if __name__ == '__main__':
    main()
