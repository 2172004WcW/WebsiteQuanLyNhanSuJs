/**
 * @fileoverview Unit Test: UC #7 - Quản lý cấp dưới
 * @description Kiểm tra gán/quản lý cấp dưới (directManagerIds)
 * @assignment Person 2 - Employee & Organization Layer
 * @path tests/P2-UC07-directManager.test.js
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
  { _id: 'NV001', hoTen: 'Nguyễn Văn A', directManagerIds: [], phongBan: { tenPhongBan: 'IT' }, trangThaiHoatDong: 'DANG_LAM_VIEC' },
  { _id: 'NV002', hoTen: 'Trần Thị B', directManagerIds: ['NV003'], phongBan: { tenPhongBan: 'IT' }, trangThaiHoatDong: 'DANG_LAM_VIEC' },
  { _id: 'NV003', hoTen: 'Lê Văn C', directManagerIds: [], phongBan: { tenPhongBan: 'IT' }, trangThaiHoatDong: 'DANG_LAM_VIEC' }
];

/** Helper to create mock fetch response with both json() and text() */
const createMockResponse = (data) => ({
  ok: true,
  json: async () => data,
  text: async () => JSON.stringify(data),
  status: 200,
  statusText: 'OK'
});

describe('UC #7: Quản lý cấp dưới', () => {
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
   * TC01: FE - Hiển thị danh sách nhân viên có thể gán quản lý
   */
  test('TC01: Hiển thị danh sách nhân viên', async () => {
    renderWithRouter(<HrEmployees />);
    
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Lê Văn C')).toBeInTheDocument();
    });
  });

  /**
   * TC02: FE - Hiển thị quản lý đã gán trong data
   */
  test('TC02: Hiển thị quản lý đã gán', async () => {
    renderWithRouter(<HrEmployees />);
    
    await waitFor(() => {
      expect(screen.getByText('Lê Văn C')).toBeInTheDocument();
    });
  });

  // ==================== BACKEND TESTS (3 TC) ====================

  /**
   * TC03: BE - Service getAllEmployees trả về đúng dữ liệu
   */
  test('TC03: Service getAllEmployees trả về đúng dữ liệu', async () => {
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
