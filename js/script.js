//  Variabel global tetap di sini
let tasks = [];
let currentFilter = "all";

const input = document.getElementById("todo-input");
const dateInput = document.getElementById("todo-date");
const addBtn = document.getElementById("add-btn");
const deleteAllBtn = document.getElementById("delete-all");
const todoList = document.getElementById("todo-list");
const total = document.getElementById("total");
const completed = document.getElementById("completed");
const pending = document.getElementById("pending");
const progress = document.getElementById("progress");
const searchInput = document.getElementById("search");

const themeBtn = document.getElementById("themeBtn");

// Modal & Toast (hanya satu modal dan satu toast aktif)
function removeActiveModal() {
  document.querySelectorAll('.custom-modal-bg').forEach(m => m.remove());
}
function showModal({title, message, confirmText, cancelText, onConfirm}) {
  removeActiveModal();
  let modal = document.createElement('div');
  modal.className = 'custom-modal-bg';
  modal.innerHTML = `
    <div class="custom-modal">
      <h2>${title}</h2>
      <div class="modal-message">${message}</div>
      <div class="modal-actions">
        <button class="modal-cancel">${cancelText || 'Cancel'}</button>
        <button class="modal-confirm">${confirmText || 'OK'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.modal-cancel').onclick = () => modal.remove();
  modal.querySelector('.modal-confirm').onclick = () => {
    modal.remove();
    if (onConfirm) onConfirm();
  };
}
function showToast(msg, color = 'green') {
  // Remove existing toast
  document.querySelectorAll('.custom-toast').forEach(t => t.remove());
  let toast = document.createElement('div');
  toast.className = 'custom-toast';
  toast.textContent = msg;
  toast.style.background = color === 'green' ? '#2ecc71' : (color === 'red' ? '#e74c3c' : '#333');
  toast.style.color = '#fff';
  document.body.appendChild(toast);
  setTimeout(() => { toast.classList.add('show'); }, 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(()=>toast.remove(), 400); }, 2000);
}

function renderTasks() {
  let filtered = tasks.filter(task => {
    if (currentFilter === "pending") return !task.done;
    if (currentFilter === "completed") return task.done;
    return true;
  });

  if (searchInput.value) {
    filtered = filtered.filter(task => task.text.toLowerCase().includes(searchInput.value.toLowerCase()));
  }

  filtered.sort((a, b) => new Date(a.date || "9999-12-31") - new Date(b.date || "9999-12-31"));

  todoList.innerHTML = filtered.length === 0
    ? `<tr><td colspan="4" class="empty center-empty">No tasks found</td></tr>`
    : filtered.map((task, i) => {
        return `<tr>
          <td>${task.text}</td>
          <td>${task.date || "-"}</td>
          <td>${task.done ? "✅ Completed" : "⏳ Pending"}</td>
          <td style="display:flex;gap:0.5rem;">
            <button class="edit-btn" data-index="${tasks.indexOf(task)}" title="Edit Task">✏️</button>
            <button onclick="toggleTask(${tasks.indexOf(task)})" title="${task.done ? 'Undo' : 'Mark as Done'}">${task.done ? '↩️' : '✔️'}</button>
            <button onclick="deleteTask(${tasks.indexOf(task)})" title="Delete"><span style='font-size:1.2em;'>🗑️</span></button>
          </td>
        </tr>`;
      }).join("");

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = function() {
      showEditModal(Number(this.getAttribute('data-index')));
    };
  });

  const doneCount = tasks.filter(t => t.done).length;
  total.textContent = tasks.length;
  completed.textContent = doneCount;
  pending.textContent = tasks.length - doneCount;
  progress.textContent = tasks.length === 0 ? "0%" : `${Math.round((doneCount / tasks.length) * 100)}%`;

  const progressBar = document.getElementById("progress-bar-fill");
  const percent = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
  progressBar.style.width = percent + "%";
  progressBar.setAttribute("aria-valuenow", percent);
  progressBar.setAttribute("title", percent + "%");
}

function showEditModal(index) {
  const task = tasks[index];
  showModal({
    title: 'Edit Task',
    message: `
      <div style='display:flex;flex-direction:column;gap:1rem;'>
        <input id='edit-task-input' type='text' value='${task.text.replace(/'/g, "&#39;")}' style='width:98%;padding:0.5rem;border-radius:7px;border:1px solid #ccc;'>
        <input id='edit-task-date' type='date' value='${task.date || ''}' style='width:98%;padding:0.5rem;border-radius:7px;border:1px solid #ccc;'>
      </div>
    `,
    confirmText: 'SAVE',
    cancelText: 'CANCEL',
    onConfirm: null
  });
  setTimeout(() => {
    const saveBtn = document.querySelector('.modal-confirm');
    if (saveBtn) {
      saveBtn.onclick = () => {
        const val = document.getElementById('edit-task-input').value.trim();
        const dateVal = document.getElementById('edit-task-date').value;
        if(val) {
          editTask(index, val, dateVal);
          showToast('Task updated successfully!', 'green');
          removeActiveModal();
        }
      };
    }
    const cancelBtn = document.querySelector('.modal-cancel');
    if (cancelBtn) cancelBtn.onclick = () => removeActiveModal();
  }, 10);
}

function addTask() {
  const text = input.value.trim();
  const date = dateInput.value;
  if (!text || !date) {
    showModal({
      title: 'Add Task',
      message: 'Task and date are required!',
      confirmText: 'OK',
      cancelText: 'CANCEL',
      onConfirm: null
    });
    return;
  }
  showModal({
    title: 'Confirm Add',
    message: `Are you sure you want to add a task <b>${text}</b> with date <b>${date}</b>?`,
    confirmText: 'YES',
    cancelText: 'NO',
    onConfirm: () => {
      tasks.push({ text, date, done: false });
      input.value = "";
      dateInput.value = "";
      renderTasks();
      showToast('Task added successfully!', 'green');
    }
  });
}

function deleteTask(index) {
  showModal({
    title: 'Delete Task',
    message: 'Are you sure you want to delete this task? This action cannot be undone.',
    confirmText: 'DELETE',
    cancelText: 'CANCEL',
    onConfirm: () => {
      tasks.splice(index, 1);
      renderTasks();
      showToast('Task deleted successfully!', 'green');
    }
  });
}

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  renderTasks();
  if (tasks[index].done) {
    showToast('Task marked as completed!', 'green');
  } else {
    showToast('Task marked as pending!', 'green');
  }
}

function deleteAllTasks() {
  if (tasks.length === 0) return;
  showModal({
    title: 'Konfirmasi Hapus Semua',
    message: `Are you sure you want to delete all (${tasks.length}) tasks? This action cannot be undone.`,
    confirmText: 'YES',
    cancelText: 'NO',
    onConfirm: () => {
      tasks = [];
      renderTasks();
      showToast('All tasks cleared successfully!', 'green');
    }
  });
}

function editTask(index, newText, newDate) {
  if (newText) {
    tasks[index].text = newText;
    if (typeof newDate !== 'undefined') tasks[index].date = newDate;
    renderTasks();
  }
}


window.addEventListener('DOMContentLoaded', function() {
  // Setup filter popup
  const filterBtn = document.getElementById('filter-btn');
  const filterPopup = document.getElementById('filter-popup');

  if (filterBtn && filterPopup) {
    filterBtn.onclick = (e) => {
      e.stopPropagation();
      filterPopup.style.display = filterPopup.style.display === 'block' ? 'none' : 'block';
    };
    document.querySelectorAll('.filter-option').forEach(opt => {
      opt.onclick = function() {
        currentFilter = this.getAttribute('data-value');
        filterPopup.style.display = 'none';
        renderTasks();
        // Update teks tombol filter untuk menunjukkan filter aktif
        filterBtn.innerHTML = `Filter ⏷ <span style='font-weight:600;'>${this.textContent}</span>`;
      };
    });
    // Sembunyikan popup jika klik di luar
    document.addEventListener('click', function hidePopup(e) {
      if (!filterPopup.contains(e.target) && e.target !== filterBtn) {
        filterPopup.style.display = 'none';
      }
    });
  }

  // Setup tombol dan input utama
  addBtn.addEventListener("click", addTask);
  deleteAllBtn.addEventListener("click", deleteAllTasks);
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });
  searchInput.addEventListener("input", renderTasks);

  // Render tugas awal saat halaman dimuat
  renderTasks();
});
