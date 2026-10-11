import React, { useState, useEffect } from 'react';
import { Exam, StudentAnswers, AntiCheatConfig, ViolationEvent, StudentSubmission } from './types/exam';
import { StudentExamLaunch } from './components/StudentExamLaunch';
import { ExamResults, PrintMode } from './components/ExamResults';
import { TeacherDashboard } from './components/TeacherDashboard';
import { safeStorage } from './utils/safeStorage';

export default function App() {
  const [exam, setExam] = useState<Exam>({
    id: 'exam-default',
    code: '101',
    title: 'Đề kiểm tra Vật Lí mặc định',
    totalPoints: 10,
    questions: []
  } as any);

  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    try {
      const saved = safeStorage.getItem('physixam_submissions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [studentExamPhase, setStudentExamPhase] = useState<'launch' | 'student_results'>('launch');
  const [answers, setAnswers] = useState<StudentAnswers>({});
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<Set<string>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(45 * 60);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [candidateInfo, setCandidateInfo] = useState({
    name: 'Thí sinh tự do',
    studentClass: '10A1',
    candidateNumber: 'SBD-001'
  });
  const [auditLog, setAuditLog] = useState<{ violations: ViolationEvent[] }>({ violations: [] });
  const [antiCheatConfig, setAntiCheatConfig] = useState<AntiCheatConfig>({
    enabled: true,
    maxViolations: 5
  } as any);

  // Đồng hồ đếm ngược thời gian làm bài
  useEffect(() => {
    if (studentExamPhase !== 'launch') return;
    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [studentExamPhase]);

  const handleAutoSubmit = () => {
    handleSubmitExam();
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleRecordViolation = (event: ViolationEvent) => {
    setAuditLog((prev) => ({
      ...prev,
      violations: [...prev.violations, event]
    }));
  };

  // Nộp bài thi
  const handleSubmitExam = () => {
    let score = 0;
    const detailedFeedback: any[] = [];

    exam.questions.forEach((q: any) => {
      const userAns = answers[q.id];
      let isCorrect = false;
      let pointsAwarded = 0;
      const qPoints = q.points || (10 / (exam.questions.length || 1));

      if (q.type === 'multiple_choice') {
        if (userAns === q.correctAnswer) {
          isCorrect = true;
          pointsAwarded = qPoints;
        }
      } else if (q.type === 'true_false_cluster') {
        const clusterAns = userAns || {};
        let correctSubCount = 0;
        q.items?.forEach((item: any) => {
          if ((clusterAns as any)[item.id] === item.isCorrect) {
            correctSubCount++;
          }
        });
        if (correctSubCount === (q.items?.length || 1)) {
          isCorrect = true;
          pointsAwarded = qPoints;
        } else if (correctSubCount > 0) {
          pointsAwarded = Number((qPoints * (correctSubCount / (q.items?.length || 1))).toFixed(2));
        }
      } else if (q.type === 'short_answer') {
        const val = typeof userAns === 'object' && userAns !== null ? userAns.value : userAns;
        if (val && String(val).trim() === String(q.correctValue || '').trim()) {
          isCorrect = true;
          pointsAwarded = qPoints;
        }
      }

      score += pointsAwarded;
      detailedFeedback.push({
        questionId: q.id,
        isCorrect,
        pointsAwarded
      });
    });

    const finalScore = Number(Math.min(10, Math.max(0, score)).toFixed(2));
    const evalResult = {
      totalScore: finalScore,
      detailedFeedback
    };

    setEvaluation(evalResult);

    const newSub: StudentSubmission = {
      id: `sub-${Date.now()}`,
      candidateName: candidateInfo.name,
      studentClass: candidateInfo.studentClass,
      candidateNumber: candidateInfo.candidateNumber,
      examCode: exam.code || '101',
      score: finalScore,
      submittedAt: new Date().toISOString(),
      answers,
      auditLog,
      evaluation: evalResult
    } as any;

    setSubmissions((prev) => {
      const updated = [newSub, ...prev];
      try {
        safeStorage.setItem('physixam_submissions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setStudentExamPhase('student_results');
  };

  // XÓA 1 BÀI NỘP THEO ID
  const handleDeleteSubmission = async (submissionId: string) => {
    setSubmissions((prev: any[]) => {
      const updated = prev.filter((s: any) => String(s.id || s._id) !== String(submissionId));
      try {
        safeStorage.setItem('physixam_submissions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await fetch(`/api/submissions/${submissionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.warn('Lỗi khi xóa bài nộp trên server:', err);
    }
  };

  // XÓA TOÀN BỘ DANH SÁCH BÀI NỘP
  const handleClearSubmissions = async () => {
    setSubmissions([]);
    try {
      safeStorage.setItem('physixam_submissions', JSON.stringify([]));
    } catch (e) {}

    try {
      await fetch('/api/submissions/clear-all', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.warn('Lỗi khi xóa sạch danh sách trên server:', err);
    }
  };

  const handleOpenPrint = (printMode: PrintMode) => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
      <main className="pb-12">
        {studentExamPhase === 'launch' && (
          <StudentExamLaunch
            exam={exam}
            antiCheatConfig={antiCheatConfig}
            candidateInfo={candidateInfo}
            timeRemainingSeconds={timeRemainingSeconds}
            onAnswerChange={handleAnswerChange}
            answers={answers}
            flaggedQuestionIds={flaggedQuestionIds}
            onToggleFlag={handleToggleFlag}
            currentQuestionIndex={currentQuestionIndex}
            onSelectQuestion={setCurrentQuestionIndex}
            onSubmitExam={handleSubmitExam}
            onRecordViolation={handleRecordViolation}
          />
        )}

        {studentExamPhase === 'student_results' && evaluation && (
          <ExamResults
            exam={exam}
            answers={answers}
            evaluation={evaluation}
            candidateInfo={candidateInfo}
            timeRemainingSeconds={timeRemainingSeconds}
            auditLog={auditLog}
            onRetake={() => {
              setAnswers({});
              setStudentExamPhase('launch');
              setTimeRemainingSeconds(45 * 60);
            }}
            onOpenTeacherMode={() => {}}
            onOpenPrint={(printMode) => handleOpenPrint(printMode as any)}
          />
        )}

        {/* Giao diện TeacherDashboard tích hợp an toàn */}
        {React.createElement(TeacherDashboard as any, {
          submissions: submissions,
          onDeleteSubmission: handleDeleteSubmission,
          onClearSubmissions: handleClearSubmissions,
          currentExam: exam,
          onUpdateExam: setExam,
          antiCheatConfig: antiCheatConfig,
          onChangeAntiCheatConfig: setAntiCheatConfig
        })}
      </main>
    </div>
  );
}