'use client'

import { useState } from 'react'

import { Check, Copy, Plus, Share2, X } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'

interface SharedUser {
  email: string
  canAdd: boolean
  canEdit: boolean
  canDelete: boolean
}

interface ShareDialogProps {
  shareId: string
  date: string
}

export function ShareDialog({ shareId, date }: ShareDialogProps) {
  const [isPublic, setIsPublic] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [sharedUsers, setSharedUsers] = useState<Array<SharedUser>>([])

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/list/${shareId}`

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const addUser = () => {
    if (!newEmail.trim() || !newEmail.includes('@')) return
    if (sharedUsers.some((u) => u.email === newEmail.trim())) return

    setSharedUsers([
      ...sharedUsers,
      {
        email: newEmail.trim(),
        canAdd: false,
        canEdit: false,
        canDelete: false,
      },
    ])
    setNewEmail('')
  }

  const removeUser = (email: string) => {
    setSharedUsers(sharedUsers.filter((u) => u.email !== email))
  }

  const updatePermission = (
    email: string,
    permission: 'canAdd' | 'canEdit' | 'canDelete',
    value: boolean,
  ) => {
    setSharedUsers(
      sharedUsers.map((u) =>
        u.email === email ? { ...u, [permission]: value } : u,
      ),
    )
  }

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <DialogTrigger>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Share2 className="h-3 w-3" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Todo List</DialogTitle>
          <DialogDescription>
            Share this day&apos;s todos with others via a link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Share Link</Label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1 text-xs" />
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 shrink-0 bg-transparent"
                onClick={copyLink}
              >
                {copiedLink ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Public/Private Toggle */}
          <div className="border-border flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle" className="text-sm font-medium">
                Public Access
              </Label>
              <p className="text-muted-foreground text-xs">
                Anyone with the link can view
              </p>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Private Sharing */}
          {!isPublic && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Share with specific users
              </Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addUser()
                    }
                  }}
                  className="flex-1 text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0 bg-transparent"
                  onClick={addUser}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Shared Users List */}
              {sharedUsers.length > 0 && (
                <div className="space-y-2">
                  {sharedUsers.map((user) => (
                    <div
                      key={user.email}
                      className="border-border space-y-2 rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex-1 truncate text-sm font-medium">
                          {user.email}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-6 w-6"
                          onClick={() => removeUser(user.email)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={user.canAdd}
                            onChange={(e) =>
                              updatePermission(
                                user.email,
                                'canAdd',
                                e.target.checked,
                              )
                            }
                            className="border-input h-3.5 w-3.5 rounded"
                          />
                          <span className="text-muted-foreground">Can add</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={user.canEdit}
                            onChange={(e) =>
                              updatePermission(
                                user.email,
                                'canEdit',
                                e.target.checked,
                              )
                            }
                            className="border-input h-3.5 w-3.5 rounded"
                          />
                          <span className="text-muted-foreground">
                            Can edit
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={user.canDelete}
                            onChange={(e) =>
                              updatePermission(
                                user.email,
                                'canDelete',
                                e.target.checked,
                              )
                            }
                            className="border-input h-3.5 w-3.5 rounded"
                          />
                          <span className="text-muted-foreground">
                            Can delete
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
