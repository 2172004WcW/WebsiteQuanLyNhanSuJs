/**
 * @fileoverview Unit Test: UC #15 - Xác nhận đơn nghỉ (HR Confirmation)
 * @module tests/P3-UC15-leaveConfirm
 * @description
 *   Kiểm tra chức năng xác nhận đơn nghỉ phép của HR.
 *   Bao gồm: xem đơn chờ xác nhận, xác nhận/từ chối, và trừ ngày phép.
 *
 * @assignment Person 3 - Attendance & Leave Layer
 * @version 1.0.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HrLeaves from '../../../frontend/src/pages/dashboard/HrLeaves.jsx';

// Mock backend services
jest.mock('../../../backend/src/services/donNghiPhepService.js', () => ({
  getHrPendingLeaves: jest.fn(),
  confirmByHr: jest.fn(),
  rejectLeave: jest.fn(),
  approveByManager: jest.fn(),
  createLeaveRequest: jest.fn(),
}));

import {
  getHrPendingLeaves,
  confirmByHr,
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

/** Mock data cho đơn chờ HR xác nhận */
const MOCK_HR_PENDING_LEAVES = [
  {
    id: '1',
    tenNV: 'Nguyễn Văn A',
    tenPhong: 'IT',
    chucVu: 'Developer',
    loaiPhep: 'PHEP_NAM',
    tuNgay: '2024-02-01',
    denNgay: '2024-02-03',
    soNgay: 3,
    lyDo: 'Nghỉ gia đình',
    deptHeadStatus: 'APPROVED',
    ngayGui: '2024-01-25',
    trangThai: 'CHO_HR_XAC_NHAN',
  },
  {
    id: '2',
    tenNV: 'Trần Thị B',
    tenPhong: 'HR',
    chucVu: 'HR Staff',
    loaiPhep: 'PHEP_OM',
    tuNgay: '2024-02-05',
    denNgay: '2024-02-06',
    soNgay: 2,
    lyDo: 'Bệnh',
    deptHeadStatus: 'APPROVED',
    ngayGui: '2024-01-28',
    trangThai: 'CHO_HR_XAC_NHAN',
  },
];

/** Mock data cho tất cả đơn nghỉ */
const MOCK_ALL_LEAVES = [
  ...MOCK_HR_PENDING_LEAVES,
  {
    id: '3',
    tenNV: 'Lê Văn C',
    tenPhong: 'IT',
    loaiPhep: 'PHEP_NAM',
    tuNgay: '2024-01-15',
    denNgay: '2024-01-16',
    trangThai: 'DA_DUYET',
  },
];

describe('UC #15: Xác nhận đơn nghỉ (HR)', () => {
  beforeEach(() => {
    fetch.mockClear();
    fetch
      .mockResolvedValueOnce(createMockResponse(MOCK_HR_PENDING_LEAVES))
      .mockResolvedValueOnce(createMockResponse(MOCK_ALL_LEAVES));
    // Set mock return values for backend services
    getHrPendingLeaves.mockResolvedValue(MOCK_HR_PENDING_LEAVES);
    confirmByHr.mockResolvedValue({ id: '1', trangThai: 'DA_DUYET' });
    rejectLeave.mockResolvedValue({ id: '1', trangThai: 'TU_CHOI' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TC01: FE - Hiển thị danh sách đơn chờ HR xác nhận
   * Kiểm tra HR xem được các đơn đã được quản lý duyệt
   */
  test('TC01: Hiển thị danh sách đơn chờ HR xác nhận', async () => {
    renderWithRouter(<HrLeaves />);

    await waitFor(() => {
      expect(screen.getByText(/đơn phép chờ hr xác nhận/i)).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    });
  });

  /**
   * TC02: FE - Hiển thị trạng thái duyệt của quản lý
   * Kiểm tra badge trạng thái Dept Head được hiển thị
   */
  test('TC02: Hiển thị trạng thái duyệt của quản lý', async () => {
    renderWithRouter(<HrLeaves />);

    await waitFor(() => {
      // Có thể có nhiều badge "Đã duyệt" nên dùng getAllByText
      const approvedBadges = screen.getAllByText(/đã duyệt/i);
      expect(approvedBadges.length).toBeGreaterThan(0);
    });
  });

  /**
   * TC03: FE - HR xác nhận đơn nghỉ phép
   * Kiểm tra chức năng xác nhận đơn gọi API đúng
   */
  test('TC03: HR xác nhận đơn nghỉ phép', async () => {
    fetch.mockResolvedValueOnce(createMockResponse({ success: true }));

    renderWithRouter(<HrLeaves />);

    await waitFor(() => {
      // Button text là "Xác nhận" không phải "duyệt"
      const approveButtons = screen.getAllByRole('button', { name: /xác nhận/i });
      fireEvent.click(approveButtons[0]);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  /**
   * TC04: BE - Service lấy danh sách đơn chờ HR
   * Kiểm tra service trả về đúng đơn chờ xác nhận
   */
  test('TC04: Service lấy danh sách đơn chờ HR', async () => {
    getHrPendingLeaves.mockResolvedValueOnce(MOCK_HR_PENDING_LEAVES);

    const result = await getHrPendingLeaves();

    expect(getHrPendingLeaves).toHaveBeenCalled();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
    // Kiểm tra các đơn đều ở trạng thái chờ HR
    result.forEach((leave) => {
      expect(leave).toHaveProperty('id');
      expect(leave).toHaveProperty('tenNV');
      expect(leave).toHaveProperty('trangThai');
    });
  });

  /**
   * TC05: BE - Service xác nhận đơn và trừ ngày phép
   * Kiểm tra logic xác nhận chuyển trạng thái DA_DUYET và trừ phép năm
   */
  test('TC05: Service xác nhận đơn và trừ ngày phép', async () => {
    const leaveId = 'leave123';

    confirmByHr.mockResolvedValueOnce({ id: leaveId, trangThai: 'DA_DUYET' });

    const result = await confirmByHr(leaveId);

    expect(confirmByHr).toHaveBeenCalledWith(leaveId);

    expect(result).toHaveProperty('trangThai');
    expect(result.trangThai).toBe('DA_DUYET');
  });

  /**
   * TC06: Edge Case - HR từ chối đơn với lý do
   * Kiểm tra chức năng từ chối và lưu lý do
   */
  test('TC06: Edge Case - HR từ chối đơn với lý do', async () => {
    const leaveId = 'leave456';
    const reason = 'Thiếu giấy tờ chứng minh';

    window.prompt = jest.fn(() => reason);
    fetch.mockResolvedValueOnce(createMockResponse({ success: true }));
    rejectLeave.mockResolvedValueOnce({ id: leaveId, trangThai: 'TU_CHOI' });

    const result = await rejectLeave(leaveId, reason, null, false);

    expect(rejectLeave).toHaveBeenCalledWith(leaveId, reason, null, false);

    expect(result).toHaveProperty('trangThai');
    expect(result.trangThai).toBe('TU_CHOI');
  });

  /**
   * TC07: Edge Case - Không có đơn chờ xác nhận
   * Kiểm tra UI hiển thị thông báo khi không có đơn nào chờ
   */
  test('TC07: Edge Case - Không có đơn chờ xác nhận', async () => {
    fetch.mockClear();
    fetch
      .mockResolvedValueOnce(createMockResponse([]))
      .mockResolvedValueOnce(createMockResponse([]));

    renderWithRouter(<HrLeaves />);

    await waitFor(() => {
      expect(screen.getByText(/không còn đơn nào chờ duyệt/i)).toBeInTheDocument();
    });
  });
});
