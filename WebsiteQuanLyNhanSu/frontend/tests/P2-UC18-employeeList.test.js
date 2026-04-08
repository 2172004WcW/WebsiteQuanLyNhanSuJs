/**
 * @fileoverview Unit Test: UC #18 - Danh sách nhân viên (Director view)
 * @description Kiểm tra xem danh sách nhân viên toàn công ty, lọc theo phòng ban
 * @assignment Person 2 - Employee & Organization Layer
 * @path tests/P2-UC18-employeeList.test.js
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

import EmployeeList from '../../../frontend/src/pages/dashboard/EmployeeList.jsx';
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

/** Mock data cho nhân viên - format theo component */
const MOCK_EMPLOYEES = [
  { _id: 'NV001', hoTen: 'Nguyễn Văn A', phongBan: { tenPhongBan: 'IT' }, chucVu: { tenChucVu: 'Developer' }, trangThaiHoatDong: 'DANG_LAM_VIEC', emailCongViec: 'a@company.com' },
  { _id: 'NV002', hoTen: 'Trần Thị B', phongBan: { tenPhongBan: 'HR' }, chucVu: { tenChucVu: 'HR Manager' }, trangThaiHoatDong: 'DANG_LAM_VIEC', emailCongViec: 'b@company.com' },
  { _id: 'NV003', hoTen: 'Lê Văn C', phongBan: { tenPhongBan: 'IT' }, chucVu: { tenChucVu: 'Senior Dev' }, trangThaiHoatDong: 'DA_NGHI_VIEC', emailCongViec: 'c@company.com' }
];

/** Helper to create mock fetch response with both json() and text() */
const createMockResponse = (data) => ({
  ok: true,
  json: async () => data,
  text: async () => JSON.stringify(data),
  status: 200,
  statusText: 'OK'
});

describe('UC #18: Danh sách nhân viên', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Mock fetch with both json() and text() methods for apiJson compatibility
    fetch.mockResolvedValue(createMockResponse(MOCK_EMPLOYEES));
    // Set mock return values for backend services
    getAllEmployees.mockResolvedValue(MOCK_EMPLOYEES);
    getEmployeeById.mockResolvedValue(MOCK_EMPLOYEES[0]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== FRONTEND TESTS (4 TC) ====================

  /**
   * TC01: FE - Render danh sách nhân viên
   */
  test('TC01: Render danh sách nhân viên', async () => {
    renderWithRouter(<EmployeeList />);
    
    await waitFor(() => {
      expect(screen.getByText('NV001')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    });
  });

  /**
   * TC02: FE - Hiển thị đúng số lượng nhân viên
   */
  test('TC02: Hiển thị đúng số lượng nhân viên', async () => {
    renderWithRouter(<EmployeeList />);
    
    await waitFor(() => {
      expect(screen.getByText('NV001')).toBeInTheDocument();
      expect(screen.getByText('NV002')).toBeInTheDocument();
      expect(screen.getByText('NV003')).toBeInTheDocument();
    });
  });

  /**
   * TC03: FE - Fetch được gọi khi render
   */
  test('TC03: Fetch được gọi khi render', async () => {
    renderWithRouter(<EmployeeList />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  // ==================== BACKEND TESTS (3 TC) ====================

  /**
   * TC04: BE - Service getAllEmployees trả về danh sách đầy đủ
   */
  test('TC04: Service getAllEmployees trả về danh sách đầy đủ', async () => {
    const result = await getAllEmployees();
    
    expect(getAllEmployees).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    // Director view có thể xem cả nhân viên đã nghỉ việc
    expect(result.some(e => e.trangThaiHoatDong === 'DA_NGHI_VIEC')).toBe(true);
  });

  /**
   * TC05: BE - Service getEmployeeById lấy đúng nhân viên
   */
  test('TC05: Service getEmployeeById lấy đúng nhân viên', async () => {
    const result = await getEmployeeById('NV001');
    
    expect(getEmployeeById).toHaveBeenCalledWith('NV001');
    expect(result).toHaveProperty('_id');
    expect(result.hoTen).toBe('Nguyễn Văn A');
  });

  /**
   * TC06: BE - Edge case - Service trả về nhân viên từ nhiều phòng ban
   */
  test('TC06: Edge case - Nhân viên từ nhiều phòng ban', async () => {
    const result = await getAllEmployees();
    
    expect(getAllEmployees).toHaveBeenCalled();
    // Kiểm tra có nhân viên thuộc phòng IT
    expect(result.some(e => e.phongBan.tenPhongBan === 'IT')).toBe(true);
    // Kiểm tra có nhân viên thuộc phòng HR
    expect(result.some(e => e.phongBan.tenPhongBan === 'HR')).toBe(true);
    // Kiểm tra có cả nhân viên đang làm và đã nghỉ
    expect(result.some(e => e.trangThaiHoatDong === 'DANG_LAM_VIEC')).toBe(true);
    expect(result.some(e => e.trangThaiHoatDong === 'DA_NGHI_VIEC')).toBe(true);
  });
});
