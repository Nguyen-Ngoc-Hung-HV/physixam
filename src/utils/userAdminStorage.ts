import * as XLSX from 'xlsx';

export interface TeacherUser {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'subject_teacher' | 'exam_proctor'; // Quản trị viên / Giáo viên bộ môn / Giáo viên coi thi
  roleTitle: string;
  assignedSubject?: string;
  createdAt: string;
  status: 'active' | 'locked';
}

export interface StudentUser {
  id: string;
  stt?: number;
  fullName: string;
  studentClass: string;
  candidateNumber: string;
  status: 'active' | 'locked';
  importedAt: string;
}

export interface RBACConfig {
  studentRestrictedBank: boolean; // Học sinh: Tuyệt đối KHÔNG được xem/truy cập Ngân hàng đề thi, không sửa câu hỏi, không xem ma trận đáp án
  studentOnlyTakeAndSelfResult: boolean; // Học sinh: Chỉ được làm bài thi được giao và xem kết quả của chính mình
  teacherFullExamAccess: boolean; // Giáo viên: Toàn quyền truy cập Ngân hàng đề, Soạn đề, Trộn mã đề và Xem bảng điểm
  adminFullSystemControl: boolean; // Quản trị viên (Admin - Thầy Hùng): Toàn quyền cấu hình hệ thống, duyệt tài khoản và sao lưu dữ liệu
  requireRosterEnrollment: boolean; // Bắt buộc thí sinh phải có tên trong danh sách lớp được duyệt mới được nộp bài
}

const STORAGE_TEACHERS_KEY = 'physixam_teachers_roster';
const STORAGE_STUDENTS_KEY = 'physixam_students_roster';
const STORAGE_RBAC_KEY = 'physixam_rbac_config';

// Danh sách Giáo viên ban đầu
export const initialTeachersList: TeacherUser[] = [
  {
    id: 'tc-001',
    fullName: 'Thầy Hùng (Trưởng Ban Khảo Thí)',
    email: 'hung1979hv@gmail.com',
    role: 'admin',
    roleTitle: 'Quản trị viên tối cao (Admin)',
    assignedSubject: 'Vật lí 12 & Quản trị Hệ thống',
    createdAt: '2026-08-15',
    status: 'active',
  },
  {
    id: 'tc-002',
    fullName: 'Cô Nguyễn Thị Mai',
    email: 'mainguyen.vatly@hungvuong.edu.vn',
    role: 'subject_teacher',
    roleTitle: 'Giáo viên bộ môn Vật lí',
    assignedSubject: 'Vật lí 12 (Nhiệt & Khí)',
    createdAt: '2026-08-20',
    status: 'active',
  },
  {
    id: 'tc-003',
    fullName: 'Thầy Trần Quốc Tuấn',
    email: 'tuantran.vatly@hungvuong.edu.vn',
    role: 'subject_teacher',
    roleTitle: 'Giáo viên bộ môn Vật lí',
    assignedSubject: 'Vật lí 11 & 12 (Sóng & Điện)',
    createdAt: '2026-08-22',
    status: 'active',
  },
  {
    id: 'tc-004',
    fullName: 'Thầy Lê Văn Hải',
    email: 'haile.khaothi@hungvuong.edu.vn',
    role: 'exam_proctor',
    roleTitle: 'Giáo viên coi thi & Giám sát',
    assignedSubject: 'Tổ Khảo thí & Khối 12',
    createdAt: '2026-09-01',
    status: 'active',
  },
];

// Danh sách Học sinh theo lớp ban đầu
export const initialStudentsRoster: StudentUser[] = [
  // Lớp 12A1
  { id: 'st-01', stt: 1, fullName: 'Nguyễn Văn An', studentClass: '12A1', candidateNumber: 'SBD-12001', status: 'active', importedAt: '2026-09-01' },
  { id: 'st-02', stt: 2, fullName: 'Lê Hoàng Long', studentClass: '12A1', candidateNumber: 'SBD-12028', status: 'active', importedAt: '2026-09-01' },
  { id: 'st-03', stt: 3, fullName: 'Đỗ Minh Khoa', studentClass: '12A1', candidateNumber: 'SBD-12035', status: 'active', importedAt: '2026-09-01' },
  { id: 'st-04', stt: 4, fullName: 'Hoàng Phương Linh', studentClass: '12A1', candidateNumber: 'SBD-12042', status: 'active', importedAt: '2026-09-01' },
  { id: 'st-05', stt: 5, fullName: 'Vũ Đình Trọng', studentClass: '12A1', candidateNumber: 'SBD-12055', status: 'active', importedAt: '2026-09-01' },
  { id: 'st-06', stt: 6, fullName: 'Nguyễn Thị Kim Ngân', studentClass: '12A1', candidateNumber: 'SBD-12068', status: 'active', importedAt: '2026-09-01' },
  
  // Lớp 12A2
  { id: 'st-07', stt: 1, fullName: 'Trần Thị Mai', studentClass: '12A2', candidateNumber: 'SBD-12015', status: 'active', importedAt: '2026-09-01' },
  { id: 'st-08', stt: 2, fullName: 'Phạm Thu Hà', studentClass: '12A2', candidateNumber: 'SBD-12061', status: 'active', importedAt: '2026-09-01' },
  { id: 'st-09', stt: 3, fullName: 'Bùi Quang Huy', studentClass: '12A2', candidateNumber: 'SBD-12073', status: 'active', importedAt: '2026-09-01' },
  { id: 'st-10', stt: 4, fullName: 'Ngô Bảo Châu', studentClass: '12A2', candidateNumber: 'SBD-12089', status: 'active', importedAt: '2026-09-01' },
  { id: 'st-11', stt: 5, fullName: 'Đinh Tiến Dũng', studentClass: '12A2', candidateNumber: 'SBD-12095', status: 'active', importedAt: '2026-09-01' },

  // Lớp 11A1
  { id: 'st-12', stt: 1, fullName: 'Trịnh Hoàng Nam', studentClass: '11A1', candidateNumber: 'SBD-11005', status: 'active', importedAt: '2026-09-01' },
  { id: 'st-13', stt: 2, fullName: 'Lý Thanh Vân', studentClass: '11A1', candidateNumber: 'SBD-11019', status: 'active', importedAt: '2026-09-01' },
  { id: 'st-14', stt: 3, fullName: 'Nguyễn Thùy Trang', studentClass: '11A1', candidateNumber: 'SBD-11032', status: 'active', importedAt: '2026-09-01' },
];

export const initialRBACConfig: RBACConfig = {
  studentRestrictedBank: true,
  studentOnlyTakeAndSelfResult: true,
  teacherFullExamAccess: true,
  adminFullSystemControl: true,
  requireRosterEnrollment: false,
};

// ============================================================================
// HÀM LẤY VÀ LƯU DỮ LIỆU VÀO LOCALSTORAGE
// ============================================================================

export function getTeachersList(): TeacherUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_TEACHERS_KEY);
    if (!raw) return initialTeachersList;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialTeachersList;
  } catch (err) {
    console.warn('Lỗi đọc danh sách giáo viên:', err);
    return initialTeachersList;
  }
}

export function saveTeachersList(list: TeacherUser[]): void {
  try {
    localStorage.setItem(STORAGE_TEACHERS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Lỗi lưu danh sách giáo viên:', err);
  }
}

export function getStudentsRoster(): StudentUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_STUDENTS_KEY);
    if (!raw) return initialStudentsRoster;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialStudentsRoster;
  } catch (err) {
    console.warn('Lỗi đọc danh sách học sinh:', err);
    return initialStudentsRoster;
  }
}

export function saveStudentsRoster(list: StudentUser[]): void {
  try {
    localStorage.setItem(STORAGE_STUDENTS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Lỗi lưu danh sách học sinh:', err);
  }
}

export function getRBACConfig(): RBACConfig {
  try {
    const raw = localStorage.getItem(STORAGE_RBAC_KEY);
    if (!raw) return initialRBACConfig;
    const parsed = JSON.parse(raw);
    return { ...initialRBACConfig, ...parsed };
  } catch (err) {
    console.warn('Lỗi đọc cấu hình RBAC:', err);
    return initialRBACConfig;
  }
}

export function saveRBACConfig(cfg: RBACConfig): void {
  try {
    localStorage.setItem(STORAGE_RBAC_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.warn('Lỗi lưu cấu hình RBAC:', err);
  }
}

// ============================================================================
// TIỆN ÍCH EXCEL: XUẤT FILE MẪU & ĐỌC EXCEL NHẬP DANH SÁCH
// ============================================================================

/**
 * Tải file Excel mẫu danh sách Giáo viên
 */
export function downloadTeacherTemplateExcel(): void {
  const aoa = [
    ['DANH SÁCH GIÁO VIÊN & ĐỒNG NGHIỆP - TRƯỜNG THPT HÙNG VƯƠNG'],
    ['(Cột Vai trò nhận các giá trị: Quản trị viên, Giáo viên bộ môn, Giáo viên coi thi)'],
    ['STT', 'Họ tên', 'Email / Tên đăng nhập', 'Vai trò', 'Bộ môn phụ trách'],
    [1, 'Thầy Nguyễn Văn Bình', 'binhnguyen@hungvuong.edu.vn', 'Giáo viên bộ môn', 'Vật lí 12'],
    [2, 'Cô Hoàng Thu Thảo', 'thaophoang@hungvuong.edu.vn', 'Giáo viên coi thi', 'Khảo thí Khối 12'],
    [3, 'Thầy Phạm Anh Tuấn', 'tuanpham@hungvuong.edu.vn', 'Quản trị viên', 'Tổ trưởng chuyên môn'],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Giao_Vien');
  XLSX.writeFile(wb, 'Mau_Danh_Sach_Giao_Vien_PhysiXam.xlsx');
}

/**
 * Tải file Excel mẫu danh sách Học sinh theo lớp
 */
export function downloadStudentTemplateExcel(): void {
  const aoa = [
    ['DANH SÁCH HỌC SINH THEO LỚP - TRƯỜNG THPT HÙNG VƯƠNG'],
    ['Năm học 2026 - 2027'],
    ['STT', 'Họ và tên', 'Lớp', 'Số báo danh'],
    [1, 'Nguyễn Hoàng Nam', '12A1', 'SBD-12001'],
    [2, 'Trần Minh Anh', '12A1', 'SBD-12002'],
    [3, 'Lê Quốc Bảo', '12A1', 'SBD-12003'],
    [4, 'Phạm Quỳnh Chi', '12A2', 'SBD-12004'],
    [5, 'Vũ Đức Duy', '12A2', 'SBD-12005'],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Hoc_Sinh');
  XLSX.writeFile(wb, 'Mau_Danh_Sach_Hoc_Sinh_PhysiXam.xlsx');
}

/**
 * Đọc file Excel tải lên để nhập Giáo viên
 */
export function parseTeachersFromExcel(fileBuffer: ArrayBuffer): { teachers: TeacherUser[]; count: number } {
  const wb = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const teachers: TeacherUser[] = [];
  let headerIndex = -1;
  let nameCol = -1;
  let emailCol = -1;
  let roleCol = -1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const lower = row.map((c) => String(c || '').toLowerCase().trim());
    const nIdx = lower.findIndex((c) => c.includes('họ') || c.includes('tên'));
    const eIdx = lower.findIndex((c) => c.includes('email') || c.includes('đăng nhập'));
    const rIdx = lower.findIndex((c) => c.includes('vai trò') || c.includes('quyền') || c.includes('role'));

    if (nIdx !== -1 && (eIdx !== -1 || rIdx !== -1)) {
      headerIndex = i;
      nameCol = nIdx;
      emailCol = eIdx !== -1 ? eIdx : nIdx + 1;
      roleCol = rIdx !== -1 ? rIdx : nIdx + 2;
      break;
    }
  }

  const startIndex = headerIndex !== -1 ? headerIndex + 1 : 0;
  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const fullName = String(row[nameCol !== -1 ? nameCol : 1] || '').trim();
    const email = String(row[emailCol !== -1 ? emailCol : 2] || '').trim();
    const rawRole = String(row[roleCol !== -1 ? roleCol : 3] || '').trim().toLowerCase();

    if (!fullName || fullName.length < 2) continue;

    let role: TeacherUser['role'] = 'subject_teacher';
    let roleTitle = 'Giáo viên bộ môn Vật lí';

    if (rawRole.includes('quản trị') || rawRole.includes('admin')) {
      role = 'admin';
      roleTitle = 'Quản trị viên hệ thống';
    } else if (rawRole.includes('coi thi') || rawRole.includes('giám sát') || rawRole.includes('proctor')) {
      role = 'exam_proctor';
      roleTitle = 'Giáo viên coi thi & Giám sát';
    }

    teachers.push({
      id: `tc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fullName,
      email: email || `${fullName.toLowerCase().replace(/\s+/g, '')}@hungvuong.edu.vn`,
      role,
      roleTitle,
      assignedSubject: 'Vật lí THPT',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    });
  }

  return { teachers, count: teachers.length };
}

/**
 * Đọc file Excel tải lên để nhập Học sinh
 */
export function parseStudentsFromExcel(fileBuffer: ArrayBuffer): { students: StudentUser[]; count: number } {
  const wb = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const students: StudentUser[] = [];
  let headerIndex = -1;
  let sttCol = -1;
  let nameCol = -1;
  let classCol = -1;
  let sbdCol = -1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const lower = row.map((c) => String(c || '').toLowerCase().trim());
    const nIdx = lower.findIndex((c) => c.includes('họ') || c.includes('tên'));
    const cIdx = lower.findIndex((c) => c.includes('lớp') || c.includes('class'));
    const sIdx = lower.findIndex((c) => c.includes('báo danh') || c.includes('sbd') || c.includes('mã hs'));
    const tIdx = lower.findIndex((c) => c === 'stt' || c === 'số thứ tự');

    if (nIdx !== -1 && (cIdx !== -1 || sIdx !== -1)) {
      headerIndex = i;
      nameCol = nIdx;
      classCol = cIdx !== -1 ? cIdx : nIdx + 1;
      sbdCol = sIdx !== -1 ? sIdx : nIdx + 2;
      sttCol = tIdx;
      break;
    }
  }

  const startIndex = headerIndex !== -1 ? headerIndex + 1 : 0;
  let currentStt = 1;

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const fullName = String(row[nameCol !== -1 ? nameCol : 1] || '').trim();
    const stClass = String(row[classCol !== -1 ? classCol : 2] || '').trim();
    const sbd = String(row[sbdCol !== -1 ? sbdCol : 3] || '').trim();

    if (!fullName || fullName.length < 2) continue;

    students.push({
      id: `st-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stt: row[sttCol] ? Number(row[sttCol]) || currentStt : currentStt,
      fullName,
      studentClass: stClass || '12A1',
      candidateNumber: sbd || `SBD-${12000 + currentStt}`,
      status: 'active',
      importedAt: new Date().toISOString().split('T')[0],
    });
    currentStt++;
  }

  return { students, count: students.length };
}
