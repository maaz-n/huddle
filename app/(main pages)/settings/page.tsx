"use client"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/user-avatar"
import { X } from "lucide-react"

const mockUser = {
  name: "John Doe",
  email: "john@example.com",
  image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
}

const mockMembers = [
  { id: "1", name: "John Doe", email: "john@example.com", role: "admin", image: mockUser.image },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "member",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "member",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
]

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="py-8 px-6 space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage workspace and profile settings</p>
        </div>

        {/* User Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-6">
              <UserAvatar user={mockUser} className="h-16 w-16" />
              <div className="flex-1 space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={mockUser.name} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={mockUser.email} disabled />
                </div>
                <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workspace Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Workspace Members</CardTitle>
              <Button variant="outline" size="sm">
                Add Member
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <UserAvatar user={{ name: member.name, image: member.image }} className="h-8 w-8" />
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select defaultValue={member.role} className="text-sm border border-border rounded px-2 py-1">
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    {member.id !== "1" && (
                      <button className="p-1 hover:bg-secondary rounded transition-colors">
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workspace Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Workspace Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input id="workspace-name" defaultValue="Engineering" />
            </div>
            <div className="flex gap-2">
              <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
              <Button variant="outline">Reset</Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Irreversible actions. Proceed with caution.</p>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
            >
              Delete Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
