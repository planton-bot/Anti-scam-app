// ============================================
// MAIN.JS - Halaman Utama (index.html)
// ============================================

(function() {
    'use strict';

    // === HAPUS SESSION SAAT BUKA HALAMAN UTAMA ===
    function clearAllSessions() {
        localStorage.removeItem('antiScamSession');
        localStorage.removeItem('antiScamUsername');
        sessionStorage.removeItem('tempLogin');
        sessionStorage.removeItem('tempUsername');
    }

    function updateStatistics() {
        const laporan = JSON.parse(localStorage.getItem('laporanAntiScam')) || [];
        
        const total = laporan.length;
        const selesai = laporan.filter(item => item.status === 'selesai').length;
        const nomorUnik = new Set(laporan.map(item => item.nomorPelaku)).size;
        const modusUnik = new Set(laporan.map(item => item.jenis)).size;
        
        const statTotal = document.getElementById('statTotal');
        const statSelesai = document.getElementById('statSelesai');
        const statNomor = document.getElementById('statNomor');
        const statModus = document.getElementById('statModus');
        
        if (statTotal) statTotal.textContent = total;
        if (statSelesai) statSelesai.textContent = selesai;
        if (statNomor) statNomor.textContent = nomorUnik;
        if (statModus) statModus.textContent = modusUnik;
    }

    function showRecentReports() {
        const laporan = JSON.parse(localStorage.getItem('laporanAntiScam')) || [];
        const container = document.getElementById('recentReports');
        
        if (!container) return;
        
        if (laporan.length === 0) {
            container.innerHTML = `
                <div class="card text-center text-muted" style="padding:2rem;">
                    <i class="fas fa-inbox" style="font-size:2rem; display:block; margin-bottom:0.5rem; opacity:0.4;"></i>
                    Belum ada laporan masuk. Jadilah yang pertama melapor!
                </div>
            `;
            return;
        }
        
        const recent = laporan.slice(-3).reverse();
        container.innerHTML = recent.map(item => `
            <div class="card" style="margin-bottom:0.75rem; padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                <div>
                    <span style="font-weight:600; color:var(--accent-blue); font-family:monospace;">${item.nomorPelaku}</span>
                    <span class="badge badge-baru" style="margin-left:8px;">${item.jenis || 'Tidak diketahui'}</span>
                </div>
                <div style="display:flex; align-items:center; gap:12px; color:var(--text-muted); font-size:0.8rem;">
                    <span><i class="far fa-calendar"></i> ${item.tanggal || '-'}</span>
                    <span class="badge ${item.status === 'selesai' ? 'badge-selesai' : item.status === 'proses' ? 'badge-proses' : 'badge-baru'}">
                        ${item.status || 'baru'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    function updateNavbar() {
        const navLogin = document.getElementById('navLogin');
        if (!navLogin) return;
        
        // Selalu tampilkan icon user (belum login)
        navLogin.innerHTML = '<i class="fas fa-user"></i>';
        navLogin.style.color = 'var(--accent-blue)';
    }

    document.addEventListener('DOMContentLoaded', function() {
        // Hapus semua session
        clearAllSessions();
        
        updateStatistics();
        showRecentReports();
        updateNavbar();
        
        setInterval(updateStatistics, 30000);
        setInterval(showRecentReports, 30000);
    });

})();