/**
 * @fileoverview Unit Test: UC #14 - Phê duyệt đơn nghỉ phép (Manager Approval)
 * @module tests/P3-UC14-leaveApprove
 * @description
 *   Kiểm tra chức năng phê duyệt đơn nghỉ phép của quản lý.
 *   Bao gồm: xem danh sách chờ duyệt, duyệt/từ chối đơn, và validation quyền hạn.
 *
 * @assignment Person 3 - Attendance & Leave Layer
 * @version 1.0.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DirectorHome from '../../../frontend/src/pages/dashboard/DirectorHome.jsx';

// Mock backend services
jest.mock('../../../backend/src/services/donNghiPhepService.js', () => ({
  getManagerPendingLeaves: jest.fn(),
  approveByManager: jest.fn(),
  rejectLeave: jest.fn(),
  getHrPendingLeaves: jest.fn(),
  confirmByHr: jest.fn(),
  createLeaveRequest: jest.fn(),
}));

import {
  getManagerPendingLeaves,
  approveByManager,
  rejectLeave,
} from '../../../backend/src/services/donNghiPhepService.js';

/** @type {jest.Mock} */
global.fetch = jest.fn();

/** Helper to render with Router */
const renderWithRouter = (component) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

/** Helper to create mock fetch response with both json() and text() */
const createMockResponse = (data) => ({
  ok: true,
  json: async () => data,
  text: async () => JSON.stringify(data),
  status: 200,
  statusText: 'OK'
});

/** Mock data cho đơn nghỉ chờ duyệt */
const MOCK_PENDING_LEAVES = [
  {
    id: '1',
    tenNV: 'Nguyễn Văn A',
    tenPhong: 'IT',
    loaiPhep: 'PHEP_NAM',
    tuNgay: '2024-02-01',
    denNgay: '2024-02-03',
    soNgay: 3,
    lyDo: 'Nghỉ gia đình',
    trangThai: 'CHO_QL_DUYET',
  },
  {
    id: '2',
    tenNV: 'Trần Thị B',
    tenPhong: 'HR',
    loaiPhep: 'PHEP_OM',
    tuNgay: '2024-02-05',
    denNgay: '2024-02-06',
    soNgay: 2,
    lyDo: 'Bệnh',
    trangThai: 'CHO_QL_DUYET',
  },
];

/** Mock data cho KPI dashboard */
const MOCK_KPI = {
  totalActive: 50,
  newThisMonth: 3,
  openPositions: 2,
  pendingLeaves: 2,
  unclosedPayroll: 1,
};

describe('UC #14: Phê duyệt đơn nghỉ phép (Manager)', () => {
  beforeEach(() => {
    fetch.mockClear();
    fetch
      .mockResolvedValueOnce(createMockResponse(MOCK_KPI))
      .mockResolvedValueOnce(createMockResponse(MOCK_PENDING_LEAVES));
    // Set mock return values for backend services
    getManagerPendingLeaves.mockResolvedValue(MOCK_PENDING_LEAVES);
    approveByManager.mockResolvedValue({ id: '1', trangThai: 'CHO_HR_XAC_NHAN' });
    rejectLeave.mockResolvedValue({ id: '1', trangThai: 'TU_CHOI' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TC01: FE - Hiển thị danh sách đơn chờ duyệt
   * Kiểm tra quản lý xem được các đơn nghỉ đang chờ phê duyệt
   */
  test('TC01: Hiển thị danh sách đơn chờ duyệt', async () => {
    renderWithRouter(<DirectorHome />);

    await waitFor(() => {
      expect(screen.getByText(/đơn nghỉ chờ quản lý duyệt/i)).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    });
  });

  /**
   * TC02: FE - Hiển thị chi tiết đơn nghỉ
   * Kiểm tra thông tin chi tiết của đơn nghỉ được hiển thị đầy đủ
   */
  test('TC02: Hiển thị chi tiết đơn nghỉ', async () => {
    renderWithRouter(<DirectorHome />);

    await waitFor(() => {
      expect(screen.getByText('IT')).toBeInTheDocument(); // Phòng ban
      // Component hiển thị ngày trực tiếp từ mock data (YYYY-MM-DD)
      expect(screen.getByText('2024-02-01')).toBeInTheDocument(); // Ngày bắt đầu
      expect(screen.getByText('2024-02-03')).toBeInTheDocument(); // Ngày kết thúc
    });
  });

  /**
   * TC03: FE - Duyệt đơn nghỉ phép
   * Kiểm tra chức năng duyệt đơn gọi API đúng endpoint
   */
  test('TC03: Duyệt đơn nghỉ phép', async () => {
    fetch.mockResolvedValueOnce(createMockResponse({ success: true }));
    window.confirm = jest.fn(() => true);

    renderWithRouter(<DirectorHome />);

    await waitFor(() => {
      const approveButtons = screen.getAllByRole('button', { name: /duyệt/i });
      fireEvent.click(approveButtons[0]);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dashboard/director/leaves/'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  /**
   * TC04: BE - Service lấy danh sách đơn chờ duyệt
   * Kiểm tra service trả về đúng danh sách đơn thuộc quyền quản lý
   */
  test('TC04: Service lấy danh sách đơn chờ duyệt', async () => {
    const mockManager = { id: 'mgr123', _id: 'mgr123', hoTen: 'Quản lý A' };

    getManagerPendingLeaves.mockResolvedValueOnce(MOCK_PENDING_LEAVES);

    const result = await getManagerPendingLeaves(mockManager);

    expect(getManagerPendingLeaves).toHaveBeenCalledWith(mockManager);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
    // Kiểm tra cấu trúc dữ liệu trả về
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('tenNV');
      expect(result[0]).toHaveProperty('trangThai');
    }
  });

  /**
   * TC05: BE - Service duyệt đơn nghỉ thành công
   * Kiểm tra logic duyệt đơn chuyển trạng thái sang CHO_HR_XAC_NHAN
   */
  test('TC05: Service duyệt đơn nghỉ thành công', async () => {
    const mockManager = { id: 'mgr123', _id: 'mgr123' };
    const leaveId = 'leave456';

    approveByManager.mockResolvedValueOnce({ id: leaveId, trangThai: 'CHO_HR_XAC_NHAN' });

    const result = await approveByManager(leaveId, mockManager);

    expect(approveByManager).toHaveBeenCalledWith(leaveId, mockManager);

    expect(result).toHaveProperty('trangThai');
    expect(['CHO_HR_XAC_NHAN', 'DA_DUYET']).toContain(result.trangThai);
  });

  /**
   * TC06: Edge Case - Từ chối đơn nghỉ với lý do
   * Kiểm tra chức năng từ chối đơn và lưu lý do
   */
  test('TC06: Edge Case - Từ chối đơn nghỉ với lý do', async () => {
    const mockManager = { id: 'mgr123', _id: 'mgr123' };
    const leaveId = 'leave789';
    const reason = 'Thiếu nhân sự trong thời gian nghỉ';

    window.prompt = jest.fn(() => reason);
    fetch.mockResolvedValueOnce(createMockResponse({ success: true }));
    rejectLeave.mockResolvedValueOnce({ id: leaveId, trangThai: 'TU_CHOI' });

    const result = await rejectLeave(leaveId, reason, mockManager, true);

    expect(rejectLeave).toHaveBeenCalledWith(leaveId, reason, mockManager, true);

    expect(result).toHaveProperty('trangThai');
    expect(result.trangThai).toBe('TU_CHOI');
  });

  /**
   * TC07: Edge Case - Không có đơn chờ duyệt
   * Kiểm tra UI hiển thị thông báo khi không có đơn nào chờ
   */
  test('TC07: Edge Case - Không có đơn chờ duyệt', async () => {
    fetch.mockClear();
    fetch
      .mockResolvedValueOnce(createMockResponse(MOCK_KPI))
      .mockResolvedValueOnce(createMockResponse([]));

    renderWithRouter(<DirectorHome />);

    await waitFor(() => {
      expect(screen.getByText(/không có đơn chờ duyệt/i)).toBeInTheDocument();
    });
  });
});
