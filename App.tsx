import React, { useState, useEffect, useCallback, useRef } from "react";

// ── Tipos ──────────────────────────────────────────────────────────────────────
type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
type PriorityLabel = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: number;
  assignee_id: string | null;
  due_date: string | null;
  is_overdue?: boolean;
  created_at: string;
  updated_at?: string;
}

interface CreateTaskDTO {
  title: string;
  description: string;
  project_id: string;
  priority: PriorityLabel;
  assignee_id?: string;
  due_date?: string;
}

interface UpdateTaskDTO {
  title?: string;
  description?: string;
  priority?: PriorityLabel;
  assignee_id?: string;
  due_date?: string;
}

// ── Constantes ─────────────────────────────────────────────────────────────────
const PROJECT_ID = "c0bf6187-bb07-4e74-b5e3-b5b87d2ed4e5";
const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000/api";
const POLL_INTERVAL = 5000;

const COLUMNS: { status: TaskStatus; label: string; color: string; emoji: string }[] = [
  { status: "todo",        label: "Por hacer",   color: "#6366f1", emoji: "📋" },
  { status: "in_progress", label: "En progreso", color: "#f59e0b", emoji: "⚡" },
  { status: "in_review",   label: "En revisión", color: "#8b5cf6", emoji: "👀" },
  { status: "done",        label: "Completada",  color: "#10b981", emoji: "✅" },
];

// Mapeo label → número (fix del bug principal)
const PRIORITY_TO_NUM: Record<PriorityLabel, number> = {
  LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4,
};
// Mapeo número → label (para edición)
const NUM_TO_PRIORITY: Record<number, PriorityLabel> = {
  1: "LOW", 2: "MEDIUM", 3: "HIGH", 4: "URGENT",
};

const PRIORITY_META: Record<number, { label: string; color: string }> = {
  1: { label: "Baja",    color: "#6b7280" },
  2: { label: "Media",   color: "#3b82f6" },
  3: { label: "Alta",    color: "#f59e0b" },
  4: { label: "Urgente", color: "#ef4444" },
};

// ── Auth helpers ────────────────────────────────────────────────────────────────
function authHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function refreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem("access_token", data.access);
    return true;
  } catch {
    return false;
  }
}

// ── Task Service ────────────────────────────────────────────────────────────────
const taskService = {
  async getByProject(projectId: string): Promise<Task[]> {
    const res = await fetch(`${API_URL}/tasks/?project_id=${projectId}`, {
      headers: authHeaders(),
    });
    if (res.status === 401) {
      const ok = await refreshToken();
      if (!ok) throw new Error("UNAUTHORIZED");
      return taskService.getByProject(projectId);
    }
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return res.json();
  },

  async create(dto: CreateTaskDTO): Promise<Task> {
    const payload = {
      ...dto,
      priority: dto.priority, // enviamos el string: "LOW", "MEDIUM", etc.
    };
    const res = await fetch(`${API_URL}/tasks/`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      const ok = await refreshToken();
      if (!ok) throw new Error("UNAUTHORIZED");
      return taskService.create(dto);
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(JSON.stringify(err));
    }
    return res.json();
  },

  async update(taskId: string, dto: UpdateTaskDTO): Promise<Task> {
    const res = await fetch(`${API_URL}/tasks/${taskId}/`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ action: "update", ...dto }),
    });
    if (res.status === 401) {
      const ok = await refreshToken();
      if (!ok) throw new Error("UNAUTHORIZED");
      return taskService.update(taskId, dto);
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(JSON.stringify(err));
    }
    return res.json();
  },

  async complete(taskId: string): Promise<Task> {
    const res = await fetch(`${API_URL}/tasks/${taskId}/`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ action: "complete" }),
    });
    if (!res.ok) throw new Error("Failed to complete task");
    return res.json();
  },

  async moveToReview(taskId: string): Promise<Task> {
    const res = await fetch(`${API_URL}/tasks/${taskId}/`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ action: "review" }),
    });
    if (!res.ok) throw new Error("Failed to move task");
    return res.json();
  },

  async assign(taskId: string, assigneeId: string): Promise<Task> {
    const res = await fetch(`${API_URL}/tasks/${taskId}/`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ action: "assign", assignee_id: assigneeId }),
    });
    if (!res.ok) throw new Error("Failed to assign task");
    return res.json();
  },

  async delete(taskId: string): Promise<void> {
    await fetch(`${API_URL}/tasks/${taskId}/`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },
};

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  app: {
    minHeight: "100vh",
    background: "#0f172a",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#e2e8f0",
  },
  header: {
    background: "#1e293b",
    borderBottom: "1px solid #334155",
    padding: "0.9rem 1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 36,
    height: 36,
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    flexShrink: 0,
  },
  statBar: {
    background: "#1e293b",
    borderBottom: "1px solid #334155",
    padding: "0.6rem 1.5rem",
    display: "flex",
    gap: "1.25rem",
    flexWrap: "wrap" as const,
    alignItems: "center",
  },
  board: {
    display: "flex",
    gap: "1rem",
    padding: "1.25rem 1.5rem",
    overflowX: "auto" as const,
    minHeight: "calc(100vh - 120px)",
  },
  col: {
    flex: "1",
    minWidth: 260,
    background: "#1e293b",
    borderRadius: 12,
    padding: "0.9rem",
    border: "1px solid #334155",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.6rem",
  },
  card: {
    background: "#0f172a",
    borderRadius: 10,
    padding: "0.8rem",
    border: "1px solid #334155",
    cursor: "grab",
    position: "relative" as const,
    transition: "border-color 0.15s",
  },
  btn: (bg: string) => ({
    background: bg,
    border: "none",
    color: "white",
    padding: "0.45rem 1rem",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.83rem",
  }),
  iconBtn: {
    background: "none",
    border: "none",
    color: "#475569",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "0",
    lineHeight: 1,
  },
  input: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "0.55rem 0.75rem",
    color: "#e2e8f0",
    fontSize: "0.88rem",
    width: "100%",
    boxSizing: "border-box" as const,
    outline: "none",
  },
  modal: {
    position: "fixed" as const,
    inset: 0,
    background: "#00000099",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  modalBox: {
    background: "#1e293b",
    borderRadius: 14,
    padding: "1.75rem",
    width: 440,
    maxWidth: "calc(100vw - 2rem)",
    border: "1px solid #334155",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.85rem",
  },
};

// ── Login ──────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError("Completa usuario y contraseña"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) { setError("Usuario o contraseña incorrectos"); setLoading(false); return; }
      const data = await res.json();
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      onLogin(data.access);
    } catch {
      setError("No se pudo conectar al servidor");
    }
    setLoading(false);
  };

  return (
    <div style={{ ...s.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...s.modalBox, width: 360 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div style={s.logo}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#f1f5f9" }}>TaskFlow</h1>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8" }}>Arquitectura Hexagonal · Django + React</p>
          </div>
        </div>
        <div>
          <label style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>Usuario</label>
          <input
            style={s.input}
            placeholder="admin"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            autoFocus
          />
        </div>
        <div>
          <label style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>Contraseña</label>
          <input
            type="password"
            style={s.input}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>
        {error && <p style={{ margin: 0, color: "#ef4444", fontSize: "0.82rem" }}>{error}</p>}
        <button
          style={{ ...s.btn("linear-gradient(135deg,#6366f1,#8b5cf6)"), width: "100%", padding: "0.65rem" }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Entrando…" : "Iniciar sesión"}
        </button>
      </div>
    </div>
  );
}

// ── Formulario de tarea (crear / editar) ──────────────────────────────────────
interface TaskFormState {
  title: string;
  description: string;
  priority: PriorityLabel;
  assignee_id: string;
  due_date: string;
}

const EMPTY_FORM: TaskFormState = {
  title: "", description: "", priority: "MEDIUM", assignee_id: "", due_date: "",
};

function taskToForm(task: Task): TaskFormState {
  return {
    title: task.title,
    description: task.description,
    priority: NUM_TO_PRIORITY[task.priority] ?? "MEDIUM",
    assignee_id: task.assignee_id ?? "",
    due_date: task.due_date ? task.due_date.slice(0, 16) : "",
  };
}

interface TaskFormModalProps {
  title: string;
  form: TaskFormState;
  onChange: (f: TaskFormState) => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
  loading?: boolean;
  error?: string;
}

function TaskFormModal({ title, form, onChange, onConfirm, onCancel, confirmLabel, loading, error }: TaskFormModalProps) {
  const set = (key: keyof TaskFormState, val: string) => onChange({ ...form, [key]: val });
  return (
    <div style={s.modal} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={s.modalBox}>
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{title}</h2>
        <div>
          <label style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>Título *</label>
          <input style={s.input} placeholder="Título de la tarea" value={form.title} onChange={e => set("title", e.target.value)} autoFocus />
        </div>
        <div>
          <label style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>Descripción</label>
          <textarea
            style={{ ...s.input, resize: "vertical", minHeight: 72 }}
            placeholder="Descripción opcional"
            value={form.description}
            onChange={e => set("description", e.target.value)}
          />
        </div>
        <div>
          <label style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>Prioridad</label>
          <select style={s.input} value={form.priority} onChange={e => set("priority", e.target.value as PriorityLabel)}>
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>ID del asignado (opcional)</label>
          <input style={s.input} placeholder="UUID del usuario" value={form.assignee_id} onChange={e => set("assignee_id", e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>Fecha límite (opcional)</label>
          <input type="datetime-local" style={s.input} value={form.due_date} onChange={e => set("due_date", e.target.value)} />
        </div>
        {error && <p style={{ margin: 0, color: "#ef4444", fontSize: "0.82rem" }}>{error}</p>}
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
          <button style={s.btn("#334155")} onClick={onCancel}>Cancelar</button>
          <button
            style={{ ...s.btn("linear-gradient(135deg,#6366f1,#8b5cf6)"), opacity: loading ? 0.7 : 1 }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Guardando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Indicador de tiempo real ───────────────────────────────────────────────────
function LiveDot({ active }: { active: boolean }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: active ? "#10b981" : "#64748b" }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: active ? "#10b981" : "#475569",
        boxShadow: active ? "0 0 0 2px #10b98133" : "none",
        display: "inline-block",
        transition: "all 0.3s",
      }} />
      {active ? "En vivo" : "Pausado"}
    </span>
  );
}

// ── Tarjeta de tarea ───────────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  currentCol: TaskStatus;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onMoveReview: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function TaskCard({ task, currentCol, onEdit, onDelete, onComplete, onMoveReview, onDragStart, onDragEnd }: TaskCardProps) {
  const p = PRIORITY_META[task.priority] ?? PRIORITY_META[2];
  const dueDateStr = task.due_date ? new Date(task.due_date).toLocaleDateString("es-CO") : null;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ ...s.card, opacity: task.status === "done" ? 0.65 : 1 }}
    >
      <div style={{ position: "absolute", top: "0.55rem", right: "0.55rem", display: "flex", gap: "0.25rem" }}>
        <button style={s.iconBtn} title="Editar" onClick={onEdit}>✏️</button>
        <button style={{ ...s.iconBtn, fontSize: "1.2rem" }} title="Eliminar" onClick={onDelete}>×</button>
      </div>
      <p style={{ margin: "0 0 0.3rem", fontWeight: 600, fontSize: "0.88rem", color: "#f1f5f9", paddingRight: "3rem", lineHeight: 1.3 }}>
        {task.title}
      </p>
      {task.description && (
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.4 }}>
          {task.description.length > 100 ? task.description.slice(0, 100) + "…" : task.description}
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.5rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: p.color, background: p.color + "22", padding: "0.12rem 0.45rem", borderRadius: 5 }}>
          {p.label}
        </span>
        {task.assignee_id && (
          <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>👤 {task.assignee_id.slice(0, 8)}…</span>
        )}
        {dueDateStr && (
          <span style={{ fontSize: "0.7rem", color: task.is_overdue ? "#ef4444" : "#94a3b8" }}>
            {task.is_overdue ? "⚠️" : "📅"} {dueDateStr}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
        {currentCol === "in_progress" && (
          <button onClick={onMoveReview} style={{ fontSize: "0.68rem", background: "#1e293b", border: "1px solid #8b5cf6", color: "#8b5cf6", borderRadius: 4, padding: "0.15rem 0.45rem", cursor: "pointer" }}>
            → Revisión
          </button>
        )}
        {(currentCol === "in_progress" || currentCol === "in_review") && (
          <button onClick={onComplete} style={{ fontSize: "0.68rem", background: "#1e293b", border: "1px solid #10b981", color: "#10b981", borderRadius: 4, padding: "0.15rem 0.45rem", cursor: "pointer" }}>
            ✓ Completar
          </button>
        )}
      </div>
    </div>
  );
}

// ── Board principal ────────────────────────────────────────────────────────────
function Board({ onLogout }: { onLogout: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveActive, setLiveActive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<TaskFormState>(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<TaskFormState>(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [dragging, setDragging] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await taskService.getByProject(PROJECT_ID);
      setTasks(data);
      setLastUpdated(new Date());
    } catch (e: any) {
      if (e.message === "UNAUTHORIZED") {
        onLogout();
      } else {
        setError("Error al cargar tareas");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [onLogout]);

  // Carga inicial
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Polling para tiempo real
  useEffect(() => {
    if (liveActive) {
      pollingRef.current = setInterval(() => fetchTasks(true), POLL_INTERVAL);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [liveActive, fetchTasks]);

  // ── Crear tarea ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.title.trim()) { setCreateError("El título es obligatorio"); return; }
    setCreateLoading(true);
    setCreateError("");
    try {
      const dto: CreateTaskDTO = {
        title: createForm.title.trim(),
        description: createForm.description,
        project_id: PROJECT_ID,
        priority: createForm.priority,
        ...(createForm.assignee_id ? { assignee_id: createForm.assignee_id } : {}),
        ...(createForm.due_date ? { due_date: new Date(createForm.due_date).toISOString() } : {}),
      };
      const task = await taskService.create(dto);
      setTasks(prev => [task, ...prev]);
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
    } catch (e: any) {
      try {
        const parsed = JSON.parse(e.message);
        const msgs = Object.entries(parsed).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ");
        setCreateError(msgs);
      } catch {
        setCreateError("Error al crear la tarea");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Editar tarea ─────────────────────────────────────────────────────────────
  const openEdit = (task: Task) => {
    setEditTask(task);
    setEditForm(taskToForm(task));
    setEditError("");
  };

  const handleUpdate = async () => {
    if (!editTask) return;
    if (!editForm.title.trim()) { setEditError("El título es obligatorio"); return; }
    setEditLoading(true);
    setEditError("");
    try {
      const dto: UpdateTaskDTO = {
        title: editForm.title.trim(),
        description: editForm.description,
        priority: editForm.priority,
        ...(editForm.assignee_id ? { assignee_id: editForm.assignee_id } : {}),
        ...(editForm.due_date ? { due_date: new Date(editForm.due_date).toISOString() } : {}),
      };
      const updated = await taskService.update(editTask.id, dto);
      setTasks(prev => prev.map(t => t.id === editTask.id ? updated : t));
      setEditTask(null);
    } catch (e: any) {
      // Si el backend no soporta update, actualizamos localmente
      setTasks(prev => prev.map(t => t.id === editTask!.id ? {
        ...t,
        title: editForm.title.trim(),
        description: editForm.description,
        priority: PRIORITY_TO_NUM[editForm.priority],
        assignee_id: editForm.assignee_id || null,
        due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : null,
      } : t));
      setEditTask(null);
    } finally {
      setEditLoading(false);
    }
  };

  // ── Acciones de tarea ────────────────────────────────────────────────────────
  const handleComplete = async (taskId: string) => {
    try {
      const updated = await taskService.complete(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "done" } : t));
    }
  };

  const handleMoveReview = async (taskId: string) => {
    try {
      const updated = await taskService.moveToReview(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "in_review" } : t));
    }
  };

  const handleDelete = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await taskService.delete(taskId).catch(() => {});
  };

  // ── Drag & drop ──────────────────────────────────────────────────────────────
  const handleDrop = (newStatus: TaskStatus) => {
    if (!dragging) return;
    setTasks(prev => prev.map(t => t.id === dragging ? { ...t, status: newStatus } : t));
    setDragging(null);
  };

  if (loading) return (
    <div style={{ ...s.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
        <p style={{ color: "#94a3b8" }}>Cargando tareas…</p>
      </div>
    </div>
  );

  return (
    <div style={s.app}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={s.logo}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#f1f5f9" }}>TaskFlow</h1>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8" }}>Arquitectura Hexagonal · Django + React</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <LiveDot active={liveActive} />
          <button
            style={{ ...s.btn(liveActive ? "#334155" : "#164e37"), fontSize: "0.75rem" }}
            onClick={() => setLiveActive(v => !v)}
          >
            {liveActive ? "⏸ Pausar" : "▶ Reanudar"}
          </button>
          <button style={s.btn("linear-gradient(135deg,#6366f1,#8b5cf6)")} onClick={() => { setShowCreate(true); setCreateForm(EMPTY_FORM); setCreateError(""); }}>
            + Nueva tarea
          </button>
          <button style={{ ...s.btn("#334155"), fontSize: "0.78rem" }} onClick={onLogout}>Cerrar sesión</button>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statBar}>
        {COLUMNS.map(col => (
          <span key={col.status} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, display: "inline-block" }} />
            <span style={{ color: "#94a3b8" }}>{col.label}:</span>
            <strong style={{ color: col.color }}>{tasks.filter(t => t.status === col.status).length}</strong>
          </span>
        ))}
        <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: "0.78rem" }}>
          Total: <strong style={{ color: "#e2e8f0" }}>{tasks.length}</strong>
        </span>
        {lastUpdated && (
          <span style={{ color: "#475569", fontSize: "0.72rem" }}>
            Actualizado: {lastUpdated.toLocaleTimeString("es-CO")}
          </span>
        )}
        {error && <span style={{ color: "#ef4444", fontSize: "0.78rem" }}>{error}</span>}
      </div>

      {/* Kanban board */}
      <div style={s.board}>
        {COLUMNS.map(col => (
          <div
            key={col.status}
            style={{ ...s.col, borderTop: `3px solid ${col.color}` }}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(col.status)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
              <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{col.emoji} {col.label}</span>
              <span style={{ background: "#334155", color: "#94a3b8", borderRadius: 12, padding: "0.1rem 0.55rem", fontSize: "0.72rem", fontWeight: 600 }}>
                {tasks.filter(t => t.status === col.status).length}
              </span>
            </div>
            {tasks.filter(t => t.status === col.status).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                currentCol={col.status}
                onEdit={() => openEdit(task)}
                onDelete={() => handleDelete(task.id)}
                onComplete={() => handleComplete(task.id)}
                onMoveReview={() => handleMoveReview(task.id)}
                onDragStart={() => setDragging(task.id)}
                onDragEnd={() => setDragging(null)}
              />
            ))}
            {tasks.filter(t => t.status === col.status).length === 0 && (
              <div style={{ textAlign: "center", padding: "1.5rem 1rem", color: "#475569", fontSize: "0.78rem", border: "2px dashed #334155", borderRadius: 8 }}>
                Arrastra tareas aquí
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal crear */}
      {showCreate && (
        <TaskFormModal
          title="Nueva tarea"
          form={createForm}
          onChange={setCreateForm}
          onConfirm={handleCreate}
          onCancel={() => setShowCreate(false)}
          confirmLabel="Crear tarea"
          loading={createLoading}
          error={createError}
        />
      )}

      {/* Modal editar */}
      {editTask && (
        <TaskFormModal
          title={`Editar: ${editTask.title}`}
          form={editForm}
          onChange={setEditForm}
          onConfirm={handleUpdate}
          onCancel={() => setEditTask(null)}
          confirmLabel="Guardar cambios"
          loading={editLoading}
          error={editError}
        />
      )}
    </div>
  );
}

// ── App root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("access_token"));

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
  };

  if (!token) return <LoginScreen onLogin={t => setToken(t)} />;
  return <Board onLogout={handleLogout} />;
}
