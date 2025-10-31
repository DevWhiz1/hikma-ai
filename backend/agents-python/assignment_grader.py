#!/usr/bin/env python
import sys, json, os, time

# Import CrewAI components
try:
    from crewai import Agent, Task, Crew
    CREWAI_AVAILABLE = True
except ImportError as e:
    CREWAI_AVAILABLE = False
    print(json.dumps({"error": f"CrewAI not installed: {e}"}))
    sys.exit(1)


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

    # Use CrewAI for grading
    if not CREWAI_AVAILABLE:
        print(json.dumps({"error": "CrewAI is required but not available"}))
        return

    try:
        # Filter out essay questions - they should be graded manually
        gradable_questions = [q for q in questions if q.get('type') != 'essay']
        essay_questions = [q for q in questions if q.get('type') == 'essay']
        essay_q_ids = [q.get('_id') or q.get('id') for q in essay_questions]
        
        # Match answers to gradable questions only
        gradable_answers = [a for a in answers if a.get('questionId') not in essay_q_ids]
        
        if not gradable_questions:
            # Only essay questions - return empty grading, mark essays for manual grading
            per_question = [{"questionId": q.get('_id') or q.get('id'), "score": None, "feedback": "Essay question - requires manual grading"} for q in essay_questions]
            out = {
                'perQuestion': per_question,
                'totalScore': None,
                'feedback': 'This submission contains only essay questions. Please grade manually.',
                'model': model_name,
                'version': 'v0.1',
                'hasEssays': True,
                'latencyMs': int((time.time() - start) * 1000)
            }
            print(json.dumps(out))
            return
        
        # Detailed grading instruction
        instruction = f"""You are an expert academic grader. Grade this student's submission carefully and fairly.

CRITICAL GRADING RULES:
1. For MCQ (Multiple Choice) questions: 
   - Award 10 points ONLY if the selectedOption matches the correctOption exactly (case-sensitive string comparison)
   - Award 0 points for any incorrect answer
   - Compare the student's selectedOption with the question's correctOption field

2. For True/False questions:
   - Award 10 points ONLY if the selectedOption (true/false as string or boolean) matches the correctAnswer exactly
   - Award 0 points for incorrect answers

3. For Short Answer questions:
   - Award 0-10 points based on accuracy and completeness
   - Be strict - give 0 for completely wrong answers
   - Partial credit only for partially correct answers
   - Compare answerText with the question's correctAnswer or expected answer

4. IMPORTANT: Match each answer to its question using questionId. Make sure you grade ALL gradable questions.

5. DO NOT give points just because an answer exists - it MUST be CORRECT to earn points

Questions with Correct Answers (GRADABLE ONLY - essays excluded):
{json.dumps(gradable_questions, indent=2)}

Student's Submitted Answers (MATCHED TO QUESTIONS):
{json.dumps(gradable_answers, indent=2)}

IMPORTANT: 
- For each question in gradable_questions, find the matching answer by questionId
- If no answer found for a question, award 0 points
- Return scores for ALL gradable questions

IMPORTANT: Return ONLY a valid JSON object with this EXACT structure (no markdown, no code blocks, no additional text):
{{
  "perQuestion": [
    {{"questionId": "the_question_id", "score": 0-10, "feedback": "Explanation of why this score was given"}},
    ...for each GRADABLE question (not essays)...
  ],
  "totalScore": 0-100,
  "feedback": "Overall assessment of the submission"
}}

Be accurate and strict. Wrong answers must receive 0 points. Score must be between 0-10 for each question."""

        # Create the grading agent
        grader = Agent(
            name='AssignmentGrader',
            role='Expert Academic Grader',
            goal='Accurately grade student submissions and provide detailed feedback',
            backstory='You are an experienced educator who grades fairly and accurately, never awarding points for incorrect answers.',
            verbose=False,
            allow_delegation=False
        )
        
        # Create the grading task
        task = Task(
            description=instruction,
            agent=grader,
            expected_output='A JSON object with perQuestion array, totalScore, and feedback'
        )
        
        # Execute the crew
        crew = Crew(
            agents=[grader],
            tasks=[task],
            verbose=False
        )
        
        result = crew.kickoff()
        text = str(result)
        
        # Extract JSON from result
        s = text.find('{')
        e = text.rfind('}')
        if s != -1 and e != -1:
            json_str = text[s:e+1]
            data = json.loads(json_str)
            per_question = data.get('perQuestion') or []
            total = data.get('totalScore') or 0
            feedback = data.get('feedback') or 'AI grading completed.'
        else:
            raise ValueError("CrewAI did not return valid JSON format")
            
    except Exception as e:
        print(json.dumps({"error": f"CrewAI grading failed: {str(e)}"}))
        return

    # Validate results
    if not per_question:
        print(json.dumps({"error": "No grading results produced by CrewAI"}))
        return
    
    # 🚀 FIX: Validate and normalize per-question scores
    validated_per_question = []
    for pq in per_question:
        qid = pq.get('questionId')
        score = pq.get('score')
        
        # Handle None/null scores (for essays)
        if score is None:
            validated_per_question.append(pq)
            continue
            
        # Convert to number if string
        try:
            if isinstance(score, str):
                score = float(score)
            score = float(score)
            # Ensure score is 0-10
            score = max(0, min(10, score))
            pq['score'] = score
        except (ValueError, TypeError):
            pq['score'] = 0  # Default to 0 if invalid
        
        validated_per_question.append(pq)
    
    per_question = validated_per_question

    # 🚀 FIX: Calculate totalScore from per-question scores if not provided or invalid
    try:
        # Try to convert total to number if it's a string
        if isinstance(total, str):
            total = float(total)
    except (ValueError, TypeError):
        total = None
    
    # Calculate from per-question scores if totalScore is invalid or not provided
    if not isinstance(total, (int, float)) or total < 0 or total > 100:
        # Calculate from per-question scores (each is 0-10)
        sum_scores = sum(
            float(pq.get('score', 0)) 
            for pq in per_question 
            if isinstance(pq.get('score'), (int, float)) or (isinstance(pq.get('score'), str) and pq.get('score').replace('.', '').isdigit())
        )
        max_possible = len(per_question) * 10
        if max_possible > 0:
            total = round((sum_scores / max_possible) * 100)
        else:
            total = 0
    
    # Ensure totalScore is between 0-100
    total = max(0, min(100, int(total)))

    out = {
        'perQuestion': per_question,
        'totalScore': total,  # Always a valid 0-100 score
        'feedback': feedback,
        'model': model_name,
        'version': 'v0.1',
        'latencyMs': int((time.time() - start) * 1000)
    }
    print(json.dumps(out))

if __name__ == '__main__':
    main()
