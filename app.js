if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[TrueTask] PWA Service Worker Registered! Scope:', reg.scope))
            .catch(err => console.error('[TrueTask] PWA Service Worker Registration Failed:', err));
    });
}

const DEFAULT_COURSES = [
    { id: 'course-1', name: 'CS 301 - Operating Systems', color: '#3b82f6' },
    { id: 'course-2', name: 'MATH 202 - Linear Algebra', color: '#f59e0b' },
    { id: 'course-3', name: 'LIT 110 - World Literature', color: '#8b5cf6' }
];

const DEFAULT_TASKS = [
    {
        id: 'task-1',
        title: 'Project 2: Virtual Memory Simulator',
        desc: 'Implement LRU page replacement algorithm. Submit zip with writeup.',
        courseId: 'course-1',
        type: 'assignment',
        quadrant: 1,
        deadline: getRelativeDateString(2),
        time: '23:59',
        completed: false,
        dateCreated: new Date().toISOString(),
        dateCompleted: null
    },
    {
        id: 'task-2',
        title: 'Study for Linear Algebra Midterm',
        desc: 'Review eigenvalues, eigenvectors, and diagonalization proofs.',
        courseId: 'course-2',
        type: 'exam',
        quadrant: 2,
        deadline: getRelativeDateString(5),
        time: '10:00',
        completed: false,
        dateCreated: new Date().toISOString(),
        dateCompleted: null
    },
    {
        id: 'task-3',
        title: 'Email Professor about Essay Extension',
        desc: 'Ask if I can turn in the comparative literature essay on Friday instead of Wednesday.',
        courseId: 'course-3',
        type: 'other',
        quadrant: 3,
        deadline: getRelativeDateString(1),
        time: '17:00',
        completed: false,
        dateCreated: new Date().toISOString(),
        dateCompleted: null
    },
    {
        id: 'task-4',
        title: 'Organize desktop and course folders',
        desc: 'Archive folders from last semester and clear downloads folder.',
        courseId: 'general',
        type: 'other',
        quadrant: 4,
        deadline: '',
        time: '',
        completed: false,
        dateCreated: new Date().toISOString(),
        dateCompleted: null
    }
];

function getRelativeDateString(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
}

class AppStateManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('truetask_tasks')) || [];
        this.courses = JSON.parse(localStorage.getItem('truetask_courses')) || [];
        
        if (this.courses.length === 0 && this.tasks.length === 0 && !localStorage.getItem('truetask_initialized')) {
            this.courses = [...DEFAULT_COURSES];
            this.tasks = [...DEFAULT_TASKS];
            this.saveState();
            localStorage.setItem('truetask_initialized', 'true');
        }
    }

    saveState() {
        localStorage.setItem('truetask_tasks', JSON.stringify(this.tasks));
        localStorage.setItem('truetask_courses', JSON.stringify(this.courses));
    }

    addTask(taskObj) {
        const newTask = {
            id: 'task-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            completed: false,
            dateCreated: new Date().toISOString(),
            dateCompleted: null,
            ...taskObj
        };
        this.tasks.push(newTask);
        this.saveState();
        return newTask;
    }

    updateTask(id, updatedFields) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updatedFields };
            this.saveState();
            return this.tasks[index];
        }
        return null;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveState();
    }

    toggleTaskCompletion(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.dateCompleted = task.completed ? new Date().toISOString() : null;
            this.saveState();
        }
        return task;
    }

    purgeAllCompleted() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveState();
    }

    addCourse(name, color) {
        const newCourse = {
            id: 'course-' + Date.now().toString(36),
            name,
            color
        };
        this.courses.push(newCourse);
        this.saveState();
        return newCourse;
    }

    deleteCourse(courseId) {
        this.courses = this.courses.filter(c => c.id !== courseId);
        this.tasks = this.tasks.map(t => {
            if (t.courseId === courseId) {
                return { ...t, courseId: 'general' };
            }
            return t;
        });
        this.saveState();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const state = new AppStateManager();
    
    let currentCourseFilter = 'all';
    let currentTabFilter = 'all';
    let currentView = 'matrix';
    let activeDraggingTaskId = null;

    const sidebarCoursesList = document.getElementById('sidebar-courses-list');
    const managerCoursesList = document.getElementById('manager-courses-list');
    const taskCourseSelect = document.getElementById('task-course');
    
    const statTotal = document.getElementById('stat-total');
    const statUrgent = document.getElementById('stat-urgent');
    const statSoon = document.getElementById('stat-soon');
    const statDone = document.getElementById('stat-done');
    const progressBar = document.getElementById('progress-bar');
    
    const currentDateDisplay = document.getElementById('current-date-display');
    
    const viewMatrixBtn = document.getElementById('view-matrix-btn');
    const viewListBtn = document.getElementById('view-list-btn');
    const matrixView = document.getElementById('matrix-view');
    const listView = document.getElementById('list-view');
    
    const taskModal = document.getElementById('task-modal');
    const courseModal = document.getElementById('course-modal');
    const completedDrawer = document.getElementById('completed-drawer');
    
    const taskForm = document.getElementById('task-form');
    const courseForm = document.getElementById('course-form');
    
    const btnNewTask = document.getElementById('btn-new-task');
    const btnAddCourse = document.getElementById('btn-add-course');
    const btnShowCompleted = document.getElementById('btn-show-completed');
    
    const btnCloseTaskModal = document.getElementById('btn-close-task-modal');
    const btnCancelTaskModal = document.getElementById('btn-cancel-task-modal');
    const btnClearDeadline = document.getElementById('btn-clear-deadline');
    
    const btnCloseCourseModal = document.getElementById('btn-close-course-modal');
    const btnSubmitCourse = document.getElementById('btn-submit-course');
    
    const btnCloseCompletedDrawer = document.getElementById('btn-close-completed-drawer');
    const btnClearCompletedAll = document.getElementById('btn-clear-completed-all');
    
    const q1List = document.getElementById('q1-list');
    const q2List = document.getElementById('q2-list');
    const q3List = document.getElementById('q3-list');
    const q4List = document.getElementById('q4-list');
    
    const listOverdue = document.getElementById('list-overdue');
    const listToday = document.getElementById('list-today');
    const listTomorrow = document.getElementById('list-tomorrow');
    const listLater = document.getElementById('list-later');
    const listNone = document.getElementById('list-none');
    
    const completedListContainer = document.getElementById('completed-list-container');

    function renderCurrentDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
    }
    renderCurrentDate();

    function computeTimeline(deadlineStr, timeStr) {
        if (!deadlineStr) {
            return { text: '⚪ No Deadline', class: 'gray', overdue: false, soon: false, daysLeft: null };
        }

        const deadlineDate = new Date(deadlineStr + 'T' + (timeStr || '23:59'));
        const now = new Date();
        
        deadlineDate.setSeconds(0, 0);
        now.setSeconds(0, 0);

        const diffMs = deadlineDate - now;
        const diffHrs = diffMs / (1000 * 60 * 60);
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffMs < 0) {
            const isSameDay = new Date(deadlineStr).toDateString() === now.toDateString();
            if (isSameDay) {
                const hoursOverdue = Math.abs(Math.round(diffHrs));
                return { 
                    text: `🔴 Overdue by ${hoursOverdue || 1} hr${hoursOverdue !== 1 ? 's' : ''}`, 
                    class: 'red', 
                    overdue: true, 
                    soon: false 
                };
            }
            const absDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
            return { 
                text: `🔴 Overdue by ${absDays || 1} day${absDays !== 1 ? 's' : ''}`, 
                class: 'red', 
                overdue: true, 
                soon: false 
            };
        }

        if (new Date(deadlineStr).toDateString() === now.toDateString()) {
            if (diffHrs > 0 && diffHrs <= 6) {
                return { 
                    text: `🟡 Due in ${Math.round(diffHrs)} hrs`, 
                    class: 'amber', 
                    overdue: false, 
                    soon: true 
                };
            }
            return { text: '🟡 Due today', class: 'amber', overdue: false, soon: true };
        }

        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        if (new Date(deadlineStr).toDateString() === tomorrow.toDateString()) {
            return { text: '🟢 Tomorrow', class: 'green', overdue: false, soon: true };
        }

        if (diffDays <= 4) {
            return { text: `🟢 ${diffDays} days left`, class: 'green', overdue: false, soon: true };
        }
        return { text: `🟢 ${diffDays} days left`, class: 'green', overdue: false, soon: false };
    }

    function updateProgressStatistics() {
        const activeTasks = state.tasks.filter(t => !t.completed);
        const completedTasks = state.tasks.filter(t => t.completed);

        statTotal.textContent = activeTasks.length;
        statDone.textContent = completedTasks.length;

        const urgentCount = activeTasks.filter(t => parseInt(t.quadrant) === 1).length;
        statUrgent.textContent = urgentCount;

        let soonCount = 0;
        activeTasks.forEach(t => {
            if (t.deadline) {
                const timeline = computeTimeline(t.deadline, t.time);
                if (timeline.overdue || timeline.soon) {
                    soonCount++;
                }
            }
        });
        statSoon.textContent = soonCount;

        const totalCount = state.tasks.length;
        const percent = totalCount > 0 ? Math.round((completedTasks.length / totalCount) * 100) : 0;
        progressBar.style.width = percent + '%';
        
        document.getElementById('count-all').textContent = state.tasks.filter(t => !t.completed).length;
        document.getElementById('count-general').textContent = state.tasks.filter(t => !t.completed && t.courseId === 'general').length;

        state.courses.forEach(c => {
            const el = document.getElementById(`count-${c.id}`);
            if (el) {
                el.textContent = state.tasks.filter(t => !t.completed && t.courseId === c.id).length;
            }
        });
    }

    function getFilteredTasks() {
        let list = state.tasks.filter(t => !t.completed);
        if (currentCourseFilter !== 'all') {
            list = list.filter(t => t.courseId === currentCourseFilter);
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        if (currentTabFilter === 'today') {
            list = list.filter(t => t.deadline === todayStr);
        } else if (currentTabFilter === 'upcoming') {
            list = list.filter(t => t.deadline && t.deadline >= todayStr);
        } else if (currentTabFilter === 'nodeadline') {
            list = list.filter(t => !t.deadline);
        }

        return list;
    }

    function createTaskCardHTML(task) {
        const timeline = computeTimeline(task.deadline, task.time);
        const course = state.courses.find(c => c.id === task.courseId);
        const courseName = course ? course.name.split(' - ')[0] : 'General';
        const courseColor = course ? course.color : '#64748b';
        
        const categoryMap = {
            assignment: '📝 Assignment',
            lecture: '📚 Lecture Prep',
            exam: '🔥 Exam / Quiz',
            project: '💻 Project Task',
            other: '✅ Task'
        };
        const typeLabel = categoryMap[task.type] || 'Task';

        return `
            <div class="task-card ${task.completed ? 'completed' : ''}" 
                 draggable="${!task.completed}" 
                 data-task-id="${task.id}" 
                 id="card-${task.id}">
                <div class="task-card-header">
                    <div class="custom-checkbox" title="Mark complete" aria-label="Mark complete" data-action="toggle-complete">
                        <svg viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <span class="task-title-text">${escapeHTML(task.title)}</span>
                    <div class="task-actions">
                        <button class="action-icon-btn edit" data-action="edit" title="Edit Task">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon></svg>
                        </button>
                        <button class="action-icon-btn delete" data-action="delete" title="Delete Task">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                ${task.desc ? `<p class="task-desc-text">${escapeHTML(task.desc)}</p>` : ''}
                <div class="task-meta">
                    <span class="badge badge-course" style="border-left: 3px solid ${courseColor}">
                        ${escapeHTML(courseName)}
                    </span>
                    <span class="badge badge-type">${typeLabel}</span>
                    <span class="badge badge-deadline ${timeline.class}">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:2px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        ${timeline.text}
                    </span>
                </div>
            </div>
        `;
    }

    function render() {
        const filteredTasks = getFilteredTasks();
        
        q1List.innerHTML = '';
        q2List.innerHTML = '';
        q3List.innerHTML = '';
        q4List.innerHTML = '';

        listOverdue.innerHTML = '';
        listToday.innerHTML = '';
        listTomorrow.innerHTML = '';
        listLater.innerHTML = '';
        listNone.innerHTML = '';

        let overdueCount = 0;
        let todayCount = 0;
        let tomorrowCount = 0;
        let laterCount = 0;
        let noneCount = 0;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        const tomorrowDate = new Date();
        tomorrowDate.setDate(now.getDate() + 1);
        const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

        filteredTasks.forEach(task => {
            const cardHTML = createTaskCardHTML(task);
            
            const quad = parseInt(task.quadrant);
            if (quad === 1) q1List.insertAdjacentHTML('beforeend', cardHTML);
            else if (quad === 2) q2List.insertAdjacentHTML('beforeend', cardHTML);
            else if (quad === 3) q3List.insertAdjacentHTML('beforeend', cardHTML);
            else if (quad === 4) q4List.insertAdjacentHTML('beforeend', cardHTML);

            if (!task.deadline) {
                listNone.insertAdjacentHTML('beforeend', cardHTML);
                noneCount++;
            } else {
                const timeline = computeTimeline(task.deadline, task.time);
                if (timeline.overdue) {
                    listOverdue.insertAdjacentHTML('beforeend', cardHTML);
                    overdueCount++;
                } else if (task.deadline === todayStr) {
                    listToday.insertAdjacentHTML('beforeend', cardHTML);
                    todayCount++;
                } else if (task.deadline === tomorrowStr) {
                    listTomorrow.insertAdjacentHTML('beforeend', cardHTML);
                    tomorrowCount++;
                } else {
                    listLater.insertAdjacentHTML('beforeend', cardHTML);
                    laterCount++;
                }
            }
        });

        toggleGroupPlaceholder('group-overdue', overdueCount, true);
        toggleGroupPlaceholder('group-today', todayCount);
        toggleGroupPlaceholder('group-tomorrow', tomorrowCount);
        toggleGroupPlaceholder('group-later', laterCount);
        toggleGroupPlaceholder('group-none', noneCount);

        document.querySelectorAll('.task-card [data-action]').forEach(btn => {
            btn.addEventListener('click', handleTaskAction);
        });

        document.querySelectorAll('.task-card[draggable="true"]').forEach(card => {
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
        });

        updateProgressStatistics();
    }

    function toggleGroupPlaceholder(groupId, count, hideGroup = false) {
        const group = document.getElementById(groupId);
        if (!group) return;

        const emptyMsg = group.querySelector('.group-empty-msg');
        
        if (count === 0) {
            if (hideGroup) {
                group.classList.add('hidden');
            } else if (emptyMsg) {
                emptyMsg.classList.remove('hidden');
            }
        } else {
            group.classList.remove('hidden');
            if (emptyMsg) {
                emptyMsg.classList.add('hidden');
            }
        }
    }

    function renderCourses() {
        const staticList = `
            <li class="course-item ${currentCourseFilter === 'all' ? 'active' : ''}" data-course-id="all">
                <span class="course-dot" style="background-color: var(--color-primary);"></span>
                <span class="course-name">All Academic Tasks</span>
                <span class="course-count" id="count-all">0</span>
            </li>
            <li class="course-item ${currentCourseFilter === 'general' ? 'active' : ''}" data-course-id="general">
                <span class="course-dot" style="background-color: #64748b;"></span>
                <span class="course-name">General / Tasks</span>
                <span class="course-count" id="count-general">0</span>
            </li>
        `;

        let dynamicList = '';
        let dialogOptions = '<option value="general">General / Personal</option>';
        let managerListHTML = '';

        state.courses.forEach(c => {
            dynamicList += `
                <li class="course-item ${currentCourseFilter === c.id ? 'active' : ''}" data-course-id="${c.id}">
                    <span class="course-dot" style="background-color: ${c.color};"></span>
                    <span class="course-name">${escapeHTML(c.name)}</span>
                    <span class="course-count" id="count-${c.id}">0</span>
                </li>
            `;

            dialogOptions += `
                <option value="${c.id}">${escapeHTML(c.name)}</option>
            `;

            managerListHTML += `
                <li class="manager-course-item">
                    <div class="flex items-center">
                        <span class="course-dot" style="background-color: ${c.color}; margin-right: 8px;"></span>
                        <span>${escapeHTML(c.name)}</span>
                    </div>
                    <button class="action-icon-btn delete" data-course-delete-id="${c.id}" title="Remove Course">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </li>
            `;
        });

        sidebarCoursesList.innerHTML = staticList + dynamicList;
        taskCourseSelect.innerHTML = dialogOptions;
        managerCoursesList.innerHTML = managerListHTML || '<p class="subtitle text-center" style="padding:12px;">No customizable courses yet.</p>';

        document.querySelectorAll('.course-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.course-item').forEach(i => i.classList.remove('active'));
                const element = e.currentTarget;
                element.classList.add('active');
                currentCourseFilter = element.dataset.courseId;
                render();
            });
        });

        document.querySelectorAll('[data-course-delete-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cId = e.currentTarget.getAttribute('data-course-delete-id');
                if (confirm('Are you sure you want to delete this course? Associated tasks will be moved to "General / Tasks".')) {
                    state.deleteCourse(cId);
                    if (currentCourseFilter === cId) {
                        currentCourseFilter = 'all';
                    }
                    renderCourses();
                    render();
                }
            });
        });

        updateProgressStatistics();
    }

    function renderCompletedDrawer() {
        const completed = state.tasks.filter(t => t.completed);
        completedListContainer.innerHTML = '';

        if (completed.length === 0) {
            completedListContainer.innerHTML = `
                <div class="drawer-placeholder">
                    <div class="placeholder-icon">🏆</div>
                    <h3>No Completed Tasks Yet</h3>
                    <p>Finish your tasks, check them off, and see them here!</p>
                </div>
            `;
            return;
        }

        completed.sort((a, b) => new Date(b.dateCompleted) - new Date(a.dateCompleted));

        completed.forEach(task => {
            const course = state.courses.find(c => c.id === task.courseId);
            const courseName = course ? course.name.split(' - ')[0] : 'General';
            const courseColor = course ? course.color : '#64748b';
            
            const doneTime = task.dateCompleted 
                ? new Date(task.dateCompleted).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Recently';

            const card = `
                <div class="archive-card" id="archive-${task.id}">
                    <div class="archive-card-header">
                        <div>
                            <span class="archive-title">${escapeHTML(task.title)}</span>
                            <div class="archive-time">Finished: ${doneTime}</div>
                        </div>
                        <div class="archive-actions">
                            <button class="action-icon-btn" data-restore-id="${task.id}" title="Restore to Active">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                            </button>
                            <button class="action-icon-btn delete" data-delete-permanent-id="${task.id}" title="Delete Permanently">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                    <div class="archive-meta">
                        <span class="badge badge-course" style="border-left: 3px solid ${courseColor}">
                            ${escapeHTML(courseName)}
                        </span>
                        <span class="badge badge-type">Q${task.quadrant}</span>
                    </div>
                </div>
            `;
            completedListContainer.insertAdjacentHTML('beforeend', card);
        });

        document.querySelectorAll('[data-restore-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-restore-id');
                state.toggleTaskCompletion(id);
                renderCompletedDrawer();
                render();
            });
        });

        document.querySelectorAll('[data-delete-permanent-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-delete-permanent-id');
                if (confirm('Delete this task permanently? This cannot be undone.')) {
                    state.deleteTask(id);
                    renderCompletedDrawer();
                    render();
                }
            });
        });
    }

    function handleTaskAction(e) {
        e.stopPropagation();
        const action = e.currentTarget.dataset.action;
        const card = e.currentTarget.closest('.task-card');
        if (!card) return;
        
        const taskId = card.dataset.taskId;

        if (action === 'toggle-complete') {
            card.classList.toggle('completed');
            
            setTimeout(() => {
                state.toggleTaskCompletion(taskId);
                render();
                if (completedDrawer.open) {
                    renderCompletedDrawer();
                }
            }, 300);
            
        } else if (action === 'delete') {
            if (confirm('Are you sure you want to delete this task?')) {
                state.deleteTask(taskId);
                render();
            }
        } else if (action === 'edit') {
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                openTaskModalForEdit(task);
            }
        }
    }

    function handleDragStart(e) {
        activeDraggingTaskId = this.dataset.taskId;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', activeDraggingTaskId);
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        activeDraggingTaskId = null;
        document.querySelectorAll('.matrix-quadrant').forEach(q => q.classList.remove('drag-over'));
    }

    document.querySelectorAll('.matrix-quadrant').forEach(quadrant => {
        quadrant.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            quadrant.classList.add('drag-over');
        });

        quadrant.addEventListener('dragleave', (e) => {
            quadrant.classList.remove('drag-over');
        });

        quadrant.addEventListener('drop', (e) => {
            e.preventDefault();
            quadrant.classList.remove('drag-over');
            
            const taskId = e.dataTransfer.getData('text/plain') || activeDraggingTaskId;
            const newQuadrantValue = parseInt(quadrant.dataset.quadrant);
            
            if (taskId && newQuadrantValue) {
                const task = state.tasks.find(t => t.id === taskId);
                if (task && task.quadrant !== newQuadrantValue) {
                    state.updateTask(taskId, { quadrant: newQuadrantValue });
                    render();
                }
            }
        });
    });

    viewMatrixBtn.addEventListener('click', () => {
        viewMatrixBtn.classList.add('active');
        viewListBtn.classList.remove('active');
        matrixView.classList.add('active');
        listView.classList.remove('active');
        currentView = 'matrix';
        render();
    });

    viewListBtn.addEventListener('click', () => {
        viewListBtn.classList.add('active');
        viewMatrixBtn.classList.remove('active');
        listView.classList.add('active');
        matrixView.classList.remove('active');
        currentView = 'list';
        render();
    });

    document.querySelectorAll('.filter-item').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentTabFilter = e.currentTarget.dataset.filter;
            render();
        });
    });

    btnNewTask.addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Create Task';
        document.getElementById('btn-submit-task').textContent = 'Create Task';
        taskForm.reset();
        document.getElementById('task-edit-id').value = '';
        document.querySelector('input[name="task-quadrant"][value="1"]').checked = true;
        taskModal.showModal();
    });

    function openTaskModalForEdit(task) {
        document.getElementById('modal-title').textContent = 'Edit Task';
        document.getElementById('btn-submit-task').textContent = 'Save Changes';
        
        document.getElementById('task-edit-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.desc || '';
        document.getElementById('task-course').value = task.courseId;
        document.getElementById('task-type').value = task.type;
        document.getElementById('task-deadline').value = task.deadline || '';
        document.getElementById('task-time').value = task.time || '23:59';
        
        const rad = document.querySelector(`input[name="task-quadrant"][value="${task.quadrant}"]`);
        if (rad) rad.checked = true;
        
        taskModal.showModal();
    }

    const closeTaskModal = () => { taskModal.close(); };
    btnCloseTaskModal.addEventListener('click', closeTaskModal);
    btnCancelTaskModal.addEventListener('click', closeTaskModal);
    
    btnClearDeadline.addEventListener('click', () => {
        document.getElementById('task-deadline').value = '';
    });

    btnAddCourse.addEventListener('click', () => {
        courseForm.reset();
        document.querySelector('input[name="course-color"][value="#3b82f6"]').checked = true;
        courseModal.showModal();
    });
    btnCloseCourseModal.addEventListener('click', () => { courseModal.close(); });

    btnShowCompleted.addEventListener('click', () => {
        renderCompletedDrawer();
        completedDrawer.showModal();
    });
    btnCloseCompletedDrawer.addEventListener('click', () => { completedDrawer.close(); });
    
    btnClearCompletedAll.addEventListener('click', () => {
        const completedCount = state.tasks.filter(t => t.completed).length;
        if (completedCount === 0) return;
        
        if (confirm(`Are you sure you want to delete all ${completedCount} completed tasks forever? This cannot be undone.`)) {
            state.purgeAllCompleted();
            renderCompletedDrawer();
            render();
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target === taskModal) taskModal.close();
        if (e.target === courseModal) courseModal.close();
        if (e.target === completedDrawer) completedDrawer.close();
    });

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('task-edit-id').value;
        const title = document.getElementById('task-title').value.trim();
        const desc = document.getElementById('task-desc').value.trim();
        const courseId = document.getElementById('task-course').value;
        const type = document.getElementById('task-type').value;
        const deadline = document.getElementById('task-deadline').value;
        const time = document.getElementById('task-time').value;
        const quadrant = parseInt(document.querySelector('input[name="task-quadrant"]:checked').value);

        if (!title) return;

        const taskData = {
            title,
            desc,
            courseId,
            type,
            deadline,
            time: deadline ? (time || '23:59') : '',
            quadrant
        };

        if (id) {
            state.updateTask(id, taskData);
        } else {
            state.addTask(taskData);
        }

        taskModal.close();
        render();
    });

    btnSubmitCourse.addEventListener('click', (e) => {
        const nameInput = document.getElementById('course-name-input');
        const name = nameInput.value.trim();
        const color = document.querySelector('input[name="course-color"]:checked').value;

        if (!name) {
            nameInput.reportValidity();
            return;
        }

        state.addCourse(name, color);
        courseModal.close();
        renderCourses();
        render();
    });

    function escapeHTML(str) {
        if (!str) return '';
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

    renderCourses();
    render();
});
