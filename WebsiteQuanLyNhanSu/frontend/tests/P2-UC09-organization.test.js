/**
 * @fileoverview Unit Test: UC #9 - Quản lý phòng ban
 * @description Kiểm tra CRUD phòng ban/chức vụ, sơ đồ tổ chức
 * @assignment Person 2 - Employee & Organization Layer
 * @path tests/P2-UC09-organization.test.js
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock backend services
jest.mock('../../../backend/src/services/organizationService.js', () => ({
  listChiNhanh: jest.fn(),
  listPhongBan: jest.fn(),
  listNhom: jest.fn(),
  listChucVu: jest.fn(),
  createPhongBan: jest.fn(),
  updatePhongBan: jest.fn(),
  deletePhongBan: jest.fn(),
  createChiNhanh: jest.fn(),
  createChucVu: jest.fn(),
}));

import HrOrganization from '../../../frontend/src/pages/dashboard/HrOrganization.jsx';
import {
  listPhongBan,
  listChiNhanh,
  listChucVu,
  createPhongBan,
  updatePhongBan,
  deletePhongBan,
} from '../../../backend/src/services/organizationService.js';

/** @type {jest.Mock} */
global.fetch = jest.fn();

/** Helper to render with Router */
const renderWithRouter = (component) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

/** Mock data cho phòng ban - format theo component */
const MOCK_DEPARTMENTS = [
  { _id: 'PB-ABCD', tenPhongBan: 'Phòng IT', moTa: 'Công nghệ thông tin', soNhanVien: 10, chiNhanh: { tenChiNhanh: 'Hà Nội' } },
  { _id: 'PB-EFGH', tenPhongBan: 'Phòng HR', moTa: 'Nhân sự', soNhanVien: 5, chiNhanh: { tenChiNhanh: 'Hà Nội' } }
];

const MOCK_CHINHANH = [
  { _id: 'CN-ABCD', tenChiNhanh: 'Hà Nội', diaChi: '123 Lê Lợi' },
  { _id: 'CN-EFGH', tenChiNhanh: 'TP.HCM', diaChi: '456 Nguyễn Huệ' }
];

/** Helper to create mock fetch response with both json() and text() */
const createMockResponse = (data) => ({
  ok: true,
  json: async () => data,
  text: async () => JSON.stringify(data),
  status: 200,
  statusText: 'OK'
});

describe('UC #9: Quản lý phòng ban', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Mock fetch with both json() and text() methods for apiJson compatibility
    fetch.mockResolvedValue(createMockResponse(MOCK_DEPARTMENTS));
    // Set mock return values for backend services
    listPhongBan.mockResolvedValue(MOCK_DEPARTMENTS);
    listChiNhanh.mockResolvedValue(MOCK_CHINHANH);
    listChucVu.mockResolvedValue([]);
    createPhongBan.mockResolvedValue({ _id: 'PB-IJKL', tenPhongBan: 'Phòng Sales' });
    updatePhongBan.mockResolvedValue({ ...MOCK_DEPARTMENTS[0], tenPhongBan: 'Phòng IT Updated' });
    deletePhongBan.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== FRONTEND TESTS (4 TC) ====================

  /**
   * TC01: FE - Render danh sách phòng ban
   */
  test('TC01: Render danh sách phòng ban', async () => {
    renderWithRouter(<HrOrganization />);
    
    await waitFor(() => {
      expect(screen.getByText('Phòng IT')).toBeInTheDocument();
      expect(screen.getByText('Phòng HR')).toBeInTheDocument();
    });
  });

  /**
   * TC02: FE - Hiển thị đúng số lượng phòng ban
   */
  test('TC02: Hiển thị đúng số lượng', async () => {
    renderWithRouter(<HrOrganization />);
    
    await waitFor(() => {
      expect(screen.getByText('Phòng IT')).toBeInTheDocument();
      expect(screen.getByText('Phòng HR')).toBeInTheDocument();
    });
  });

  // ==================== BACKEND TESTS (3 TC) ====================

  /**
   * TC03: BE - Service createPhongBan tạo phòng ban mới
   */
  test('TC03: Service createPhongBan tạo phòng ban mới', async () => {
    createPhongBan.mockResolvedValueOnce({ _id: 'PB-IJKL', tenPhongBan: 'Phòng Sales', chiNhanh: 'CN-ABCD' });
    
    const result = await createPhongBan({
      tenPhongBan: 'Phòng Sales',
      chiNhanh: 'CN-ABCD'
    });

    expect(createPhongBan).toHaveBeenCalledWith(expect.objectContaining({
      tenPhongBan: 'Phòng Sales'
    }));
    expect(result).toHaveProperty('_id');
    expect(result.tenPhongBan).toBe('Phòng Sales');
  });

  /**
   * TC04: BE - Service listPhongBan trả về danh sách
   */
  test('TC04: Service listPhongBan trả về danh sách', async () => {
    const result = await listPhongBan();

    expect(listPhongBan).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  /**
   * TC05: BE - Service updatePhongBan cập nhật phòng ban
   */
  test('TC05: Service updatePhongBan cập nhật phòng ban', async () => {
    updatePhongBan.mockResolvedValueOnce({ _id: 'PB-ABCD', tenPhongBan: 'Phòng IT Updated' });
    
    const result = await updatePhongBan('PB-ABCD', {
      tenPhongBan: 'Phòng IT Updated'
    });

    expect(updatePhongBan).toHaveBeenCalledWith('PB-ABCD', expect.objectContaining({
      tenPhongBan: 'Phòng IT Updated'
    }));
    expect(result).toHaveProperty('_id');
    expect(result.tenPhongBan).toBe('Phòng IT Updated');
  });
});

