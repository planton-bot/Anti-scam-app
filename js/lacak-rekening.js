// ============================================
// LACAK-REKENING.JS - Admin Premium+
// Panggil Backend Python Flask
// ============================================

(function() {
    'use strict';

    // ============================================
    // KONFIGURASI BACKEND
    // ============================================
    const API_BACKEND = 'http://localhost:5000/api/lacak';

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
        localStorage.setItem('redirectMessage', 'Silakan login terlebih dahulu untuk mengakses fitur Lacak');
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

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
        alert('⛔ Akses ditolak! Fitur ini hanya untuk Admin Premium & Super Admin.');
        window.location.href = 'dashboard.html';
        return;
    }

    // === FUNGSI TOAST ===
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) {
            alert(message);
            return;
        }

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
        }, 5000);
    }

    // === FUNGSI GET LAPORAN ===
    function getLaporan() {
        return JSON.parse(localStorage.getItem('laporanAntiScam')) || [];
    }

    // === FUNGSI CEK IP DARI BACKEND PYTHON ===
    async function getIPGeolocation(ip) {
        try {
            showToast('🔄 Melacak IP dengan Python backend + IPWho...', 'info');
            
            const response = await fetch(`${API_BACKEND}?ip=${ip}`);
            const data = await response.json();
            
            if (data.success) {
                return { error: false, data: data.data };
            } else {
                return { error: true, message: data.message || '❌ Gagal melacak IP' };
            }

        } catch (error) {
            showToast('⚠️ Backend tidak terhubung, fallback ke IPWho langsung...', 'error');
            return fallbackIPWho(ip);
        }
    }

    // === FALLBACK: PAKAI IPWHO LANGSUNG (TANPA BACKEND) ===
    async function fallbackIPWho(ip) {
        try {
            const response = await fetch(`https://api.ipwho.org/ip/${ip}?apiKey=lw_ipwho_43352ab1_beaf7385330c99752acfef03fc6a10fb`);
            const data = await response.json();
            
            if (data.success !== false) {
                return {
                    error: false,
                    data: {
                        ip: data.ip || ip,
                        country: data.country || 'N/A',
                        country_code: data.country_code || 'N/A',
                        region: data.region || 'N/A',
                        city: data.city || 'N/A',
                        latitude: data.latitude || 0,
                        longitude: data.longitude || 0,
                        isp: data.isp || 'N/A',
                        timezone: data.timezone || 'N/A',
                        currency: data.currency || 'N/A',
                        flag_emoji: data.flag?.emoji || '🏳️',
                        is_vpn: data.security?.vpn || false,
                        is_tor: data.security?.tor || false,
                        is_proxy: data.security?.proxy || false,
                        is_hosting: data.security?.hosting || false,
                        threat_score: data.security?.threat_score || 0
                    }
                };
            } else {
                return { error: true, message: data.message || '❌ Error dari IPWho' };
            }
        } catch (error) {
            return { error: true, message: `❌ Gagal: ${error.message}` };
        }
    }

    // === CEK IP SENDIRI ===
    async function cekIPSaya() {
        showToast('🔄 Mendapatkan IP Anda...', 'info');
        
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            
            if (data.ip) {
                document.getElementById('keywordCari').value = data.ip;
                document.getElementById('lacakForm').dispatchEvent(new Event('submit'));
            }
        } catch (error) {
            showToast('❌ Gagal mendapatkan IP: ' + error.message, 'error');
        }
    }

    // === LACAK DATA DARI LAPORAN ===
    function lacakDariLaporan(keyword) {
        const laporan = getLaporan();
        
        const hasil = laporan.filter(item => {
            const nomorMatch = item.nomorPelaku && item.nomorPelaku.toLowerCase().includes(keyword.toLowerCase());
            const namaMatch = item.namaPelaku && item.namaPelaku.toLowerCase().includes(keyword.toLowerCase());
            return nomorMatch || namaMatch;
        });

        return hasil;
    }

    // === CEK APAKAH KEYWORD ADALAH IP ===
    function isIPAddress(keyword) {
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        return ipPattern.test(keyword.trim());
    }

    // === RENDER HASIL LACAK ===
    function renderHasil(keyword, hasilLaporan, geoData) {
        const container = document.getElementById('hasilLacak');

        let html = `<div class="tracking-result">`;

        // HEADER
        html += `
            <div class="tracking-header">
                <div>
                    <strong style="font-size:1.1rem;">🔍 Hasil Lacak</strong>
                    <div style="color:var(--text-muted); font-size:0.85rem;">Kata kunci: "${keyword}"</div>
                </div>
                <span class="status ${hasilLaporan.length > 0 ? 'found' : 'not-found'}">
                    ${hasilLaporan.length > 0 ? `⚠️ ${hasilLaporan.length} Ditemukan` : '✅ Tidak Ditemukan'}
                </span>
            </div>
        `;

        // GEOLOKASI DARI IP
        if (geoData && !geoData.error) {
            const g = geoData.data;
            const isThreat = g.is_vpn || g.is_tor || g.is_proxy || g.threat_score > 5;
            const flag = g.flag_emoji || '🏳️';
            
            html += `
                <div style="background:var(--bg-input); border-radius:var(--radius-sm); padding:1rem; margin-bottom:1rem; border-left:4px solid ${isThreat ? 'var(--accent-red)' : 'var(--accent-green)'};">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                        <div>
                            <h4 style="font-weight:600; font-size:0.95rem;">
                                ${flag} ${g.country || 'N/A'} 
                                <span style="font-weight:400; color:var(--text-muted); font-size:0.8rem;">
                                    ${g.city ? `- ${g.city}` : ''}
                                </span>
                            </h4>
                            <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:4px; font-size:0.85rem; color:var(--text-secondary);">
                                <span><strong>📍</strong> ${g.city || 'N/A'}, ${g.region || ''} ${g.country || ''}</span>
                                <span><strong>🗺️</strong> ${g.latitude || 'N/A'}, ${g.longitude || 'N/A'}</span>
                                <span><strong>🏷️</strong> ${g.isp || 'N/A'}</span>
                                <span><strong>⏰</strong> ${g.timezone || 'N/A'}</span>
                                <span><strong>💰</strong> ${g.currency || 'N/A'}</span>
                            </div>
                        </div>
                        <div style="text-align:center;">
                            <span class="badge ${isThreat ? 'badge-tidak-valid' : 'badge-selesai'}" style="font-size:0.8rem;">
                                ${isThreat ? '⚠️ Mencurigakan' : '✅ Aman'}
                            </span>
                            ${g.is_vpn ? `<span class="badge badge-tidak-valid">🔒 VPN</span>` : ''}
                            ${g.is_tor ? `<span class="badge badge-tidak-valid">🌐 Tor</span>` : ''}
                            ${g.is_proxy ? `<span class="badge badge-tidak-valid">🔀 Proxy</span>` : ''}
                            ${g.is_hosting ? `<span class="badge badge-tidak-valid">☁️ Hosting</span>` : ''}
                        </div>
                    </div>
                    <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
                        <a href="https://www.google.com/maps?q=${g.latitude || 0},${g.longitude || 0}" target="_blank" class="btn btn-outline btn-sm">
                            <i class="fas fa-map"></i> Lihat di Google Maps
                        </a>
                        <a href="https://ipwhois.io/${g.ip || ''}" target="_blank" class="btn btn-outline btn-sm">
                            <i class="fas fa-info-circle"></i> Detail IP
                        </a>
                    </div>
                </div>
            `;
        } else if (geoData && geoData.error) {
            html += `
                <div style="background:var(--bg-input); border-radius:var(--radius-sm); padding:0.75rem 1rem; margin-bottom:1rem; border-left:4px solid var(--accent-yellow);">
                    <span style="color:var(--accent-yellow);"><i class="fas fa-exclamation-triangle"></i> ${geoData.message}</span>
                </div>
            `;
        }

        // DAFTAR LAPORAN
        if (hasilLaporan.length > 0) {
            const uniqueNomor = new Set(hasilLaporan.map(h => h.nomorPelaku)).size;
            const uniqueNama = new Set(hasilLaporan.map(h => h.namaPelaku).filter(Boolean)).size;
            const statusCount = {
                baru: hasilLaporan.filter(h => h.status === 'baru').length,
                proses: hasilLaporan.filter(h => h.status === 'proses').length,
                selesai: hasilLaporan.filter(h => h.status === 'selesai').length,
                'tidak-valid': hasilLaporan.filter(h => h.status === 'tidak-valid').length
            };

            html += `
                <div class="tracking-grid" style="margin-bottom:1rem;">
                    <div class="tracking-item">
                        <label>Total Laporan</label>
                        <div class="value highlight">${hasilLaporan.length}</div>
                    </div>
                    <div class="tracking-item">
                        <label>Nomor Unik</label>
                        <div class="value highlight">${uniqueNomor}</div>
                    </div>
                    <div class="tracking-item">
                        <label>Nama Unik</label>
                        <div class="value highlight">${uniqueNama}</div>
                    </div>
                    <div class="tracking-item">
                        <label>Status</label>
                        <div class="value" style="display:flex; gap:0.5rem; flex-wrap:wrap; font-size:0.8rem;">
                            ${statusCount.baru > 0 ? `<span class="badge badge-baru">Baru: ${statusCount.baru}</span>` : ''}
                            ${statusCount.proses > 0 ? `<span class="badge badge-proses">Proses: ${statusCount.proses}</span>` : ''}
                            ${statusCount.selesai > 0 ? `<span class="badge badge-selesai">Selesai: ${statusCount.selesai}</span>` : ''}
                            ${statusCount['tidak-valid'] > 0 ? `<span class="badge badge-tidak-valid">Tidak Valid: ${statusCount['tidak-valid']}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;

            html += `
                <div style="border-top:1px solid var(--border-color); padding-top:1rem;">
                    <p style="font-weight:600; font-size:0.9rem; color:var(--text-secondary); margin-bottom:0.5rem;">
                        <i class="fas fa-list"></i> Daftar Laporan Terkait:
                    </p>
                    ${hasilLaporan.map((item, index) => `
                        <div class="report-item" style="padding:0.75rem 1rem; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                            <div>
                                <span style="font-weight:600;">#${index + 1}</span>
                                <span style="font-family:monospace; color:var(--accent-blue); margin-left:8px;">${item.nomorPelaku}</span>
                                ${item.namaPelaku ? `<span style="color:var(--text-secondary); font-size:0.85rem; margin-left:4px;">(${item.namaPelaku})</span>` : ''}
                                <span style="color:var(--text-muted); font-size:0.8rem; margin-left:8px;">${item.jenis || 'Tidak diketahui'}</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="badge ${item.status === 'selesai' ? 'badge-selesai' : item.status === 'proses' ? 'badge-proses' : 'badge-baru'}">
                                    ${item.status || 'baru'}
                                </span>
                                <span style="color:var(--text-muted); font-size:0.75rem;">${item.tanggal || '-'}</span>
                                ${item.bukti ? `<span style="color:var(--accent-blue); font-size:0.7rem; cursor:pointer;" onclick="alert('📎 Bukti: ${item.bukti}')"><i class="fas fa-image"></i> Foto</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            html += `
                <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border-color); display:flex; gap:10px; flex-wrap:wrap;">
                    <button onclick="window.exportHasil('${keyword}')" class="btn btn-success btn-sm">
                        <i class="fas fa-file-export"></i> Export Hasil
                    </button>
                    <a href="cek-nomor.html?q=${encodeURIComponent(keyword)}" class="btn btn-outline btn-sm">
                        <i class="fas fa-search"></i> Cek di Database
                    </a>
                </div>
            `;
        } else {
            html += `
                <div style="text-align:center; padding:2rem 0; color:var(--text-muted);">
                    <i class="fas fa-search" style="font-size:3rem; display:block; opacity:0.3; margin-bottom:0.5rem;"></i>
                    Tidak ada data laporan yang cocok dengan "${keyword}"
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;

        if (hasilLaporan.length > 0) {
            showToast(`⚠️ Ditemukan ${hasilLaporan.length} data terkait "${keyword}"`, 'error');
        } else if (geoData && !geoData.error) {
            showToast(`📍 ${geoData.data.flag_emoji || '🏳️'} ${geoData.data.city || 'N/A'}, ${geoData.data.country || 'N/A'}`, 'info');
        } else {
            showToast('✅ Tidak ditemukan data untuk keyword tersebut', 'success');
        }
    }

    // === EXPORT HASIL ===
    window.exportHasil = function(keyword) {
        const hasil = lacakDariLaporan(keyword);
        if (hasil.length === 0) {
            showToast('❌ Tidak ada data untuk diexport!', 'error');
            return;
        }

        const headers = ['No', 'Jenis', 'Nomor Pelaku', 'Nama Pelaku', 'Deskripsi', 'Tanggal', 'Status', 'Bukti'];
        const rows = hasil.map((item, index) => [
            index + 1,
            item.jenis || '',
            item.nomorPelaku || '',
            item.namaPelaku || '',
            (item.deskripsi || '').replace(/,/g, ';'),
            item.tanggal || '',
            item.status || '',
            item.bukti || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `lacak_${keyword}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        showToast(`📊 ${hasil.length} data berhasil diexport!`, 'success');
    };

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

    // === EVENT SUBMIT ===
    const form = document.getElementById('lacakForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const keyword = document.getElementById('keywordCari').value.trim();
            
            if (!keyword) {
                showToast('⚠️ Masukkan kata kunci untuk dilacak!', 'error');
                return;
            }

            if (keyword.length < 2) {
                showToast('⚠️ Kata kunci minimal 2 karakter!', 'error');
                return;
            }

            const hasilLaporan = lacakDariLaporan(keyword);
            
            let geoData = null;
            if (isIPAddress(keyword)) {
                geoData = await getIPGeolocation(keyword);
            }

            renderHasil(keyword, hasilLaporan, geoData);
        });
    }

    // === EVENT CEK IP SAYA ===
    const cekIpBtn = document.getElementById('cekIpSaya');
    if (cekIpBtn) {
        cekIpBtn.addEventListener('click', cekIPSaya);
    }

    // === INISIALISASI ===
    document.addEventListener('DOMContentLoaded', function() {
        updateNavbar();
        console.log('🔍 Lacak Rekening - Admin Premium');
        console.log('👑 Role:', currentUser?.role || 'Unknown');
        console.log('📍 Backend Python + IPWho API siap!');
        
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q) {
            const input = document.getElementById('keywordCari');
            if (input) {
                input.value = q;
                form.dispatchEvent(new Event('submit'));
            }
        }
    });

})();