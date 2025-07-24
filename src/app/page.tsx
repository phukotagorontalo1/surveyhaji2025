
"use client";

import { useState } from 'react';
import { SurveyForm } from '@/components/survey-form';
import { DashboardDisplay } from '@/components/dashboard-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, LogIn, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const DASHBOARD_PASSWORD = "Tolopani123";

export default function Home() {
  const [activeTab, setActiveTab] = useState("survey");
  const [isDashboardAuthenticated, setIsDashboardAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DASHBOARD_PASSWORD) {
      setIsDashboardAuthenticated(true);
      setError("");
    } else {
      setError("Password salah. Silakan coba lagi.");
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="text-center mb-8">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">
            Survey Pelayanan Haji
          </h1>
          <p className="font-headline text-lg sm:text-xl text-foreground/80 mt-2">
            Tahun 2025 M / 1446 H
          </p>
          <p className="text-muted-foreground mt-1">
            Kantor Kementerian Agama Kota Gorontalo
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="survey">Isi Survey</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard Hasil</TabsTrigger>
          </TabsList>
          <TabsContent value="survey" className="mt-6">
            <div className="mx-auto max-w-2xl">
              <SurveyForm />
            </div>
          </TabsContent>
          <TabsContent value="dashboard" className="mt-6">
            {!isDashboardAuthenticated ? (
              <div className="flex items-center justify-center">
                <Card className="w-full max-w-sm">
                  <CardHeader>
                      <CardTitle className="text-2xl font-headline flex items-center gap-2">
                          <Shield className="text-primary"/> Akses Dasbor
                      </CardTitle>
                      <CardDescription>
                          Untuk melihat hasil rekapitulasi survei, silakan masukkan password.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <form onSubmit={handleLogin} className="space-y-4">
                          <div className="space-y-2">
                              <Label htmlFor="dashboard-password">Password</Label>
                              <div className="relative">
                                  <Input
                                      id="dashboard-password"
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
                          <div className="flex flex-col sm:flex-row gap-2">
                             <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setActiveTab("survey")}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                              </Button>
                              <Button type="submit" className="w-full">
                                  <LogIn className="mr-2 h-4 w-4" /> Lanjutkan
                              </Button>
                          </div>
                      </form>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <DashboardDisplay />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
