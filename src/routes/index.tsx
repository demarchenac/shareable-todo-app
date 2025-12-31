import { createFileRoute } from '@tanstack/react-router'

import { TodoApp } from '@/todo/components/todo-app'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return <TodoApp />
}
