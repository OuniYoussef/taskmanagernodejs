let socket;
let users = [];

// Connect Socket.io
function connectWebSocket() {
    if (!socket) {
        socket = io();
        socket.on('connect', () => console.log('WebSocket connected!'));
        socket.on('taskCreated',  (task)   => updateTaskList(task, 'created'));
        socket.on('taskUpdated',  (task)   => updateTaskList(task, 'updated'));
        socket.on('taskDeleted',  (taskId) => updateTaskList({ _id: taskId }, 'deleted'));
        socket.on('notification', (data)   => displayNotification(data.message));
    }
}

// Display a notification in top-left corner
function displayNotification(message) {
    const notificationList = document.getElementById('notificationList');
    const li = document.createElement('li');
    li.textContent = message;
    notificationList.appendChild(li);
    // Auto-remove after 15 seconds
    setTimeout(() => li.remove(), 15000);
}

// Update or create a task in DOM
function updateTaskList(task, action) {
    const taskList = document.getElementById('taskList');
    let li = document.getElementById(task._id);

    if (action === 'created') {
        // Create new DOM element
        li = document.createElement('li');
        li.id = task._id;
        li.innerHTML = buildTaskHTML(task);
        taskList.appendChild(li);

    } else if (li) {
        if (action === 'updated') {
            // Replace existing DOM element
            li.innerHTML = buildTaskHTML(task);
        } else if (action === 'deleted') {
            // Mark as deleted
            li.classList.add('deleted');
            li.textContent += ' (Deleted)';
        }
    }
}

// Helper for building the Task's HTML
function buildTaskHTML(task) {
    // Format the date nicely, or fallback to 'N/A'
    const createdDate = task.createdAt
        ? new Date(task.createdAt).toLocaleString()
        : 'N/A';

    return `
    <div class="p-3 mb-2 bg-white shadow-sm rounded">
      <div><strong>ID:</strong> ${task._id}</div>
      <div><strong>Title:</strong> ${task.title}</div>
      <div><strong>Description:</strong> ${task.description}</div>
      <div><strong>Created At:</strong> ${createdDate}</div>

      <!-- Use Bootstrap's flex utilities to align Status and Assigned side by side -->
      <div class="d-flex align-items-center gap-3 mt-2">
        <!-- Status Dropdown -->
        <div>
          <label class="me-1 fw-bold">Status:</label>
          <select
            class="form-select d-inline-block w-auto"
            onchange="updateTaskStatus('${task._id}', this.value)"
          >
            <option value="in progress" ${task.status === 'in progress' ? 'selected' : ''}>
              In Progress
            </option>
            <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>
              Completed
            </option>
          </select>
        </div>

        <!-- Assigned Dropdown -->
        <div>
          <label class="me-1 fw-bold">Assign to:</label>
          <select
            class="form-select d-inline-block w-auto"
            onchange="updateTaskUser('${task._id}', this.value)"
          >
            ${users.map(u => `
              <option value="${u._id}" ${task.assignedUser == u._id ? 'selected' : ''}>
                ${u.username}
              </option>`).join('')}
          </select>
        </div>

        <!-- Delete Button -->
        <button
          class="btn btn-danger btn-sm"
          onclick="deleteTask('${task._id}')"
        >
          Delete
        </button>
      </div>
    </div>
  `;
}

// Load users from /api/users
function loadUsers() {
    fetch('/api/users')
        .then(res => res.json())
        .then(data => {
            users = data;
            console.log('Loaded users:', users);
        })
        .catch(err => console.error('Error fetching users:', err));
}

// Check if user is authenticated, then connect websockets & fetch tasks
function checkAuth() {
    fetch('/api/auth-check', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.authenticated) {
                connectWebSocket();
                fetchTasks();
            } else {
                window.location.href = '/login.html';
            }
        })
        .catch(err => console.error('Auth check failed:', err));
}

// Fetch tasks from /api/tasks and display them
function fetchTasks() {
    fetch('/api/tasks')
        .then(res => res.json())
        .then(tasks => {
            tasks.forEach(task => updateTaskList(task, 'created'));
        })
        .catch(err => console.error('Error loading tasks:', err));
}

// CREATE a new task
function createTask() {
    const taskTitleInput = document.getElementById('newTaskTitle');
    const taskDescInput  = document.getElementById('newTaskDesc');

    if (!taskTitleInput || !taskDescInput) {
        return console.error('Task input fields not found!');
    }

    const taskTitle = taskTitleInput.value;
    const taskDesc  = taskDescInput.value || 'No Description';

    if (!taskTitle) {
        return alert('Enter a task title');
    }

    fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, description: taskDesc, status: 'in progress' })
    })
        .then(res => res.json())
        .then(task => {
            console.log('Task Created:', task);
            resetFields(['newTaskTitle', 'newTaskDesc']);
            // The 'taskCreated' socket event from server will also cause update
        })
        .catch(err => console.error('Error creating task:', err));
}

// UPDATE status only
function updateTaskStatus(taskId, newStatus) {
    fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
        .then(res => res.json())
        .then(data => {
            console.log('Task updated:', data);
            updateTaskList(data, 'updated');
        })
        .catch(err => console.error('Error updating task status:', err));
}

// DELETE task
function deleteTask(taskId) {
    fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
            console.log('Task Deleted:', taskId);
            // The 'taskDeleted' socket event from server triggers DOM update
        })
        .catch(err => console.error('Error deleting task:', err));
}

// UPDATE assigned user
function updateTaskUser(taskId, userId) {
    fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedUser: userId })
    })
        .then(res => res.json())
        .then(updatedTask => {
            console.log('Task user updated:', updatedTask);
            updateTaskList(updatedTask, 'updated');
        })
        .catch(err => console.error('Error updating user:', err));
}

// UPDATE title/description
function updateTask() {
    const taskId    = document.getElementById('updateTaskId').value;
    const taskTitle = document.getElementById('updateTaskTitle').value;
    const taskDesc  = document.getElementById('updateTaskDesc').value || 'No Description';

    if (!taskId)    return alert('Enter a Task ID');
    if (!taskTitle) return alert('Enter a new Task Title');

    fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, description: taskDesc })
    })
        .then(res => res.json())
        .then(updatedTask => {
            console.log('Task updated:', updatedTask);
            updateTaskList(updatedTask, 'updated');
            resetFields(['updateTaskId','updateTaskTitle','updateTaskDesc']);
        })
        .catch(err => console.error('Error updating task:', err));
}

// Helper to clear out form fields
function resetFields(fieldIds) {
    fieldIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
}

// On page load
window.onload = function () {
    checkAuth();  // if authenticated => connectWebSocket(), fetchTasks()
    loadUsers();  // fetch the user list
};

function logout() {
    fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
    })
        .then(() => {
            window.location.href = '/login.html';
        })
        .catch(err => console.error('Logout failed:', err));
}