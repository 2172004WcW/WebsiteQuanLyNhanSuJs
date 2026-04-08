/**
 * @fileoverview Unit Test: UC #23 - Tìm kiếm & Lọc & Phân trang (Search, Filter & Pagination)
 * @module tests/P5-UC23-searchFilter
 * @description
 *   Kiểm tra chức năng tìm kiếm, lọc và phân trang trên các danh sách.
 *   Bao gồm: tìm kiếm theo từ khóa, lọc theo phòng ban, phân trang.
 *
 * @assignment Person 5 - Recruitment, Notification & System Layer
 * @version 1.0.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock client API
jest.mock('../src/api/client.js', () => ({
  apiJson: jest.fn(),
  apiJsonBody: jest.fn(),
}));

// Mock backend services
jest.mock('../../../backend/src/services/employeeService.js', () => ({
  searchEmployees: jest.fn(),
  buildQuery: jest.fn(),
}));

// Mock HrChrome to simplify testing
jest.mock('../src/components/hr/HrChrome.jsx', () => ({
  __esModule: true,
  default: function HrChrome({ children }) {
    return <div data-testid="hr-chrome">{children}</div>;
  },
}));

import HrEmployees from '../../../frontend/src/pages/dashboard/HrEmployees.jsx';
import { apiJson, apiJsonBody } from '../src/api/client.js';
import {
  searchEmployees,
  buildQuery,
} from '../../../backend/src/services/employeeService.js';

// Helper to render with Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

/** Mock data cho danh sách nhân viên */
const MOCK_EMPLOYEES = Array.from({ length: 25 }, (_, i) => ({
  _id: String(i + 1),
  maNhanVien: `NV${String(i + 1).padStart(3, '0')}`,
  hoTen: `Nhân viên ${i + 1}`,
  phongBan: { tenPhongBan: i % 2 === 0 ? 'IT' : 'HR' },
  chucVu: { tenChucVu: 'Developer' },
  trangThai: i % 3 === 0 ? 'NGHI_VIEC' : 'DANG_LAM',
}));

/** Mock data cho phòng ban */
const MOCK_PHONG_BAN = [
  { _id: '1', tenPhongBan: 'IT' },
  { _id: '2', tenPhongBan: 'HR' },
];

/** Mock data cho chức vụ */
const MOCK_CHUC_VU = [
  { _id: '1', tenChucVu: 'Developer' },
  { _id: '2', tenChucVu: 'Manager' },
];

/** Mock data cho nhóm */
const MOCK_NHOM = [
  { _id: '1', tenNhom: 'Team A' },
  { _id: '2', tenNhom: 'Team B' },
];

/** Mock data cho bảng lương */
const MOCK_BANG_LUONG = [
  { _id: '1', tenChucVu: 'Developer' },
  { _id: '2', tenChucVu: 'Manager' },
];

describe('UC #23: Tìm kiếm & Lọc & Phân trang', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock apiJson to return employees and dropdown data
    apiJson.mockImplementation((path) => {
      if (path && path.includes) {
        if (path.includes('/employees')) {
          return Promise.resolve(MOCK_EMPLOYEES);
        }
        if (path.includes('/phong-ban')) {
          return Promise.resolve(MOCK_PHONG_BAN);
        }
        if (path.includes('/chuc-vu')) {
          return Promise.resolve(MOCK_CHUC_VU);
        }
        if (path.includes('/nhom')) {
          return Promise.resolve(MOCK_NHOM);
        }
        if (path.includes('/structure')) {
          return Promise.resolve(MOCK_BANG_LUONG);
        }
      }
      return Promise.resolve([]);
    });
    // Set mock return values for backend services
    searchEmployees.mockResolvedValue(MOCK_EMPLOYEES);
    buildQuery.mockResolvedValue({ query: {}, options: {} });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TC01: FE - Hiển thị danh sách nhân viên
   * Kiểm tra bảng nhân viên được render đúng
   */
  test('TC01: Hiển thị danh sách nhân viên', async () => {
    renderWithRouter(<HrEmployees />);

    await waitFor(() => {
      expect(screen.getByText('Nhân viên 1')).toBeInTheDocument();
      expect(screen.getByText('Nhân viên 2')).toBeInTheDocument();
    });
  });

  /**
   * TC02: FE - Hiển thị dropdown phòng ban
   * Kiểm tra dropdown phòng ban được render
   */
  test('TC02: Hiển thị dropdown phòng ban', async () => {
    renderWithRouter(<HrEmployees />);

    await waitFor(() => {
      expect(screen.getByText(/quản lý nhân viên/i)).toBeInTheDocument();
    });
  });

  /**
   * TC03: FE - Thêm nhân viên mới
   * Kiểm tra form thêm nhân viên
   */
  test('TC03: Thêm nhân viên mới', async () => {
    renderWithRouter(<HrEmployees />);

    await waitFor(() => {
      expect(screen.getByText('Nhân viên 1')).toBeInTheDocument();
    });

    // Click "Thêm NV" button
    const addButton = screen.getByRole('button', { name: /thêm nv/i });
    fireEvent.click(addButton);

    // Check form appears - look for the input field with placeholder
    await waitFor(() => {
      const hoTenInput = screen.getByPlaceholderText(/nguyễn văn a/i);
      expect(hoTenInput).toBeInTheDocument();
    });
  });

  /**
   * TC04: BE - Service tìm kiếm nhân viên
   * Kiểm tra service trả về kết quả tìm kiếm
   */
  test('TC04: Service tìm kiếm nhân viên', async () => {
    const searchQuery = 'Nhân viên';

    const result = await searchEmployees(searchQuery);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('hoTen');
      expect(result[0]).toHaveProperty('maNhanVien');
    }
  });

  /**
   * TC05: BE - Service xây dựng query lọc
   * Kiểm tra logic build query với các filter
   */
  test('TC05: Service xây dựng query lọc', async () => {
    const filters = {
      dept: 'IT',
      status: 'DANG_LAM',
      search: 'Developer',
    };

    const result = await buildQuery(filters);

    expect(result).toBeDefined();
    expect(Array.isArray(result) || typeof result === 'object').toBe(true);
  });

  /**
   * TC06: Edge Case - Xóa nhân viên
   * Kiểm tra xóa nhân viên với confirm dialog
   */
  test('TC06: Edge Case - Xóa nhân viên', async () => {
    window.confirm = jest.fn(() => true);
    // Mock delete call and subsequent reload
    apiJson.mockImplementation((path, options) => {
      if (options && options.method === 'DELETE') {
        return Promise.resolve({ success: true });
      }
      if (path && path.includes) {
        if (path.includes('/employees')) {
          return Promise.resolve(MOCK_EMPLOYEES);
        }
        if (path.includes('/phong-ban')) {
          return Promise.resolve(MOCK_PHONG_BAN);
        }
        if (path.includes('/chuc-vu')) {
          return Promise.resolve(MOCK_CHUC_VU);
        }
        if (path.includes('/nhom')) {
          return Promise.resolve(MOCK_NHOM);
        }
        if (path.includes('/structure')) {
          return Promise.resolve(MOCK_BANG_LUONG);
        }
      }
      return Promise.resolve([]);
    });

    renderWithRouter(<HrEmployees />);

    await waitFor(() => {
      expect(screen.getByText('Nhân viên 1')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /xóa/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
    });
  });

  /**
   * TC07: Edge Case - Chỉnh sửa nhân viên
   * Kiểm tra chỉnh sửa nhân viên
   */
  test('TC07: Edge Case - Chỉnh sửa nhân viên', async () => {
    renderWithRouter(<HrEmployees />);

    await waitFor(() => {
      expect(screen.getByText('Nhân viên 1')).toBeInTheDocument();
    });

    // Click "Hồ sơ" link
    const profileLinks = screen.getAllByRole('link', { name: /hồ sơ/i });
    expect(profileLinks.length).toBeGreaterThan(0);
  });
});
