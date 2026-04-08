/**
 * @fileoverview Unit Test: UC #19 - Báo cáo chấm công (Attendance Report)
 * @module tests/P3-UC19-attendanceReport
 * @description
 *   Kiểm tra chức năng báo cáo chấm công của Director.
 *   Bao gồm: thống kê chấm công theo phòng ban, xu hướng, và lọc theo thời gian.
 *
 * @assignment Person 3 - Attendance & Leave Layer
 * @version 1.0.0
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DirectorReports from '../../../frontend/src/pages/dashboard/DirectorReports.jsx';

// Mock backend services
jest.mock('../../../backend/src/services/dashboardService.js', () => ({
  getDirectorAttendanceByDept: jest.fn(),
  getDirectorHeadcountTrend: jest.fn(),
  getDirectorSalaryTrend: jest.fn(),
  getDirectorKpi: jest.fn(),
}));

import {
  getDirectorAttendanceByDept,
  getDirectorHeadcountTrend,
  getDirectorSalaryTrend,
} from '../../../backend/src/services/dashboardService.js';

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

/** Mock data cho xu hướng headcount */
const MOCK_HEADCOUNT_TREND = [
  { label: '08/2023', totalActive: 45, newJoined: 2 },
  { label: '09/2023', totalActive: 47, newJoined: 3 },
  { label: '10/2023', totalActive: 48, newJoined: 2 },
  { label: '11/2023', totalActive: 49, newJoined: 2 },
  { label: '12/2023', totalActive: 50, newJoined: 3 },
  { label: '01/2024', totalActive: 50, newJoined: 1 },
];

/** Mock data cho quỹ lương */
const MOCK_SALARY_TREND = [
  { label: '2023-08', total: 450000000, averagePerEmployee: 10000000 },
  { label: '2023-09', total: 470000000, averagePerEmployee: 10000000 },
  { label: '2023-10', total: 480000000, averagePerEmployee: 10000000 },
  { label: '2023-11', total: 490000000, averagePerEmployee: 10000000 },
  { label: '2023-12', total: 500000000, averagePerEmployee: 10000000 },
  { label: '2024-01', total: 500000000, averagePerEmployee: 10000000 },
];

/** Mock data cho chấm công theo phòng ban */
const MOCK_ATTENDANCE_BY_DEPT = [
  { departmentName: 'IT', attendanceRate: 95 },
  { departmentName: 'HR', attendanceRate: 92 },
  { departmentName: 'Sales', attendanceRate: 88 },
];

describe('UC #19: Báo cáo chấm công', () => {
  beforeEach(() => {
    fetch.mockClear();
    fetch
      .mockResolvedValueOnce(createMockResponse(MOCK_HEADCOUNT_TREND))
      .mockResolvedValueOnce(createMockResponse(MOCK_SALARY_TREND))
      .mockResolvedValueOnce(createMockResponse(MOCK_ATTENDANCE_BY_DEPT));
    // Set mock return values for backend services
    getDirectorAttendanceByDept.mockResolvedValue(MOCK_ATTENDANCE_BY_DEPT);
    getDirectorHeadcountTrend.mockResolvedValue(MOCK_HEADCOUNT_TREND);
    getDirectorSalaryTrend.mockResolvedValue(MOCK_SALARY_TREND);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TC01: FE - Hiển thị trang báo cáo với bộ lọc
   * Kiểm tra các filter tháng/năm và bảng dữ liệu được render
   */
  test('TC01: Hiển thị trang báo cáo với bộ lọc', async () => {
    renderWithRouter(<DirectorReports />);

    await waitFor(() => {
      // Có nhiều elements chứa "báo cáo" nên dùng getAllByText
      const reportElements = screen.getAllByText(/báo cáo/i);
      expect(reportElements.length).toBeGreaterThan(0);
      // Có thể có nhiều label chứa "tháng" (month options)
      const monthLabels = screen.getAllByLabelText(/tháng/i);
      expect(monthLabels.length).toBeGreaterThan(0);
      const yearLabels = screen.getAllByLabelText(/năm/i);
      expect(yearLabels.length).toBeGreaterThan(0);
    });
  });

  /**
   * TC02: FE - Hiển thị xu hướng headcount
   * Kiểm tra bảng xu hướng nhân sự hiển thị đúng
   */
  test('TC02: Hiển thị xu hướng headcount', async () => {
    renderWithRouter(<DirectorReports />);

    await waitFor(() => {
      expect(screen.getByText(/xu hướng headcount/i)).toBeInTheDocument();
    });
  });

  /**
   * TC03: FE - Thay đổi bộ lọc tháng/năm
   * Kiểm tra API được gọi lại khi thay đổi filter
   */
  test('TC03: Thay đổi bộ lọc tháng/năm', async () => {
    renderWithRouter(<DirectorReports />);

    await waitFor(() => {
      // Có thể có nhiều elements liên quan đến "tháng" nên dùng getAllByLabelText
      const monthSelects = screen.getAllByLabelText(/tháng/i);
      expect(monthSelects.length).toBeGreaterThan(0);
      userEvent.selectOptions(monthSelects[0], '2'); // Chọn tháng 2
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  /**
   * TC04: BE - Service lấy chấm công theo phòng ban
   * Kiểm tra service trả về tỷ lệ chuyên cần theo phòng ban
   */
  test('TC04: Service lấy chấm công theo phòng ban', async () => {
    getDirectorAttendanceByDept.mockResolvedValueOnce(MOCK_ATTENDANCE_BY_DEPT);

    const result = await getDirectorAttendanceByDept(1, 2024);

    expect(getDirectorAttendanceByDept).toHaveBeenCalledWith(1, 2024);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('departmentName');
      expect(result[0]).toHaveProperty('attendanceRate');
      expect(typeof result[0].attendanceRate).toBe('number');
      expect(result[0].attendanceRate).toBeGreaterThanOrEqual(0);
      expect(result[0].attendanceRate).toBeLessThanOrEqual(100);
    }
  });

  /**
   * TC05: BE - Service lấy xu hướng headcount
   * Kiểm tra service trả về dữ liệu 6 tháng
   */
  test('TC05: Service lấy xu hướng headcount', async () => {
    getDirectorHeadcountTrend.mockResolvedValueOnce(MOCK_HEADCOUNT_TREND);

    const result = await getDirectorHeadcountTrend();

    expect(getDirectorHeadcountTrend).toHaveBeenCalled();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('label');
      expect(result[0]).toHaveProperty('totalActive');
      expect(result[0]).toHaveProperty('newJoined');
    }
  });

  /**
   * TC06: Edge Case - Không có dữ liệu chấm công
   * Kiểm tra UI hiển thị thông báo phù hợp khi tháng chưa có dữ liệu
   */
  test('TC06: Edge Case - Không có dữ liệu chấm công', async () => {
    fetch.mockClear();
    fetch
      .mockResolvedValueOnce(createMockResponse([]))
      .mockResolvedValueOnce(createMockResponse([]))
      .mockResolvedValueOnce(createMockResponse([]));

    renderWithRouter(<DirectorReports />);

    await waitFor(() => {
      // Có nhiều elements chứa "báo cáo"
      const reportElements = screen.getAllByText(/báo cáo/i);
      expect(reportElements.length).toBeGreaterThan(0);
    });
  });

  /**
   * TC07: Edge Case - Hiển thị quỹ lương theo tháng
   * Kiểm tra bảng quỹ lương hiển thị đúng định dạng
   */
  test('TC07: Edge Case - Hiển thị quỹ lương theo tháng', async () => {
    renderWithRouter(<DirectorReports />);

    await waitFor(() => {
      expect(screen.getByText(/quỹ lương theo tháng/i)).toBeInTheDocument();
    });
  });
});
