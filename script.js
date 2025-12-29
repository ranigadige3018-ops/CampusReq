// State Management
const initialResources = [
    { id: 1, name: 'Quantum Lab 1', type: 'lab', capacity: 30, attended: 12, status: 'available', utilization: 45 },
    { id: 2, name: 'Main Auditorium', type: 'classroom', capacity: 200, attended: 45, status: 'available', utilization: 15 },
    { id: 3, name: 'Interactive Projector X', type: 'projector', capacity: 0, attended: 0, status: 'available', utilization: 0 },
    { id: 4, name: 'Neural Network Hub', type: 'lab', capacity: 25, attended: 20, status: 'available', utilization: 80 },
    { id: 5, name: 'History Wing A', type: 'classroom', capacity: 45, attended: 15, status: 'available', utilization: 30 }
];

const resourceModal = document.getElementById('resourceModal');
const resourceForm = document.getElementById('resourceForm');
const addResourceBtn = document.getElementById('addResourceBtn');
const resourceGrid = document.getElementById('resourceGrid');
const bookingsGrid = document.getElementById('bookingsGrid');
const searchInput = document.getElementById('resourceSearch');
const filterBtns = document.querySelectorAll('.filter-btn');
const bookingModal = document.getElementById('bookingModal');
const bookingForm = document.getElementById('bookingForm');
const closeBtn = document.querySelector('.close-btn');

let resources = JSON.parse(localStorage.getItem('campus_resources')) || [...initialResources];
let bookings = JSON.parse(localStorage.getItem('campus_bookings')) || [];

// Stats Elements
const totalResEl = document.getElementById('totalResources');
const availableResEl = document.getElementById('availableNow');
const avgUtilEl = document.getElementById('avgUtilization');
const activeBookingsEl = document.getElementById('activeBookings');
const adminPanel = document.getElementById('adminPanel');
const userBookingsSection = document.getElementById('userBookingsSection');
const adminRequestsGrid = document.getElementById('adminRequestsGrid');
const toggleAdminBtn = document.getElementById('toggleAdminBtn');
const adminAuthSection = document.getElementById('adminAuthSection');
const adminContentSection = document.getElementById('adminContentSection');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

let isAdminView = false;
let isAdminLoggedIn = false;

function updateStats() {
    const total = resources.length;
    const occupiedCount = bookings.length;
    const available = total - occupiedCount;
    const avgUtil = total > 0
        ? Math.round(resources.reduce((acc, res) => acc + res.utilization, 0) / total)
        : 0;

    totalResEl.textContent = total;
    availableResEl.textContent = available;
    avgUtilEl.textContent = `${avgUtil}%`;
    activeBookingsEl.textContent = occupiedCount;
}

// Landing Page Transition
const enterBtn = document.getElementById('enterBtn');
const landingPage = document.getElementById('landingPage');
const dashboard = document.getElementById('dashboard');

enterBtn.addEventListener('click', () => {
    landingPage.classList.add('fade-out');
    dashboard.classList.add('fade-in');
    setTimeout(() => {
        landingPage.style.display = 'none';
        dashboard.style.transition = 'opacity 1s ease';
        dashboard.style.opacity = '1';
    }, 1000);
});

function getIcon(type) {
    switch (type) {
        case 'classroom': return '🏛️';
        case 'lab': return '🔬';
        case 'projector': return '📽️';
        default: return '📦';
    }
}

function renderResources(items) {
    resourceGrid.innerHTML = '';

    items.forEach((item, index) => {
        const isBooked = bookings.some(b => b.resourceId === item.id);
        const displayStatus = isBooked ? 'occupied' : item.status;

        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="card-management">
                <button class="mgmt-btn" onclick="editResource(${item.id})">✏️</button>
                <button class="mgmt-btn del" onclick="deleteResource(${item.id})">🗑️</button>
            </div>
            <div class="card-icon">${getIcon(item.type)}</div>
            <div class="card-type">${item.type}</div>
            <h2 class="card-title">${item.name}</h2>
            
            <div class="utilization-meter">
                <div class="meter-fill" style="width: ${item.utilization}%"></div>
            </div>
            
            <div class="card-info-detailed">
                <div class="info-item">
                    <span class="info-label">Capacity</span>
                    <span class="info-value">${item.capacity > 0 ? item.capacity : 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Attended</span>
                    <span class="info-value text-primary">${item.attended || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Remaining</span>
                    <span class="info-value text-success">${item.capacity > 0 ? Math.max(0, item.capacity - (item.attended || 0)) : 'N/A'}</span>
                </div>
            </div>
            
            <div class="card-status-row">
                <div class="status-badge status-${displayStatus}">
                    ${displayStatus}
                </div>
            </div>
            <button class="book-btn" onclick="openBookingModal(${item.id})" ${displayStatus === 'occupied' ? 'disabled' : ''}>
                ${displayStatus === 'occupied' ? 'UNAVAILABLE' : 'BOOK NOW'}
            </button>
        `;

        resourceGrid.appendChild(card);
    });
}

function renderBookings() {
    if (bookings.length === 0) {
        bookingsGrid.innerHTML = `
            <div class="empty-bookings">
                <p>No active bookings. Choose a resource above to get started.</p>
            </div>
        `;
        return;
    }

    bookingsGrid.innerHTML = '';
    bookings.forEach(booking => {
        const resource = resources.find(r => r.id === booking.resourceId);
        const card = document.createElement('div');
        card.className = 'booking-card';
        card.innerHTML = `
            <div class="booking-header">
                <div class="booking-header-left">
                    <div class="res-name">${resource ? resource.name : 'Deleted Resource'}</div>
                    <div class="booking-time">${booking.date} | ${booking.startTime} - ${booking.endTime}</div>
                </div>
                <div class="booking-status-box">
                    <div class="status-badge status-${booking.status || 'confirmed'}">${(booking.status || 'confirmed').toUpperCase()}</div>
                    ${booking.status === 'confirmed' ? `<div id="qrcode-${booking.id}" class="qr-code-container"></div>` : ''}
                </div>
            </div>
            <div class="booking-purpose">${booking.purpose}</div>
            <div class="booking-actions">
                <button class="action-btn edit-btn" onclick="editBooking(${booking.id})">EDIT</button>
                <button class="action-btn delete-btn" onclick="deleteBooking(${booking.id})">CANCEL</button>
            </div>
        `;
        bookingsGrid.appendChild(card);

        // Generate QR code if confirmed
        if (booking.status === 'confirmed') {
            const qrData = `Resource: ${resource ? resource.name : 'N/A'}\nDate: ${booking.date}\nTime: ${booking.startTime}-${booking.endTime}\nID: ${booking.id}`;
            new QRCode(document.getElementById(`qrcode-${booking.id}`), {
                text: qrData,
                width: 60,
                height: 60,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    });
}

function renderAdminPanel() {
    const pendingRequests = bookings.filter(b => b.status === 'pending');

    if (pendingRequests.length === 0) {
        adminRequestsGrid.innerHTML = `
            <div class="empty-bookings">
                <p>No pending requests. Everything is up to date.</p>
            </div>
        `;
        return;
    }

    adminRequestsGrid.innerHTML = '';
    pendingRequests.forEach(booking => {
        const resource = resources.find(r => r.id === booking.resourceId);
        const card = document.createElement('div');
        card.className = 'booking-card';
        card.innerHTML = `
            <div class="booking-header">
                <div>
                    <div class="res-name">${resource ? resource.name : 'Deleted Resource'}</div>
                    <div class="booking-time">${booking.date} | ${booking.startTime} - ${booking.endTime}</div>
                </div>
                <div class="status-badge status-pending">PENDING</div>
            </div>
            <div class="booking-purpose">${booking.purpose}</div>
            <div class="booking-actions">
                <button class="action-btn" style="background: #4caf50;" onclick="confirmBooking(${booking.id})">CONFIRM</button>
                <button class="action-btn delete-btn" onclick="rejectBooking(${booking.id})">REJECT</button>
            </div>
        `;
        adminRequestsGrid.appendChild(card);
    });
}

function confirmBooking(id) {
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
        bookings[index].status = 'confirmed';
        localStorage.setItem('campus_bookings', JSON.stringify(bookings));
        renderAdminPanel();
        renderBookings();
        updateStats();
        alert('Booking confirmed finally!');
    }
}

function rejectBooking(id) {
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
        bookings[index].status = 'rejected';
        localStorage.setItem('campus_bookings', JSON.stringify(bookings));
        renderAdminPanel();
        renderBookings();
        updateStats();
        alert('Booking rejected. Please register again if needed.');
    }
}


// Resource CRUD
function openResourceModal(resId = null) {
    const isEdit = resId !== null;
    document.getElementById('resModalTitle').innerText = isEdit ? 'EDIT RESOURCE' : 'ADD RESOURCE';
    document.getElementById('resSubmitBtn').innerText = isEdit ? 'UPDATE RESOURCE' : 'SAVE RESOURCE';

    if (isEdit) {
        const res = resources.find(r => r.id === resId);
        document.getElementById('editResId').value = res.id;
        document.getElementById('newResName').value = res.name;
        document.getElementById('newResType').value = res.type;
        document.getElementById('newResCapacity').value = res.capacity;
        document.getElementById('newResAttended').value = res.attended || 0;
        document.getElementById('newResUtil').value = res.utilization;
    } else {
        resourceForm.reset();
        document.getElementById('editResId').value = '';
    }

    resourceModal.style.display = 'flex';
}

function closeResourceModal() {
    resourceModal.style.display = 'none';
}

function saveResource(e) {
    e.preventDefault();
    const id = document.getElementById('editResId').value;
    const resData = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('newResName').value,
        type: document.getElementById('newResType').value,
        capacity: parseInt(document.getElementById('newResCapacity').value),
        attended: parseInt(document.getElementById('newResAttended').value),
        utilization: parseInt(document.getElementById('newResUtil').value),
        status: 'available'
    };

    if (id) {
        const index = resources.findIndex(r => r.id === parseInt(id));
        resources[index] = resData;
    } else {
        resources.push(resData);
    }

    localStorage.setItem('campus_resources', JSON.stringify(resources));
    closeResourceModal();
    renderResources(resources);
    updateStats();
}

function editResource(id) {
    openResourceModal(id);
}

function deleteResource(id) {
    if (confirm('Delete this resource? This will also affect associated bookings.')) {
        resources = resources.filter(r => r.id !== id);
        // Clean up bookings for this resource
        bookings = bookings.filter(b => b.resourceId !== id);
        localStorage.setItem('campus_resources', JSON.stringify(resources));
        localStorage.setItem('campus_bookings', JSON.stringify(bookings));
        renderResources(resources);
        renderBookings();
        updateStats();
    }
}

// Booking CRUD
function openBookingModal(resId, bookingId = null) {
    const resource = resources.find(r => r.id === resId);
    if (!resource) return;

    document.getElementById('resourceId').value = resId;
    document.getElementById('bookingId').value = bookingId || '';
    document.getElementById('resName').value = resource.name;
    document.getElementById('modalTitle').innerText = bookingId ? 'EDIT BOOKING' : 'BOOK RESOURCE';

    if (bookingId) {
        const booking = bookings.find(b => b.id === bookingId);
        document.getElementById('bookingDate').value = booking.date;
        document.getElementById('startTime').value = booking.startTime;
        document.getElementById('endTime').value = booking.endTime;
        document.getElementById('purpose').value = booking.purpose;
    } else {
        bookingForm.reset();
        document.getElementById('resName').value = resource.name;
    }

    bookingModal.style.display = 'flex';
}

function closeBookingModal() {
    bookingModal.style.display = 'none';
    bookingForm.reset();
}

function saveBooking(e) {
    e.preventDefault();
    const resId = parseInt(document.getElementById('resourceId').value);
    const bookingId = document.getElementById('bookingId').value;

    const bookingData = {
        id: bookingId ? parseInt(bookingId) : Date.now(),
        resourceId: resId,
        date: document.getElementById('bookingDate').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        purpose: document.getElementById('purpose').value,
        status: bookingId ? (bookings.find(b => b.id === parseInt(bookingId)).status) : 'pending'
    };

    if (bookingId) {
        const index = bookings.findIndex(b => b.id === parseInt(bookingId));
        bookings[index] = bookingData;
    } else {
        bookings.push(bookingData);
    }

    localStorage.setItem('campus_bookings', JSON.stringify(bookings));
    closeBookingModal();
    renderBookings();
    renderResources(resources);
    updateStats();
}

function editBooking(id) {
    const booking = bookings.find(b => b.id === id);
    if (booking) {
        openBookingModal(booking.resourceId, id);
    }
}

function deleteBooking(id) {
    if (confirm('Cancel this booking?')) {
        bookings = bookings.filter(b => b.id !== id);
        localStorage.setItem('campus_bookings', JSON.stringify(bookings));
        renderBookings();
        renderResources(resources);
        updateStats();
    }
}

function filterResources() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;

    let filtered = resources;

    if (activeFilter === 'recommend') {
        // Guidance Engine: Recommend low utilization resources that are available
        filtered = resources.filter(res => {
            const isBooked = bookings.some(b => b.resourceId === res.id);
            return !isBooked && res.utilization < 50;
        }).sort((a, b) => a.utilization - b.utilization);
    } else {
        filtered = resources.filter(res => {
            const matchesSearch = res.name.toLowerCase().includes(searchTerm);
            const matchesFilter = activeFilter === 'all' || res.type === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }

    renderResources(filtered);
}

// Event Listeners
searchInput.addEventListener('input', filterResources);
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterResources();
    });
});

bookingForm.addEventListener('submit', saveBooking);
closeBtn.addEventListener('click', closeBookingModal);
window.addEventListener('click', (e) => {
    if (e.target === bookingModal) closeBookingModal();
    if (e.target === resourceModal) closeResourceModal();
});

resourceForm.addEventListener('submit', saveResource);

toggleAdminBtn.addEventListener('click', () => {
    isAdminView = !isAdminView;
    if (isAdminView) {
        document.body.classList.add('admin-mode');
        toggleAdminBtn.textContent = 'Exit Admin View';
        checkAdminLogin();
    } else {
        document.body.classList.remove('admin-mode');
        toggleAdminBtn.textContent = 'Admin View';
    }
});

function checkAdminLogin() {
    if (isAdminLoggedIn) {
        adminAuthSection.style.display = 'none';
        adminContentSection.style.display = 'block';
        renderAdminPanel();
    } else {
        adminAuthSection.style.display = 'block';
        adminContentSection.style.display = 'none';
    }
}

adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('adminName').value;
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    // For demonstration, any non-empty input is accepted
    if (name && email && password) {
        isAdminLoggedIn = true;
        alert(`Welcome Admin ${name}!`);
        checkAdminLogin();
    }
});

adminLogoutBtn.addEventListener('click', () => {
    isAdminLoggedIn = false;
    alert('Logged out from Admin Panel');
    checkAdminLogin();
});

// Initial render
renderResources(resources);
renderBookings();
updateStats();
