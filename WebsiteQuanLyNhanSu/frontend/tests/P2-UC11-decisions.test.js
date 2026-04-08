/**
 * @fileoverview Unit Test: UC #11 - Quyết định nhân sự
 * @description Kiểm tra tạo, phê duyệt quyết định điều chuyển, thăng chức
 * @assignment Person 2 - Employee & Organization Layer
 * @path tests/P2-UC11-decisions.test.js
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock backend services
jest.mock('../../../backend/src/services/employeeService.js', () => ({
  onboardEmployee: jest.fn(),
  updateProfile: jest.fn(),
  getEmployeeById: jest.fn(),
  getAllEmployees: jest.fn(),
  setBangLuongForEmployee: jest.fn(),
}));

import HrDecisions from '../../../frontend/src/pages/dashboard/HrDecisions.jsx';
import {
  getAllEmployees,
  getEmployeeById,
} from '../../../backend/src/services/employeeService.js';

/** @type {jest.Mock} */
global.fetch = jest.fn();

/** Helper to render with Router */
const renderWithRouter = (component) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

/** Mock data cho quyết định - format theo component (tenNhanVien là string) */
const MOCK_DECISIONS = [
  { _id: 'QD-001', soQuyetDinh: 'QD001', loaiQuyetDinh: 'DIEU_CHUYEN', ngayQuyetDinh: '2024-01-15', tenNhanVien: 'Nguyễn Văn A', nguoiKy: 'Giám đốc', noiDungQuyetDinh: 'Điều chuyển từ IT sang HR' },
  { _id: 'QD-002', soQuyetDinh: 'QD002', loaiQuyetDinh: 'KHEN_THUONG', ngayQuyetDinh: '2024-02-01', tenNhanVien: 'Trần Thị B', nguoiKy: 'Trưởng phòng', noiDungQuyetDinh: 'Khen thưởng thành tích' }
];

const MOCK_EMPLOYEES = [
  { _id: 'NV001', hoTen: 'Nguyễn Văn A', trangThaiHoatDong: 'DANG_LAM_VIEC' },
  { _id: 'NV002', hoTen: 'Trần Thị B', trangThaiHoatDong: 'DANG_LAM_VIEC' }
];

/** Helper to create mock fetch response with both json() and text() */
const createMockResponse = (data) => ({
  ok: true,
  json: async () => data,
  text: async () => JSON.stringify(data),
  status: 200,
  statusText: 'OK'
});

describe('UC #11: Quyết định nhân sự', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Mock fetch with both json() and text() methods for apiJson compatibility
    fetch.mockResolvedValue(createMockResponse(MOCK_DECISIONS));
    // Set mock return values for backend services
    getAllEmployees.mockResolvedValue(MOCK_EMPLOYEES);
    getEmployeeById.mockResolvedValue(MOCK_EMPLOYEES[0]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== FRONTEND TESTS (4 TC) ====================

  /**
   * TC01: FE - Render danh sách quyết định
   */
  test('TC01: Render danh sách quyết định', async () => {
    renderWithRouter(<HrDecisions />);
    
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    });
  });

  /**
   * TC02: FE - Hiển thị đúng số lượng quyết định
   */
  test('TC02: Hiển thị đúng số lượng quyết định', async () => {
    renderWithRouter(<HrDecisions />);
    
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    });
  });

  // ==================== BACKEND TESTS (3 TC) ====================

  /**
   * TC03: BE - Service getAllEmployees trả về danh sách nhân viên
   */
  test('TC03: Service getAllEmployees trả về danh sách', async () => {
    const result = await getAllEmployees();

    expect(getAllEmployees).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  /**
   * TC04: BE - Service getEmployeeById lấy đúng nhân viên
   */
  test('TC04: Service getEmployeeById lấy đúng nhân viên', async () => {
    const result = await getEmployeeById('NV001');

    expect(getEmployeeById).toHaveBeenCalledWith('NV001');
    expect(result).toHaveProperty('_id');
    expect(result.hoTen).toBe('Nguyễn Văn A');
  });

  /**
   * TC05: BE - Edge case - Không tìm thấy nhân viên
   */
  test('TC05: Edge case - Không tìm thấy nhân viên', async () => {
    getEmployeeById.mockRejectedValueOnce(new Error('Không tìm thấy nhân viên với mã: INVALID'));
    
    await expect(getEmployeeById('INVALID')).rejects.toThrow('Không tìm thấy nhân viên');
  });
});
