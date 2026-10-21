// ============================================
// DASHBOARD.JS - Dashboard (dashboard.html)
// ============================================

(function() {
    'use strict';

    // === CEK SESSION - HARUS LOGIN ===
    function isLoggedIn() {
        // Cek apakah ada session sementara
        const tempLogin = sessionStorage.getItem('tempLogin');
        const tempUsername = sessionStorage.getItem('tempUsername');
        
        if (tempLogin === 'true' && tempUsername) {
            return true;
        }
        return false;
    }

    // Jika tidak login, redirect ke login
    if (!isLoggedIn()) {
        localStorage.setItem('redirectMessage', 'Silakan login terlebih dahulu');
        window.location.href = 'login.html';
        return;
    }

    // === GET CURRENT USER ===
    function getCurrentUser() {
        const username = sessionStorage.getItem('tempUsername');
        if (!username) return null;
        const users = JSON.parse(localStorage.getItem('antiScamUsers')) || [];
        return users.find(u => u.username === username) || null;
    }

    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.role === 'superadmin';
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

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
            
            // Tambahkan menu khusus
            const navbarLinks = document.querySelector('.navbar-links');
            if (navbarLinks) {
                const oldMenu = document.getElementById('adminMenu');
                if (oldMenu) oldMenu.remove();
                
                let menuHTML = '';
                if (isSuperAdmin) {
                    menuHTML += `<a href="kelola-admin.html" style="color:var(--accent-purple);"><i class="fas fa-users-cog"></i> Kelola Admin</a>`;
                    menuHTML += `<a href="data-import-export.html" id="importExportLink" style="color:var(--accent-purple);"><i class="fas fa-database"></i> Backup</a>`;
                }
                if (isAdmin || isSuperAdmin) {
                    menuHTML += `<a href="lacak-rekening.html" style="color:var(--accent-blue);"><i class="fas fa-search-dollar"></i> Lacak</a>`;
                }
                
                if (menuHTML) {
                    const menuWrapper = document.createElement('div');
                    menuWrapper.id = 'adminMenu';
                    menuWrapper.style.display = 'inline-flex';
                    menuWrapper.style.gap = '8px';
                    menuWrapper.innerHTML = menuHTML;
                    
                    const loginLink = navbarLinks.querySelector('a[href="login.html"]');
                    if (loginLink) {
                        navbarLinks.insertBefore(menuWrapper, loginLink);
                    } else {
                        navbarLinks.appendChild(menuWrapper);
                    }
                }
            }
        } else {
            navLogin.innerHTML = '<i class="fas fa-user"></i>';
            navLogin.style.color = 'var(--accent-blue)';
        }
    }

    // === AMBIL ELEMEN ===
    const tbody = document.getElementById('laporanTableBody');
    const totalSpan = document.getElementById('totalLaporan');
    const filterSelect = document.getElementById('filterJenis');
    const searchInput = document.getElementById('searchNomor');

    let laporanData = [];
    let filteredData = [];

    function loadData() {
        laporanData = JSON.parse(localStorage.getItem('laporanAntiScam')) || [];
        filteredData = [...laporanData];
        return filteredData;
    }

    function renderTable(data) {
        if (!data || data.length === 0) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align:center; padding:2.5rem 1rem; color:var(--text-muted);">
                            <i class="fas fa-inbox" style="font-size:2rem; display:block; margin-bottom:0.5rem; opacity:0.3;"></i>
                            Belum ada laporan masuk
                        </td>
                    </tr>
                `;
            }
            if (totalSpan) totalSpan.textContent = '0 Laporan';
            return;
        }

        if (totalSpan) totalSpan.textContent = `${data.length} Laporan`;
        
        if (tbody) {
            tbody.innerHTML = data.map((item, index) => {
                let statusClass = 'badge-baru';
                let statusText = item.status || 'baru';
                
                if (item.status === 'selesai') {
                    statusClass = 'badge-selesai';
                } else if (item.status === 'proses') {
                    statusClass = 'badge-proses';
                } else if (item.status === 'tidak-valid') {
                    statusClass = 'badge-tidak-valid';
                }
                
                return `
                    <tr>
                        <td style="text-align:center;">${index + 1}</td>
                        <td>
                            <span class="badge badge-baru" style="background:rgba(100,116,139,0.15); color:var(--text-muted);">
                                ${item.jenis || 'Tidak diketahui'}
                            </span>
                        </td>
                        <td style="font-family:monospace; font-weight:600; color:var(--accent-blue);">
                            ${item.nomorPelaku}
                        </td>
                        <td>${item.namaPelaku || '-'}</td>
                        <td style="font-size:0.8rem; color:var(--text-muted);">${item.tanggal || '-'}</td>
                        <td>
                            <span class="badge ${statusClass}">${statusText}</span>
                        </td>
                        <td style="text-align:center;">
                            <button onclick="window.detailLaporan('${item.id || index}')" 
                                    style="background:none; border:none; color:var(--accent-blue); cursor:pointer; font-size:1rem;">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${isAdmin || isSuperAdmin ? `
                            <button onclick="window.hapusLaporan('${item.id || index}')" 
                                    style="background:none; border:none; color:var(--accent-red); cursor:pointer; font-size:1rem; margin-left:8px;">
                                <i class="fas fa-trash-can"></i>
                            </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    window.detailLaporan = function(id) {
        let item = laporanData.find(d => d.id === id);
        if (!item) {
            const index = parseInt(id);
            if (!isNaN(index) && laporanData[index]) {
                item = laporanData[index];
            }
        }
        
        if (!item) {
            alert('❌ Data laporan tidak ditemukan!');
            return;
        }
        
        const message = `
📋 DETAIL LAPORAN
═══════════════════
🆔 ID: ${item.id || '-'}
📌 Jenis: ${item.jenis || '-'}
📱 Nomor Pelaku: ${item.nomorPelaku}
👤 Nama Pelaku: ${item.namaPelaku || '-'}
📅 Tanggal: ${item.tanggal || '-'}
📊 Status: ${item.status || 'baru'}
${item.bukti ? '📎 Bukti: ' + item.bukti : ''}

📝 Deskripsi:
${item.deskripsi || 'Tidak ada deskripsi'}
        `;
        
        const pilihan = confirm(
            message + '\n\n━━━━━━━━━━━━━━━━━━━━━\nKlik "OK" untuk ubah status menjadi "selesai"\nKlik "Batal" untuk tutup'
        );
        
        if (pilihan) {
            updateStatus(item.id || laporanData.indexOf(item));
        }
    };

    function updateStatus(id) {
        if (!isAdmin && !isSuperAdmin) {
            alert('⛔ Hanya Admin yang bisa mengubah status!');
            return;
        }
        
        let index = laporanData.findIndex(d => d.id === id);
        if (index === -1) {
            const idx = parseInt(id);
            if (!isNaN(idx) && laporanData[idx]) {
                index = idx;
            }
        }
        
        if (index === -1) {
            alert('❌ Data tidak ditemukan!');
            return;
        }
        
        const statusBaru = prompt(
            'Ubah status laporan:\n\n' +
            'Ketik: baru | proses | selesai | tidak-valid\n\n' +
            `Status saat ini: ${laporanData[index].status}`
        );
        
        if (statusBaru && ['baru', 'proses', 'selesai', 'tidak-valid'].includes(statusBaru.toLowerCase())) {
            laporanData[index].status = statusBaru.toLowerCase();
            localStorage.setItem('laporanAntiScam', JSON.stringify(laporanData));
            applyFilters();
            alert('✅ Status berhasil diubah menjadi "' + statusBaru + '"!');
        } else if (statusBaru !== null) {
            alert('❌ Status tidak valid! Gunakan: baru, proses, selesai, atau tidak-valid');
        }
    }

    window.hapusLaporan = function(id) {
        if (!isAdmin && !isSuperAdmin) {
            alert('⛔ Hanya Admin yang bisa menghapus laporan!');
            return;
        }
        
        if (!confirm('⚠️ Yakin ingin menghapus laporan ini?')) return;
        
        let index = laporanData.findIndex(d => d.id === id);
        if (index === -1) {
            const idx = parseInt(id);
            if (!isNaN(idx) && laporanData[idx]) {
                index = idx;
            }
        }
        
        if (index === -1) {
            alert('❌ Data tidak ditemukan!');
            return;
        }
        
        laporanData.splice(index, 1);
        localStorage.setItem('laporanAntiScam', JSON.stringify(laporanData));
        applyFilters();
        alert('🗑️ Laporan berhasil dihapus!');
    };

    function applyFilters() {
        const filterJenis = filterSelect ? filterSelect.value : 'semua';
        const searchNomor = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        filteredData = laporanData.filter(item => {
            if (filterJenis !== 'semua' && item.jenis !== filterJenis) {
                return false;
            }
            if (searchNomor && !item.nomorPelaku.toLowerCase().includes(searchNomor)) {
                return false;
            }
            return true;
        });
        
        renderTable(filteredData);
    }

    window.hapusSemua = function() {
        if (!isSuperAdmin) {
            alert('⛔ Hanya Super Admin yang bisa menghapus semua data!');
            return;
        }
        
        if (!confirm('⚠️ Yakin ingin menghapus SEMUA data laporan? Tindakan ini tidak bisa dibatalkan!')) {
            return;
        }
        
        if (!confirm('Konfirmasi lagi: Hapus semua ' + laporanData.length + ' laporan?')) {
            return;
        }
        
        localStorage.removeItem('laporanAntiScam');
        laporanData = [];
        filteredData = [];
        renderTable([]);
        alert('✅ Semua data berhasil dihapus!');
    };

    window.exportCSV = function() {
        if (!isAdmin && !isSuperAdmin) {
            alert('⛔ Hanya Admin yang bisa export data!');
            return;
        }
        
        if (laporanData.length === 0) {
            alert('❌ Tidak ada data untuk diexport!');
            return;
        }
        
        const headers = ['No', 'Jenis', 'Nomor Pelaku', 'Nama Pelaku', 'Deskripsi', 'Tanggal', 'Status'];
        const rows = laporanData.map((item, index) => [
            index + 1,
            item.jenis || '',
            item.nomorPelaku || '',
            item.namaPelaku || '',
            (item.deskripsi || '').replace(/,/g, ';'),
            item.tanggal || '',
            item.status || ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `laporan_antiscam_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        
        alert('📊 Data berhasil diexport ke CSV!');
    };

    // === UBAH PASSWORD ===
    window.showChangePasswordModal = function() {
        const username = sessionStorage.getItem('tempUsername');
        if (!username) {
            alert('❌ Anda harus login terlebih dahulu!');
            return;
        }

        if (document.getElementById('passwordModal')) {
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'passwordModal';
        modal.innerHTML = `
            <div class="modal-box">
                <div class="modal-title">
                    <i class="fas fa-key"></i> Ubah Password
                </div>
                <div class="modal-subtitle">
                    Mengubah password untuk akun: <strong style="color:var(--accent-blue);">${username}</strong>
                </div>
                <form id="changePasswordForm">
                    <div class="form-group">
                        <label>Password Lama</label>
                        <input type="password" id="oldPassword" class="form-control" placeholder="Masukkan password lama" required />
                    </div>
                    <div class="form-group">
                        <label>Password Baru</label>
                        <input type="password" id="newPassword" class="form-control" placeholder="Minimal 6 karakter" required />
                    </div>
                    <div class="form-group">
                        <label>Konfirmasi Password Baru</label>
                        <input type="password" id="confirmNewPassword" class="form-control" placeholder="Ulangi password baru" required />
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-cancel" onclick="window.closePasswordModal()">
                            <i class="fas fa-times"></i> Batal
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Simpan
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
            e.preventDefault();
            handleChangePassword(username);
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                window.closePasswordModal();
            }
        });
    };

    window.closePasswordModal = function() {
        const modal = document.getElementById('passwordModal');
        if (modal) {
            modal.remove();
        }
    };

    function handleChangePassword(username) {
        const oldPassword = document.getElementById('oldPassword').value.trim();
        const newPassword = document.getElementById('newPassword').value.trim();
        const confirmNew = document.getElementById('confirmNewPassword').value.trim();

        if (!oldPassword || !newPassword || !confirmNew) {
            alert('⚠️ Semua field wajib diisi!');
            return;
        }

        if (newPassword.length < 6) {
            alert('⚠️ Password baru minimal 6 karakter!');
            return;
        }

        if (newPassword !== confirmNew) {
            alert('⚠️ Konfirmasi password tidak cocok!');
            return;
        }

        const users = JSON.parse(localStorage.getItem('antiScamUsers')) || [];
        const userIndex = users.findIndex(u => u.username === username);

        if (userIndex === -1) {
            alert('❌ Akun tidak ditemukan!');
            return;
        }

        if (users[userIndex].password !== oldPassword) {
            alert('❌ Password lama salah!');
            return;
        }

        users[userIndex].password = newPassword;
        localStorage.setItem('antiScamUsers', JSON.stringify(users));

        window.closePasswordModal();
        alert('✅ Password berhasil diubah!');
    }

    function addChangePasswordButton() {
        const container = document.querySelector('.flex-between.flex-wrap');
        if (!container) return;

        if (document.getElementById('changePasswordBtn')) return;

        const btnWrapper = document.createElement('div');
        btnWrapper.innerHTML = `
            <button id="changePasswordBtn" class="btn btn-outline btn-sm" onclick="window.showChangePasswordModal()" style="margin-left:auto;">
                <i class="fas fa-key"></i> Ubah Password
            </button>
        `;
        container.appendChild(btnWrapper.firstElementChild);
    }

    // ============================================
    // SEMBUNYIKAN LINK BACKUP
    // ============================================
    function getCurrentUserFromLocal() {
        const username = sessionStorage.getItem('tempUsername');
        if (!username) return null;
        const users = JSON.parse(localStorage.getItem('antiScamUsers')) || [];
        return users.find(u => u.username === username) || null;
    }

    function hideBackupLinkIfNotSuperAdmin() {
        const currentUser = getCurrentUserFromLocal();
        const link = document.getElementById('importExportLink');
        if (link && currentUser?.role !== 'superadmin') {
            link.style.display = 'none';
        }
    }

    // === INISIALISASI ===
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📊 Dashboard AntiScam.ID');
        console.log('👑 Role:', currentUser?.role || 'Unknown');
        
        updateNavbar();
        loadData();
        renderTable(filteredData);
        addChangePasswordButton();
        
        hideBackupLinkIfNotSuperAdmin();
        
        if (filterSelect) {
            filterSelect.addEventListener('change', applyFilters);
        }
        if (searchInput) {
            searchInput.addEventListener('input', applyFilters);
        }
        
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', window.exportCSV);
        }
        
        const hapusBtn = document.getElementById('hapusSemuaBtn');
        if (hapusBtn) {
            hapusBtn.addEventListener('click', window.hapusSemua);
        }
    });

})();