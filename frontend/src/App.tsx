import React, { useState } from 'react';

const COLUMNS = [
  { status: 'todo', label: '📋 Por hacer', color: '#6366f1' },
  { status: 'in_progress', label: '⚡ En progreso', color: '#f59e0b' },
  { status: 'in_review', label: '👀 En revisión', color: '#8b5cf6' },
  { status: 'done', label: '✅ Completada', color: '#10b981' },
];

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Baja', color: '#6b7280' },
  2: { label: 'Media', color: '#3b82f6' },
  3: { label: 'Alta', color: '#f59e0b' },
  4: { label: 'Urgente', color: '#ef4444' },
};

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  assignee: string;
}

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Diseñar arquitectura hexagonal', description: 'Definir capas: domain, application, infrastructure, presentation.', status: 'done', priority: 3, assignee: 'Ana García' },
  { id: '2', title: 'Implementar entidad Task', description: 'Crear Task con métodos start(), complete(), assign_to().', status: 'done', priority: 3, assignee: 'Carlos López' },
  { id: '3', title: 'Crear ITaskRepository', description: 'Definir el port de salida con save, find_by_id, delete.', status: 'in_review', priority: 2, assignee: 'Ana García' },
  { id: '4', title: 'Implementar DjangoTaskRepository', description: 'Adapter que implementa ITaskRepository usando Django ORM.', status: 'in_progress', priority: 3, assignee: 'Carlos López' },
  { id: '5', title: 'Configurar JWT Auth', description: 'Integrar djangorestframework-simplejwt para autenticación.', status: 'in_progress', priority: 4, assignee: 'María Torres' },
  { id: '6', title: 'Crear TaskViewSet', description: 'Endpoints REST: crear, listar, actualizar y eliminar tareas.', status: 'todo', priority: 3, assignee: 'Carlos López' },
  { id: '7', title: 'Escribir tests unitarios', description: 'Cubrir CreateTaskUseCase y Task entity con mocks.', status: 'todo', priority: 2, assignee: 'Ana García' },
  { id: '8', title: 'Dockerizar el proyecto', description: 'Crear docker-compose con backend, frontend y PostgreSQL.', status: 'todo', priority: 1, assignee: 'María Torres' },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 2, assignee: '' });
  const [dragging, setDragging] = useState<string | null>(null);

  const addTask = () => {
    if (!newTask.title.trim()) return;
    setTasks(prev => [...prev, {
      id: Date.now().toString(),
      ...newTask,
      status: 'todo',
    }]);
    setNewTask({ title: '', description: '', priority: 2, assignee: '' });
    setShowForm(false);
  };

  const moveTask = (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'Segoe UI', sans-serif", color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9' }}>TaskFlow</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Arquitectura Hexagonal · Django + React</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Proyecto: <strong style={{ color: '#e2e8f0' }}>TaskFlow Demo</strong></span>
          <button
            onClick={() => setShowForm(true)}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: 'white', padding: '0.5rem 1.25rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
          >
            + Nueva tarea
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', background: '#1e293b', borderBottom: '1px solid #334155' }}>
        {COLUMNS.map(col => (
          <div key={col.status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
            <span style={{ color: '#94a3b8' }}>{col.label.split(' ').slice(1).join(' ')}:</span>
            <strong style={{ color: col.color }}>{tasks.filter(t => t.status === col.status).length}</strong>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.85rem' }}>Total: <strong style={{ color: '#e2e8f0' }}>{tasks.length}</strong></span>
      </div>

      {/* Board */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem 2rem', overflowX: 'auto', minHeight: 'calc(100vh - 140px)' }}>
        {COLUMNS.map(col => (
          <div
            key={col.status}
            onDragOver={e => e.preventDefault()}
            onDrop={() => dragging && moveTask(dragging, col.status)}
            style={{ flex: '1', minWidth: 260, background: '#1e293b', borderRadius: 12, padding: '1rem', border: `1px solid #334155`, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 3, height: 20, background: col.color, borderRadius: 2 }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{col.label}</span>
              </div>
              <span style={{ background: '#334155', color: '#94a3b8', borderRadius: 12, padding: '0.1rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>
                {tasks.filter(t => t.status === col.status).length}
              </span>
            </div>

            {/* Tasks */}
            {tasks.filter(t => t.status === col.status).map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={() => setDragging(task.id)}
                onDragEnd={() => setDragging(null)}
                style={{ background: '#0f172a', borderRadius: 10, padding: '0.85rem', border: '1px solid #334155', cursor: 'grab', transition: 'transform 0.1s', position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#f1f5f9', lineHeight: 1.3 }}>{task.title}</p>
                  <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1rem', padding: '0 0 0 0.5rem', lineHeight: 1 }}>×</button>
                </div>
                <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>{task.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: PRIORITY_LABELS[task.priority].color, background: PRIORITY_LABELS[task.priority].color + '22', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                    {PRIORITY_LABELS[task.priority].label}
                  </span>
                  {task.assignee && (
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#334155', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>
                        {task.assignee.charAt(0)}
                      </span>
                      {task.assignee.split(' ')[0]}
                    </span>
                  )}
                </div>
                {/* Move buttons */}
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.6rem' }}>
                  {COLUMNS.filter(c => c.status !== col.status).map(c => (
                    <button key={c.status} onClick={() => moveTask(task.id, c.status)}
                      style={{ fontSize: '0.65rem', background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: 4, padding: '0.15rem 0.4rem', cursor: 'pointer' }}>
                      → {c.label.split(' ').slice(1).join(' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {tasks.filter(t => t.status === col.status).length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#475569', fontSize: '0.8rem', border: '2px dashed #334155', borderRadius: 8 }}>
                Arrastra tareas aquí
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal nueva tarea */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: '2rem', width: 420, border: '1px solid #334155' }}>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem' }}>Nueva tarea</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input placeholder="Título *" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.6rem 0.8rem', color: '#e2e8f0', fontSize: '0.9rem' }} />
              <textarea placeholder="Descripción" value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.6rem 0.8rem', color: '#e2e8f0', fontSize: '0.9rem', resize: 'vertical', minHeight: 80 }} />
              <input placeholder="Asignado a" value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))}
                style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.6rem 0.8rem', color: '#e2e8f0', fontSize: '0.9rem' }} />
              <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: Number(e.target.value) }))}
                style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.6rem 0.8rem', color: '#e2e8f0', fontSize: '0.9rem' }}>
                <option value={1}>Baja</option>
                <option value={2}>Media</option>
                <option value={3}>Alta</option>
                <option value={4}>Urgente</option>
              </select>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)}
                  style={{ background: '#334155', border: 'none', color: '#e2e8f0', padding: '0.6rem 1.25rem', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={addTask}
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: 'white', padding: '0.6rem 1.25rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Crear tarea</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}