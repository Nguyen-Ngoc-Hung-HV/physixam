import { Exam, ExamEvaluation } from '../types/exam';

export interface StudentInfo {
  name: string;
  studentClass: string;
  candidateNumber?: string;
}

/**
 * Xuất dữ liệu bảng điểm học sinh sang định dạng file CSV với mã hóa UTF-8 BOM.
 * UTF-8 BOM (\uFEFF) giúp Microsoft Excel hiển thị chính xác toàn bộ dấu Tiếng Việt mà không bị lỗi font.
 */
export function exportScoreReportToCSV(
  exam: Exam,
  evaluation: ExamEvaluation,
  studentInfo: StudentInfo = { name: 'Thí sinh', studentClass: '12A1' }
) {
  const BOM = '\uFEFF';

  // Dòng tiêu đề thông tin bài thi
  const lines: string[] = [
    `"BẢNG ĐIỂM ĐÁNH GIÁ NĂNG LỰC MÔN VẬT LÍ"`,
    `"Tên kỳ thi:","${exam.title.replace(/"/g, '""')}"`,
    `"Đề thi:","${exam.subtitle.replace(/"/g, '""')}"`,
    `"Họ và tên học sinh:","${studentInfo.name.replace(/"/g, '""')}"`,
    `"Lớp:","${studentInfo.studentClass.replace(/"/g, '""')}"`,
    `"Thời gian nộp bài:","${evaluation.submittedAt}"`,
    `"Thời gian làm bài:","${Math.floor(evaluation.timeSpentSeconds / 60)} phút ${evaluation.timeSpentSeconds % 60} giây"`,
    `"Tổng điểm đạt được:","${evaluation.totalScore.toFixed(2)} / ${evaluation.maxScore.toFixed(2)}"`,
    `"Tỉ lệ đạt:","${evaluation.percentage}%"`,
  ];

  // Bổ sung Nhật ký giám sát thi (Audit Log) nếu có
  if (evaluation.auditLog) {
    let reasonText = 'Học sinh chủ động nộp bài';
    if (evaluation.auditLog.submissionReason === 'violation_limit_exceeded') {
      reasonText = 'TỰ ĐỘNG THU BÀI DO VI PHẠM QUY CHẾ (VƯỢT QUÁ SỐ LẦN RỜI MÀN HÌNH)';
    } else if (evaluation.auditLog.submissionReason === 'time_expired') {
      reasonText = 'Hết thời gian làm bài (Tự động nộp)';
    }

    lines.push(`"Tình trạng nộp bài:","${reasonText}"`);
    lines.push(`"Số lần rời màn hình / chuyển tab:","${evaluation.auditLog.violationCount} / ${evaluation.auditLog.maxAllowedViolations} lần"`);
    if (evaluation.auditLog.violations.length > 0) {
      const violationDetails = evaluation.auditLog.violations
        .map((v, i) => `[Lần ${i + 1}] ${v.timestamp}: ${v.reason}`)
        .join(' | ');
      lines.push(`"Chi tiết các lần vi phạm:","${violationDetails.replace(/"/g, '""')}"`);
    } else {
      lines.push(`"Đánh giá giám sát:","Không ghi nhận vi phạm quy chế (Tuyệt đối tuân thủ)"`);
    }
  }

  lines.push('');
  // Tiêu đề các cột dữ liệu chi tiết
  lines.push(`"STT","Mã câu","Phần thi","Chủ đề Vật lí","Câu trả lời của học sinh","Đáp án chính xác","Trạng thái","Điểm đạt","Điểm tối đa"`);

  // Chi tiết từng câu hỏi
  exam.questions.forEach((q, idx) => {
    const res = evaluation.results[q.id];
    let statusText = 'Chưa làm / Sai';
    if (res.isCorrect) statusText = 'Chính xác';
    else if (res.isPartiallyCorrect) statusText = 'Đúng một phần';

    const row = [
      idx + 1,
      `"${q.id}"`,
      `"${q.part}"`,
      `"${q.topic.replace(/"/g, '""')}"`,
      `"${(res.userAnswerSummary || 'Chưa trả lời').replace(/"/g, '""')}"`,
      `"${(res.correctAnswerSummary || '').replace(/"/g, '""')}"`,
      `"${statusText}"`,
      res.earnedPoints.toFixed(2),
      res.maxPoints.toFixed(2)
    ];

    lines.push(row.join(','));
  });

  // Hàng tổng kết cuối bảng
  lines.push('');
  lines.push(`"","TỔNG KẾT","Điểm Phần I: ${evaluation.partScores['Phần I']?.earned || 0}/${evaluation.partScores['Phần I']?.max || 0}","Điểm Phần II: ${evaluation.partScores['Phần II']?.earned || 0}/${evaluation.partScores['Phần II']?.max || 0}","Điểm Phần III: ${evaluation.partScores['Phần III']?.earned || 0}/${evaluation.partScores['Phần III']?.max || 0}","TỔNG ĐIỂM: ${evaluation.totalScore.toFixed(2)}/${evaluation.maxScore.toFixed(2)}"`);

  const csvContent = BOM + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Bang_Diem_Vat_Ly_12_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Xuất toàn bộ danh sách nộp bài và nhật ký giám sát của lớp sang định dạng CSV UTF-8 BOM
 */
export function exportAllSubmissionsToCSV(
  submissions: import('../types/exam').StudentSubmission[],
  examTitle: string
) {
  const BOM = '\uFEFF';
  const lines: string[] = [
    `"BẢNG ĐIỂM & NHẬT KÝ GIÁM SÁT THI TRỰC TUYẾN"`,
    `"Kỳ thi:","${examTitle.replace(/"/g, '""')}"`,
    `"Thời gian xuất báo cáo:","${new Date().toLocaleString('vi-VN')}"`,
    `"Tổng số bài thi:","${submissions.length}"`,
    '',
    `"STT","Họ và tên thí sinh","Lớp","Số báo danh","Mã đề","Điểm số","Tỉ lệ %","Thời gian làm bài","Thời điểm nộp","Tình trạng nộp bài","Số lần vi phạm","Chi tiết vi phạm"`
  ];

  submissions.forEach((sub, idx) => {
    let reasonText = 'Học sinh chủ động nộp';
    if (sub.submissionReason === 'violation_limit_exceeded') {
      reasonText = 'TỰ ĐỘNG THU BÀI DO VI PHẠM QUY CHẾ';
    } else if (sub.submissionReason === 'time_expired') {
      reasonText = 'Hết giờ làm bài';
    }

    const timeSpent = `${Math.floor(sub.timeSpentSeconds / 60)}p ${sub.timeSpentSeconds % 60}s`;
    const violationSummary = sub.auditLog.violations.length > 0
      ? sub.auditLog.violations.map((v, i) => `[${i + 1}] ${v.timestamp} - ${v.reason}`).join('; ')
      : 'Không có';

    const row = [
      idx + 1,
      `"${sub.studentName.replace(/"/g, '""')}"`,
      `"${sub.studentClass.replace(/"/g, '""')}"`,
      `"${sub.candidateNumber.replace(/"/g, '""')}"`,
      `"${sub.examCode}"`,
      `${sub.totalScore.toFixed(2)} / ${sub.maxScore.toFixed(2)}`,
      `${sub.percentage}%`,
      `"${timeSpent}"`,
      `"${sub.submittedAt}"`,
      `"${reasonText}"`,
      `${sub.violationCount} / ${sub.auditLog.maxAllowedViolations}`,
      `"${violationSummary.replace(/"/g, '""')}"`
    ];

    lines.push(row.join(','));
  });

  const csvContent = BOM + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Danh_Sach_Diem_Giam_Sat_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Xuất Bảng điểm chi tiết toàn bộ học sinh sang file Microsoft Excel (.xlsx) chuẩn hóa theo yêu cầu
 */
export function exportGradebookToExcel(
  submissions: import('../types/exam').StudentSubmission[],
  examTitle: string = 'KIỂM TRA ĐÁNH GIÁ NĂNG LỰC VẬT LÝ'
): void {
  import('xlsx').then((XLSX) => {
    const aoa: any[][] = [];

    // Header Lines tiêu chuẩn
    aoa.push(['SỞ GIÁO DỤC & ĐÀO TẠO TP ĐÀ NẴNG']);
    aoa.push(['TRƯỜNG THPT HÙNG VƯƠNG']);
    aoa.push(['BẢNG ĐIỂM CHI TIẾT KỲ THI ĐÁNH GIÁ NĂNG LỰC VẬT LÝ']);
    aoa.push(['Năm học 2026 - 2027']);
    aoa.push([`Kỳ thi: ${examTitle} • Xuất lúc: ${new Date().toLocaleString('vi-VN')} • Tổng số: ${submissions.length} thí sinh`]);
    aoa.push([]); // Dòng trống ngăn cách

    // Hàng tiêu đề 11 cột chuẩn hóa
    aoa.push([
      'STT',
      'Họ và tên học sinh',
      'Lớp',
      'Mã đề thi',
      'Điểm Phần I',
      'Điểm Phần II',
      'Điểm Phần III',
      'TỔNG ĐIỂM (Thang 10)',
      'Số lần vi phạm',
      'Thời gian nộp bài',
      'Xếp loại',
    ]);

    // Các hàng dữ liệu thí sinh
    submissions.forEach((sub, idx) => {
      const p1 = sub.evaluation?.partScores?.['Phần I']?.earned ?? 0;
      const p2 = sub.evaluation?.partScores?.['Phần II']?.earned ?? 0;
      const p3 = sub.evaluation?.partScores?.['Phần III']?.earned ?? 0;
      const total = Number(sub.totalScore.toFixed(2));

      // Xếp loại học lực
      let rank = 'Chưa đạt';
      if (total >= 9.0) rank = 'Xuất sắc';
      else if (total >= 8.0) rank = 'Giỏi';
      else if (total >= 6.5) rank = 'Khá';
      else if (total >= 5.0) rank = 'Trung bình';

      aoa.push([
        idx + 1,
        sub.studentName,
        sub.studentClass,
        sub.examCode || '101',
        Number(p1.toFixed(2)),
        Number(p2.toFixed(2)),
        Number(p3.toFixed(2)),
        total,
        sub.violationCount || 0,
        sub.submittedAt,
        rank,
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Cài đặt độ rộng cột tối ưu
    ws['!cols'] = [
      { wch: 6 },   // STT
      { wch: 26 },  // Họ và tên
      { wch: 10 },  // Lớp
      { wch: 12 },  // Mã đề thi
      { wch: 14 },  // Điểm Phần I
      { wch: 14 },  // Điểm Phần II
      { wch: 14 },  // Điểm Phần III
      { wch: 22 },  // TỔNG ĐIỂM (Thang 10)
      { wch: 16 },  // Số lần vi phạm
      { wch: 24 },  // Thời gian nộp bài
      { wch: 14 },  // Xếp loại
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Bang_Diem_Chi_Tiet');
    XLSX.writeFile(wb, `Bang_Diem_Chi_Tiet_Vat_Ly_2026_2027_${Date.now()}.xlsx`);
  });
}
