// ============================================
// KELOLA-ADMIN.JS - Hanya Super Admin
// ============================================

(function() {
    'use strict';

    // === CEK SESSION ===
    function isLoggedIn() {
        const tempLogin = sessionStorage.getItem('tempLogin');
        const tempUsername = sessionStorage.getItem('tempUsername');
        
        if (tempLogin === 'true' && tempUsername) {
            return true;
        }
        return false;
    }

    if (!isLoggedIn()) {
        localStorage.setItem('redirectMessage', 'Silakan login terlebih dahulu');
        window.location.href = 'login.html';
        return;
    }

    function getCurrentUser() {
        const username = sessionStorage.getItem('tempUsername');
        if (!username) return null;
        const users = JSON.parse(localStorage.getItem('antiScamUsers')) || [];
        return users.find(u => u.username === username) || null;
    }

    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== 'superadmin') {
        alert('⛔ Akses ditolak! Hanya Super Admin yang bisa mengakses halaman ini.');
        window.location.href = 'dashboard.html';
        return;
    }

    // === FUNGSI ===
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        const colors = {
            success: 'toast-success',
            error: 'toast-error',
            info: 'toast-info'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${colors[type] || 'toast-info'}`;
        toast.innerHTML = `
            <span class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(30px)';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }

    function getUsers() {
        return JSON.parse(localStorage.getItem('antiScamUsers')) || [];
    }

    function saveUsers(users) {
        localStorage.setItem('antiScamUsers', JSON.stringify(users));
    }

    function renderAdminList() {
        const users = getUsers();
        const tbody = document.getElementById('adminTableBody');

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">
                        <i class="fas fa-inbox" style="display:block; font-size:2rem; opacity:0.3; margin-bottom:0.5rem;"></i>
                        Belum ada admin terdaftar
                    </td>
                </tr>
            `;
            return;
        }

        const roleLabels = {
            superadmin: '🛡️ Super Admin',
            admin: '🔐 Admin Premium',
            staff: '👤 Staff'
        };

        const roleClasses = {
            superadmin: 'badge-superadmin',
            admin: 'badge-admin',
            staff: 'badge-staff'
        };

        tbody.innerHTML = users.map((user, index) => `
            <tr>
                <td><strong>${user.username}</strong></td>
                <td><span class="badge ${roleClasses[user.role] || 'badge-staff'}">${roleLabels[user.role] || user.role}</span></td>
                <td>Level ${user.level || 3}</td>
                <td style="font-size:0.8rem; color:var(--text-muted);">${new Date(user.createdAt).toLocaleDateString('id-ID')}</td>
                <td style="text-align:center;">
                    ${user.username !== 'superadmin' ? `
                        <button onclick="window.editAdmin('${user.username}')" class="btn-action info" title="Ubah Password">
                            <i class="fas fa-key"></i>
                        </button>
                        <button onclick="window.deleteAdmin('${user.username}')" class="btn-action danger" title="Hapus">
                            <i class="fas fa-trash-can"></i>
                        </button>
                    ` : `
                        <span style="color:var(--text-muted); font-size:0.7rem;">
                            <i class="fas fa-crown" style="color:var(--accent-yellow);"></i> Utama
                        </span>
                    `}
                </td>
            </tr>
        `).join('');
    }

    // === TAMBAH ADMIN ===
    document.getElementById('tambahAdminForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value.trim();
        const role = document.getElementById('newRole').value;

        if (!username || !password) {
            showToast('⚠️ Username dan password wajib diisi!', 'error');
            return;
        }

        if (username.length < 3) {
            showToast('⚠️ Username minimal 3 karakter!', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('⚠️ Password minimal 6 karakter!', 'error');
            return;
        }

        const users = getUsers();
        
        if (users.find(u => u.username === username)) {
            showToast('⚠️ Username sudah digunakan!', 'error');
            return;
        }

        const levelMap = { superadmin: 1, admin: 2, staff: 3 };

        users.push({
            username: username,
            password: password,
            role: role,
            level: levelMap[role] || 3,
            createdAt: new Date().toISOString()
        });

        saveUsers(users);
        renderAdminList();
        this.reset();
        showToast(`✅ Admin "${username}" berhasil ditambahkan!`, 'success');
    });

    // === EDIT PASSWORD ===
    window.editAdmin = function(username) {
        const newPassword = prompt(`Ubah password untuk "${username}":\n\nMasukkan password baru (minimal 6 karakter)`);
        
        if (newPassword === null) return;
        
        if (newPassword.length < 6) {
            showToast('⚠️ Password minimal 6 karakter!', 'error');
            return;
        }

        const users = getUsers();
        const userIndex = users.findIndex(u => u.username === username);
        
        if (userIndex === -1) {
            showToast('❌ User tidak ditemukan!', 'error');
            return;
        }

        users[userIndex].password = newPassword;
        saveUsers(users);
        renderAdminList();
        showToast(`✅ Password untuk "${username}" berhasil diubah!`, 'success');
    };

    // === HAPUS ADMIN ===
    window.deleteAdmin = function(username) {
        if (username === 'superadmin') {
            showToast('⛔ Tidak bisa menghapus akun Super Admin utama!', 'error');
            return;
        }

        if (!confirm(`⚠️ Yakin ingin menghapus admin "${username}"?`)) return;
        if (!confirm(`Konfirmasi lagi: Hapus "${username}"?`)) return;

        const users = getUsers();
        const filtered = users.filter(u => u.username !== username);
        
        if (filtered.length === users.length) {
            showToast('❌ User tidak ditemukan!', 'error');
            return;
        }

        saveUsers(filtered);
        renderAdminList();
        showToast(`🗑️ Admin "${username}" berhasil dihapus!`, 'success');
    };

    // === UPDATE NAVBAR ===
    function updateNavbar() {
        const navLogin = document.getElementById('navLogin');
        if (!navLogin) return;
        
        const user = getCurrentUser();
        
        if (user) {
            navLogin.innerHTML = `<i class="fas fa-user-check"></i> <span class="admin-badge">🛡️ Super Admin</span>`;
            navLogin.style.color = 'var(--accent-green)';
        } else {
            navLogin.innerHTML = '<i class="fas fa-user"></i>';
            navLogin.style.color = 'var(--accent-blue)';
        }
    }

    // === INISIALISASI ===
    document.addEventListener('DOMContentLoaded', function() {
        updateNavbar();
        renderAdminList();
        console.log('👑 Super Admin Panel - Kelola Admin');
    });

})();