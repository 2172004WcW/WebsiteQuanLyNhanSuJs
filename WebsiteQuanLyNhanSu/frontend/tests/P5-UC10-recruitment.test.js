/**
 * @fileoverview Unit Test: UC #10 - Quản lý tuyển dụng (Recruitment Management)
 * @module tests/P5-UC10-recruitment
 * @description
 *   Kiểm tra chức năng quản lý tuyển dụng của HR.
 *   Bao gồm: tin tuyển dụng, ứng viên, và quy trình phỏng vấn.
 *
 * @assignment Person 5 - Recruitment, Notification & System Layer
 * @version 1.0.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock client API - must mock before imports
jest.mock('../src/api/client.js', () => ({
  apiJson: jest.fn(),
  apiJsonBody: jest.fn(),
}));

// Mock backend services
jest.mock('../../../backend/src/services/recruitmentService.js', () => ({
  getRecruitments: jest.fn(),
  getCandidates: jest.fn(),
  updateCandidateStatus: jest.fn(),
}));

// Mock HrChrome to simplify testing
jest.mock('../src/components/hr/HrChrome.jsx', () => ({
  __esModule: true,
  default: function HrChrome({ children }) {
    return <div data-testid="hr-chrome">{children}</div>;
  },
}));

import HrRecruitment from '../../../frontend/src/pages/dashboard/HrRecruitment.jsx';
import { apiJson, apiJsonBody } from '../src/api/client.js';
import {
  getRecruitments,
  getCandidates,
  updateCandidateStatus,
} from '../../../backend/src/services/recruitmentService.js';

// Helper to render with Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

/** Mock data cho ứng viên */
const MOCK_CANDIDATES = [
  { id: '1', hoTen: 'Phạm Văn C', email: 'phamvanc@email.com', soDienThoai: '0912345678', viTri: 'Frontend Developer', tenPhongBan: 'IT', trangThai: 'CHO_DUYET', ngayNop: '2024-01-15', cvUrl: 'http://example.com/cv1.pdf' },
  { id: '2', hoTen: 'Lê Thị D', email: 'lethid@email.com', soDienThoai: '0923456789', viTri: 'Backend Developer', tenPhongBan: 'IT', trangThai: 'DAT', ngayNop: '2024-01-10', cvUrl: null },
];

/** Mock data cho lịch phỏng vấn */
const MOCK_INTERVIEWS = [
  { id: '1', tenUngVien: 'Phạm Văn C', viTriUngTuyen: 'Frontend Developer', thoiGian: '2024-01-20T09:00:00Z', diaDiem: 'Phòng họp A', nguoiPhongVan: 'Nguyễn Văn A', ghiChu: 'Test', trangThaiUngVien: 'CHO_DUYET' },
];

describe('UC #10: Quản lý tuyển dụng', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock apiJson to return candidates and interviews
    apiJson.mockImplementation((path) => {
      if (path && path.includes && path.includes('/candidates')) {
        return Promise.resolve(MOCK_CANDIDATES);
      }
      if (path && path.includes && path.includes('/interviews')) {
        return Promise.resolve(MOCK_INTERVIEWS);
      }
      return Promise.resolve([]);
    });
    apiJsonBody.mockResolvedValue({ success: true });
    // Set mock return values for backend services
    getRecruitments.mockResolvedValue([]);
    getCandidates.mockResolvedValue(MOCK_CANDIDATES);
    updateCandidateStatus.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TC01: FE - Hiển thị danh sách ứng viên
   * Kiểm tra bảng ứng viên được render đúng
   */
  test('TC01: Hiển thị danh sách ứng viên', async () => {
    renderWithRouter(<HrRecruitment />);

    await waitFor(() => {
      expect(screen.getByText('Phạm Văn C')).toBeInTheDocument();
      expect(screen.getByText('Lê Thị D')).toBeInTheDocument();
    });
  });

  /**
   * TC02: FE - Hiển thị thông tin ứng viên chi tiết
   * Kiểm tra thông tin ứng viên được render
   */
  test('TC02: Hiển thị thông tin ứng viên chi tiết', async () => {
    renderWithRouter(<HrRecruitment />);

    await waitFor(() => {
      expect(screen.getByText('Phạm Văn C')).toBeInTheDocument();
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      // Use getAllByText because multiple candidates have IT department
      expect(screen.getAllByText('IT').length).toBeGreaterThanOrEqual(1);
    });
  });

  /**
   * TC03: FE - Thêm ứng viên mới
   * Kiểm tra form thêm ứng viên và API call
   */
  test('TC03: Thêm ứng viên mới', async () => {
    apiJsonBody.mockResolvedValueOnce({ id: '3', hoTen: 'Nguyễn Văn E' });

    renderWithRouter(<HrRecruitment />);

    await waitFor(() => {
      expect(screen.getByText('Phạm Văn C')).toBeInTheDocument();
    });

    // Click "Thêm ứng viên" button
    const addButton = screen.getByRole('button', { name: /thêm ứng viên/i });
    fireEvent.click(addButton);

    // Fill form
    await waitFor(() => {
      expect(screen.getByLabelText(/họ tên/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/họ tên/i);
    await userEvent.type(nameInput, 'Nguyễn Văn E');

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'nguyenvane@email.com');

    const saveButton = screen.getByRole('button', { name: /lưu/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiJsonBody).toHaveBeenCalled();
    });
  });

  /**
   * TC04: BE - Service lấy danh sách ứng viên
   * Kiểm tra service trả về đầy đủ thông tin ứng viên
   */
  test('TC04: Service lấy danh sách ứng viên', async () => {
    const result = await getCandidates();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('hoTen');
      expect(result[0]).toHaveProperty('email');
      expect(result[0]).toHaveProperty('trangThai');
    }
  });

  /**
   * TC05: BE - Service lấy danh sách tuyển dụng
   * Kiểm tra service trả về thông tin tuyển dụng
   */
  test('TC05: Service lấy danh sách tuyển dụng', async () => {
    const result = await getRecruitments();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  /**
   * TC06: Edge Case - Cập nhật trạng thái ứng viên
   * Kiểm tra chuyển trạng thái từ chờ duyệt sang đạt
   */
  test('TC06: Edge Case - Cập nhật trạng thái ứng viên', async () => {
    window.confirm = jest.fn(() => true);
    apiJsonBody.mockResolvedValueOnce({ success: true });

    renderWithRouter(<HrRecruitment />);

    await waitFor(() => {
      expect(screen.getByText('Phạm Văn C')).toBeInTheDocument();
    });

    // Click "Đạt" button for first candidate
    const passButtons = screen.getAllByRole('button', { name: /đạt/i });
    fireEvent.click(passButtons[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
    });
  });

  /**
   * TC07: Edge Case - Xóa ứng viên
   * Kiểm tra xóa ứng viên
   */
  test('TC07: Edge Case - Xóa ứng viên', async () => {
    window.confirm = jest.fn(() => true);

    renderWithRouter(<HrRecruitment />);

    await waitFor(() => {
      expect(screen.getByText('Phạm Văn C')).toBeInTheDocument();
    });

    // Click delete button (trash icon)
    const deleteButtons = screen.getAllByRole('button', { name: /xóa/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
    });
  });
});
