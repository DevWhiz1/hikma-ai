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

    # Try CrewAI first if enabled (with validation)
    if try_crew and Agent and Task and Crew:
        try:
            counts_text = f"Target counts -> mcq: {mcq_count or 0}, true-false: {tf_count or 0}, short-answer: {short_count or 0}, essay: {essay_count or 0}."
            difficulty = ai_spec.get('difficulty', 'medium')
            description = payload.get('description', '')
            
            # 🚀 ENHANCED: Creator agent with better instructions
            creator_instructions = (
                f"Create {num_questions} high-quality, educational questions about '{topic}' for Islamic studies.\n"
                f"Difficulty level: {difficulty}\n"
                f"{description and f'Context: {description}' or ''}\n"
                f"{counts_text}\n\n"
                "Requirements:\n"
                "- Questions must be clear, culturally appropriate, and educationally valuable\n"
                "- MCQs must have exactly 4 options with one clearly correct answer\n"
                "- True/False questions must have options ['True','False'] with correct index (0 or 1)\n"
                "- Short answers should require 2-3 sentences\n"
                "- Essays should require detailed, well-reasoned responses\n"
                "- For Islamic topics, ensure accuracy and respect for religious teachings\n\n"
                "Return ONLY a valid JSON array of objects with structure:\n"
                "[{\"type\": \"mcq|short-answer|true-false|essay\", \"prompt\": \"question text\", \"options\": [\"opt1\",\"opt2\",...], \"answer\": index_or_text}]"
            )
            
            creator = Agent(
                name='AssignmentCreator',
                role='Expert Islamic Education Question Writer',
                goal='Create high-quality, accurate educational questions for Islamic studies',
                backstory='You are an experienced Islamic educator who creates fair, clear, and educationally valuable questions. You ensure questions are accurate, appropriate, and help students learn.',
                verbose=False
            )
            
            create_task = Task(
                description=creator_instructions,
                agent=creator,
                expected_output='A valid JSON array of question objects'
            )
            
            # 🚀 NEW: Validator agent to review and improve questions
            validator_instructions = (
                "Review the generated questions for:\n"
                "1. Clarity and understandability\n"
                "2. Educational value and appropriateness\n"
                "3. Accuracy (especially for Islamic content)\n"
                "4. Correct format (MCQs have 4 options, etc.)\n"
                "5. Proper difficulty level\n"
                "Return the validated questions as a JSON array, fixing any issues found."
            )
            
            validator = Agent(
                name='QuestionValidator',
                role='Quality Assurance Reviewer',
                goal='Ensure all questions meet high educational standards',
                backstory='You are a meticulous educational quality reviewer who ensures all questions are clear, accurate, and pedagogically sound.',
                verbose=False
            )
            
            validate_task = Task(
                description=validator_instructions,
                agent=validator,
                expected_output='A validated JSON array of question objects',
                context=[create_task]
            )
            
            # Run creation and validation
            crew = Crew(agents=[creator, validator], tasks=[create_task, validate_task])
            result = crew.kickoff()
            text = str(result)
            
            # Extract JSON array from result
            start_idx = text.find('[')
            end_idx = text.rfind(']')
            if start_idx != -1 and end_idx != -1:
                json_str = text[start_idx:end_idx+1]
                arr = json.loads(json_str)
                
                # Process and validate each question
                for q in arr:
                    qtype = q.get('type', '').lower()
                    if qtype not in ['mcq', 'short-answer', 'true-false', 'essay']:
                        qtype = 'mcq'  # Default fallback
                    
                    question_obj = {
                        'type': qtype,
                        'prompt': q.get('prompt', '').strip(),
                        'answer': q.get('answer')
                    }
                    
                    # Validate MCQ format
                    if qtype == 'mcq':
                        opts = q.get('options', [])
                        if len(opts) != 4:
                            # Pad or trim to 4 options
                            while len(opts) < 4:
                                opts.append(f"Option {chr(65 + len(opts))}")
                            opts = opts[:4]
                        question_obj['options'] = opts
                        # Ensure answer is valid index
                        if isinstance(question_obj['answer'], int) and 0 <= question_obj['answer'] < 4:
                            pass  # Valid
                        else:
                            question_obj['answer'] = 0  # Default to first option
                    
                    # Validate True/False format
                    elif qtype == 'true-false':
                        question_obj['options'] = ['True', 'False']
                        if isinstance(question_obj['answer'], bool):
                            question_obj['answer'] = 0 if question_obj['answer'] else 1
                        elif isinstance(question_obj['answer'], int) and question_obj['answer'] in [0, 1]:
                            pass  # Valid
                        else:
                            question_obj['answer'] = 0  # Default to True
                    
                    if question_obj['prompt']:  # Only add if prompt is not empty
                        questions.append(question_obj)
                
                # Add Islamic sources
                sources = [
                    'Quran and Hadith references',
                    'Authentic Islamic scholarly sources'
                ]
        except Exception as e:
            # Log error but continue to fallback
            import traceback
            print(f"CrewAI error: {str(e)}", file=sys.stderr)
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
