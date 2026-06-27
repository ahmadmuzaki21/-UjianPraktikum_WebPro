const API_URL = '/api/tasks';
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const titleInput = document.getElementById('title');
const descInput = document.getElementById('description');
const enableNotifBtn = document.getElementById('enableNotifBtn');

// Modal Elements
const editModal = document.getElementById('editModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const editForm = document.getElementById('editForm');
const editIdInput = document.getElementById('editId');
const editTitleInput = document.getElementById('editTitle');
const editDescInput = document.getElementById('editDescription');

// Public VAPID Key (Idealnya didapat dari backend, tapi kita hardcode untuk kemudahan contoh ini)
const PUBLIC_VAPID_KEY = 'BCzGQoiBo9-4p8xG7Jen3xSDpZZJadr7XFwk31kC0CWwJX1a4W15CdEGx9VG4xoMBKZvDqlVakDd8jqyDItztCk'; // Ganti dengan hasil generate-vapid.js

// Event Listeners
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await createTask(titleInput.value, descInput.value);
    titleInput.value = '';
    descInput.value = '';
    loadTasks();
});

enableNotifBtn.addEventListener('click', subscribeToPush);

// Modal Event Listeners
closeModalBtn.addEventListener('click', closeEditModal);
window.addEventListener('click', (e) => {
    if (e.target == editModal) closeEditModal();
});

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editIdInput.value;
    const title = editTitleInput.value;
    const description = editDescInput.value;
    
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });
        closeEditModal();
        loadTasks();
    } catch (error) {
        console.error('Error updating task:', error);
    }
});

function openEditModal(id, title, description) {
    editIdInput.value = id;
    // Decode HTML entities back for the input field to display normally
    const txt = document.createElement("textarea");
    txt.innerHTML = title;
    editTitleInput.value = txt.value;
    
    txt.innerHTML = description === 'null' || !description ? '' : description;
    editDescInput.value = txt.value;
    
    editModal.style.display = 'flex';
}

function closeEditModal() {
    editModal.style.display = 'none';
}

// --- Async Functions for CRUD ---

async function loadTasks() {
    try {
        const response = await fetch(API_URL);
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

async function createTask(title, description) {
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });
    } catch (error) {
        console.error('Error creating task:', error);
    }
}

async function toggleTask(id, currentStatus) {
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            // Toggle the is_completed status
            body: JSON.stringify({ is_completed: !currentStatus }) 
        });
        loadTasks();
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function deleteTask(id) {
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// --- DOM Manipulation ---

function renderTasks(tasks) {
    taskList.innerHTML = '';
    
    if(tasks.length === 0) {
        taskList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Belum ada tugas.</p>';
        return;
    }

    tasks.forEach(task => {
        const item = document.createElement('div');
        item.className = `task-item ${task.is_completed ? 'completed' : ''}`;
        
        item.innerHTML = `
            <div class="task-content">
                <div class="task-title">${escapeHTML(task.title)}</div>
                ${task.description ? `<div class="task-desc">${escapeHTML(task.description)}</div>` : ''}
            </div>
            <div class="task-actions">
                <button class="btn-text edit-btn" onclick="openEditModal(${task.id}, '${escapeHTML(task.title)}', '${task.description ? escapeHTML(task.description) : ''}')">
                    Edit
                </button>
                <button class="btn-text delete-btn" onclick="deleteTask(${task.id})">
                    Hapus
                </button>
            </div>
        `;
        taskList.appendChild(item);
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// --- Service Worker & Push Notifications ---

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker terdaftar');
        } catch (error) {
            console.error('Pendaftaran Service Worker gagal:', error);
        }
    }
}

async function subscribeToPush() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Request permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Izin notifikasi ditolak.');
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            // Send subscription to backend
            await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });

            alert('Berhasil berlangganan notifikasi push!');
        } catch (error) {
            console.error('Gagal berlangganan push notification:', error);
        }
    } else {
        alert('Browser Anda tidak mendukung push notifications.');
    }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Initialize
registerServiceWorker();
loadTasks();
