// ============================================
// DATA-IMPORT-EXPORT.JS
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

    function getCurrentUser() {
        const username = sessionStorage.getItem('tempUsername');
        if (!username) return null;
        const users = JSON.parse(localStorage.getItem('antiScamUsers')) || [];
        return users.find(u => u.username === username) || null;
    }

    // Cek privilege: hanya superadmin
    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.role === 'superadmin';

    if (!isLoggedIn() || !isSuperAdmin) {
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

    function getAllData() {
        return {
            laporan: JSON.parse(localStorage.getItem('laporanAntiScam')) || [],
            users: JSON.parse(localStorage.getItem('antiScamUsers')) || [],
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    function updateStats() {
        const data = getAllData();
        document.getElementById('statLaporan').textContent = data.laporan.length;
        document.getElementById('statAdmin').textContent = data.users.length;
        const nomorUnik = new Set(data.laporan.map(l => l.nomorPelaku)).size;
        document.getElementById('statNomorUnik').textContent = nomorUnik;
    }

    // === UPDATE NAVBAR ===
    function updateNavbar() {
        const navLogin = document.getElementById('navLogin');
        if (!navLogin) return;
        
        const user = getCurrentUser();
        
        if (user) {
            const roleLabels = {
                superadmin: '🛡️ Super Admin',
                admin: '🔐 Admin Premium',
                staff: '👤 Staff'
            };
            navLogin.innerHTML = `<i class="fas fa-user-check"></i> <span class="admin-badge">${roleLabels[user.role] || 'Admin'}</span>`;
            navLogin.style.color = 'var(--accent-green)';
        } else {
            navLogin.innerHTML = '<i class="fas fa-user"></i>';
            navLogin.style.color = 'var(--accent-blue)';
        }
    }

    // === EXPORT ===
    document.getElementById('exportBtn').addEventListener('click', function() {
        const data = getAllData();
        
        // Preview
        const preview = document.getElementById('exportPreview');
        preview.style.display = 'block';
        preview.innerHTML = syntaxHighlight(JSON.stringify(data, null, 2));
        
        // Download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `antiscam_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast(`📤 Data berhasil diexport! (${data.laporan.length} laporan, ${data.users.length} admin)`, 'success');
    });

    // === SYNTAX HIGHLIGHT ===
    function syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(?:[^"\\]|\\.)*"):/g, function(match) {
            return `<span class="json-key">${match}</span>`;
        }).replace(/: "([^"]*)"/g, function(match, p1) {
            return `: <span class="json-string">"${p1}"</span>`;
        }).replace(/: (\d+)/g, function(match, p1) {
            return `: <span class="json-number">${p1}</span>`;
        }).replace(/: (true|false)/g, function(match, p1) {
            return `: <span class="json-boolean">${p1}</span>`;
        }).replace(/: (null)/g, function(match, p1) {
            return `: <span class="json-null">${p1}</span>`;
        });
    }

    // === IMPORT - Preview File ===
    document.getElementById('importFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                // Validasi struktur
                if (!data.laporan || !data.users) {
                    showToast('❌ File JSON tidak valid! Harus ada "laporan" dan "users".', 'error');
                    return;
                }

                // Preview
                const preview = document.getElementById('importPreview');
                preview.style.display = 'block';
                preview.innerHTML = syntaxHighlight(JSON.stringify(data, null, 2));
                
                // Tampilkan tombol confirm
                const confirmBtn = document.getElementById('importConfirmBtn');
                confirmBtn.style.display = 'inline-flex';
                confirmBtn.textContent = `⚠️ Import ${data.laporan.length} Laporan & ${data.users.length} Admin (Hapus Data Lama)`;
                
                // Simpan data untuk diimport
                confirmBtn.onclick = function() {
                    if (!confirm('⚠️ PERINGATAN: Data lama akan DIHAPUS dan diganti dengan data baru! Lanjutkan?')) return;
                    if (!confirm('Konfirmasi lagi: Yakin ingin mengganti semua data?')) return;
                    
                    // Simpan data baru
                    localStorage.setItem('laporanAntiScam', JSON.stringify(data.laporan));
                    localStorage.setItem('antiScamUsers', JSON.stringify(data.users));
                    
                    // Update stats
                    updateStats();
                    
                    // Reset
                    preview.style.display = 'none';
                    confirmBtn.style.display = 'none';
                    document.getElementById('importFile').value = '';
                    
                    showToast(`✅ Import berhasil! ${data.laporan.length} laporan, ${data.users.length} admin.`, 'success');
                    
                    // Reload setelah 2 detik
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                };
                
                showToast(`📥 File siap diimport: ${data.laporan.length} laporan, ${data.users.length} admin`, 'info');
                
            } catch (error) {
                showToast('❌ Gagal membaca file JSON: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    });

    // === INISIALISASI ===
    document.addEventListener('DOMContentLoaded', function() {
        updateNavbar();
        updateStats();
        console.log('📦 Import/Export Data - Super Admin Panel');
    });

})();