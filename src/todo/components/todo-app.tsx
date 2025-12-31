'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'

import { addDays, format, subDays } from 'date-fns'
import {
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Loader2,
  LogOut,
  MoreVertical,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Calendar } from '@/shared/components/ui/calendar'
import { CardHeader } from '@/shared/components/ui/card'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Input } from '@/shared/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'

import { useTodoStore } from '../stores/todo'
import { ShareDialog } from './share-dialog'

const digitEmojis: Record<string, string> = {
  '0': '0️⃣',
  '1': '1️⃣',
  '2': '2️⃣',
  '3': '3️⃣',
  '4': '4️⃣',
  '5': '5️⃣',
  '6': '6️⃣',
  '7': '7️⃣',
  '8': '8️⃣',
  '9': '9️⃣',
}

const getNumberEmoji = (index: number, totalCount: number) => {
  const displayNum = index + 1
  const maxDigits = String(totalCount).length
  const paddedNum = String(displayNum).padStart(maxDigits, '0')
  return paddedNum
    .split('')
    .map((digit) => digitEmojis[digit])
    .join('')
}

export function TodoApp() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set())
  const [newSubTodoTitle, setNewSubTodoTitle] = useState<
    Record<string, string>
  >({})
  const [followUpForms, setFollowUpForms] = useState<Set<string>>(new Set())
  const [newFollowUpText, setNewFollowUpText] = useState<
    Record<string, string>
  >({})
  const [focusedIndex, setFocusedIndex] = useState<number | string | null>(null)
  const [activeFollowUpForm, setActiveFollowUpForm] = useState<string | null>(
    null,
  )
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const skipNextFocusRestore = useRef(false)

  const newTodoInputRef = useRef<HTMLInputElement>(null)
  const subTodoInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const followUpInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const {
    todos,
    user,
    addTodo,
    toggleTodo,
    deleteTodo,
    addSubTodo,
    toggleSubTodo,
    deleteSubTodo,
    addFollowUp,
    addSubTodoFollowUp,
    removeFollowUp,
    removeSubTodoFollowUp,
    logout,
  } = useTodoStore()

  const dateString = format(selectedDate, 'yyyy-MM-dd')
  const todosForDate = todos
    .filter((todo) => todo.date === dateString)
    .sort((a, b) => a.createdAt - b.createdAt)
  const dailyShareId = `daily-${dateString.replace(/-/g, '')}`

  const dayTooltips = useMemo(() => {
    const tooltips: Record<string, string> = {}
    const todosByDate = todos.reduce(
      (acc, todo) => {
        if (!acc[todo.date]) acc[todo.date] = []
        acc[todo.date].push(todo)
        return acc
      },
      {} as Record<string, typeof todos>,
    )

    Object.entries(todosByDate).forEach(([date, dateTodos]) => {
      const completed = dateTodos.filter((t) => t.completed).length
      const total = dateTodos.length
      tooltips[date] = `${completed}/${total}`
    })

    return tooltips
  }, [todos])

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim()) return
    addTodo(newTodoTitle.trim(), false, dateString)
    setNewTodoTitle('')
  }

  const handleAddSubTodo = (todoId: string) => {
    const title = newSubTodoTitle[todoId]?.trim()
    if (!title) return
    addSubTodo(todoId, title)
    setNewSubTodoTitle((prev) => ({ ...prev, [todoId]: '' }))
  }

  const canHaveFollowUp = (todo: (typeof todos)[0]) => {
    if (!todo.completed) return false
    if (todo.subTodos.length === 0) return true
    return todo.subTodos.every((sub) => sub.completed)
  }

  const canSubTodoHaveFollowUp = (
    subTodo: (typeof todos)[0]['subTodos'][0],
  ) => {
    return subTodo.completed
  }

  const toggleFollowUpForm = (id: string) => {
    setFollowUpForms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        setTimeout(() => {
          followUpInputRefs.current[id]?.focus()
        }, 100)
      }
      return next
    })
  }

  const handleAddFollowUp = (todoId: string, subTodoId?: string) => {
    const key = subTodoId ? `${todoId}-${subTodoId}` : todoId
    const followUpText = newFollowUpText[key]?.trim()
    if (!followUpText) return

    console.log('[v0] Adding follow-up', { todoId, subTodoId, followUpText })

    if (subTodoId) {
      addSubTodoFollowUp(todoId, subTodoId, followUpText)
    } else {
      addFollowUp(todoId, followUpText)
    }

    setNewFollowUpText((prev) => ({ ...prev, [key]: '' }))
    toggleFollowUpForm(key)

    const todoIndex = todosForDate.findIndex((t) => t.id === todoId)
    if (todoIndex !== -1) {
      if (subTodoId) {
        const todo = todosForDate[todoIndex]
        const subIndex = todo.subTodos.findIndex((st) => st.id === subTodoId)
        if (subIndex !== -1) {
          setFocusedIndex(`${todoIndex}-sub-${subIndex}`)
          setTimeout(() => {
            document
              .getElementById(`todo-${todoIndex}-sub-${subIndex}`)
              ?.focus()
          }, 50)
        }
      } else {
        setFocusedIndex(todoIndex)
        setTimeout(() => {
          console.log('[v0] Focusing todo after follow-up', { todoIndex })
          document.getElementById(`todo-${todoIndex}`)?.focus()
        }, 50)
      }
    }
  }

  const copyForClaude = (todo: (typeof todos)[0], todoIndex: number) => {
    const maxDigits = String(todosForDate.length).length
    const prefix = todo.completed ? '✅'.repeat(maxDigits) + ' ' : ''
    const subTodoPrefix = '     '.repeat(maxDigits)
    const todoText = todo.completed
      ? `~${todo.title}~${todo.followUp ? ` \n▶️ ${todo.followUp}` : ''}`
      : todo.title
    const hasSubTodos = todo.subTodos.length > 0
    const index = todo.completed
      ? ''
      : (hasSubTodos
          ? '⌛'.repeat(maxDigits)
          : getNumberEmoji(todoIndex, todosForDate.length)) + ' '
    let text = `${prefix}${index}${todoText}`

    if (todo.subTodos.length > 0) {
      const subMaxDigits = String(todo.subTodos.length).length
      const subText = todo.subTodos
        .map((sub, i) => {
          const subPrefix = sub.completed ? '✅'.repeat(subMaxDigits) + ' ' : ''
          const subTodoText = sub.completed
            ? `~${sub.title}~${sub.followUp ? ` \n▶️ ${sub.followUp}` : ''}`
            : sub.title
          const subIndex = sub.completed
            ? ''
            : getNumberEmoji(i, todo.subTodos.length) + ' '
          let subLine = `${subTodoPrefix}${subPrefix}${subIndex}${subTodoText}`

          if (sub.completed && sub.followUp) {
            subLine += `\n${subTodoPrefix}${'     '.repeat(subMaxDigits)}▶️ ${sub.followUp}`
          }

          return subLine
        })
        .join('\n')
      text += '\n' + subText
    }
    navigator.clipboard.writeText(text)
    setCopiedId(todo.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyAllForClaude = () => {
    const maxDigits = String(todosForDate.length).length
    const subIdentation = '➡️'.repeat(maxDigits)
    const followUpIdentation = '     '.repeat(maxDigits)
    const text = todosForDate
      .map((todo, todoIndex) => {
        const prefix = todo.completed ? '✅'.repeat(maxDigits) : ''
        const todoText = todo.completed ? ` ~${todo.title}~` : todo.title
        const hasSubTodos = todo.subTodos.length > 0
        const index = todo.completed
          ? ''
          : (hasSubTodos
              ? '⌛'.repeat(maxDigits)
              : getNumberEmoji(todoIndex, todosForDate.length)) + ' '
        let line = `${prefix}${index}${todoText}`

        if (todo.completed && todo.followUp) {
          line += `\n${followUpIdentation}▶️ ${todo.followUp}`
        }

        if (todo.subTodos.length > 0) {
          const subMaxDigits = String(todo.subTodos.length).length
          const subText = todo.subTodos
            .map((sub, i) => {
              const subPrefix = sub.completed ? '✅'.repeat(subMaxDigits) : ''
              const subTodoText = sub.completed ? ` ~${sub.title}~` : sub.title
              const subIndex = sub.completed
                ? ''
                : getNumberEmoji(i, todo.subTodos.length) + ' '
              let subLine = `${subIdentation}${subPrefix}${subIndex}${subTodoText}`

              if (sub.completed && sub.followUp) {
                subLine += `\n${followUpIdentation}${'     '.repeat(subMaxDigits)}▶️ ${sub.followUp}`
              }

              return subLine
            })
            .join('\n')
          line += '\n' + subText
        }
        return line
      })
      .join('\n')
    navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const toggleExpanded = (todoId: string) => {
    setExpandedTodos((prev) => {
      const next = new Set(prev)
      if (next.has(todoId)) {
        next.delete(todoId)
      } else {
        next.add(todoId)
      }
      return next
    })
  }

  const isToday =
    format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  const completedCount = todosForDate.filter((t) => t.completed).length

  const handleKeyDown = (
    e: React.KeyboardEvent,
    todoIndex: number | string,
  ) => {
    if (
      openMenuId &&
      (e.key === 'Enter' ||
        e.key === ' ' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp')
    ) {
      return
    }

    const isSubTodo =
      typeof todoIndex === 'string' && todoIndex.includes('-sub-')
    const [mainTodoIndex, subTodoIndexStr] = isSubTodo
      ? todoIndex.split('-sub-')
      : [todoIndex, null]
    const currentTodoIndex = Number(mainTodoIndex)
    const currentSubTodoIndex = subTodoIndexStr ? Number(subTodoIndexStr) : null

    if (!todosForDate[currentTodoIndex]) return

    const todo = todosForDate[currentTodoIndex]
    const subTodo =
      currentSubTodoIndex !== null ? todo.subTodos[currentSubTodoIndex] : null

    if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
      e.preventDefault()
      if (subTodo) {
        // Open sub-todo action menu
        setOpenMenuId(`sub-${todo.id}-${subTodo.id}`)
      } else {
        // Open main todo action menu
        setOpenMenuId(`todo-${todo.id}`)
      }
    } else if (
      e.key === 'ArrowDown' &&
      (e.ctrlKey || e.metaKey) &&
      todo?.subTodos.length > 0 &&
      currentSubTodoIndex === null
    ) {
      e.preventDefault()
      setExpandedTodos((prev) => {
        const next = new Set(prev)
        next.add(todo.id)
        return next
      })
    } else if (
      e.key === 'ArrowUp' &&
      (e.ctrlKey || e.metaKey) &&
      todo?.subTodos.length > 0
    ) {
      e.preventDefault()
      setExpandedTodos((prev) => {
        const next = new Set(prev)
        next.delete(todo.id)
        return next
      })
      // If currently on a sub-todo, focus the parent
      if (currentSubTodoIndex !== null) {
        setFocusedIndex(currentTodoIndex)
        setTimeout(() => {
          document.getElementById(`todo-${currentTodoIndex}`)?.focus()
        }, 0)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()

      // If on a sub-todo
      if (currentSubTodoIndex !== null && todo?.subTodos) {
        // Try to move to next sub-todo
        if (currentSubTodoIndex < todo.subTodos.length - 1) {
          const nextSubIndex = currentSubTodoIndex + 1
          setFocusedIndex(`${currentTodoIndex}-sub-${nextSubIndex}`)
          document
            .getElementById(`todo-${currentTodoIndex}-sub-${nextSubIndex}`)
            ?.focus()
        } else {
          // Move to next main todo
          if (currentTodoIndex === todosForDate.length - 1) {
            setFocusedIndex(0)
            document.getElementById(`todo-0`)?.focus()
          } else {
            const nextIndex = currentTodoIndex + 1
            setFocusedIndex(nextIndex)
            document.getElementById(`todo-${nextIndex}`)?.focus()
          }
        }
      } else {
        // If on main todo and it's expanded with sub-todos, go to first sub-todo
        const isExpanded = expandedTodos.has(todo.id)
        if (isExpanded && todo?.subTodos.length > 0) {
          setFocusedIndex(`${currentTodoIndex}-sub-0`)
          document.getElementById(`todo-${currentTodoIndex}-sub-0`)?.focus()
        } else {
          // Move to next main todo
          if (currentTodoIndex === todosForDate.length - 1) {
            setFocusedIndex(0)
            document.getElementById(`todo-0`)?.focus()
          } else {
            const nextIndex = currentTodoIndex + 1
            setFocusedIndex(nextIndex)
            document.getElementById(`todo-${nextIndex}`)?.focus()
          }
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()

      // If on a sub-todo
      if (currentSubTodoIndex !== null) {
        if (currentSubTodoIndex > 0) {
          // Move to previous sub-todo
          const prevSubIndex = currentSubTodoIndex - 1
          setFocusedIndex(`${currentTodoIndex}-sub-${prevSubIndex}`)
          document
            .getElementById(`todo-${currentTodoIndex}-sub-${prevSubIndex}`)
            ?.focus()
        } else {
          // Move to parent todo
          setFocusedIndex(currentTodoIndex)
          document.getElementById(`todo-${currentTodoIndex}`)?.focus()
        }
      } else {
        // If on main todo
        if (currentTodoIndex === 0) {
          const lastIndex = todosForDate.length - 1
          const lastTodo = todosForDate[lastIndex]
          const isLastExpanded = expandedTodos.has(lastTodo.id)

          if (isLastExpanded && lastTodo.subTodos.length > 0) {
            setFocusedIndex(`${lastIndex}-sub-${lastTodo.subTodos.length - 1}`)
            // Go to last sub-todo of last todo
            document
              .getElementById(
                `todo-${lastIndex}-sub-${lastTodo.subTodos.length - 1}`,
              )
              ?.focus()
          } else {
            // Go to last main todo
            setFocusedIndex(lastIndex)
            document.getElementById(`todo-${lastIndex}`)?.focus()
          }
        } else {
          // On main todo - check if previous todo has expanded sub-todos
          const prevTodo = todosForDate[currentTodoIndex - 1]
          const isPrevExpanded = expandedTodos.has(prevTodo.id)
          if (isPrevExpanded && prevTodo.subTodos.length > 0) {
            setFocusedIndex(
              `${currentTodoIndex - 1}-sub-${prevTodo.subTodos.length - 1}`,
            )
            // Go to last sub-todo of previous todo
            document
              .getElementById(
                `todo-${currentTodoIndex - 1}-sub-${prevTodo.subTodos.length - 1}`,
              )
              ?.focus()
          } else {
            // Go to previous main todo
            const prevIndex = currentTodoIndex - 1
            setFocusedIndex(prevIndex)
            document.getElementById(`todo-${prevIndex}`)?.focus()
          }
        }
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (subTodo) {
        // Toggle sub-todo
        toggleSubTodo(todo.id, subTodo.id)
      } else {
        // Toggle main todo
        toggleTodo(todo.id)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (focusedIndex !== null) {
        setFocusedIndex(null)
        document.activeElement instanceof HTMLElement &&
          document.activeElement.blur()
      }
    }
  }

  const handleMenuOpenChange = (
    open: boolean,
    menuId: string,
    elementId: string,
    focusIndex: number | string,
  ) => {
    setOpenMenuId(open ? menuId : null)

    if (!open && !skipNextFocusRestore.current) {
      setTimeout(() => {
        const element = document.getElementById(elementId)
        if (element) {
          element.focus()
          setFocusedIndex(focusIndex)
        }
      }, 50)
    }

    if (!open) {
      skipNextFocusRestore.current = false
    }
  }

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusedIndex !== null) {
        setFocusedIndex(null)
        document.activeElement instanceof HTMLElement &&
          document.activeElement.blur()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()

        if (focusedIndex === null) {
          newTodoInputRef.current?.focus()
        } else {
          const todo = todosForDate[focusedIndex as number] // Cast focusedIndex to number for array access
          if (todo) {
            setExpandedTodos((prev) => {
              const next = new Set(prev)
              next.add(todo.id)
              return next
            })
            setTimeout(() => {
              subTodoInputRefs.current[todo.id]?.focus()
            }, 50)
          }
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [focusedIndex, todosForDate])

  return (
    <TooltipProvider>
      <div className="bg-background min-h-screen p-4 sm:p-6">
        <div className="mx-auto max-w-lg">
          <header className="mb-4 flex items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger render={<div />}>
                  <Button
                    variant="ghost"
                    className="h-8 flex-1 justify-center gap-2 px-3"
                  >
                    <span className="text-sm font-medium">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </span>
                    <CalendarIcon className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    autoFocus
                    dayTooltips={dayTooltips}
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground h-8 shrink-0 px-2 text-xs"
                  >
                    {user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>

          <form onSubmit={handleAddTodo} className="mb-3 flex gap-2">
            <Input
              ref={newTodoInputRef}
              placeholder="Add a todo..."
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              className="h-9 flex-1 text-sm"
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          <div className="border-border bg-card rounded-lg border">
            {todosForDate.length > 0 && (
              <CardHeader className="border-b px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm font-medium">
                      {todosForDate.filter((t) => t.completed).length} /{' '}
                      {todosForDate.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyAllForClaude}
                          className="h-7 w-7 p-0"
                        >
                          {copiedAll ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{copiedAll ? 'Copied!' : 'Copy all'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <ShareDialog shareId={dailyShareId} date={dateString} />
                  </div>
                </div>
              </CardHeader>
            )}

            {todosForDate.length === 0 ? (
              <div className="text-muted-foreground px-3 py-8 text-center text-sm">
                No todos yet. Add one above.
              </div>
            ) : (
              <ul className="divide-border divide-y">
                {todosForDate.map((todo, todoIndex) => {
                  const isExpanded = expandedTodos.has(todo.id)
                  const subCompletedCount = todo.subTodos.filter(
                    (s) => s.completed,
                  ).length
                  const followUpFormKey = todo.id
                  const isFollowUpFormOpen = followUpForms.has(followUpFormKey)

                  return (
                    <li key={todo.id} className="flex flex-col">
                      <div
                        key={todo.id}
                        id={`todo-${todoIndex}`}
                        tabIndex={0}
                        onKeyDown={(e) => handleKeyDown(e, todoIndex)}
                        className={cn(
                          'group hover:bg-muted/30 focus:ring-primary/50 flex flex-col rounded-md transition-colors focus:ring-2 focus:outline-none',
                          focusedIndex === todoIndex &&
                            'ring-primary/50 ring-2',
                        )}
                        onClick={(e) => {
                          const target = e.target as HTMLElement
                          if (target.closest('button, input[type="checkbox"]'))
                            return
                          toggleTodo(todo.id)
                        }}
                      >
                        <div className="flex items-start gap-2 px-3 py-2">
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => toggleTodo(todo.id)}
                            className="h-4 w-4"
                            tabIndex={-1}
                          />
                          <span className="text-sm">
                            {getNumberEmoji(todoIndex, todosForDate.length)}
                          </span>
                          <span
                            className={cn(
                              'flex-1 truncate font-medium',
                              todo.completed &&
                                'text-muted-foreground line-through',
                            )}
                          >
                            {todo.title}
                          </span>
                          {todo.subTodos.length > 0 &&
                            todo.subTodos.some((sub) => sub.completed) && (
                              <Loader2 className="text-primary h-4 w-4 animate-spin" />
                            )}
                          {todo.subTodos.length > 0 && (
                            <button
                              onClick={() => toggleExpanded(todo.id)}
                              tabIndex={-1}
                              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                            >
                              <span>
                                {subCompletedCount}/{todo.subTodos.length}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          )}
                          <DropdownMenu
                            open={openMenuId === `todo-${todo.id}`}
                            onOpenChange={(open) =>
                              handleMenuOpenChange(
                                open,
                                `todo-${todo.id}`,
                                `todo-${todoIndex}`,
                                todoIndex,
                              )
                            }
                          >
                            <DropdownMenuTrigger>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  'h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100',
                                  focusedIndex === todoIndex && 'opacity-100',
                                )}
                                tabIndex={-1} // Added tabIndex={-1} to prevent button from stealing focus
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  skipNextFocusRestore.current = true
                                  toggleExpanded(todo.id)
                                  setTimeout(() => {
                                    subTodoInputRefs.current[todo.id]?.focus()
                                  }, 100)
                                }}
                              >
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                Add sub-todo
                              </DropdownMenuItem>
                              {canHaveFollowUp(todo) && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    skipNextFocusRestore.current = true
                                    toggleFollowUpForm(followUpFormKey)
                                  }}
                                >
                                  <Play className="mr-2 h-3.5 w-3.5" />
                                  {todo.followUp
                                    ? 'Edit follow-up'
                                    : 'Add follow-up'}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyForClaude(todo, todoIndex)
                                }}
                              >
                                {copiedId === todo.id ? (
                                  <>
                                    <Check className="mr-2 h-3.5 w-3.5" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="mr-2 h-3.5 w-3.5" />
                                    Copy
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteTodo(todo.id)
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {todo.followUp && (
                          <div className="px-3 pb-2 pl-9">
                            <span className="text-primary text-xs">
                              ▶️ {todo.followUp}
                            </span>
                          </div>
                        )}
                      </div>

                      {isFollowUpFormOpen && (
                        <div className="border-border border-t">
                          <div className="bg-muted/20 flex items-center gap-2 px-3 py-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground h-7 w-7 shrink-0"
                              onClick={() => {
                                toggleFollowUpForm(followUpFormKey)
                                const todoIndex = todosForDate.findIndex(
                                  (t) => t.id === todo.id,
                                )
                                if (todoIndex !== -1) {
                                  setFocusedIndex(todoIndex)
                                  setTimeout(() => {
                                    document
                                      .getElementById(`todo-${todoIndex}`)
                                      ?.focus()
                                  }, 50)
                                }
                              }}
                              title="Close follow-up form"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <Input
                              // ref={(el) =>
                              //   (followUpInputRefs.current[followUpFormKey] =
                              //     el)
                              // }
                              placeholder="Add follow-up..."
                              value={
                                newFollowUpText[followUpFormKey] ||
                                todo.followUp ||
                                ''
                              }
                              onChange={(e) =>
                                setNewFollowUpText((prev) => ({
                                  ...prev,
                                  [followUpFormKey]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleAddFollowUp(todo.id)
                                }
                              }}
                              className="h-7 flex-1 text-xs"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleAddFollowUp(todo.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {isExpanded && (
                        <div className="border-border border-t">
                          <div className="bg-muted/30 border-l-primary/30 border-l-4">
                            {todo.subTodos.map((subTodo, index) => {
                              const subFollowUpFormKey = `${todo.id}-${subTodo.id}`
                              const isSubFollowUpFormOpen =
                                followUpForms.has(subFollowUpFormKey)

                              return (
                                <div key={subTodo.id}>
                                  <div
                                    key={subTodo.id}
                                    id={`todo-${todoIndex}-sub-${index}`}
                                    tabIndex={0}
                                    onKeyDown={(e) =>
                                      handleKeyDown(
                                        e,
                                        `${todoIndex}-sub-${index}`,
                                      )
                                    }
                                    onClick={(e) => {
                                      const target = e.target as HTMLElement
                                      if (
                                        target.closest(
                                          'button, input[type="checkbox"]',
                                        )
                                      )
                                        return
                                      toggleSubTodo(todo.id, subTodo.id)
                                    }}
                                    className={cn(
                                      'group/sub hover:bg-muted/30 flex cursor-pointer flex-col transition-colors',
                                      'focus:ring-primary/50 focus:ring-2 focus:outline-none focus:ring-inset',
                                      focusedIndex ===
                                        `${todoIndex}-sub-${index}` &&
                                        'ring-primary/50 ring-2 ring-inset',
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        'flex items-center gap-2 pr-3 pl-3',
                                        subTodo.followUp
                                          ? 'py-1.5 pb-0'
                                          : 'py-1.5',
                                        subTodo.completed && 'opacity-50',
                                      )}
                                    >
                                      <Checkbox
                                        checked={subTodo.completed}
                                        onCheckedChange={() =>
                                          toggleSubTodo(todo.id, subTodo.id)
                                        }
                                        className="h-3.5 w-3.5"
                                        tabIndex={-1}
                                      />
                                      <span className="text-sm">
                                        {getNumberEmoji(
                                          index,
                                          todo.subTodos.length,
                                        )}
                                      </span>
                                      <span
                                        className={cn(
                                          'flex-1 truncate text-xs',
                                          subTodo.completed &&
                                            'text-muted-foreground line-through',
                                        )}
                                      >
                                        {subTodo.title}
                                      </span>
                                      <DropdownMenu
                                        open={
                                          openMenuId ===
                                          `sub-${todo.id}-${subTodo.id}`
                                        }
                                        onOpenChange={(open) =>
                                          handleMenuOpenChange(
                                            open,
                                            `sub-${todo.id}-${subTodo.id}`,
                                            `todo-${todoIndex}-sub-${index}`,
                                            `${todoIndex}-sub-${index}`, // Fixed focusIndex format to include "-sub-"
                                          )
                                        }
                                      >
                                        <DropdownMenuTrigger>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className={cn(
                                              'h-5 w-5 opacity-0 group-hover/sub:opacity-100',
                                              focusedIndex ===
                                                `${todoIndex}-${index}` &&
                                                'opacity-100',
                                            )}
                                            tabIndex={-1} // Added tabIndex={-1} to prevent button from stealing focus
                                          >
                                            <MoreVertical className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                          align="end"
                                          className="w-40"
                                        >
                                          {canSubTodoHaveFollowUp(subTodo) && (
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                skipNextFocusRestore.current = true
                                                toggleFollowUpForm(
                                                  subFollowUpFormKey,
                                                )
                                              }}
                                            >
                                              <Play className="mr-2 h-3.5 w-3.5" />
                                              {subTodo.followUp
                                                ? 'Edit follow-up'
                                                : 'Add follow-up'}
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              deleteSubTodo(todo.id, subTodo.id)
                                            }}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                    {subTodo.followUp && (
                                      <div className="pr-3 pb-1.5 pl-8.5">
                                        <span className="text-primary text-xs">
                                          ▶️ {subTodo.followUp}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {isSubFollowUpFormOpen && (
                                    <div className="bg-muted/40 ml-6 flex items-center gap-2 px-3 py-1.5">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-foreground h-7 w-7 shrink-0"
                                        onClick={() => {
                                          toggleFollowUpForm(subFollowUpFormKey)
                                          const todoIndex =
                                            todosForDate.findIndex(
                                              (t) => t.id === todo.id,
                                            )
                                          if (todoIndex !== -1) {
                                            setFocusedIndex(
                                              `${todoIndex}-sub-${index}`,
                                            )
                                            // Focus the parent todo element
                                            setTimeout(() => {
                                              document
                                                .getElementById(
                                                  `todo-${todoIndex}-sub-${index}`,
                                                )
                                                ?.focus()
                                            }, 0)
                                          }
                                        }}
                                        title="Close follow-up form"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                      <Input
                                        // ref={(el) =>
                                        //   (followUpInputRefs.current[
                                        //     subFollowUpFormKey
                                        //   ] = el)
                                        // }
                                        placeholder="Add follow-up..."
                                        value={
                                          newFollowUpText[subFollowUpFormKey] ||
                                          subTodo.followUp ||
                                          ''
                                        }
                                        onChange={(e) =>
                                          setNewFollowUpText((prev) => ({
                                            ...prev,
                                            [subFollowUpFormKey]:
                                              e.target.value,
                                          }))
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddFollowUp(
                                              todo.id,
                                              subTodo.id,
                                            )
                                          }
                                        }}
                                        className="h-6 flex-1 text-xs"
                                      />
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={() =>
                                          handleAddFollowUp(todo.id, subTodo.id)
                                        }
                                      >
                                        <Check className="h-2.5 w-2.5" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          <div className="bg-muted/20 flex items-center gap-2 px-1.5 py-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground h-7 w-7 shrink-0"
                              onClick={() => {
                                toggleExpanded(todo.id)
                                const todoIndex = todosForDate.findIndex(
                                  (t) => t.id === todo.id,
                                )
                                if (todoIndex !== -1) {
                                  setFocusedIndex(todoIndex)
                                  // Focus the parent todo element
                                  setTimeout(() => {
                                    document
                                      .getElementById(`todo-${todoIndex}`)
                                      ?.focus()
                                  }, 0)
                                }
                              }}
                              title="Close sub-todo form"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <Input
                              // ref={(el) =>
                              //   (subTodoInputRefs.current[todo.id] = el)
                              // }
                              placeholder="Add sub-todo..."
                              value={newSubTodoTitle[todo.id] || ''}
                              onChange={(e) =>
                                setNewSubTodoTitle((prev) => ({
                                  ...prev,
                                  [todo.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleAddSubTodo(todo.id)
                                }
                              }}
                              className="h-7 flex-1 text-xs"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleAddSubTodo(todo.id)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
