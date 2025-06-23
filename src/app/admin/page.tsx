
"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from "@/components/ui/sidebar"
import { Shield, LogIn, Eye, EyeOff, LogOut, FileText, Settings, Home, Loader2 } from "lucide-react"

import SurveyEntries from "@/components/admin/SurveyEntries"
import QuestionManagement from "@/components/admin/QuestionManagement"

const ADMIN_PASSWORD = "admin";

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "entries";

  return (
    <div className="flex min-h-screen">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="font-headline text-xl font-semibold">Admin Panel</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={view === "entries"}>
                <Link href="/admin?view=entries">
                  <FileText />
                  <span>Entri Survei</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={view === "questions"}>
                <Link href="/admin?view=questions">
                  <Settings />
                  <span>Manajemen Pertanyaan</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t">
          <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <Home />
                    <span>Halaman Depan</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onLogout}>
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
          <p className="px-4 text-xs text-muted-foreground">Password: <strong>admin</strong></p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 sm:p-6 md:p-8">
            {view === "entries" && <SurveyEntries />}
            {view === "questions" && <QuestionManagement />}
        </div>
      </SidebarInset>
    </div>
  );
}


function AdminDashboardSuspenseWrapper({ onLogout }: { onLogout: () => void }) {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AdminDashboard onLogout={onLogout} />
    </Suspense>
  )
}


export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setError("");
        } else {
            setError("Password salah. Silakan coba lagi.");
        }
    };
    
    const handleLogout = () => {
        setIsAuthenticated(false);
        setPassword("");
    };

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline flex items-center gap-2">
                            <Shield className="text-primary"/> Akses Terbatas
                        </CardTitle>
                        <CardDescription>
                            Halaman ini hanya untuk admin. Silakan masukkan password untuk melanjutkan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pr-10"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground">
                                        {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                    </button>
                                </div>
                                {error && <p className="text-sm text-destructive">{error}</p>}
                            </div>
                            <Button type="submit" className="w-full">
                                <LogIn className="mr-2 h-4 w-4" /> Masuk
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <SidebarProvider>
            <AdminDashboardSuspenseWrapper onLogout={handleLogout} />
        </SidebarProvider>
    );
}
