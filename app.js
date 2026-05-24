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
const DEFAULT_CATEGORIES = [
    { id: 'coding', name: 'Coding', emoji: '💻', color: '#3b82f6' },
    { id: 'health', name: 'Health', emoji: '🏃', color: '#10b981' },
    { id: 'learning', name: 'Learning', emoji: '📚', color: '#8b5cf6' },
    { id: 'life', name: 'Daily Life', emoji: '⚙️', color: '#f59e0b' }
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
        this.routines = JSON.parse(localStorage.getItem('truetask_routines')) || [];
        this.categories = JSON.parse(localStorage.getItem('truetask_categories')) || [...DEFAULT_CATEGORIES];
        
        if (this.courses.length === 0 && this.tasks.length === 0 && !localStorage.getItem('truetask_initialized')) {
            this.courses = [...DEFAULT_COURSES];
            this.tasks = [...DEFAULT_TASKS];
            this.routines = [
                {
                    id: 'routine-1',
                    title: 'LeetCode Daily Challenge',
                    category: 'coding',
                    dateCreated: new Date().toISOString(),
                    completions: []
                }
            ];
            this.saveState();
            localStorage.setItem('truetask_initialized', 'true');
        }
    }

    saveState() {
        localStorage.setItem('truetask_tasks', JSON.stringify(this.tasks));
        localStorage.setItem('truetask_courses', JSON.stringify(this.courses));
        localStorage.setItem('truetask_routines', JSON.stringify(this.routines));
        localStorage.setItem('truetask_categories', JSON.stringify(this.categories));
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

    addCategory(name, color) {
        const id = 'category-' + Date.now().toString(36);
        const newCat = { id, name, emoji: '🏷️', color };
        this.categories.push(newCat);
        this.saveState();
        return newCat;
    }

    deleteCategory(catId) {
        this.categories = this.categories.filter(c => c.id !== catId);
        this.routines = this.routines.map(r => {
            if (r.category === catId) {
                return { ...r, category: 'life' };
            }
            return r;
        });
        this.saveState();
    }

    addRoutine(title, category = 'coding') {
        const newRoutine = {
            id: 'routine-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            title,
            category,
            dateCreated: new Date().toISOString(),
            completions: []
        };
        this.routines.push(newRoutine);
        this.saveState();
        return newRoutine;
    }

    updateRoutine(id, title, category) {
        const index = this.routines.findIndex(r => r.id === id);
        if (index !== -1) {
            this.routines[index] = { ...this.routines[index], title, category };
            this.saveState();
            return this.routines[index];
        }
        return null;
    }

    deleteRoutine(id) {
        this.routines = this.routines.filter(r => r.id !== id);
        this.saveState();
    }

    toggleRoutineCompletion(id, dateStr) {
        const routine = this.routines.find(r => r.id === id);
        if (routine) {
            const idx = routine.completions.indexOf(dateStr);
            if (idx === -1) {
                routine.completions.push(dateStr);
            } else {
                routine.completions.splice(idx, 1);
            }
            this.saveState();
        }
        return routine;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const state = new AppStateManager();
    
    let currentWorkspace = 'academic';
    let currentRoutineFilter = 'all';
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
    const categoryModal = document.getElementById('category-modal');
    const completedDrawer = document.getElementById('completed-drawer');
    
    const taskForm = document.getElementById('task-form');
    const courseForm = document.getElementById('course-form');
    const categoryForm = document.getElementById('category-form');
    
    const btnNewTask = document.getElementById('btn-new-task');
    const btnAddCourse = document.getElementById('btn-add-course');
    const btnCloseCategoryModal = document.getElementById('btn-close-category-modal');
    const btnSubmitCategory = document.getElementById('btn-submit-category');
    const managerCategoriesList = document.getElementById('manager-categories-list');
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
        if (currentWorkspace === 'academic') {
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
        } else {
            const routines = state.routines;
            const todayStr = getLocalDateString(new Date());
            
            const totalHabits = routines.length;
            const doneToday = routines.filter(r => r.completions.includes(todayStr)).length;
            const todayPercent = totalHabits > 0 ? Math.round((doneToday / totalHabits) * 100) : 0;

            statTotal.textContent = totalHabits;
            statDone.textContent = `${doneToday}/${totalHabits}`;
            progressBar.style.width = todayPercent + '%';

            let maxStreak = 0;
            routines.forEach(r => {
                const streak = calculateStreak(r.completions);
                if (streak > maxStreak) maxStreak = streak;
            });
            statUrgent.textContent = maxStreak;

            let perfectDays = 0;
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = getLocalDateString(date);
                const completedOnDay = routines.filter(r => r.completions.includes(dateStr)).length;
                const percent = totalHabits > 0 ? Math.round((completedOnDay / totalHabits) * 100) : 0;
                if (percent === 100 && totalHabits > 0) {
                    perfectDays++;
                }
            }
            statSoon.textContent = perfectDays;
        }
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
        if (currentWorkspace === 'routines') return;
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
                document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
                document.getElementById('btn-show-routines').classList.remove('active');
                document.getElementById('view-daily-routines').classList.remove('active');
                document.getElementById('view-academic-tasks').classList.add('active');
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
            document.getElementById('btn-show-routines').classList.remove('active');
            document.getElementById('view-daily-routines').classList.remove('active');
            document.getElementById('view-academic-tasks').classList.add('active');
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
        if (currentWorkspace === 'academic') {
            courseForm.reset();
            document.querySelector('input[name="course-color"][value="#3b82f6"]').checked = true;
            courseModal.showModal();
        } else {
            categoryForm.reset();
            document.querySelector('input[name="category-color"][value="#3b82f6"]').checked = true;
            renderCategoryManagerList();
            categoryModal.showModal();
        }
    });
    btnCloseCourseModal.addEventListener('click', () => { courseModal.close(); });
    btnCloseCategoryModal.addEventListener('click', () => { categoryModal.close(); });

    btnSubmitCategory.addEventListener('click', (e) => {
        const nameInput = document.getElementById('category-name-input');
        const name = nameInput.value.trim();
        const color = document.querySelector('input[name="category-color"]:checked').value;

        if (!name) {
            nameInput.reportValidity();
            return;
        }

        state.addCategory(name, color);
        categoryModal.close();
        renderCategories();
        renderRoutinesDashboard();
    });

    function renderCategoryManagerList() {
        let managerListHTML = '';
        state.categories.forEach(c => {
            const isDefault = ['coding', 'health', 'learning', 'life'].includes(c.id);
            managerListHTML += `
                <li class="manager-course-item">
                    <div class="flex items-center">
                        <span class="course-dot" style="background-color: ${c.color}; margin-right: 8px;"></span>
                        <span>${escapeHTML(c.name)}</span>
                    </div>
                    ${!isDefault ? `
                    <button class="action-icon-btn delete" data-category-delete-id="${c.id}" title="Remove Category">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                    ` : '<span class="subtitle" style="font-size:10px;">Default</span>'}
                </li>
            `;
        });
        managerCategoriesList.innerHTML = managerListHTML;

        managerCategoriesList.querySelectorAll('[data-category-delete-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const catId = e.currentTarget.getAttribute('data-category-delete-id');
                if (confirm('Are you sure you want to delete this category? Associated routines will be moved to "Daily Life".')) {
                    state.deleteCategory(catId);
                    if (currentRoutineCategory === catId) {
                        currentRoutineCategory = 'all';
                    }
                    renderCategoryManagerList();
                    renderCategories();
                    renderRoutinesDashboard();
                }
            });
        });
    }

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
        if (e.target === categoryModal) categoryModal.close();
        if (e.target === completedDrawer) completedDrawer.close();
        if (e.target === routineModal) routineModal.close();
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

    const routinesContainer = document.getElementById('routines-container');
    const routineModal = document.getElementById('routine-modal');
    const routineForm = document.getElementById('routine-form');
    const btnCloseRoutineModal = document.getElementById('btn-close-routine-modal');
    const btnCancelRoutineModal = document.getElementById('btn-cancel-routine-modal');
    const btnShowRoutines = document.getElementById('btn-show-routines');
    const btnNewRoutine = document.getElementById('btn-new-routine');

    let currentRoutineCategory = 'all';

    function getLocalDateString(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function calculateStreak(completions) {
        if (!completions || completions.length === 0) return 0;
        const sorted = [...completions].sort((a, b) => new Date(b) - new Date(a));
        const todayStr = getLocalDateString(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);
        const hasToday = sorted.includes(todayStr);
        const hasYesterday = sorted.includes(yesterdayStr);
        if (!hasToday && !hasYesterday) return 0;
        let streak = 0;
        let checkDate = hasToday ? new Date() : yesterday;
        while (true) {
            const checkStr = getLocalDateString(checkDate);
            if (sorted.includes(checkStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }

    function createRoutineCardHTML(routine) {
        const todayStr = getLocalDateString(new Date());
        const completedToday = routine.completions.includes(todayStr);
        const streak = calculateStreak(routine.completions);
        
        const catObj = state.categories.find(c => c.id === routine.category);
        const catLabel = catObj ? `${catObj.emoji} ${catObj.name}` : 'Routine';

        const historyDays = [];
        for (let i = 4; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = getLocalDateString(date);
            const label = date.toLocaleDateString('en-US', { weekday: 'narrow' });
            historyDays.push({ dateStr, label });
        }

        let historyHTML = '';
        historyDays.forEach(day => {
            const isCompleted = routine.completions.includes(day.dateStr);
            const activeDotClass = isCompleted ? 'completed' : '';
            historyHTML += `
                <div class="history-day">
                    <span class="history-label">${day.label}</span>
                    <span class="history-dot ${activeDotClass}"></span>
                </div>
            `;
        });

        return `
            <div class="routine-card ${completedToday ? 'completed-today' : ''}" data-routine-id="${routine.id}">
                <div class="routine-card-main">
                    <div class="custom-checkbox routine-checkbox" data-action="toggle-routine" title="Toggle routine" aria-label="Toggle routine">
                        <svg viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <div class="routine-details">
                        <span class="routine-title">${escapeHTML(routine.title)}</span>
                        <div class="flex items-center gap-2" style="margin-top: 4px;">
                            <div class="routine-streak" style="margin-right: 8px;">
                                <span class="streak-emoji">🔥</span>
                                <span class="streak-count">${streak} day streak</span>
                            </div>
                            <span class="badge badge-type">${catLabel}</span>
                        </div>
                    </div>
                    <div class="routine-actions">
                        <button class="action-icon-btn edit" data-action="edit-routine" title="Edit Routine">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>
                            </svg>
                        </button>
                        <button class="action-icon-btn delete" data-action="delete-routine" title="Delete Routine">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="routine-history">
                    ${historyHTML}
                </div>
            </div>
        `;
    }

    function renderRoutinesDashboard() {
        const routines = state.routines;
        const todayStr = getLocalDateString(new Date());
        
        const totalHabits = routines.length;
        const doneToday = routines.filter(r => r.completions.includes(todayStr)).length;
        const todayPercent = totalHabits > 0 ? Math.round((doneToday / totalHabits) * 100) : 0;

        const elTotal = document.getElementById('routine-stat-total');
        if (elTotal) elTotal.textContent = totalHabits;
        const elDone = document.getElementById('routine-stat-done');
        if (elDone) elDone.textContent = `${doneToday} / ${totalHabits}`;
        const elBar = document.getElementById('routine-progress-bar');
        if (elBar) elBar.style.width = todayPercent + '%';

        let maxStreak = 0;
        routines.forEach(r => {
            const streak = calculateStreak(r.completions);
            if (streak > maxStreak) maxStreak = streak;
        });
        const elStreak = document.getElementById('routine-stat-streak');
        if (elStreak) elStreak.textContent = maxStreak;

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const elDate = document.getElementById('routines-date-display');
        if (elDate) elDate.textContent = new Date().toLocaleDateString('en-US', options);

        let perfectDays = 0;
        let totalPercentSum = 0;
        let points = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = getLocalDateString(date);
            const label = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            const completedOnDay = routines.filter(r => r.completions.includes(dateStr)).length;
            const percent = totalHabits > 0 ? Math.round((completedOnDay / totalHabits) * 100) : 0;
            
            totalPercentSum += percent;
            if (percent === 100 && totalHabits > 0) {
                perfectDays++;
            }
            
            const index = 6 - i;
            const x = 50 + index * 100;
            const y = 150 - (percent / 100 * 120);
            points.push({ x, y, percent, label });
        }

        let linePath = '';
        let areaPath = '';
        if (points.length > 0) {
            linePath = `M ${points[0].x} ${points[0].y}`;
            areaPath = `M ${points[0].x} 150 L ${points[0].x} ${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
                linePath += ` L ${points[i].x} ${points[i].y}`;
                areaPath += ` L ${points[i].x} ${points[i].y}`;
            }
            areaPath += ` L ${points[points.length - 1].x} 150 Z`;
        }

        let pointsHTML = '';
        points.forEach(pt => {
            pointsHTML += `
                <g class="graph-point-group">
                    <circle cx="${pt.x}" cy="${pt.y}" r="12" fill="rgba(59, 130, 246, 0.15)" class="graph-point-aura"></circle>
                    <circle cx="${pt.x}" cy="${pt.y}" r="5" fill="#3b82f6" stroke="#ffffff" stroke-width="2" class="graph-point-dot"></circle>
                    <circle cx="${pt.x}" cy="${pt.y}" r="20" fill="transparent"></circle>
                    <g class="graph-tooltip" transform="translate(${pt.x}, ${pt.y - 25})">
                        <rect x="-35" y="-18" width="70" height="22" rx="4" fill="rgba(9, 13, 22, 0.95)" stroke="rgba(255,255,255,0.1)" stroke-width="1"></rect>
                        <text x="0" y="-3" fill="#ffffff" font-size="10" font-weight="600" text-anchor="middle">${pt.percent}%</text>
                    </g>
                </g>
            `;
        });

        let xLabelsHTML = '';
        points.forEach(pt => {
            xLabelsHTML += `
                <text x="${pt.x}" y="172" fill="rgba(255,255,255,0.4)" font-size="10" font-weight="600" text-anchor="middle">${pt.label}</text>
            `;
        });

        let graphHTML = `
            <svg class="weekly-graph-svg" viewBox="0 0 700 180">
                <defs>
                    <linearGradient id="graph-line-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#3b82f6"/>
                        <stop offset="100%" stop-color="#ec4899"/>
                    </linearGradient>
                    <linearGradient id="graph-area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.2"/>
                        <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
                    </linearGradient>
                </defs>
                <line x1="50" y1="30" x2="650" y2="30" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
                <line x1="50" y1="90" x2="650" y2="90" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4"/>
                <line x1="50" y1="150" x2="650" y2="150" stroke="rgba(255,255,255,0.1)"/>
                
                <text x="15" y="34" fill="rgba(255,255,255,0.25)" font-size="10" font-weight="600">100%</text>
                <text x="20" y="94" fill="rgba(255,255,255,0.25)" font-size="10" font-weight="600">50%</text>
                <text x="25" y="154" fill="rgba(255,255,255,0.25)" font-size="10" font-weight="600">0%</text>
                
                ${points.length > 0 ? `
                    <path d="${areaPath}" fill="url(#graph-area-grad)"></path>
                    <path d="${linePath}" fill="none" stroke="url(#graph-line-grad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
                ` : ''}
                
                ${pointsHTML}
                ${xLabelsHTML}
            </svg>
        `;
        
        const avgPercent = totalHabits > 0 ? Math.round(totalPercentSum / 7) : 0;
        const elAvg = document.getElementById('consistency-avg-label');
        if (elAvg) elAvg.textContent = `Average completion: ${avgPercent}%`;
        
        const elPerfect = document.getElementById('routine-stat-perfect');
        if (elPerfect) elPerfect.textContent = perfectDays;
        
        const elGraph = document.getElementById('weekly-graph-container');
        if (elGraph) elGraph.innerHTML = graphHTML;

        let filteredRoutines = routines;
        if (currentRoutineCategory !== 'all') {
            filteredRoutines = filteredRoutines.filter(r => r.category === currentRoutineCategory);
        }

        if (currentRoutineFilter === 'incomplete') {
            filteredRoutines = filteredRoutines.filter(r => !r.completions.includes(todayStr));
        } else if (currentRoutineFilter === 'completed') {
            filteredRoutines = filteredRoutines.filter(r => r.completions.includes(todayStr));
        } else if (currentRoutineFilter === 'streak') {
            filteredRoutines = filteredRoutines.filter(r => calculateStreak(r.completions) > 0);
        }

        routinesContainer.innerHTML = '';
        if (filteredRoutines.length === 0) {
            routinesContainer.innerHTML = '<p class="subtitle text-center" style="grid-column: 1 / -1; padding: 24px;">No routines found under this category. Add one to start tracking!</p>';
            updateProgressStatistics();
            renderCategories();
            renderSidebarFilters();
            return;
        }

        filteredRoutines.forEach(routine => {
            routinesContainer.insertAdjacentHTML('beforeend', createRoutineCardHTML(routine));
        });

        document.querySelectorAll('.routine-card [data-action]').forEach(btn => {
            btn.addEventListener('click', handleRoutineAction);
        });

        updateProgressStatistics();
        renderCategories();
        renderSidebarFilters();
    }

    function handleRoutineAction(e) {
        e.stopPropagation();
        const action = e.currentTarget.dataset.action;
        const card = e.currentTarget.closest('.routine-card');
        if (!card) return;
        const rId = card.dataset.routineId;
        if (action === 'toggle-routine') {
            const dateStr = getLocalDateString(new Date());
            card.classList.toggle('completed-today');
            setTimeout(() => {
                state.toggleRoutineCompletion(rId, dateStr);
                renderRoutinesDashboard();
            }, 200);
        } else if (action === 'delete-routine') {
            if (confirm('Are you sure you want to delete this routine?')) {
                state.deleteRoutine(rId);
                renderRoutinesDashboard();
            }
        } else if (action === 'edit-routine') {
            const routine = state.routines.find(r => r.id === rId);
            if (routine) {
                openRoutineModalForEdit(routine);
            }
        }
    }

    function renderCategories() {
        if (currentWorkspace !== 'routines') return;
        
        const countAll = state.routines.length;
        let html = `
            <li class="course-item ${currentRoutineCategory === 'all' ? 'active' : ''}" data-category-id="all">
                <span class="course-dot" style="background-color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 11px;"></span>
                <span class="course-name" style="margin-left: 8px;">🌟 All Habits</span>
                <span class="course-count">${countAll}</span>
            </li>
        `;

        state.categories.forEach(cat => {
            const count = state.routines.filter(r => r.category === cat.id).length;
            html += `
                <li class="course-item ${currentRoutineCategory === cat.id ? 'active' : ''}" data-category-id="${cat.id}">
                    <span class="course-dot" style="background-color: ${cat.color}; display: flex; align-items: center; justify-content: center; font-size: 11px;"></span>
                    <span class="course-name" style="margin-left: 8px;">${cat.emoji} ${cat.name}</span>
                    <span class="course-count">${count}</span>
                </li>
            `;
        });

        sidebarCoursesList.innerHTML = html;

        sidebarCoursesList.querySelectorAll('.course-item').forEach(item => {
            item.addEventListener('click', (e) => {
                sidebarCoursesList.querySelectorAll('.course-item').forEach(i => i.classList.remove('active'));
                const element = e.currentTarget;
                element.classList.add('active');
                currentRoutineCategory = element.dataset.categoryId;
                renderRoutinesDashboard();
            });
        });
    }

    function renderRoutineCategoryOptions() {
        const select = document.getElementById('routine-category');
        if (!select) return;
        let html = '';
        state.categories.forEach(cat => {
            html += `<option value="${cat.id}">${cat.emoji} ${cat.name}</option>`;
        });
        select.innerHTML = html;
    }

    function renderSidebarFilters() {
        const listContainer = document.getElementById('sidebar-filters-list');
        if (!listContainer) return;

        if (currentWorkspace === 'academic') {
            const todayStr = getLocalDateString(new Date());
            
            const countAll = state.tasks.filter(t => !t.completed).length;
            const countToday = state.tasks.filter(t => !t.completed && t.deadline === todayStr).length;
            const countUpcoming = state.tasks.filter(t => !t.completed && t.deadline && t.deadline >= todayStr).length;
            const countNoDeadline = state.tasks.filter(t => !t.completed && !t.deadline).length;

            listContainer.innerHTML = `
                <li class="filter-item ${currentTabFilter === 'all' ? 'active' : ''}" data-filter="all">
                    <svg class="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <span>All Active Tasks</span>
                    <span class="course-count" style="margin-left: auto;">${countAll}</span>
                </li>
                <li class="filter-item ${currentTabFilter === 'today' ? 'active' : ''}" data-filter="today">
                    <svg class="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>Due Today</span>
                    <span class="course-count" style="margin-left: auto;">${countToday}</span>
                </li>
                <li class="filter-item ${currentTabFilter === 'upcoming' ? 'active' : ''}" data-filter="upcoming">
                    <svg class="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span>Upcoming Tracker</span>
                    <span class="course-count" style="margin-left: auto;">${countUpcoming}</span>
                </li>
                <li class="filter-item ${currentTabFilter === 'nodeadline' ? 'active' : ''}" data-filter="nodeadline">
                    <svg class="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M16 8l-8 8"></path></svg>
                    <span>No Deadline Tasks</span>
                    <span class="course-count" style="margin-left: auto;">${countNoDeadline}</span>
                </li>
            `;

            listContainer.querySelectorAll('.filter-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    listContainer.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    currentTabFilter = e.currentTarget.dataset.filter;
                    render();
                });
            });
        } else {
            const todayStr = getLocalDateString(new Date());
            
            const countAll = state.routines.length;
            const countIncomplete = state.routines.filter(r => !r.completions.includes(todayStr)).length;
            const countCompleted = state.routines.filter(r => r.completions.includes(todayStr)).length;
            const countStreak = state.routines.filter(r => calculateStreak(r.completions) > 0).length;

            listContainer.innerHTML = `
                <li class="filter-item ${currentRoutineFilter === 'all' ? 'active' : ''}" data-filter="all">
                    <svg class="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <span>All Active Habits</span>
                    <span class="course-count" style="margin-left: auto;">${countAll}</span>
                </li>
                <li class="filter-item ${currentRoutineFilter === 'incomplete' ? 'active' : ''}" data-filter="incomplete">
                    <svg class="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    <span>Incomplete Today</span>
                    <span class="course-count" style="margin-left: auto;">${countIncomplete}</span>
                </li>
                <li class="filter-item ${currentRoutineFilter === 'completed' ? 'active' : ''}" data-filter="completed">
                    <svg class="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <span>Completed Today</span>
                    <span class="course-count" style="margin-left: auto;">${countCompleted}</span>
                </li>
                <li class="filter-item ${currentRoutineFilter === 'streak' ? 'active' : ''}" data-filter="streak">
                    <svg class="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                    <span>Active Streaks</span>
                    <span class="course-count" style="margin-left: auto;">${countStreak}</span>
                </li>
            `;

            listContainer.querySelectorAll('.filter-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    listContainer.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    currentRoutineFilter = e.currentTarget.dataset.filter;
                    renderRoutinesDashboard();
                });
            });
        }
    }

    function switchWorkspace(target) {
        currentWorkspace = target;
        const btnShowRoutines = document.getElementById('btn-show-routines');
        const btnCompleted = document.getElementById('btn-show-completed');
        const viewAcademic = document.getElementById('view-academic-tasks');
        const viewRoutines = document.getElementById('view-daily-routines');
        const btnAdd = document.getElementById('btn-add-course');
        
        if (target === 'academic') {
            document.getElementById('sidebar-stats-title').textContent = 'Overall Progress';
            document.getElementById('sidebar-stat-label-1').textContent = 'Active';
            document.getElementById('sidebar-stat-label-2').textContent = 'Urgent';
            document.getElementById('sidebar-stat-label-3').textContent = 'Due Soon';
            document.getElementById('sidebar-stat-label-4').textContent = 'Done';
            
            document.getElementById('sidebar-section-title-1').textContent = 'COURSES';
            if (btnAdd) {
                btnAdd.style.display = 'inline-flex';
                btnAdd.title = 'Add Course';
                btnAdd.setAttribute('aria-label', 'Add Course');
            }
            if (btnCompleted) {
                btnCompleted.style.display = 'inline-flex';
            }
            
            btnShowRoutines.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                </svg>
                <span style="margin-left: 8px;">Daily Routines</span>
            `;
            
            viewAcademic.classList.add('active');
            viewRoutines.classList.remove('active');
            
            renderCourses();
            renderSidebarFilters();
            render();
        } else {
            document.getElementById('sidebar-stats-title').textContent = 'Routine Statistics';
            document.getElementById('sidebar-stat-label-1').textContent = 'Total Habits';
            document.getElementById('sidebar-stat-label-2').textContent = 'Max Streak';
            document.getElementById('sidebar-stat-label-3').textContent = 'Perfect Days';
            document.getElementById('sidebar-stat-label-4').textContent = 'Done Today';
            
            document.getElementById('sidebar-section-title-1').textContent = 'CATEGORIES';
            if (btnAdd) {
                btnAdd.style.display = 'inline-flex';
                btnAdd.title = 'Add Category';
                btnAdd.setAttribute('aria-label', 'Add Category');
            }
            if (btnCompleted) {
                btnCompleted.style.display = 'none';
            }
            
            btnShowRoutines.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                </svg>
                <span style="margin-left: 8px;">Academic Workspace</span>
            `;
            
            viewAcademic.classList.remove('active');
            viewRoutines.classList.add('active');
            
            renderCategories();
            renderSidebarFilters();
            renderRoutinesDashboard();
        }
    }

    btnShowRoutines.addEventListener('click', () => {
        if (currentWorkspace === 'academic') {
            switchWorkspace('routines');
        } else {
            switchWorkspace('academic');
        }
    });

    btnNewRoutine.addEventListener('click', () => {
        document.getElementById('routine-modal-title').textContent = 'Create Routine';
        document.getElementById('btn-submit-routine').textContent = 'Create Routine';
        routineForm.reset();
        document.getElementById('routine-edit-id').value = '';
        renderRoutineCategoryOptions();
        document.getElementById('routine-category').value = state.categories[0]?.id || 'coding';
        routineModal.showModal();
    });

    function openRoutineModalForEdit(routine) {
        document.getElementById('routine-modal-title').textContent = 'Edit Routine';
        document.getElementById('btn-submit-routine').textContent = 'Save Changes';
        document.getElementById('routine-edit-id').value = routine.id;
        document.getElementById('routine-title').value = routine.title;
        renderRoutineCategoryOptions();
        document.getElementById('routine-category').value = routine.category || 'coding';
        routineModal.showModal();
    }

    const closeRoutineModal = () => { routineModal.close(); };
    btnCloseRoutineModal.addEventListener('click', closeRoutineModal);
    btnCancelRoutineModal.addEventListener('click', closeRoutineModal);

    routineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('routine-edit-id').value;
        const title = document.getElementById('routine-title').value.trim();
        const category = document.getElementById('routine-category').value;
        if (!title) return;
        if (id) {
            state.updateRoutine(id, title, category);
        } else {
            state.addRoutine(title, category);
        }
        routineModal.close();
        renderRoutinesDashboard();
    });

    switchWorkspace('academic');
});
