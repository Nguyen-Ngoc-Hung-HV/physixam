import { StudentSubmission } from '../types/exam';
import { ExamPackage } from '../types/curriculum';

export async function syncSubmissionToCloud(submission: StudentSubmission): Promise<boolean> {
  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.warn('Lỗi đồng bộ bài nộp lên cloud:', err);
    return false;
  }
}

export async function fetchSubmissionsFromCloud(): Promise<StudentSubmission[]> {
  try {
    const res = await fetch('/api/submissions');
    const data = await res.json();
    if (data.success && Array.isArray(data.submissions)) {
      return data.submissions;
    }
  } catch (err) {
    console.warn('Không thể tải bài nộp từ cloud:', err);
  }
  return [];
}

export async function syncExamPackageToCloud(pkg: ExamPackage): Promise<boolean> {
  try {
    const res = await fetch('/api/exam-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg),
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.warn('Lỗi lưu đề thi lên cloud:', err);
    return false;
  }
}

export async function fetchExamPackagesFromCloud(): Promise<ExamPackage[]> {
  try {
    const res = await fetch('/api/exam-packages');
    const data = await res.json();
    if (data.success && Array.isArray(data.packages)) {
      return data.packages;
    }
  } catch (err) {
    console.warn('Không thể tải ngân hàng đề từ cloud:', err);
  }
  return [];
}
