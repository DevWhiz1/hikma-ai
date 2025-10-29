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
        # Detailed grading instruction
        instruction = f"""You are an expert academic grader. Grade this student's submission carefully and fairly.

CRITICAL GRADING RULES:
1. For MCQ (Multiple Choice) questions: 
   - Award 10 points ONLY if the selectedOption matches the correctOption exactly
   - Award 0 points for any incorrect answer
   - Compare the student's selectedOption with the question's correctOption field

2. For True/False questions:
   - Award 10 points ONLY if the selectedOption matches the correctAnswer exactly
   - Award 0 points for incorrect answers

3. For Short Answer questions:
   - Award 0-10 points based on accuracy and completeness
   - Be strict - give 0 for completely wrong answers
   - Partial credit only for partially correct answers

4. For Essay questions:
   - Award 0-10 points based on depth, accuracy, relevance, and coherence
   - Consider both content quality and understanding demonstrated

5. DO NOT give points just because an answer exists - it MUST be CORRECT to earn points

Questions with Correct Answers:
{json.dumps(questions, indent=2)}

Student's Submitted Answers:
{json.dumps(answers, indent=2)}

IMPORTANT: Return ONLY a valid JSON object with this EXACT structure (no markdown, no code blocks, no additional text):
{{
  "perQuestion": [
    {{"questionId": "the_question_id", "score": 0-10, "feedback": "Explanation of why this score was given"}},
    ...for each question...
  ],
  "totalScore": 0-100,
  "feedback": "Overall assessment of the submission"
}}

Be accurate and strict. Wrong answers must receive 0 points."""

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
