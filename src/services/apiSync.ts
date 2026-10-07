import { StudentSubmission } from '../types/exam';
import { ExamPackage, ExamAssignmentInfo } from '../types/curriculum';

// ================= ĐỒNG BỘ BÀI NỘP CỦA HỌC SINH =================

export async function syncSubmissionToCloud(submission: StudentSubmission): Promise<boolean> {
  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.warn('Lỗi đồng bộ bài nộp lên Cloud:', err);
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
    return [];
  } catch (err) {
    console.warn('Lỗi lấy bài nộp từ Cloud:', err);
    return [];
  }
}

// Xóa 1 bài nộp theo ID (Phục vụ Vấn đề 3)
export async function deleteSubmissionFromCloud(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/submissions/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.warn('Lỗi xóa bài nộp trên Cloud:', err);
    return false;
  }
}

// Xóa toàn bộ danh sách bài nộp (Phục vụ Vấn đề 3)
export async function clearAllSubmissionsFromCloud(): Promise<boolean> {
  try {
    const res = await fetch('/api/submissions', {
      method: 'DELETE',
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.warn('Lỗi xóa toàn bộ bài nộp trên Cloud:', err);
    return false;
  }
}

// ================= ĐỒNG BỘ GÓI ĐỀ THI (EXAM PACKAGES) =================

export async function syncExamPackageToCloud(pkg: ExamPackage): Promise<boolean> {
  try {
    const res = await fetch('/api/exam-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg),
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.warn('Lỗi đồng bộ gói đề thi lên Cloud:', err);
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
    return [];
  } catch (err) {
    console.warn('Lỗi lấy gói đề từ Cloud:', err);
    return [];
  }
}

// ================= ĐỒNG BỘ LƯỢT GIAO ĐỀ (ASSIGNMENTS) =================

export async function syncAssignmentToCloud(assignment: ExamAssignmentInfo): Promise<boolean> {
  try {
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignment),
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.warn('Lỗi đồng bộ lượt giao đề lên Cloud:', err);
    return false;
  }
}

export async function fetchAssignmentsFromCloud(): Promise<ExamAssignmentInfo[]> {
  try {
    const res = await fetch('/api/assignments');
    const data = await res.json();
    if (data.success && Array.isArray(data.assignments)) {
      return data.assignments;
    }
    return [];
  } catch (err) {
    console.warn('Lỗi lấy danh sách giao đề từ Cloud:', err);
    return [];
  }
}