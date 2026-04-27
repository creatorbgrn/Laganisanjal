const config = window.CREWE_CUT_CONFIG || {};
const themeStorageKey = "crewe-cut-theme-pro";

// Elements
const authPanel = document.getElementById("admin-auth-panel");
const adminApp = document.getElementById("admin-app");
const loginForm = document.getElementById("admin-login-form");
const logoutButton = document.getElementById("logout-button");
const loginButton = document.getElementById("admin-login-button");
const feedback = document.getElementById("admin-feedback");
const dashboardFeedback = document.getElementById("admin-dashboard-feedback");

// Navigation
const navItems = document.querySelectorAll(".nav-item");
const adminSections = document.querySelectorAll("[data-admin-section]");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const sectionLabel = document.getElementById("topbar-section-label");

// Content Areas
const statsGrid = document.getElementById("admin-stats");
const latestBookings = document.getElementById("latest-bookings");
const todayBookings = document.getElementById("today-bookings");
const clientsList = document.getElementById("clients-list");
const bookingsTableBody = document.getElementById("bookings-table-body");
const mobileBookings = document.getElementById("mobile-bookings");
const servicesSettingsList = document.getElementById("services-settings-list");
const gallerySettingsList = document.getElementById("gallery-settings-list");

// State
let supabaseClient = null;
let siteSettings = null;
let allBookings = [];
let serviceChart = null;
let volumeChart = null;

// --- UTILS ---

function getSupabase() {
    if (supabaseClient) return supabaseClient;
    if (!config.supabaseUrl || !config.supabaseAnonKey) return null;
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    return supabaseClient;
}

function setFeedback(el, type, msg) {
    if (!el) return;
    el.hidden = false;
    el.className = `form-message ${type}`;
    el.textContent = msg;
    if (type === 'success') setTimeout(() => el.hidden = true, 5000);
}

function formatDay(day) {
    if (!day) return "N/A";
    const date = new Date(day + "T00:00:00");
    return new Intl.DateTimeFormat("en-GB", { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
}

function formatTime(time) {
    return time ? time.slice(0, 5) : "00:00";
}

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

// --- NAVIGATION ---

function setupNavigation() {
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const target = item.getAttribute("data-admin-target");
            switchSection(target);
            if (window.innerWidth <= 768) closeSidebar();
        });
    });

    sidebarToggle?.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
    });

    mobileMenuBtn?.addEventListener("click", () => {
        sidebar.classList.add("mobile-open");
        sidebarOverlay.classList.add("visible");
    });

    sidebarOverlay?.addEventListener("click", closeSidebar);
}

function closeSidebar() {
    sidebar.classList.remove("mobile-open");
    sidebarOverlay.classList.remove("visible");
}

function switchSection(target) {
    navItems.forEach(i => i.classList.toggle("is-active", i.getAttribute("data-admin-target") === target));
    adminSections.forEach(s => s.classList.toggle("is-active", s.getAttribute("data-admin-section") === target));
    
    // Update breadcrumb
    const activeNav = document.querySelector(`.nav-item[data-admin-target="${target}"] .nav-label`);
    if (activeNav && sectionLabel) sectionLabel.textContent = activeNav.textContent;

    if (target === 'calendar') renderCalendar();
}

// --- DATA LOADING ---

async function loadData() {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        setFeedback(dashboardFeedback, "error", "Could not load bookings.");
        return;
    }

    allBookings = data || [];
    renderDashboard();
    renderBookingsTable();
    renderClients();
}

// --- RENDERING ---

function renderDashboard() {
    const today = getTodayStr();
    const todayList = allBookings.filter(b => b.preferred_day === today);
    const newCount = allBookings.filter(b => b.status === 'new').length;

    // Stats
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="kpi-card">
                <div class="kpi-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div class="kpi-value">${allBookings.length}</div>
                <div class="kpi-label">Total Requests</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="color: var(--accent)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
                <div class="kpi-value">${newCount}</div>
                <div class="kpi-label">New Requests</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="color: var(--green)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div class="kpi-value">${todayList.length}</div>
                <div class="kpi-label">Today</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="color: var(--blue)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div class="kpi-value">${new Set(allBookings.map(b => b.email)).size}</div>
                <div class="kpi-label">Unique Clients</div>
            </div>
        `;
    }

    renderAnalytics(); // Initialize charts
    renderCalendar();  // Initialize calendar
    
    // New Badge
    const badge = document.getElementById("nav-badge-new");
    if (badge) badge.textContent = newCount > 0 ? newCount : "";

    // Lists
    renderSimpleList(latestBookings, allBookings.slice(0, 5), "No recent requests.");
    renderSimpleList(todayBookings, todayList.slice(0, 5), "No bookings today.");
}

function renderAnalytics() {
    const pieCanvas = document.getElementById("service-pie-chart");
    const barCanvas = document.getElementById("bookings-bar-chart");
    if (!pieCanvas || !barCanvas) return;

    // 1. Process Data for Service Pie Chart
    const services = {};
    allBookings.forEach(b => {
        services[b.service] = (services[b.service] || 0) + 1;
    });

    const pieLabels = Object.keys(services);
    const pieData = Object.values(services);

    if (serviceChart) serviceChart.destroy();
    serviceChart = new Chart(pieCanvas, {
        type: 'doughnut',
        data: {
            labels: pieLabels,
            datasets: [{
                data: pieData,
                backgroundColor: ['#d4a468', '#e8bc7b', '#60a5fa', '#4ade80', '#f87171', '#fbbf24'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom', labels: { color: '#8a9bb5', padding: 20 } }
            },
            cutout: '70%'
        }
    });

    // 2. Process Data for Volume Bar Chart (Last 7 Days)
    const last7Days = [];
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
    }

    const volumeData = last7Days.map(date => {
        return allBookings.filter(b => b.preferred_day === date).length;
    });

    const barLabels = last7Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', { weekday: 'short' });
    });

    if (volumeChart) volumeChart.destroy();
    
    // Create gradient
    const ctx = barCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(212, 164, 104, 0.25)');
    gradient.addColorStop(1, 'rgba(212, 164, 104, 0)');

    volumeChart = new Chart(barCanvas, {
        type: 'line',
        data: {
            labels: barLabels,
            datasets: [{
                label: 'Bookings',
                data: volumeData,
                borderColor: '#d4a468',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4, // Smooth curves
                borderWidth: 3,
                pointBackgroundColor: '#d4a468',
                pointBorderColor: '#161a20',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { color: '#8a9bb5', stepSize: 1 } 
                },
                x: { 
                    grid: { display: false }, 
                    ticks: { color: '#8a9bb5' } 
                }
            },
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e2330',
                    titleColor: '#f0f0f0',
                    bodyColor: '#8a9bb5',
                    borderColor: 'rgba(212, 164, 104, 0.3)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false
                }
            }
        }
    });

    // 3. Update Revenue/List part
    const breakdownEl = document.getElementById("sales-service-breakdown");
    if (breakdownEl) {
        const max = Math.max(...Object.values(services), 1);
        breakdownEl.innerHTML = Object.entries(services)
            .sort((a,b) => b[1] - a[1])
            .map(([name, count]) => `
                <div class="service-breakdown-row">
                    <div style="min-width: 120px; font-size: 0.8rem">${name}</div>
                    <div class="service-breakdown-bar-wrap">
                        <div class="service-breakdown-bar" style="width: ${(count/max)*100}%"></div>
                    </div>
                    <div class="service-breakdown-count">${count}</div>
                </div>
            `).join("");
    }
}

function renderCalendar() {
    const grid = document.getElementById("calendar-grid");
    if (!grid) return;

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const label = document.getElementById("cal-month-label");
    if (label) label.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    let html = "";
    // Headers
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => {
        html += `<div class="cal-day-header">${d}</div>`;
    });

    // Padding
    for (let i = 0; i < firstDay; i++) html += `<div class="cal-day other-month"></div>`;

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayBookings = allBookings.filter(b => b.preferred_day === dateStr);
        const isToday = d === now.getDate() ? "today" : "";
        
        html += `
            <div class="cal-day ${isToday}">
                <div class="cal-day-num">${d}</div>
                ${dayBookings.map(() => `<div class="cal-dot"></div>`).join("")}
                ${dayBookings.length > 0 ? `<div class="cal-count">${dayBookings.length}</div>` : ""}
            </div>
        `;
    }

    grid.innerHTML = html;
}

function renderSimpleList(container, list, emptyMsg) {
    if (!container) return;
    if (list.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>${emptyMsg}</p></div>`;
        return;
    }

    container.innerHTML = list.map(b => `
        <div class="overview-item">
            <div>
                <div class="overview-name">${b.client_name}</div>
                <div class="overview-sub">${b.service}</div>
            </div>
            <div class="overview-right">
                <div class="overview-slot">${formatTime(b.preferred_time)}</div>
                <span class="badge badge-${b.status}">${b.status}</span>
            </div>
        </div>
    `).join("");
}

function renderBookingsTable() {
    if (!bookingsTableBody) return;
    
    bookingsTableBody.innerHTML = allBookings.map(b => `
        <tr>
            <td class="td-name">${b.client_name}</td>
            <td>${b.service}</td>
            <td>${formatDay(b.preferred_day)} @ ${formatTime(b.preferred_time)}</td>
            <td>
                <div class="td-sub">${b.phone}</div>
                <div class="td-sub">${b.email}</div>
            </td>
            <td><div class="td-sub">${b.notes || '-'}</div></td>
            <td>
                <select class="status-select" onchange="updateStatus('${b.id}', this.value)">
                    <option value="new" ${b.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="contacted" ${b.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                    <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
            </td>
        </tr>
    `).join("");
}

async function updateStatus(id, newStatus) {
    const supabase = getSupabase();
    const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", id);
    if (error) setFeedback(dashboardFeedback, "error", "Failed to update status.");
    else loadData();
}

function renderClients() {
    if (!clientsList) return;
    const clientsMap = {};
    allBookings.forEach(b => {
        if (!clientsMap[b.email]) {
            clientsMap[b.email] = { name: b.client_name, email: b.email, phone: b.phone, visits: 0 };
        }
        clientsMap[b.email].visits++;
    });

    const list = Object.values(clientsMap);
    clientsList.innerHTML = list.map(c => `
        <div class="client-item">
            <div class="client-avatar">${c.name[0]}</div>
            <div class="client-info">
                <div class="client-name">${c.name}</div>
                <div class="client-contact">${c.email} • ${c.phone}</div>
            </div>
            <div class="client-side">
                <span class="client-visits">${c.visits} Visits</span>
            </div>
        </div>
    `).join("");
}

// --- AUTH ---

async function checkAuth() {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        authPanel.hidden = true;
        adminApp.hidden = false;
        loadData();
    } else {
        authPanel.hidden = false;
        adminApp.hidden = true;
    }
}

loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    const supabase = getSupabase();

    loginButton.disabled = true;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        setFeedback(feedback, "error", "Login failed: " + error.message);
        loginButton.disabled = false;
    } else {
        checkAuth();
    }
});

logoutButton?.addEventListener("click", async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    checkAuth();
});

// --- MANUAL BOOKING ---

function setupManualBooking() {
    const openBtn = document.getElementById("open-manual-booking");
    const modal = document.getElementById("manual-booking-modal-backdrop");
    const closeBtn = document.getElementById("manual-booking-close");
    const form = document.getElementById("manual-booking-form");

    if (!openBtn || !modal || !form) return;

    openBtn.addEventListener("click", () => {
        modal.hidden = false;
        // Default to today
        form.day.value = getTodayStr();
    });

    closeBtn?.addEventListener("click", () => {
        modal.hidden = true;
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.hidden = true;
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Creating...";

        const bookingData = {
            client_name: form.clientName.value,
            phone: form.phone.value,
            email: form.email.value || null,
            service: form.service.value,
            preferred_day: form.day.value,
            preferred_time: form.time.value,
            status: 'confirmed', // Admin bookings are confirmed by default
            created_at: new Date().toISOString()
        };

        const supabase = getSupabase();
        const { error } = await supabase.from("bookings").insert([bookingData]);

        submitBtn.disabled = false;
        submitBtn.textContent = "Create Booking";

        if (error) {
            alert("Error creating booking: " + error.message);
        } else {
            modal.hidden = true;
            form.reset();
            loadData(); // Refresh dashboard
        }
    });
}

// --- INIT ---

document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupManualBooking();
    checkAuth();
    
    // Clock
    setInterval(() => {
        const clock = document.getElementById("topbar-clock");
        if (clock) clock.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }, 1000);
});

// Export functions for HTML usage
window.updateStatus = updateStatus;
