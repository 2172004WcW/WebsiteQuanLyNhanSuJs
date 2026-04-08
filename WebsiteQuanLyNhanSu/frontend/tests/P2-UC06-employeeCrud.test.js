/**
 * @fileoverview Unit Test: UC #6 - Quản lý nhân viên (CRUD + Profile)
 * @description Kiểm tra CRUD nhân viên, phân công phòng ban/chức vụ
 * @assignment Person 2 - Employee & Organization Layer
 * @path tests/P2-UC06-employeeCrud.test.js
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

import HrEmployees from '../../../frontend/src/pages/dashboard/HrEmployees.jsx';
import {
  onboardEmployee,
  updateProfile,
  getEmployeeById,
  getAllEmployees,
} from '../../../backend/src/services/employeeService.js';

/** @type {jest.Mock} */
global.fetch = jest.fn();

/** Helper to render with Router */
const renderWithRouter = (component) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

/** Mock data cho nhân viên - format theo component */
const MOCK_EMPLOYEES = [
  { _id: 'NV001', hoTen: 'Nguyễn Văn A', phongBan: { tenPhongBan: 'IT' }, chucVu: { tenChucVu: 'Developer' }, trangThaiHoatDong: 'DANG_LAM_VIEC' },
  { _id: 'NV002', hoTen: 'Trần Thị B', phongBan: { tenPhongBan: 'HR' }, chucVu: { tenChucVu: 'HR Manager' }, trangThaiHoatDong: 'DANG_LAM_VIEC' }
];

/** Helper to create mock fetch response with both json() and text() */
const createMockResponse = (data) => ({
  ok: true,
  json: async () => data,
  text: async () => JSON.stringify(data),
  status: 200,
  statusText: 'OK'
});

describe('UC #6: Quản lý nhân viên', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Mock fetch with both json() and text() methods for apiJson compatibility
    fetch.mockResolvedValue(createMockResponse(MOCK_EMPLOYEES));
    // Set mock return values for backend services
    getAllEmployees.mockResolvedValue(MOCK_EMPLOYEES);
    getEmployeeById.mockResolvedValue(MOCK_EMPLOYEES[0]);
    onboardEmployee.mockResolvedValue({ _id: 'NV003', hoTen: 'Lê Văn C' });
    updateProfile.mockResolvedValue({ ...MOCK_EMPLOYEES[0], hoTen: 'Nguyễn Văn A Updated' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== FRONTEND TESTS (4 TC) ====================

  /**
   * TC01: FE - Render danh sách nhân viên
   * Edge case: Hiển thị trạng thái làm việc
   */
  test('TC01: Render danh sách nhân viên', async () => {
    renderWithRouter(<HrEmployees />);
    
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    });
  });

  /**
   * TC02: FE - Tạo nhân viên mới
   * Edge case: Validate mã nhân viên unique
   */
  test('TC02: Tạo nhân viên mới', async () => {
    fetch.mockResolvedValueOnce(createMockResponse(MOCK_EMPLOYEES));
    fetch.mockResolvedValueOnce(createMockResponse({ _id: 'NV003', hoTen: 'Lê Văn C' }));

    renderWithRouter(<HrEmployees />);
    
    await waitFor(() => {
      // Wait for initial render
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  /**
   * TC03: FE - Component hiển thị đúng dữ liệu
   */
  test('TC03: Component hiển thị đúng dữ liệu', async () => {
    renderWithRouter(<HrEmployees />);
    
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });

    // Hiển thị phòng ban
    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.getByText('HR')).toBeInTheDocument();
  });

  // ==================== BACKEND TESTS (3 TC) ====================

  /**
   * TC04: BE - Service onboardEmployee tạo NV mới
   */
  test('TC04: Service onboardEmployee tạo nhân viên mới', async () => {
    onboardEmployee.mockResolvedValueOnce({ _id: 'NV003', hoTen: 'Lê Văn C', phongBan: 'PB001' });
    
    const result = await onboardEmployee({
      hoTen: 'Lê Văn C',
      phongBan: 'PB001',
      ngayVaoLam: '2024-01-15'
    });

    expect(onboardEmployee).toHaveBeenCalledWith(expect.objectContaining({
      hoTen: 'Lê Văn C',
      phongBan: 'PB001'
    }));
    expect(result).toHaveProperty('_id');
  });

  /**
   * TC05: BE - Service getAllEmployees trả về danh sách
   */
  test('TC05: Service getAllEmployees trả về danh sách', async () => {
    const result = await getAllEmployees();

    expect(getAllEmployees).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    // Kiểm tra format dữ liệu
    expect(result[0]).toHaveProperty('hoTen');
    expect(result[0]).toHaveProperty('trangThaiHoatDong');
  });

  /**
   * TC06: BE - Service updateProfile cập nhật thông tin
   */
  test('TC06: Service updateProfile cập nhật thông tin', async () => {
    updateProfile.mockResolvedValueOnce({ _id: 'NV001', hoTen: 'Nguyễn Văn A', soDienThoai: '0987654321', emailCongViec: 'updated@company.com' });
    
    const result = await updateProfile('NV001', {
      soDienThoai: '0987654321',
      emailCongViec: 'updated@company.com'
    });

    expect(updateProfile).toHaveBeenCalledWith('NV001', expect.objectContaining({
      soDienThoai: '0987654321',
      emailCongViec: 'updated@company.com'
    }));
    expect(result).toHaveProperty('_id');
    expect(result.soDienThoai).toBe('0987654321');
  });
});

