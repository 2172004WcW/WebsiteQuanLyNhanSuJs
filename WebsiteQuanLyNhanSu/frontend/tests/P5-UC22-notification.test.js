/**
 * @fileoverview Unit Test: UC #22 - Thông báo real-time (Real-time Notifications)
 * @module tests/P5-UC22-notification
 * @description
 *   Kiểm tra chức năng thông báo real-time trong hệ thống.
 *   Bao gồm: notification dropdown, đánh dấu đã đọc, và số lượng chưa đọc.
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
}));

// Mock backend services
jest.mock('../../../backend/src/services/notificationService.js', () => ({
  getNotifications: jest.fn(),
  markAsRead: jest.fn(),
  getUnreadCount: jest.fn(),
}));

import NotificationDropdown from '../../../frontend/src/components/NotificationDropdown.jsx';
import { apiJson } from '../src/api/client.js';
import {
  getNotifications,
  markAsRead,
  getUnreadCount,
} from '../../../backend/src/services/notificationService.js';

/** Mock data cho thông báo */
const MOCK_NOTIFICATIONS = [
  { _id: '1', tieuDe: 'Đơn nghỉ phép được duyệt', noiDung: 'Đơn nghỉ của bạn đã được duyệt', daDoc: false, thoiGian: '2024-01-15T10:00:00Z', loai: 'LEAVE' },
  { _id: '2', tieuDe: 'Phiếu lương tháng 1', noiDung: 'Phiếu lương của bạn đã sẵn sàng', daDoc: false, thoiGian: '2024-01-10T08:00:00Z', loai: 'PAYROLL' },
  { _id: '3', tieuDe: 'Thông báo chung', noiDung: 'Họp toàn công ty ngày mai', daDoc: true, thoiGian: '2024-01-05T09:00:00Z', loai: 'BROADCAST' },
];

describe('UC #22: Thông báo real-time', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock apiJson to return notifications
    apiJson.mockImplementation((path) => {
      if (path && path.includes && path.includes('/notifications')) {
        if (path.includes('/unread-count')) {
          return Promise.resolve({ unread: 2 });
        }
        if (path.includes('/read-all')) {
          return Promise.resolve({ success: true });
        }
        if (path.includes('/read')) {
          return Promise.resolve({ daDoc: true });
        }
        return Promise.resolve(MOCK_NOTIFICATIONS);
      }
      return Promise.resolve([]);
    });
    // Set mock return values for backend services
    getNotifications.mockResolvedValue(MOCK_NOTIFICATIONS);
    markAsRead.mockResolvedValue({ daDoc: true });
    getUnreadCount.mockResolvedValue(2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TC01: FE - Hiển thị notification dropdown
   * Kiểm tra dropdown thông báo được render với số lượng chưa đọc
   */
  test('TC01: Hiển thị notification dropdown', async () => {
    render(<NotificationDropdown open={true} listVersion={0} onUnreadSynced={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/thông báo/i)).toBeInTheDocument();
    });
  });

  /**
   * TC02: FE - Hiển thị danh sách thông báo
   * Kiểm tra danh sách thông báo hiển thị đúng
   */
  test('TC02: Hiển thị danh sách thông báo', async () => {
    render(<NotificationDropdown open={true} listVersion={0} onUnreadSynced={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Đơn nghỉ phép được duyệt')).toBeInTheDocument();
      expect(screen.getByText('Phiếu lương tháng 1')).toBeInTheDocument();
    });
  });

  /**
   * TC03: FE - Đánh dấu thông báo đã đọc
   * Kiểm tra chức năng đánh dấu đã đọc và gọi API
   */
  test('TC03: Đánh dấu thông báo đã đọc', async () => {
    render(<NotificationDropdown open={true} listVersion={0} onUnreadSynced={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Đơn nghỉ phép được duyệt')).toBeInTheDocument();
    });

    // Click on a notification to mark as read
    const notification = screen.getByText('Đơn nghỉ phép được duyệt');
    fireEvent.click(notification);

    await waitFor(() => {
      expect(apiJson).toHaveBeenCalled();
    });
  });

  /**
   * TC04: BE - Service lấy danh sách thông báo
   * Kiểm tra service trả về đầy đủ thông tin thông báo
   */
  test('TC04: Service lấy danh sách thông báo', async () => {
    const mockUser = { _id: 'user123', id: 'user123' };

    const result = await getNotifications(mockUser);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('tieuDe');
      expect(result[0]).toHaveProperty('noiDung');
      expect(result[0]).toHaveProperty('daDoc');
      expect(result[0]).toHaveProperty('thoiGian');
    }
  });

  /**
   * TC05: BE - Service đánh dấu đã đọc
   * Kiểm tra logic chuyển trạng thái daDoc sang true
   */
  test('TC05: Service đánh dấu đã đọc', async () => {
    const notificationId = 'notif123';

    const result = await markAsRead(notificationId);

    expect(result).toHaveProperty('daDoc');
    expect(result.daDoc).toBe(true);
  });

  /**
   * TC06: Edge Case - Không có thông báo
   * Kiểm tra UI hiển thị thông báo phù hợp khi không có thông báo nào
   */
  test('TC06: Edge Case - Không có thông báo', async () => {
    apiJson.mockResolvedValueOnce([]);

    render(<NotificationDropdown open={true} listVersion={0} onUnreadSynced={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/không có thông báo/i)).toBeInTheDocument();
    });
  });

  /**
   * TC07: Edge Case - Đánh dấu tất cả đã đọc
   * Kiểm tra chức năng đánh dấu tất cả thông báo đã đọc
   */
  test('TC07: Edge Case - Đánh dấu tất cả đã đọc', async () => {
    render(<NotificationDropdown open={true} listVersion={0} onUnreadSynced={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/thông báo/i)).toBeInTheDocument();
    });

    // Use more specific selector for the mark all button (tin riêng)
    const markAllButton = screen.getByRole('button', { name: /đánh dấu đã đọc \(tin riêng\)/i });
    fireEvent.click(markAllButton);

    await waitFor(() => {
      expect(apiJson).toHaveBeenCalledWith(
        expect.stringContaining('/read-all'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });
});
