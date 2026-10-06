import { StudentSubmission } from '../types/exam';
import { ExamPackage, ExamAssignmentInfo } from '../types/curriculum';

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

// ĐỒNG BỘ LƯỢT GIAO ĐỀ (ASSIGNMENT) LÊN CLOUD ĐỂ DÙNG LINK NGẮN (#code=...)
export async function syncAssignmentToCloud(assignment: ExamAssignmentInfo): Promise<boolean> {
  try {
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignment),
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.warn('Lỗi lưu bài giao lên cloud:', err);
    return false;
  }
}

// TẢI DANH SÁCH LƯỢT GIAO ĐỀ TỪ CLOUD VỀ MÁY HỌC SINH
export async function fetchAssignmentsFromCloud(): Promise<ExamAssignmentInfo[]> {
  try {
    const res = await fetch('/api/assignments');
    const data = await res.json();
    if (data.success && Array.isArray(data.assignments)) {
      return data.assignments;
    }
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('Không thể tải danh sách bài giao từ cloud:', err);
  }
  return [];
}