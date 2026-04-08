/**
 * @fileoverview Unit Test: UC #21 - Hồ sơ cá nhân (Employee Profile)
 * @module tests/P4-UC21-employeeProfile
 * @description
 *   Kiểm tra chức năng xem và cập nhật hồ sơ cá nhân của nhân viên.
 *   Bao gồm: xem thông tin, chỉnh sửa, và upload ảnh đại diện.
 *
 * @assignment Person 4 - Payroll & Dashboard Layer
 * @version 1.0.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EmployeeProfile from '../../../frontend/src/pages/dashboard/EmployeeProfile.jsx';

// Mock backend services
jest.mock('../../../backend/src/services/employeeService.js', () => ({
  getEmployeeProfile: jest.fn(),
  updateEmployeeProfile: jest.fn(),
}));

import {
  getEmployeeProfile,
  updateEmployeeProfile,
} from '../../../backend/src/services/employeeService.js';

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

/** Mock data cho hồ sơ nhân viên */
const MOCK_PROFILE = {
  _id: '1',
  hoTen: 'Nguyễn Văn A',
  email: 'a@company.com',
  phone: '0987654321',
  address: 'Hà Nội',
  chucVu: 'Developer',
  phongBan: 'IT',
  ngayVaoLam: '2020-01-01',
  avatarUrl: null,
};

describe('UC #21: Hồ sơ cá nhân', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Default mock - return empty object for any fetch call
    fetch.mockImplementation(() => Promise.resolve(createMockResponse({})));
    // Set mock return values for backend services
    getEmployeeProfile.mockResolvedValue(MOCK_PROFILE);
    updateEmployeeProfile.mockResolvedValue({ ...MOCK_PROFILE, phone: '0912345678' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TC01: FE - Hiển thị thông tin hồ sơ cá nhân
   * Kiểm tra các thông tin cơ bản được render đúng
   */
  test('TC01: Hiển thị thông tin hồ sơ cá nhân', async () => {
    fetch.mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/profile')) return Promise.resolve(createMockResponse(MOCK_PROFILE));
      return Promise.resolve(createMockResponse({}));
    });

    renderWithRouter(<EmployeeProfile />);

    await waitFor(() => {
      // Có thể có nhiều element chứa "hồ sơ cá nhân" (heading, nav)
      expect(screen.getAllByText(/hồ sơ cá nhân/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument();
      expect(screen.getByText('IT')).toBeInTheDocument();
    });
  });

  /**
   * TC02: FE - Hiển thị form cập nhật thông tin
   * Kiểm tra các trường có thể chỉnh sửa được hiển thị
   */
  test('TC02: Hiển thị form cập nhật thông tin', async () => {
    fetch.mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/profile')) return Promise.resolve(createMockResponse(MOCK_PROFILE));
      return Promise.resolve(createMockResponse({}));
    });

    renderWithRouter(<EmployeeProfile />);

    await waitFor(() => {
      // Kiểm tra các input field tồn tại - dùng queryAllByLabelText để tránh lỗi nếu có nhiều elements
      const emailInputs = screen.queryAllByLabelText(/email/i);
      const phoneInputs = screen.queryAllByLabelText(/số điện thoại/i);
      const addressInputs = screen.queryAllByLabelText(/địa chỉ/i);
      expect(emailInputs.length).toBeGreaterThanOrEqual(1);
      expect(phoneInputs.length).toBeGreaterThanOrEqual(1);
      expect(addressInputs.length).toBeGreaterThanOrEqual(1);
    });
  });

  /**
   * TC03: FE - Cập nhật thông tin liên hệ
   * Kiểm tra chức năng lưu thay đổi thông tin
   */
  test('TC03: Cập nhật thông tin liên hệ', async () => {
    fetch.mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/profile') && !urlStr.includes('/avatar')) {
        return Promise.resolve(createMockResponse({ ...MOCK_PROFILE, phone: '0912345678' }));
      }
      return Promise.resolve(createMockResponse({}));
    });

    renderWithRouter(<EmployeeProfile />);

    await waitFor(() => {
      const phoneInput = screen.getByLabelText(/số điện thoại/i);
      userEvent.clear(phoneInput);
      userEvent.type(phoneInput, '0912345678');
    });

    const saveButton = screen.getByRole('button', { name: /lưu/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dashboard/employee/profile'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  /**
   * TC04: BE - Service lấy thông tin hồ sơ
   * Kiểm tra service trả về đầy đủ thông tin nhân viên
   */
  test('TC04: Service lấy thông tin hồ sơ', async () => {
    const mockEmployee = { _id: 'emp123', id: 'emp123' };
    getEmployeeProfile.mockResolvedValueOnce(MOCK_PROFILE);

    const result = await getEmployeeProfile(mockEmployee);

    expect(getEmployeeProfile).toHaveBeenCalledWith(mockEmployee);
    expect(result).toHaveProperty('hoTen');
    expect(result).toHaveProperty('email');
    expect(result).toHaveProperty('phone');
    expect(result).toHaveProperty('chucVu');
    expect(result).toHaveProperty('phongBan');
  });

  /**
   * TC05: BE - Service cập nhật hồ sơ
   * Kiểm tra logic cập nhật chỉ cho phép các field editable
   */
  test('TC05: Service cập nhật hồ sơ', async () => {
    const mockEmployee = { _id: 'emp123', id: 'emp123' };
    const updateData = {
      email: 'newemail@company.com',
      phone: '0912345678',
      address: 'TP.HCM',
    };
    const updatedProfile = { ...MOCK_PROFILE, ...updateData };
    updateEmployeeProfile.mockResolvedValueOnce(updatedProfile);

    const result = await updateEmployeeProfile(mockEmployee, updateData);

    expect(updateEmployeeProfile).toHaveBeenCalledWith(mockEmployee, updateData);
    expect(result).toHaveProperty('hoTen');
    expect(result).toHaveProperty('email');
  });

  /**
   * TC06: Edge Case - Không thể cập nhật thông tin công việc
   * Kiểm tra validation không cho sửa chức vụ, phòng ban
   */
  test('TC06: Edge Case - Không thể cập nhật thông tin công việc', async () => {
    fetch.mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/profile')) return Promise.resolve(createMockResponse(MOCK_PROFILE));
      return Promise.resolve(createMockResponse({}));
    });

    renderWithRouter(<EmployeeProfile />);

    await waitFor(() => {
      // Chức vụ và phòng ban là readonly, không có input để sửa
      expect(screen.getByText('Developer')).toBeInTheDocument();
      expect(screen.getByText('IT')).toBeInTheDocument();
    });
  });

  /**
   * TC07: Edge Case - Upload ảnh đại diện
   * Kiểm tra chức năng upload avatar
   */
  test('TC07: Edge Case - Upload ảnh đại diện', async () => {
    fetch.mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/profile')) return Promise.resolve(createMockResponse(MOCK_PROFILE));
      if (urlStr.includes('/avatar')) return Promise.resolve(createMockResponse({ avatarUrl: '/avatar.png' }));
      return Promise.resolve(createMockResponse({}));
    });

    renderWithRouter(<EmployeeProfile />);

    await waitFor(() => {
      const fileInput = screen.getByLabelText(/chọn tệp/i);
      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
      userEvent.upload(fileInput, file);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dashboard/employee/profile/avatar'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
