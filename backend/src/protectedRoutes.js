import { Router } from 'express';
import mongoose from 'mongoose';
import { extractJwt } from './middleware/auth.js';
import { verifyToken } from './jwt.js';
import * as notificationService from './services/notificationService.js';
import * as adminService from './services/adminService.js';
import * as loginLogService from './services/loginLogService.js';

function role(req) {
    return req.jwtPayload?.role;
}

function requireRoles(...roles) {
    const u = roles.map((r) => r.toUpperCase());
    return (req, res, next) => {
        const r0 = String(role(req) || '').toUpperCase();
        if (!u.includes(r0)) {
            res.status(403).json({ message: 'Không đủ quyền' });
            return;
        }
        next();
    };
}

async function currentTaiKhoan(req) {
    const { findTaiKhoanByUsername } = await import('./helpers/userContext.js');
    return findTaiKhoanByUsername(req.jwtPayload?.sub);
}

export function buildProtectedRouter() {
    const r = Router();

    // ======================== NOTIFICATIONS ========================
    r.get('/notifications', requireRoles('ADMIN'), async (req, res) => {
        const u = req.jwtPayload.sub;
        res.json(await notificationService.listForUser(u, Number(req.query.limit || 50)));
    });

    r.get('/notifications/unread-count', requireRoles('ADMIN'), async (req, res) => {
        const u = req.jwtPayload.sub;
        res.json({ unread: await notificationService.countUnreadPrivate(u) });
    });

    r.put('/notifications/:id/read', requireRoles('ADMIN'), async (req, res) => {
        const ok = await notificationService.markRead(req.params.id, req.jwtPayload.sub);
        if (!ok) return res.status(404).end();
        res.json({});
    });

    r.put('/notifications/read-all', requireRoles('ADMIN'), async (req, res) => {
        const n = await notificationService.markAllReadPrivate(req.jwtPayload.sub);
        res.json({ updated: n });
    });

    r.post('/notifications/broadcast', requireRoles('ADMIN'), async (req, res) => {
        await notificationService.notifyBroadcast(
            'SYSTEM_BROADCAST',
            req.body?.title || 'Thông báo hệ thống',
            req.body?.content || '',
            null
        );
        res.status(202).end();
    });

    // ======================== ADMIN DASHBOARD ========================
    r.get('/dashboard/admin/accounts', requireRoles('ADMIN'), async (req, res) => {
        res.json(await adminService.listAccounts(req.query.q, req.query.role, req.query.active));
    });

    r.get('/dashboard/admin/accounts/unassigned', requireRoles('ADMIN'), async (_req, res) => {
        res.json(await adminService.listTaiKhoanChuaGanNhanVien());
    });

    r.get('/dashboard/admin/employees/unassigned', requireRoles('ADMIN'), async (_req, res) => {
        res.json(await adminService.listNhanVienChuaCoTaiKhoanBrief());
    });

    r.get('/dashboard/admin/login-logs', requireRoles('ADMIN'), async (req, res) => {
        const limit = req.query.limit ? Number(req.query.limit) : 200;
        res.json(await loginLogService.listLoginLogs(limit));
    });

    r.post('/dashboard/admin/accounts', requireRoles('ADMIN'), async (req, res) => {
        try {
            const b = req.body || {};
            const out = await adminService.createAccount(
                b.username,
                b.password,
                b.role,
                b.nhanVienId,
                req.jwtPayload.sub
            );
            res.json(out);
        } catch (e) {
            res.status(e.status || 400).json({ message: e.message });
        }
    });

    r.put('/dashboard/admin/accounts/:maTaiKhoan/toggle-status', requireRoles('ADMIN'), async (req, res) => {
        try {
            res.json(await adminService.toggleStatus(req.params.maTaiKhoan, req.jwtPayload.sub));
        } catch (e) {
            res.status(e.status || 400).json({ message: e.message });
        }
    });

    r.put('/dashboard/admin/accounts/:maTaiKhoan/role', requireRoles('ADMIN'), async (req, res) => {
        try {
            const b = req.body || {};
            res.json(
                await adminService.updateRoleAndDirectManager(
                    req.params.maTaiKhoan,
                    b.role,
                    b.directManagerId,
                    req.jwtPayload.sub
                )
            );
        } catch (e) {
            res.status(e.status || 400).json({ message: e.message });
        }
    });

    r.get('/dashboard/admin/employees/direct-managers', requireRoles('ADMIN'), async (_req, res) => {
        res.json(await adminService.listDirectManagerCandidates());
    });

    r.get('/dashboard/admin/employees/with-accounts', requireRoles('ADMIN'), async (_req, res) => {
        res.json(await adminService.listEmployeesWithAccountsBrief());
    });

    r.get('/dashboard/admin/employees/subordinates', requireRoles('ADMIN'), async (req, res) => {
        res.json(await adminService.listSubordinatesBrief(req.query.managerId));
    });

    r.put('/dashboard/admin/accounts/:maTaiKhoan/manage-subordinates', requireRoles('ADMIN'), async (req, res) => {
        try {
            await adminService.updateManagedSubordinates(
                req.params.maTaiKhoan,
                req.body?.employeeIds,
                req.jwtPayload.sub
            );
            res.status(204).end();
        } catch (e) {
            res.status(e.status || 400).json({ message: e.message });
        }
    });

    r.put('/dashboard/admin/accounts/:maTaiKhoan/assign', requireRoles('ADMIN'), async (req, res) => {
        try {
            res.json(
                await adminService.assignNhanVien(req.params.maTaiKhoan, req.body?.nhanVienId, req.jwtPayload.sub)
            );
        } catch (e) {
            res.status(e.status || 400).json({ message: e.message });
        }
    });

    r.delete('/dashboard/admin/accounts/:maTaiKhoan', requireRoles('ADMIN'), async (req, res) => {
        try {
            await adminService.deleteAccount(req.params.maTaiKhoan, req.jwtPayload.sub);
            res.status(204).end();
        } catch (e) {
            res.status(e.status || 400).json({ message: e.message });
        }
    });

    r.post('/dashboard/admin/accounts/:maTaiKhoan/reset-password', requireRoles('ADMIN'), async (req, res) => {
        try {
            const raw = await adminService.resetPassword(req.params.maTaiKhoan, req.body?.newPassword);
            res.json({ message: 'Đã đặt mật khẩu mới', temporaryPassword: raw });
        } catch (e) {
            res.status(e.status || 400).json({ message: e.message });
        }
    });

    return r;
}
