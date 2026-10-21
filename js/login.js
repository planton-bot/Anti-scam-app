// ============================================
// LOGIN.JS - Halaman Login/Register
// ============================================

(function() {
    'use strict';

    // === AKUN DEFAULT ===
    const DEFAULT_USERS = [
        { username: 'superadmin', password: 'Malang260320*#D3v1', role: 'superadmin', level: 1, createdAt: new Date().toISOString() },
        { username: 'admin', password: 'Malang260320*#D3v1', role: 'admin', level: 2, createdAt: new Date().toISOString() },
        { username: 'staff', password: 'Malang260320*#D3v1', role: 'staff', level: 3, createdAt: new Date().toISOString() }
    ];

    function initDefaultUsers() {
        const existing = JSON.parse(localStorage.getItem('antiScamUsers')) || [];
        const adminExists = existing.some(u => u.username === 'superadmin');
        
        if (!adminExists) {
            localStorage.setItem('antiScamUsers', JSON.stringify(DEFAULT_USERS));
            console.log('✅ Akun default berhasil dibuat!');
        } else {
            const updatedUsers = existing.map(u => {
                const defaultUser = DEFAULT_USERS.find(d => d.username === u.username);
                if (defaultUser) {
                    return { ...u, password: defaultUser.password, role: defaultUser.role, level: defaultUser.level };
                }
                return u;
            });
            localStorage.setItem('antiScamUsers', JSON.stringify(updatedUsers));
            console.log('✅ Akun default berhasil diupdate!');
        }
    }

    const form = document.getElementById('authForm');
    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');
    const toggleLink = document.getElementById('toggleLink');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const authSubmit = document.getElementById('authSubmit');

    const loginGroup = document.getElementById('loginGroup');
    const usernameGroup = document.getElementById('usernameGroup');
    const confirmGroup = document.getElementById('confirmGroup');
    const loginEmail = document.getElementById('loginEmail');
    const regUsername = document.getElementById('regUsername');
    const authPassword = document.getElementById('authPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    let isLoginMode = true;

    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) {
            alert(message);
            return;
        }

        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
        const colors = { success: 'toast-success', error: 'toast-error', info: 'toast-info' };

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

    function getUsers() {
        return JSON.parse(localStorage.getItem('antiScamUsers')) || [];
    }

    function saveUsers(users) {
        localStorage.setItem('antiScamUsers', JSON.stringify(users));
    }

    // ============================================
    // SESSION DIHAPUS - HARUS LOGIN SETIAP KALI
    // ============================================
    
    // Cek session - SELALU FALSE (harus login)
    function isLoggedIn() {
        return false; // SELALU FALSE, HARUS LOGIN
    }

    // Set session - TIDAK DISIMPAN (langsung dihapus)
    function setSession(status) {
        // Session tidak pernah disimpan
        // Biarkan kosong - user harus login setiap kali
        console.log('🔐 Session tidak disimpan, harus login setiap kali');
    }

    function getCurrentUser() {
        // Tidak ada session, selalu null
        return null;
    }

    function updateNavbar() {
        const navLogin = document.getElementById('navLogin');
        if (!navLogin) return;
        
        // Selalu tampilkan icon user (belum login)
        navLogin.innerHTML = '<i class="fas fa-user"></i>';
        navLogin.style.color = 'var(--accent-blue)';
    }

    function setMode(login) {
        isLoginMode = login;

        if (login) {
            formTitle.textContent = 'Masuk';
            formSubtitle.textContent = 'Masuk ke akun AntiScam.ID';
            authSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
            loginGroup.style.display = 'block';
            usernameGroup.style.display = 'none';
            confirmGroup.style.display = 'none';
            toggleLink.innerHTML = 'Belum punya akun? <a href="#" id="toggleAuth">Daftar sekarang</a>';
            const toggleAuth = document.getElementById('toggleAuth');
            if (toggleAuth) {
                toggleAuth.addEventListener('click', function(e) {
                    e.preventDefault();
                    setMode(false);
                });
            }
            btnLogin.className = 'btn btn-primary btn-sm';
            btnLogin.style.cssText = 'flex:1; justify-content:center; padding:8px;';
            btnRegister.className = 'btn btn-outline btn-sm';
            btnRegister.style.cssText = 'flex:1; justify-content:center; padding:8px;';
        } else {
            formTitle.textContent = 'Daftar Akun';
            formSubtitle.textContent = 'Buat akun baru AntiScam.ID';
            authSubmit.innerHTML = '<i class="fas fa-user-plus"></i> Daftar';
            loginGroup.style.display = 'none';
            usernameGroup.style.display = 'block';
            confirmGroup.style.display = 'block';
            toggleLink.innerHTML = 'Sudah punya akun? <a href="#" id="toggleAuth">Masuk sekarang</a>';
            const toggleAuth = document.getElementById('toggleAuth');
            if (toggleAuth) {
                toggleAuth.addEventListener('click', function(e) {
                    e.preventDefault();
                    setMode(true);
                });
            }
            btnRegister.className = 'btn btn-primary btn-sm';
            btnRegister.style.cssText = 'flex:1; justify-content:center; padding:8px;';
            btnLogin.className = 'btn btn-outline btn-sm';
            btnLogin.style.cssText = 'flex:1; justify-content:center; padding:8px;';
        }

        form.reset();
    }

    function handleRegister(username, password, confirm) {
        if (username.length < 3) {
            showToast('⚠️ Username minimal 3 karakter', 'error');
            return false;
        }
        if (password.length < 6) {
            showToast('⚠️ Password minimal 6 karakter', 'error');
            return false;
        }
        if (password !== confirm) {
            showToast('⚠️ Password tidak cocok!', 'error');
            return false;
        }

        const users = getUsers();
        if (users.find(u => u.username === username)) {
            showToast('⚠️ Username sudah digunakan!', 'error');
            return false;
        }

        users.push({
            username: username,
            password: password,
            role: 'staff',
            level: 3,
            createdAt: new Date().toISOString()
        });
        saveUsers(users);

        showToast('✅ Registrasi berhasil! Silakan login.', 'success');
        setMode(true);
        return true;
    }

    function handleLogin(email, password) {
        if (!email || !password) {
            showToast('⚠️ Email dan password wajib diisi', 'error');
            return false;
        }

        const users = getUsers();
        const user = users.find(u => u.username === email && u.password === password);

        if (!user) {
            showToast('❌ Email atau password salah!', 'error');
            return false;
        }

        // === TIDAK MENYIMPAN SESSION ===
        // Hanya simpan username sementara untuk keperluan redirect
        // Setelah halaman dimuat, session akan dihapus
        sessionStorage.setItem('tempLogin', 'true');
        sessionStorage.setItem('tempUsername', user.username);
        
        const roleLabels = {
            superadmin: '🛡️ Super Admin',
            admin: '🔐 Admin Premium',
            staff: '👤 Staff'
        };
        showToast(`✅ Selamat datang, ${roleLabels[user.role] || user.username}!`, 'success');

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        return true;
    }

    // Hapus session saat halaman dimuat
    function clearTempSession() {
        // Hapus session storage
        sessionStorage.removeItem('tempLogin');
        sessionStorage.removeItem('tempUsername');
        
        // Hapus localStorage session
        localStorage.removeItem('antiScamSession');
        localStorage.removeItem('antiScamUsername');
    }

    window.logout = function() {
        if (confirm('Yakin ingin logout?')) {
            // Hapus semua session
            clearTempSession();
            showToast('👋 Logout berhasil!', 'info');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    };

    // Event listeners
    if (btnLogin) {
        btnLogin.addEventListener('click', function() {
            setMode(true);
        });
    }

    if (btnRegister) {
        btnRegister.addEventListener('click', function() {
            setMode(false);
        });
    }

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            if (isLoginMode) {
                const email = loginEmail.value.trim();
                const password = authPassword.value.trim();
                handleLogin(email, password);
            } else {
                const username = regUsername.value.trim();
                const password = authPassword.value.trim();
                const confirm = confirmPassword.value.trim();
                handleRegister(username, password, confirm);
            }
        });
    }

    // === INISIALISASI ===
    document.addEventListener('DOMContentLoaded', function() {
        // Inisialisasi akun default
        initDefaultUsers();
        
        // Hapus semua session
        clearTempSession();
        
        updateNavbar();
        
        // Form selalu aktif (tidak ada session)
        if (form) {
            form.style.opacity = '1';
            form.style.pointerEvents = 'auto';
        }

        // Cek pesan redirect dari halaman lain
        const redirectMessage = localStorage.getItem('redirectMessage');
        if (redirectMessage) {
            setTimeout(() => {
                showToast(redirectMessage, 'info');
                localStorage.removeItem('redirectMessage');
            }, 500);
        }
    });

    // Export fungsi
    window.auth = {
        isLoggedIn: isLoggedIn,
        setSession: setSession,
        getUsers: getUsers,
        getCurrentUser: getCurrentUser,
        showToast: showToast,
        updateNavbar: updateNavbar,
        logout: window.logout
    };

})();