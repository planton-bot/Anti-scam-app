// ============================================
// CEK-NOMOR.JS - Halaman Cek Nomor
// ============================================

(function() {
    'use strict';

    const form = document.getElementById('cekForm');
    const nomorInput = document.getElementById('nomorCari');
    const hasilDiv = document.getElementById('hasilCek');

    // Fungsi untuk menampilkan toast
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

    // Fungsi utama cek nomor
    function cekNomor(nomor) {
        const laporan = JSON.parse(localStorage.getItem('laporanAntiScam')) || [];
        
        const hasil = laporan.filter(item => 
            item.nomorPelaku && item.nomorPelaku.includes(nomor)
        );

        return hasil;
    }

    // Render hasil pencarian
    function renderHasil(nomor, hasil) {
        if (hasil.length === 0) {
            hasilDiv.innerHTML = `
                <div class="search-result not-found">
                    <span class="result-icon" style="color:var(--accent-green);">
                        <i class="fas fa-check-circle"></i>
                    </span>
                    <div class="result-title" style="color:var(--accent-green);">
                        ✅ Nomor AMAN
                    </div>
                    <div class="result-detail">
                        Nomor <strong>${nomor}</strong> tidak ditemukan dalam database penipuan.
                        <br style="display:block; margin-top:4px;" />
                        <span style="color:var(--text-muted); font-size:0.85rem;">
                            Tetap waspada dan laporkan jika menemukan kejanggalan.
                        </span>
                    </div>
                </div>
            `;
            showToast('✅ Nomor aman, tidak ditemukan dalam database', 'success');
            return;
        }

        const totalLaporan = hasil.length;
        const statusCount = {
            baru: hasil.filter(h => h.status === 'baru').length,
            proses: hasil.filter(h => h.status === 'proses').length,
            selesai: hasil.filter(h => h.status === 'selesai').length,
            'tidak-valid': hasil.filter(h => h.status === 'tidak-valid').length
        };

        hasilDiv.innerHTML = `
            <div class="search-result found">
                <span class="result-icon" style="color:var(--accent-red);">
                    <i class="fas fa-exclamation-triangle"></i>
                </span>
                <div class="result-title" style="color:var(--accent-red);">
                    ⚠️ Nomor TERDAFTAR sebagai Penipuan!
                </div>
                <div class="result-detail">
                    Nomor <strong>${nomor}</strong> ditemukan dalam <strong>${totalLaporan}</strong> laporan penipuan.
                </div>
                
                <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; margin-top:0.75rem;">
                    ${statusCount.baru > 0 ? `<span class="badge badge-baru">Baru: ${statusCount.baru}</span>` : ''}
                    ${statusCount.proses > 0 ? `<span class="badge badge-proses">Diproses: ${statusCount.proses}</span>` : ''}
                    ${statusCount.selesai > 0 ? `<span class="badge badge-selesai">Selesai: ${statusCount.selesai}</span>` : ''}
                    ${statusCount['tidak-valid'] > 0 ? `<span class="badge badge-tidak-valid">Tidak Valid: ${statusCount['tidak-valid']}</span>` : ''}
                </div>

                <div class="report-list" style="margin-top:1rem; border-top:1px solid var(--border-color); padding-top:1rem;">
                    <p style="font-weight:600; font-size:0.9rem; color:var(--text-secondary); margin-bottom:0.5rem;">
                        <i class="fas fa-list"></i> Daftar Laporan:
                    </p>
                    ${hasil.map((item, index) => `
                        <div class="report-item">
                            <div>
                                <span style="font-weight:500;">#${index + 1}</span>
                                <span style="color:var(--text-muted); font-size:0.85rem; margin-left:8px;">
                                    ${item.jenis || 'Tidak diketahui'}
                                </span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="badge ${item.status === 'selesai' ? 'badge-selesai' : item.status === 'proses' ? 'badge-proses' : 'badge-baru'}">
                                    ${item.status || 'baru'}
                                </span>
                                <span style="color:var(--text-muted); font-size:0.75rem;">
                                    ${item.tanggal || '-'}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border-color); text-align:center;">
                    <a href="report.html" class="btn btn-primary btn-sm">
                        <i class="fas fa-flag"></i> Laporkan Juga
                    </a>
                </div>
            </div>
        `;
        showToast(`⚠️ Ditemukan ${totalLaporan} laporan untuk nomor ini`, 'error');
    }

    // Update Navbar
    function updateNavbar() {
        const navLogin = document.getElementById('navLogin');
        if (!navLogin) return;
        
        const isLoggedIn = localStorage.getItem('antiScamSession') === 'true';
        
        if (isLoggedIn) {
            navLogin.innerHTML = '<i class="fas fa-user-check"></i> <span class="admin-badge">Admin</span>';
            navLogin.style.color = 'var(--accent-green)';
        } else {
            navLogin.innerHTML = '<i class="fas fa-user"></i>';
            navLogin.style.color = 'var(--accent-blue)';
        }
    }

    // Event submit
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const nomor = nomorInput.value.trim();
        
        if (!nomor) {
            showToast('⚠️ Masukkan nomor yang ingin dicek', 'error');
            return;
        }

        if (nomor.length < 4) {
            showToast('⚠️ Nomor terlalu pendek (minimal 4 digit)', 'error');
            return;
        }

        const hasil = cekNomor(nomor);
        renderHasil(nomor, hasil);
    });

    // Auto cek jika ada parameter di URL
    document.addEventListener('DOMContentLoaded', function() {
        updateNavbar();
        
        const params = new URLSearchParams(window.location.search);
        const nomor = params.get('q');
        if (nomor) {
            nomorInput.value = nomor;
            form.dispatchEvent(new Event('submit'));
        }
    });

})();