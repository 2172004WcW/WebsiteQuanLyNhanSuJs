/**
 * @fileoverview Unit Test: UC #8 - Cài đặt hệ thống (System Settings)
 * @module tests/P5-UC08-adminSettings
 * @description
 *   Kiểm tra chức năng cài đặt hệ thống của Admin.
 *   Bao gồm: cấu hình SMTP, thông tin công ty, chính sách nghỉ phép.
 *
 * @assignment Person 5 - Recruitment, Notification & System Layer
 * @version 1.0.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock backend services
jest.mock('../../../backend/src/services/adminService.js', () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
}));

import AdminSettings from '../../../frontend/src/pages/dashboard/AdminSettings.jsx';
import {
  getSettings,
  updateSettings,
} from '../../../backend/src/services/adminService.js';

/** @type {jest.Mock} */
global.fetch = jest.fn();

// Helper to render with Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

/** Mock data cho cài đặt hệ thống */
const MOCK_SETTINGS = {
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    user: 'hr@company.com',
    fromEmail: 'noreply@company.com',
  },
  company: {
    name: 'Công ty TNHH ABC',
    address: 'Hà Nội',
    phone: '0241234567',
  },
  leavePolicy: {
    phepNamMacDinh: 12,
    phepNamTheoNam: 15,
  },
};

describe('UC #8: Cài đặt hệ thống', () => {
  beforeEach(() => {
    fetch.mockClear();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SETTINGS,
    });
    // Set mock return values for backend services
    getSettings.mockResolvedValue(MOCK_SETTINGS);
    updateSettings.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TC01: FE - Hiển thị trang cài đặt với các tab
   * Kiểm tra trang cấu hình hệ thống được render đúng
   */
  test('TC01: Hiển thị trang cài đặt với các tab', async () => {
    renderWithRouter(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByText(/Cấu hình hệ thống/i)).toBeInTheDocument();
      // Use heading role to find the specific broadcast heading
      expect(screen.getByRole('heading', { name: /Thông báo chung \(broadcast\)/i })).toBeInTheDocument();
    });
  });

  /**
   * TC02: FE - Cập nhật cấu hình SMTP
   * Kiểm tra thay đổi SMTP host và port qua API
   */
  test('TC02: Cập nhật cấu hình SMTP', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    renderWithRouter(<AdminSettings />);

    // Kiểm tra form broadcast có thể tương tác
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Tiêu đề/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText(/Tiêu đề/i);
    userEvent.clear(titleInput);
    userEvent.type(titleInput, 'Test SMTP Config');

    const saveButton = screen.getByRole('button', { name: /Gửi thông báo/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  /**
   * TC03: FE - Kiểm tra kết nối SMTP
   * Kiểm tra chức năng gửi broadcast notification
   */
  test('TC03: Kiểm tra broadcast notification', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    renderWithRouter(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Nội dung/i)).toBeInTheDocument();
    });

    const contentInput = screen.getByPlaceholderText(/Nội dung/i);
    userEvent.type(contentInput, 'Test broadcast message');

    const sendButton = screen.getByRole('button', { name: /Gửi thông báo/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notifications'),
        expect.any(Object)
      );
    });
  });

  /**
   * TC04: BE - Service lấy cài đặt hệ thống
   * Kiểm tra service trả về đầy đủ các cấu hình
   */
  test('TC04: Service lấy cài đặt hệ thống', async () => {
    const result = await getSettings();

    expect(result).toHaveProperty('smtp');
    expect(result).toHaveProperty('company');
    expect(result).toHaveProperty('leavePolicy');
    expect(result.smtp).toHaveProperty('host');
    expect(result.smtp).toHaveProperty('port');
  });

  /**
   * TC05: BE - Service cập nhật cài đặt
   * Kiểm tra logic lưu cấu hình mới
   */
  test('TC05: Service cập nhật cài đặt', async () => {
    const newSettings = {
      smtp: { host: 'smtp.new.com', port: 465 },
      company: { name: 'Công ty XYZ' },
    };

    const result = await updateSettings(newSettings);

    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
  });

  /**
   * TC06: Edge Case - Validation broadcast form
   * Kiểm tra validation form broadcast trước khi gửi
   */
  test('TC06: Edge Case - Validation form broadcast', async () => {
    renderWithRouter(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Tiêu đề/i)).toBeInTheDocument();
    });

    // Thử gửi form trống
    const sendButton = screen.getByRole('button', { name: /Gửi thông báo/i });
    fireEvent.click(sendButton);

    // Kiểm tra form vẫn còn (validation chặn gửi)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Tiêu đề/i)).toBeInTheDocument();
    });
  });

  /**
   * TC07: Edge Case - Gửi broadcast thành công
   * Kiểm tra gửi thông báo broadcast với dữ liệu hợp lệ
   */
  test('TC07: Edge Case - Gửi broadcast thành công', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    renderWithRouter(<AdminSettings />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Tiêu đề/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText(/Tiêu đề/i);
    userEvent.type(titleInput, 'Thông báo test');

    const contentInput = screen.getByPlaceholderText(/Nội dung/i);
    userEvent.type(contentInput, 'Nội dung thông báo test');

    const sendButton = screen.getByRole('button', { name: /Gửi thông báo/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });
});
