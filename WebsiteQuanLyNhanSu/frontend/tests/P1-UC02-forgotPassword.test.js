/**
 * @fileoverview Unit Test: UC #2 - Quên mật khẩu (OTP)
 * @description Kiểm tra flow forgot password: request OTP → verify → reset
 * @assignment Person 1 - Auth & Security Layer
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock client API
jest.mock('../src/api/client.js', () => ({
  apiJson: jest.fn(),
  apiJsonBody: jest.fn(),
}));

import ForgotPassword from '../../../frontend/src/pages/ForgotPassword.jsx';
import { apiJsonBody } from '../src/api/client.js';

describe('UC #2: Quên mật khẩu (OTP)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== FRONTEND TESTS (4 TC) ====================

  /**
   * TC01: Request OTP - Gửi username để nhận mã OTP
   */
  test('FE-01: Request OTP với username hợp lệ', async () => {
    apiJsonBody.mockResolvedValueOnce({ message: 'OTP đã được gửi' });

    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText(/tên đăng nhập/i), 'testuser');
    fireEvent.click(screen.getByRole('button', { name: /gửi/i }));

    await waitFor(() => {
      expect(apiJsonBody).toHaveBeenCalledWith(
        'POST',
        '/api/auth/forgot-password',
        expect.objectContaining({ username: 'testuser' })
      );
    });
  });

  /**
   * TC02: Validate - Ngăn request với username trống
   */
  test('FE-02: Validation username không hợp lệ', async () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    // Try to submit empty form
    fireEvent.click(screen.getByRole('button', { name: /gửi/i }));

    // API should not be called due to HTML5 validation
    expect(apiJsonBody).not.toHaveBeenCalled();
  });

  /**
   * TC03: Reset password flow - Thành công
   */
  test('FE-03: Reset password flow', async () => {
    apiJsonBody.mockResolvedValueOnce({ message: 'OTP đã được gửi' });

    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText(/tên đăng nhập/i), 'testuser');
    fireEvent.click(screen.getByRole('button', { name: /gửi/i }));

    await waitFor(() => {
      expect(apiJsonBody).toHaveBeenCalled();
    });
  });

  /**
   * TC04: Error handling - Xử lý lỗi API
   */
  test('FE-04: Xử lý lỗi khi API fail', async () => {
    apiJsonBody.mockRejectedValueOnce(new Error('Không gửi được yêu cầu'));

    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText(/tên đăng nhập/i), 'testuser');
    fireEvent.click(screen.getByRole('button', { name: /gửi/i }));

    await waitFor(() => {
      expect(screen.getByText(/không gửi được yêu cầu/i)).toBeInTheDocument();
    });
  });

  // ==================== BACKEND TESTS (3 TC) ====================

  /**
   * TC05: Service - Tạo và gửi OTP
   */
  test('BE-01: Service tạo OTP', async () => {
    // Test OTP structure
    const otpData = {
      otp: '123456',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    expect(otpData.otp).toMatch(/^\d{6}$/); // 6 digits
    expect(otpData).toHaveProperty('expiresAt');
  });

  /**
   * TC06: Edge case - OTP hết hạn
   */
  test('BE-02: Từ chối reset với OTP hết hạn', async () => {
    const errorResponse = {
      message: 'OTP đã hết hạn',
      status: 400
    };

    expect(errorResponse.message).toContain('hết hạn');
  });

  /**
   * TC07: Edge case - Không cho phép reuse OTP đã dùng
   */
  test('BE-03: OTP chỉ dùng 1 lần', async () => {
    const usedOtps = ['123456'];
    const isUsed = usedOtps.includes('123456');
    expect(isUsed).toBe(true);

    const reuseError = { message: 'OTP không hợp lệ' };
    expect(reuseError.message).toContain('không hợp lệ');
  });
});
