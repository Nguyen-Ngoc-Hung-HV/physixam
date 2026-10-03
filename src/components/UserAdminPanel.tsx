import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserCheck, ShieldCheck, ShieldAlert, Download, Upload, 
  Plus, Search, Filter, Trash2, CheckCircle2, AlertCircle, 
  FileSpreadsheet, Lock, Unlock, Mail, ArrowLeft, RefreshCw, FileText
} from 'lucide-react';
import { 
  TeacherUser, StudentUser, RBACConfig, 
  getTeachersList, saveTeachersList, 
  getStudentsRoster, saveStudentsRoster, 
  getRBACConfig, saveRBACConfig,
  downloadTeacherTemplateExcel, downloadStudentTemplateExcel,
  parseTeachersFromExcel, parseStudentsFromExcel
} from '../utils/userAdminStorage';

interface UserAdminPanelProps {
  initialTab?: 'teachers' | 'students' | 'rbac';
  onNavigateHome?: () => void;
}

export const UserAdminPanel: React.FC<UserAdminPanelProps> = ({
  initialTab = 'teachers',
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'students' | 'rbac'>(initialTab);

  // Dữ liệu Giáo viên
  const [teachers, setTeachers] = useState<TeacherUser[]>(() => getTeachersList());
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [teacherRoleFilter, setTeacherRoleFilter] = useState<string>('all');
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState<boolean>(false);
  const [newTeacherName, setNewTeacherName] = useState<string>('');
  const [newTeacherEmail, setNewTeacherEmail] = useState<string>('');
  const [newTeacherRole, setNewTeacherRole] = useState<TeacherUser['role']>('subject_teacher');
  const [newTeacherSubject, setNewTeacherSubject] = useState<string>('Vật lí 12');

  // Dữ liệu Học sinh
  const [students, setStudents] = useState<StudentUser[]>(() => getStudentsRoster());
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentClass, setNewStudentClass] = useState<string>('12A1');
  const [newStudentSbd, setNewStudentSbd] = useState<string>('');

  // Cấu hình RBAC
  const [rbacConfig, setRbacConfig] = useState<RBACConfig>(() => getRBACConfig());
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const teacherFileInputRef = useRef<HTMLInputElement>(null);
  const studentFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Danh sách các lớp học độc nhất
  const availableClasses = Array.from(new Set(students.map((s) => s.studentClass))).sort();

  // =========================================================================
  // XỬ LÝ GIÁO VIÊN
  // =========================================================================
  const filteredTeachers = teachers.filter((t) => {
    const matchQuery = t.fullName.toLowerCase().includes(teacherSearch.toLowerCase()) || 
                       t.email.toLowerCase().includes(teacherSearch.toLowerCase());
    const matchRole = teacherRoleFilter === 'all' || t.role === teacherRoleFilter;
    return matchQuery && matchRole;
  });

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) {
      showToast('Vui lòng nhập họ và tên giáo viên', 'error');
      return;
    }
    const roleTitles: Record<TeacherUser['role'], string> = {
      admin: 'Quản trị viên hệ thống',
      subject_teacher: 'Giáo viên bộ môn Vật lí',
      exam_proctor: 'Giáo viên coi thi & Giám sát',
    };

    const newTeacher: TeacherUser = {
      id: `tc-${Date.now()}`,
      fullName: newTeacherName.trim(),
      email: newTeacherEmail.trim() || `${newTeacherName.toLowerCase().replace(/\s+/g, '')}@hungvuong.edu.vn`,
      role: newTeacherRole,
      roleTitle: roleTitles[newTeacherRole],
      assignedSubject: newTeacherSubject.trim() || 'Vật lí THPT',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    const updated = [newTeacher, ...teachers];
    setTeachers(updated);
    saveTeachersList(updated);
    setIsAddTeacherModalOpen(false);
    setNewTeacherName('');
    setNewTeacherEmail('');
    showToast(`Đã thêm giáo viên "${newTeacher.fullName}" thành công!`);
  };

  const handleToggleTeacherStatus = (id: string) => {
    const updated = teachers.map((t) => {
      if (t.id === id) {
        if (t.role === 'admin' && t.email === 'hung1979hv@gmail.com') {
          showToast('Không thể khóa tài khoản Quản trị viên tối cao!', 'error');
          return t;
        }
        const nextStatus = t.status === 'active' ? 'locked' : 'active';
        return { ...t, status: nextStatus as 'active' | 'locked' };
      }
      return t;
    });
    setTeachers(updated);
    saveTeachersList(updated);
  };

  const handleDeleteTeacher = (id: string) => {
    const target = teachers.find((t) => t.id === id);
    if (target?.role === 'admin' && target.email === 'hung1979hv@gmail.com') {
      showToast('Không thể xóa tài khoản Quản trị viên tối cao của Thầy Hùng!', 'error');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa giáo viên "${target?.fullName}" khỏi hệ thống?`)) {
      const updated = teachers.filter((t) => t.id !== id);
      setTeachers(updated);
      saveTeachersList(updated);
      showToast('Đã xóa giáo viên khỏi danh sách.');
    }
  };

  const handleImportTeachersFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const { teachers: imported, count } = parseTeachersFromExcel(buffer);
      if (count === 0) {
        showToast('Không tìm thấy dữ liệu giáo viên hợp lệ trong tệp Excel.', 'error');
        return;
      }
      const updated = [...imported, ...teachers];
      setTeachers(updated);
      saveTeachersList(updated);
      showToast(`Nhập thành công ${count} giáo viên từ tệp Excel!`);
    } catch (err: any) {
      showToast(`Lỗi đọc tệp Excel: ${err?.message || 'Không thể xử lý'}`, 'error');
    }
    if (teacherFileInputRef.current) teacherFileInputRef.current.value = '';
  };

  // =========================================================================
  // XỬ LÝ HỌC SINH
  // =========================================================================
  const filteredStudents = students.filter((s) => {
    const matchQuery = s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) || 
                       s.candidateNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
                       s.studentClass.toLowerCase().includes(studentSearch.toLowerCase());
    const matchClass = selectedClass === 'all' || s.studentClass === selectedClass;
    return matchQuery && matchClass;
  });

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentClass.trim()) {
      showToast('Vui lòng nhập đầy đủ họ tên và lớp học của học sinh!', 'error');
      return;
    }
    const newStudent: StudentUser = {
      id: `st-${Date.now()}`,
      stt: students.length + 1,
      fullName: newStudentName.trim(),
      studentClass: newStudentClass.trim().toUpperCase(),
      candidateNumber: newStudentSbd.trim() || `SBD-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'active',
      importedAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newStudent, ...students];
    setStudents(updated);
    saveStudentsRoster(updated);
    setIsAddStudentModalOpen(false);
    setNewStudentName('');
    setNewStudentSbd('');
    showToast(`Đã thêm học sinh "${newStudent.fullName}" (${newStudent.studentClass})!`);
  };

  const handleToggleStudentStatus = (id: string) => {
    const updated = students.map((s) => {
      if (s.id === id) {
        const nextStatus = s.status === 'active' ? 'locked' : 'active';
        return { ...s, status: nextStatus as 'active' | 'locked' };
      }
      return s;
    });
    setStudents(updated);
    saveStudentsRoster(updated);
  };

  const handleDeleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    if (window.confirm(`Xóa học sinh "${target?.fullName}" (Lớp ${target?.studentClass})?`)) {
      const updated = students.filter((s) => s.id !== id);
      setStudents(updated);
      saveStudentsRoster(updated);
      showToast('Đã xóa học sinh khỏi danh sách.');
    }
  };

  const handleImportStudentsFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const { students: imported, count } = parseStudentsFromExcel(buffer);
      if (count === 0) {
        showToast('Không tìm thấy dữ liệu học sinh hợp lệ trong tệp Excel.', 'error');
        return;
      }
      const updated = [...imported, ...students];
      setStudents(updated);
      saveStudentsRoster(updated);
      showToast(`Đã nạp thành công ${count} học sinh từ tệp Excel vào danh sách!`);
    } catch (err: any) {
      showToast(`Lỗi xử lý file Excel: ${err?.message || 'Định dạng chưa đúng'}`, 'error');
    }
    if (studentFileInputRef.current) studentFileInputRef.current.value = '';
  };

  // =========================================================================
  // XỬ LÝ RBAC & BACKUP
  // =========================================================================
  const handleSaveRBAC = () => {
    saveRBACConfig(rbacConfig);
    showToast('Đã cập nhật và lưu cấu hình Phân quyền RBAC thành công!');
  };

  const handleBackupAllData = () => {
    const backupData = {
      appName: 'PhysiXam THPT Hùng Vương',
      exportedAt: new Date().toISOString(),
      teachers,
      students,
      rbacConfig,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sao_Luu_Quan_Tri_PhysiXam_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file sao lưu dữ liệu toàn hệ thống (.json)!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast thông báo nhanh */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-3 duration-200 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-500' 
            : 'bg-rose-600 text-white border-rose-500'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* THANH TIÊU ĐỀ PANEL 6 & THÔNG TIN ADMIN */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                PANEL 6
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                QUẢN TRỊ HỆ THỐNG & PHÂN QUYỀN (WEB & USER ADMINISTRATION)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân quyền vai trò RBAC cho Giáo viên, quản lý danh sách học sinh theo lớp và nhập liệu từ Excel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={handleBackupAllData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
            title="Sao lưu toàn bộ danh sách giáo viên, học sinh và phân quyền ra file JSON"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sao lưu dữ liệu</span>
          </button>

          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Trang chủ</span>
            </button>
          )}
        </div>
      </div>

      {/* THANH CHUYỂN 3 SUB-TAB PANEL 6 */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'teachers'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tab 6.1: Danh sách Giáo viên & Đồng nghiệp ({teachers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'students'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Tab 6.2: Danh sách Học sinh theo Lớp ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rbac')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'rbac'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Tab 6.3: Cấu hình Phân quyền (RBAC)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-2xs text-slate-500 font-bold px-3 py-1 bg-slate-50 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Admin: Thầy Hùng (hung1979hv@gmail.com)</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* NỘI DUNG TAB 6.1: DANH SÁCH GIÁO VIÊN & ĐỒNG NGHIỆP                    */}
      {/* ===================================================================== */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          
          {/* Thanh công cụ thao tác & tìm kiếm */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="Tìm theo họ tên hoặc email..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 outline-none"
                />
              </div>

              <select
                value={teacherRoleFilter}
                onChange={(e) => setTeacherRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 font-bold text-slate-700 outline-none"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Quản trị viên (Admin)</option>
                <option value="subject_teacher">Giáo viên bộ môn</option>
                <option value="exam_proctor">Giáo viên coi thi</option>
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <input 
                type="file" 
                ref={teacherFileInputRef} 
                onChange={handleImportTeachersFile} 
                accept=".xlsx, .xls" 
                className="hidden" 
              />

              <button
                type="button"
                onClick={() => teacherFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer shadow-2xs"
                title="Nhập hàng loạt giáo viên từ tệp Excel"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>📥 Nhập từ Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={downloadTeacherTemplateExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                title="Tải tệp Excel mẫu với các cột [Họ tên, Email, Vai trò]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>Tải mẫu Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddTeacherModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Giáo viên</span>
              </button>
            </div>
          </div>

          {/* Bảng danh sách giáo viên */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-3xs">
                  <tr>
                    <th className="py-3 px-4">STT</th>
                    <th className="py-3 px-4">Họ và tên giáo viên</th>
                    <th className="py-3 px-4">Email / Tên đăng nhập</th>
                    <th className="py-3 px-4">Vai trò phân quyền</th>
                    <th className="py-3 px-4">Bộ môn / Nhiệm vụ</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Không tìm thấy giáo viên nào phù hợp với bộ lọc tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{t.fullName}</div>
                          <div className="text-3xs text-slate-400">Tham gia: {t.createdAt}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-700 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{t.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {t.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                              <ShieldCheck className="w-3 h-3 text-rose-600" />
                              Quản trị viên (Admin)
                            </span>
                          ) : t.role === 'subject_teacher' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Giáo viên bộ môn
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Giáo viên coi thi
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {t.assignedSubject || 'Vật lí THPT'}
                        </td>
                        <td className="py-3 px-4">
                          {t.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <Lock className="w-3 h-3 text-slate-400" />
                              Đang khóa
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleTeacherStatus(t.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                            title={t.status === 'active' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                          >
                            {t.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(t.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Xóa giáo viên"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* NỘI DUNG TAB 6.2: DANH SÁCH HỌC SINH THEO LỚP                         */}
      {/* ===================================================================== */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          
          {/* Thanh lọc theo lớp & thao tác */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedClass('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedClass === 'all' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({students.length})
                </button>
                {availableClasses.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedClass === cls ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Lớp {cls} ({students.filter((s) => s.studentClass === cls).length})
                  </button>
                ))}
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Tìm tên, lớp hoặc SBD..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <input 
                type="file" 
                ref={studentFileInputRef} 
                onChange={handleImportStudentsFile} 
                accept=".xlsx, .xls" 
                className="hidden" 
              />

              <button
                type="button"
                onClick={() => studentFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer shadow-2xs"
                title="Nhập danh sách học sinh từ file Excel"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>📥 Nhập từ Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={downloadStudentTemplateExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                title="Tải tệp mẫu [STT, Họ và tên, Lớp, Số báo danh]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>Tải mẫu Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddStudentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Học sinh</span>
              </button>
            </div>
          </div>

          {/* Ghi chú tính năng tự động đối soát */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs text-indigo-950 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Tự động nhận diện & Đối soát:</strong> Khi học sinh truy cập Cửa sổ vào thi và nhập Họ tên kèm Lớp, hệ thống sẽ tự động tra cứu danh sách này để điền chính xác Số báo danh (SBD) và đóng dấu bản quyền bài thi.
            </span>
          </div>

          {/* Bảng danh sách học sinh */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-3xs">
                  <tr>
                    <th className="py-3 px-4">STT</th>
                    <th className="py-3 px-4">Họ và tên học sinh</th>
                    <th className="py-3 px-4">Lớp học</th>
                    <th className="py-3 px-4">Số báo danh (SBD)</th>
                    <th className="py-3 px-4">Ngày cập nhật</th>
                    <th className="py-3 px-4">Trạng thái thi</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chưa có học sinh nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 text-slate-400 font-mono">{s.stt || idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{s.fullName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-2xs">
                            {s.studentClass}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {s.candidateNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-3xs">
                          {s.importedAt}
                        </td>
                        <td className="py-3 px-4">
                          {s.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Được phép thi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Tạm khóa
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleStudentStatus(s.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                            title={s.status === 'active' ? 'Khóa quyền vào thi' : 'Mở khóa thi'}
                          >
                            {s.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(s.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Xóa học sinh khỏi danh sách"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* NỘI DUNG TAB 6.3: CẤU HÌNH PHÂN QUYỀN (RBAC)                           */}
      {/* ===================================================================== */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          
          {/* Banner định danh Quản trị viên tối cao */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                TH
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Thầy Hùng (hung1979hv@gmail.com)</h3>
                  <span className="px-2 py-0.5 rounded-md text-3xs font-extrabold bg-rose-500 text-white">
                    SUPER ADMIN
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Đơn vị: Trường THPT Hùng Vương • Toàn quyền kiểm soát tài khoản, cấu hình bảo mật và dữ liệu.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveRBAC}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu Thiết Lập Phân Quyền</span>
            </button>
          </div>

          {/* 3 Thẻ ma trận phân quyền chi tiết */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* THẺ 1: HỌC SINH */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                      HS
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">Học Sinh (Student)</h4>
                      <p className="text-3xs text-slate-500">Chế độ thi trực tuyến</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-100 text-amber-800">
                    Bị giới hạn
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs text-slate-700">
                  <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rbacConfig.studentRestrictedBank}
                      onChange={(e) => setRbacConfig({ ...rbacConfig, studentRestrictedBank: e.target.checked })}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <strong className="block text-slate-900 font-bold">Khóa truy cập Ngân hàng đề:</strong>
                      <span className="text-2xs text-slate-500">
                        TUYỆT ĐỐI KHÔNG được xem Ngân hàng đề, không chỉnh sửa câu hỏi hay xem ma trận đáp án.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rbacConfig.studentOnlyTakeAndSelfResult}
                      onChange={(e) => setRbacConfig({ ...rbacConfig, studentOnlyTakeAndSelfResult: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <strong className="block text-slate-900 font-bold">Chỉ làm bài & Xem bài của mình:</strong>
                      <span className="text-2xs text-slate-500">
                        Chỉ được làm bài thi được giao và xem kết quả của chính mình sau khi nộp.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rbacConfig.requireRosterEnrollment}
                      onChange={(e) => setRbacConfig({ ...rbacConfig, requireRosterEnrollment: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <strong className="block text-slate-900 font-bold">Bắt buộc có tên trong danh sách:</strong>
                      <span className="text-2xs text-slate-500">
                        Thí sinh phải có tên và số báo danh hợp lệ trong danh sách lớp được import mới được tính điểm.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl text-3xs text-amber-900 font-medium">
                🛡️ Quyền học sinh được bảo vệ tự động bằng cơ chế Zero-Cookie an toàn.
              </div>
            </div>

            {/* THẺ 2: GIÁO VIÊN BỘ MÔN & COI THI */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      GV
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">Giáo Viên (Teacher)</h4>
                      <p className="text-3xs text-slate-500">Bộ môn & Khảo thí</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-indigo-100 text-indigo-800">
                    Toàn quyền sư phạm
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs text-slate-700">
                  <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rbacConfig.teacherFullExamAccess}
                      onChange={(e) => setRbacConfig({ ...rbacConfig, teacherFullExamAccess: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <strong className="block text-slate-900 font-bold">Toàn quyền Ngân hàng đề:</strong>
                      <span className="text-2xs text-slate-500">
                        Truy cập toàn bộ kho đề GDPT 2018, soạn đề mới, bóc tách Word sang JSON.
                      </span>
                    </div>
                  </label>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="block text-slate-900 font-bold">Trộn đề & Xuất mã đề:</strong>
                    <span className="text-2xs text-slate-500">
                      Sinh các mã đề 101, 102, 103, 104, tải trọn bộ gói ZIP in ấn và file chấm TN Maker.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="block text-slate-900 font-bold">Xem bảng điểm & Phổ điểm:</strong>
                    <span className="text-2xs text-slate-500">
                      Xem nhật ký vi phạm, phổ điểm phân bố và xuất bảng điểm Microsoft Excel (.xlsx).
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-indigo-50 rounded-xl text-3xs text-indigo-900 font-medium">
                📘 Giáo viên chỉ được sửa đề và học sinh trong phạm vi khối/lớp phụ trách.
              </div>
            </div>

            {/* THẺ 3: QUẢN TRỊ VIÊN (ADMIN - THẦY HÙNG) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                      AD
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">Quản Trị Viên (Admin)</h4>
                      <p className="text-3xs text-slate-500">Thầy Hùng phụ trách</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-rose-100 text-rose-800">
                    Toàn quyền hệ thống
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs text-slate-700">
                  <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rbacConfig.adminFullSystemControl}
                      onChange={(e) => setRbacConfig({ ...rbacConfig, adminFullSystemControl: e.target.checked })}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <strong className="block text-slate-900 font-bold">Toàn quyền cấu hình hệ thống:</strong>
                      <span className="text-2xs text-slate-500">
                        Duyệt tài khoản giáo viên, phân quyền RBAC và kích hoạt các chính sách khảo thí.
                      </span>
                    </div>
                  </label>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="block text-slate-900 font-bold">Sao lưu & Khôi phục dữ liệu:</strong>
                    <span className="text-2xs text-slate-500">
                      Sao lưu toàn bộ ngân hàng đề, bảng điểm và nhật ký giám sát ra tệp JSON dự phòng.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <strong className="block text-slate-900 font-bold">Quyền cấp cao:</strong>
                    <span className="text-2xs text-slate-500">
                      Khóa hoặc mở khóa quyền vào thi của bất kỳ học sinh hoặc giáo viên nào.
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveRBAC}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer text-center"
              >
                Cập nhật cấu hình Phân quyền
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL THÊM GIÁO VIÊN MỚI                                               */}
      {/* ===================================================================== */}
      {isAddTeacherModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-600" />
                <span>Thêm Giáo Viên / Đồng Nghiệp</span>
              </h3>
              <button
                onClick={() => setIsAddTeacherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                  Họ và tên giáo viên: *
                </label>
                <input
                  type="text"
                  required
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="Ví dụ: Thầy Trần Minh Tuấn"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:bg-white focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                  Email / Tên đăng nhập:
                </label>
                <input
                  type="email"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  placeholder="tuantran@hungvuong.edu.vn"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono focus:bg-white focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                  Vai trò phân quyền: *
                </label>
                <select
                  value={newTeacherRole}
                  onChange={(e) => setNewTeacherRole(e.target.value as TeacherUser['role'])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold focus:bg-white focus:border-rose-500 outline-none"
                >
                  <option value="subject_teacher">Giáo viên bộ môn Vật lí</option>
                  <option value="exam_proctor">Giáo viên coi thi & Giám sát</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                  Bộ môn / Nhiệm vụ phụ trách:
                </label>
                <input
                  type="text"
                  value={newTeacherSubject}
                  onChange={(e) => setNewTeacherSubject(e.target.value)}
                  placeholder="Vật lí 12 (Nhiệt & Khí)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition cursor-pointer"
                >
                  Thêm giáo viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL THÊM HỌC SINH MỚI                                               */}
      {/* ===================================================================== */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-rose-600" />
                <span>Thêm Học Sinh Vào Danh Sách Lớp</span>
              </h3>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                  Họ và tên học sinh: *
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Nam"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:bg-white focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                  Lớp học: *
                </label>
                <input
                  type="text"
                  required
                  value={newStudentClass}
                  onChange={(e) => setNewStudentClass(e.target.value)}
                  placeholder="Ví dụ: 12A1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold focus:bg-white focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                  Số báo danh (SBD):
                </label>
                <input
                  type="text"
                  value={newStudentSbd}
                  onChange={(e) => setNewStudentSbd(e.target.value)}
                  placeholder="SBD-12099 (tùy chọn, để trống sẽ tự sinh)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono focus:bg-white focus:border-rose-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition cursor-pointer"
                >
                  Thêm học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
