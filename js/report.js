// ============================================
// REPORT.JS - Halaman Laporan (report.html)
// ============================================

(function() {
    'use strict';

    const form = document.getElementById('reportForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');

    // Generate ID unik
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // Simpan laporan
    function saveReport(data) {
        let laporan = JSON.parse(localStorage.getItem('laporanAntiScam')) || [];
        data.id = generateId();
        data.timestamp = new Date().toISOString();
        laporan.push(data);
        localStorage.setItem('laporanAntiScam', JSON.stringify(laporan));
        return data;
    }

    // Validasi
    function validateForm(data) {
        const errors = [];
        if (!data.jenis) errors.push('Jenis penipuan harus dipilih');
        if (!data.nomorPelaku || data.nomorPelaku.trim() === '') {
            errors.push('Nomor rekening/telepon pelaku wajib diisi');
        }
        if (!data.deskripsi || data.deskripsi.trim() === '') {
            errors.push('Deskripsi kejadian wajib diisi');
        }
        if (data.nomorPelaku && data.nomorPelaku.length < 5) {
            errors.push('Nomor pelaku terlalu pendek');
        }
        return errors;
    }

    // Tampilkan sukses
    function showSuccess() {
        successMessage.classList.remove('alert-hidden');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Laporan Terkirim!';
        
        setTimeout(() => {
            form.reset();
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Laporan';
            setTimeout(() => {
                successMessage.classList.add('alert-hidden');
            }, 5000);
        }, 3000);
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

    // Submit
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const data = {
                jenis: document.getElementById('jenis').value,
                nomorPelaku: document.getElementById('nomorPelaku').value.trim(),
                namaPelaku: document.getElementById('namaPelaku').value.trim(),
                deskripsi: document.getElementById('deskripsi').value.trim(),
                tanggal: new Date().toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                status: 'baru',
                bukti: document.getElementById('bukti').files[0]?.name || null
            };

            const errors = validateForm(data);
            if (errors.length > 0) {
                alert('⚠️ ' + errors.join('\n'));
                return;
            }

            try {
                saveReport(data);
                showSuccess();
                console.log('📝 Laporan tersimpan:', data);
            } catch (error) {
                alert('❌ Gagal menyimpan laporan: ' + error.message);
            }
        });

        // Draft otomatis
        let draftTimer;
        form.addEventListener('input', function() {
            clearTimeout(draftTimer);
            draftTimer = setTimeout(() => {
                const data = {
                    jenis: document.getElementById('jenis').value,
                    nomorPelaku: document.getElementById('nomorPelaku').value,
                    namaPelaku: document.getElementById('namaPelaku').value,
                    deskripsi: document.getElementById('deskripsi').value
                };
                sessionStorage.setItem('draftLaporan', JSON.stringify(data));
            }, 1000);
        });
    }

    // Restore draft & Update Navbar
    document.addEventListener('DOMContentLoaded', function() {
        updateNavbar();
        
        const draft = sessionStorage.getItem('draftLaporan');
        if (draft) {
            try {
                const data = JSON.parse(draft);
                if (data.jenis) document.getElementById('jenis').value = data.jenis;
                if (data.nomorPelaku) document.getElementById('nomorPelaku').value = data.nomorPelaku;
                if (data.namaPelaku) document.getElementById('namaPelaku').value = data.namaPelaku;
                if (data.deskripsi) document.getElementById('deskripsi').value = data.deskripsi;
                sessionStorage.removeItem('draftLaporan');
            } catch(e) {}
        }
    });

})();