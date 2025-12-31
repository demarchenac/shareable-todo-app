import { create } from 'zustand'

export interface SubTodo {
  id: string
  title: string
  completed: boolean
  followUp?: string
}

export interface Todo {
  id: string
  title: string
  completed: boolean
  isPublic: boolean
  date: string // YYYY-MM-DD format
  createdAt: number
  shareId: string
  subTodos: Array<SubTodo>
  followUp?: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface TodoStore {
  todos: Array<Todo>
  user: User | null
  addTodo: (title: string, isPublic: boolean, date: string) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  addSubTodo: (todoId: string, title: string) => void
  toggleSubTodo: (todoId: string, subTodoId: string) => void
  deleteSubTodo: (todoId: string, subTodoId: string) => void
  getTodosByDate: (date: string) => Array<Todo>
  getTodoByShareId: (shareId: string) => Todo | undefined
  addFollowUp: (id: string, followUp: string) => void
  addSubTodoFollowUp: (
    todoId: string,
    subTodoId: string,
    followUp: string,
  ) => void
  removeFollowUp: (id: string) => void
  removeSubTodoFollowUp: (todoId: string, subTodoId: string) => void
  login: () => void
  logout: () => void
}

const generateShareId = () => Math.random().toString(36).substring(2, 10)

// Mock initial data
const mockTodos: Array<Todo> = [
  {
    id: '1',
    title: 'Review pull request for authentication module',
    completed: true,
    isPublic: true,
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 3600000,
    shareId: 'abc123xy',
    subTodos: [],
  },
  {
    id: '2',
    title: 'Write documentation for API endpoints',
    completed: false,
    isPublic: true,
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 7200000,
    shareId: 'def456zw',
    subTodos: [
      { id: 'sub-1', title: 'Document GET /users endpoint', completed: true },
      { id: 'sub-2', title: 'Document POST /auth endpoint', completed: false },
      { id: 'sub-3', title: 'Add code examples', completed: false },
    ],
  },
  {
    id: '3',
    title: 'Fix bug in user dashboard',
    completed: false,
    isPublic: false,
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 1800000,
    shareId: 'ghi789uv',
    subTodos: [
      { id: 'sub-4', title: 'Reproduce the bug', completed: true },
      { id: 'sub-5', title: 'Write failing test', completed: false },
    ],
  },
  {
    id: '4',
    title: 'Prepare presentation for team meeting',
    completed: true,
    isPublic: false,
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 86400000,
    shareId: 'jkl012st',
    subTodos: [],
  },
  {
    id: '5',
    title: 'Refactor database queries for performance',
    completed: false,
    isPublic: true,
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 2700000,
    shareId: 'pqr345mn',
    subTodos: [],
  },
  {
    id: '6',
    title: 'Set up CI/CD pipeline for staging',
    completed: true,
    isPublic: false,
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 3000000,
    shareId: 'mno345qr',
    subTodos: [],
  },
  {
    id: '7',
    title: 'Design new onboarding flow',
    completed: false,
    isPublic: true,
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 3300000,
    shareId: 'pqr678tu',
    subTodos: [
      { id: 'sub-6', title: 'Create wireframes', completed: true },
      { id: 'sub-7', title: 'Review with product team', completed: false },
    ],
  },
  {
    id: '8',
    title: 'Update dependencies to latest versions',
    completed: false,
    isPublic: false,
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 3600000,
    shareId: 'stu901vw',
    subTodos: [],
  },
  {
    id: '9',
    title: 'Optimize image loading on homepage',
    completed: false,
    isPublic: false,
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 4200000,
    shareId: 'yza567bc',
    subTodos: [],
  },
  {
    id: '10',
    title: 'Implement dark mode toggle',
    completed: false,
    isPublic: true,
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 4500000,
    shareId: 'bcd890ef',
    subTodos: [],
  },
  {
    id: '11',
    title: 'Create user feedback survey',
    completed: false,
    isPublic: true,
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 4800000,
    shareId: 'efg123hi',
    subTodos: [],
  },
]

const mockUser: User = {
  id: 'user-1',
  name: 'Alex Developer',
  email: 'alex@example.com',
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: mockTodos,
  user: mockUser,

  addTodo: (title, isPublic, date) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      completed: false,
      isPublic,
      date,
      createdAt: Date.now(),
      shareId: generateShareId(),
      subTodos: [],
    }
    set((state) => ({ todos: [newTodo, ...state.todos] }))
  },

  toggleTodo: (id) => {
    set((state) => ({
      todos: state.todos.map((todo) => {
        if (todo.id === id) {
          const newCompleted = !todo.completed
          return {
            ...todo,
            completed: newCompleted,
            subTodos: todo.subTodos.map((sub) => ({
              ...sub,
              completed: newCompleted,
            })),
          }
        }
        return todo
      }),
    }))
  },

  deleteTodo: (id) => {
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    }))
  },

  addSubTodo: (todoId, title) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              completed: false,
              subTodos: [
                ...todo.subTodos,
                { id: Date.now().toString(), title, completed: false },
              ],
            }
          : todo,
      ),
    }))
  },

  toggleSubTodo: (todoId, subTodoId) => {
    set((state) => ({
      todos: state.todos.map((todo) => {
        if (todo.id === todoId) {
          const updatedSubTodos = todo.subTodos.map((sub) =>
            sub.id === subTodoId ? { ...sub, completed: !sub.completed } : sub,
          )
          const allSubsCompleted =
            updatedSubTodos.length > 0 &&
            updatedSubTodos.every((sub) => sub.completed)
          return {
            ...todo,
            subTodos: updatedSubTodos,
            completed: allSubsCompleted,
          }
        }
        return todo
      }),
    }))
  },

  deleteSubTodo: (todoId, subTodoId) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subTodos: todo.subTodos.filter((sub) => sub.id !== subTodoId),
            }
          : todo,
      ),
    }))
  },

  getTodosByDate: (date) => {
    return get().todos.filter((todo) => todo.date === date)
  },

  getTodoByShareId: (shareId) => {
    return get().todos.find((todo) => todo.shareId === shareId)
  },

  addFollowUp: (id, followUp) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, followUp } : todo,
      ),
    }))
  },

  addSubTodoFollowUp: (todoId, subTodoId, followUp) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subTodos: todo.subTodos.map((sub) =>
                sub.id === subTodoId ? { ...sub, followUp } : sub,
              ),
            }
          : todo,
      ),
    }))
  },

  removeFollowUp: (id) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, followUp: undefined } : todo,
      ),
    }))
  },

  removeSubTodoFollowUp: (todoId, subTodoId) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subTodos: todo.subTodos.map((sub) =>
                sub.id === subTodoId ? { ...sub, followUp: undefined } : sub,
              ),
            }
          : todo,
      ),
    }))
  },

  login: () => set({ user: mockUser }),
  logout: () => set({ user: null }),
}))
