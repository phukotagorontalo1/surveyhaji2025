
"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, query, orderBy, Timestamp, doc, deleteDoc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Image from "next/image"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2, Shield, LogIn, Eye, EyeOff, LogOut, Search, FileDown, CheckCircle2, XCircle, Save, Settings } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

const DEFAULT_QUESTIONS = {
    kualitas: {
        q1: 'Persyaratan pelayanan yang mudah dipahami.',
        q2: 'Prosedur pelayanan yang tidak berbelit-belit.',
        q3: 'Waktu penyelesaian pelayanan yang cepat dan tepat.',
        q4: 'Kewajaran biaya/tarif dalam pelayanan.',
        q5: 'Kualitas hasil pelayanan yang diberikan.',
        q6: 'Kompetensi dan profesionalisme petugas pelayanan.',
        q7: 'Sikap petugas pelayanan yang ramah dan sopan.',
        q8: 'Kualitas sarana dan prasarana pendukung pelayanan.',
    },
    penyimpangan: {
        p1: 'Tidak adanya praktik pungutan liar (pungli) dalam pelayanan.',
        p2: 'Tidak adanya praktik di luar prosedur resmi yang merugikan.',
        p3: 'Tidak adanya praktik percaloan dalam pengurusan layanan.',
        p4: 'Tidak adanya gratifikasi atau pemberian imbalan kepada petugas.',
        p5: 'Ketersediaan dan kemudahan akses sistem pengaduan.',
    },
    perbaikan: {
        kebijakan: "Kebijakan pelayanan",
        sdm: "Profesionalisme SDM",
        sarpras: "Kualitas Sarana dan Prasarana",
        sistem: "Sistem informasi dan pelayanan publik",
        konsultasi: "Konsultasi dan pengaduan",
        pungli: "Penghilangan Praktik pungli",
        prosedur: "Penghilangan praktik diluar prosedur",
        calo: "Penghilangan praktik percaloan",
        tidak_ada: "Tidak ada yang perlu diperbaiki"
    }
};

interface SurveyData {
    id: string;
    kualitas: { [key: string]: number };
    penyimpangan: { [key: string]: number };
    createdAt: Timestamp;
    nama?: string;
    nomorHp: string;
    pekerjaan: string;
    usia: string;
    jenisKelamin: string;
    pendidikan: string;
    tidakDiarahkan: boolean;
    perbaikan: string[];
    saran?: string;
    tandaTangan: string;
}

const ADMIN_PASSWORD = "admin";

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [surveys, setSurveys] = useState<SurveyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    
    const [questionConfig, setQuestionConfig] = useState<any>(null);
    const [configLoading, setConfigLoading] = useState(true);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!isAuthenticated) return;

        const initializeAndFetchData = async () => {
            setLoading(true);
            setConfigLoading(true);
            try {
                // Initialize/Fetch Config
                const configRef = doc(db, "config", "questions");
                const configSnap = await getDoc(configRef);
                if (!configSnap.exists()) {
                    await setDoc(configRef, DEFAULT_QUESTIONS);
                    setQuestionConfig(DEFAULT_QUESTIONS);
                } else {
                    setQuestionConfig(configSnap.data());
                }

                // Fetch Survey Data
                const q = query(collection(db, "surveys"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const surveyData: SurveyData[] = [];
                querySnapshot.forEach((doc) => {
                    surveyData.push({ id: doc.id, ...doc.data() } as SurveyData);
                });
                setSurveys(surveyData);
            } catch (err) {
                console.error("Error fetching data: ", err);
                toast({
                    variant: "destructive",
                    title: "Gagal memuat data",
                    description: "Terjadi kesalahan saat mengambil data.",
                });
            } finally {
                setLoading(false);
                setConfigLoading(false);
            }
        };

        initializeAndFetchData();
    }, [isAuthenticated, toast]);

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
        router.push('/');
    };
    
    const handleDelete = async (surveyId: string) => {
        try {
            await deleteDoc(doc(db, "surveys", surveyId));
            setSurveys(surveys.filter(s => s.id !== surveyId));
            toast({
                title: "Data berhasil dihapus",
                description: `Data survei dengan ID ${surveyId} telah dihapus.`,
            });
        } catch (err) {
            console.error("Error deleting document: ", err);
            toast({
                variant: "destructive",
                title: "Gagal menghapus data",
                description: "Terjadi kesalahan. Mohon coba lagi.",
            });
        }
    };

    const handleConfigChange = (section: string, key: string, value: string) => {
        setQuestionConfig((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };
    
    const handleSaveConfig = async () => {
        setIsSavingConfig(true);
        try {
            const configRef = doc(db, "config", "questions");
            await setDoc(configRef, questionConfig);
            toast({
                title: "Konfigurasi disimpan",
                description: "Perubahan pertanyaan survei telah berhasil disimpan.",
            });
        } catch(err) {
            console.error("Error saving config:", err);
            toast({ variant: "destructive", title: "Gagal menyimpan", description: "Terjadi kesalahan saat menyimpan konfigurasi." });
        } finally {
            setIsSavingConfig(false);
        }
    };

    const calculateScores = (survey: SurveyData) => {
        if (!questionConfig) return { ikm: 0, ipak: 0 };
        const kualitasSum = Object.values(survey.kualitas).reduce((a, b) => a + b, 0);
        const ikm = (kualitasSum / (Object.keys(questionConfig.kualitas).length * 6)) * 100;

        const penyimpanganSum = Object.values(survey.penyimpangan).reduce((a, b) => a + b, 0);
        const ipak = (penyimpanganSum / (Object.keys(questionConfig.penyimpangan).length * 6)) * 100;
        
        return { ikm, ipak };
    };

    const displayedSurveys = useMemo(() => {
        if (!questionConfig) return [];
        let filtered = surveys.filter(survey =>
            (survey.nama || "Anonim").toLowerCase().includes(searchTerm.toLowerCase()) ||
            survey.nomorHp.includes(searchTerm)
        );

        filtered.sort((a, b) => {
            let valA, valB;
            if (sortConfig.key === 'ikm' || sortConfig.key === 'ipak') {
                valA = calculateScores(a)[sortConfig.key as 'ikm' | 'ipak'];
                valB = calculateScores(b)[sortConfig.key as 'ikm' | 'ipak'];
            } else if (sortConfig.key === 'nama') {
                valA = a.nama?.toLowerCase() || 'zzz';
                valB = b.nama?.toLowerCase() || 'zzz';
            } else { // createdAt
                valA = a.createdAt.toMillis();
                valB = b.createdAt.toMillis();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [surveys, searchTerm, sortConfig, questionConfig]);
    
    const handleDownload = () => {
        if (displayedSurveys.length === 0 || !questionConfig) {
            toast({ title: "Tidak ada data untuk diunduh." });
            return;
        }

        const flattenedData = displayedSurveys.map(s => {
            const { ikm, ipak } = calculateScores(s);
            const flat: {[key: string]: any} = {
                id: s.id,
                'Tanggal Input': s.createdAt.toDate().toISOString(),
                'Nama': s.nama || 'Anonim',
                'No. HP': s.nomorHp,
                'Pekerjaan': s.pekerjaan,
                'Usia': s.usia,
                'Jenis Kelamin': s.jenisKelamin,
                'Pendidikan': s.pendidikan,
                ...Object.fromEntries(Object.entries(s.kualitas).map(([k,v]) => [`Kualitas - ${questionConfig.kualitas[k]}`,v])),
                'IKM': ikm.toFixed(2),
                ...Object.fromEntries(Object.entries(s.penyimpangan).map(([k,v]) => [`Penyimpangan - ${questionConfig.penyimpangan[k]}`,v])),
                'IPAK': ipak.toFixed(2),
                'Pernyataan Mandiri': s.tidakDiarahkan ? 'Ya' : 'Tidak',
                'Area Perbaikan': s.perbaikan.map(p => questionConfig.perbaikan[p] || p).join('; '),
                'Saran': s.saran || '',
            };
            return flat;
        });

        const headers = Object.keys(flattenedData[0]);
        const csvRows = [headers.join(',')];

        for (const row of flattenedData) {
            const values = headers.map(header => {
                const value = row[header];
                const stringValue = value === null || value === undefined ? '' : String(value);
                const escaped = stringValue.replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'Laporan-Survey-Kepuasan-Haji-Admin.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
    
    if (loading || configLoading) {
        return <div className="flex h-screen justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-4">Memuat data admin...</p></div>;
    }

    return (
        <main className="container mx-auto p-4 sm:p-6 md:p-8 space-y-8">
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">
                        Dashboard Admin
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manajemen entri data survei kepuasan pelayanan haji. Kata sandi: <strong>admin</strong>
                    </p>
                </div>
                 <Button onClick={handleLogout} variant="outline">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Entri Survei</CardTitle>
                             <CardDescription>Ditemukan {displayedSurveys.length} dari {surveys.length} total entri.</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Cari nama atau HP..."
                                    className="pl-8 sm:w-auto md:w-[250px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select 
                                value={`${sortConfig.key}-${sortConfig.direction}`} 
                                onValueChange={(value) => {
                                    const [key, direction] = value.split('-');
                                    setSortConfig({ key, direction });
                                }}
                            >
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Urutkan berdasarkan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="createdAt-desc">Terbaru</SelectItem>
                                    <SelectItem value="createdAt-asc">Terlama</SelectItem>
                                    <SelectItem value="ikm-desc">IKM Tertinggi</SelectItem>
                                    <SelectItem value="ikm-asc">IKM Terendah</SelectItem>
                                    <SelectItem value="ipak-desc">IPAK Tertinggi</SelectItem>
                                    <SelectItem value="ipak-asc">IPAK Terendah</SelectItem>
                                    <SelectItem value="nama-asc">Nama (A-Z)</SelectItem>
                                    <SelectItem value="nama-desc">Nama (Z-A)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleDownload} className="w-full sm:w-auto">
                                <FileDown className="mr-2 h-4 w-4" />
                                Unduh CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {surveys.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Belum ada data survei yang masuk.</p>
                    ) : displayedSurveys.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Tidak ada data yang cocok dengan pencarian Anda.</p>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Responden</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>IKM</TableHead>
                                        <TableHead>IPAK</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedSurveys.map(survey => {
                                        const { ikm, ipak } = calculateScores(survey);
                                        return (
                                        <TableRow key={survey.id}>
                                            <TableCell>
                                                <div className="font-medium">{survey.nama || 'Anonim'}</div>
                                                <div className="text-sm text-muted-foreground">{survey.nomorHp}</div>
                                            </TableCell>
                                            <TableCell>{survey.createdAt.toDate().toLocaleString('id-ID')}</TableCell>
                                            <TableCell>{ikm.toFixed(2)}</TableCell>
                                            <TableCell>{ipak.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="icon" className="h-8 w-8">
                                                                <Eye className="h-4 w-4" />
                                                                <span className="sr-only">Lihat Detail</span>
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>Detail Survei - {survey.nama || 'Anonim'}</DialogTitle>
                                                                <DialogDescription>
                                                                    Dikirim pada {survey.createdAt.toDate().toLocaleString('id-ID')}
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                                                                <div className="md:col-span-2 space-y-6">
                                                                    <div>
                                                                        <h4 className="font-bold text-lg mb-2">I. Detail Responden</h4>
                                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                                            <p><strong>Nama:</strong> {survey.nama || "Tidak diisi"}</p>
                                                                            <p><strong>No. HP:</strong> {survey.nomorHp}</p>
                                                                            <p><strong>Pekerjaan:</strong> {survey.pekerjaan}</p>
                                                                            <p><strong>Usia:</strong> {survey.usia}</p>
                                                                            <p><strong>Jenis Kelamin:</strong> {survey.jenisKelamin}</p>
                                                                            <p><strong>Pendidikan:</strong> {survey.pendidikan}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                        <div>
                                                                            <h4 className="font-bold text-lg mb-2">II. Jawaban Kualitas Pelayanan</h4>
                                                                            <ul className="space-y-1 text-sm">
                                                                                {Object.entries(survey.kualitas).map(([key, value]) => (
                                                                                    <li key={key} className="flex justify-between"><span>{questionConfig.kualitas[key]}:</span> <strong>{value}/6</strong></li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-bold text-lg mb-2">III. Jawaban Penyimpangan</h4>
                                                                            <ul className="space-y-1 text-sm">
                                                                                {Object.entries(survey.penyimpangan).map(([key, value]) => (
                                                                                    <li key={key} className="flex justify-between"><span>{questionConfig.penyimpangan[key]}:</span> <strong>{value}/6</strong></li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-lg mb-2">IV. Evaluasi & Verifikasi</h4>
                                                                        <div className="space-y-2 text-sm">
                                                                            <p><strong>Area Perbaikan:</strong> {survey.perbaikan.map(p => questionConfig.perbaikan[p] || p).join(', ')}</p>
                                                                            <div>
                                                                                <p><strong>Saran:</strong></p>
                                                                                <blockquote className="border-l-2 pl-4 italic text-muted-foreground">{survey.saran || "Tidak ada saran."}</blockquote>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <p><strong>Pernyataan mandiri:</strong></p>
                                                                                {survey.tidakDiarahkan ? (
                                                                                    <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                                                                                        <CheckCircle2 className="h-4 w-4" /> Disetujui
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="inline-flex items-center gap-1 text-destructive font-medium">
                                                                                        <XCircle className="h-4 w-4" /> Tidak disetujui
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <h4 className="font-bold text-lg mb-2">Tanda Tangan</h4>
                                                                        {survey.tandaTangan ? (
                                                                            <Image src={survey.tandaTangan} alt="Tanda Tangan Responden" width={200} height={100} className="rounded-md border bg-white" />
                                                                        ) : <p className="text-sm text-muted-foreground">Tidak ada tanda tangan.</p>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="icon" className="h-8 w-8">
                                                                <Trash2 className="h-4 w-4" />
                                                                <span className="sr-only">Hapus Entri</span>
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Tindakan ini tidak dapat diurungkan. Ini akan menghapus data survei secara permanen dari server.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(survey.id)}>Ya, Hapus</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <div>
                            <CardTitle>Manajemen Pertanyaan</CardTitle>
                            <CardDescription>Ubah redaksi pertanyaan yang tampil di formulir survei.</CardDescription>
                         </div>
                         <Button onClick={handleSaveConfig} disabled={isSavingConfig}>
                             {isSavingConfig ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="mr-2 h-4 w-4"/> Simpan Perubahan</>}
                         </Button>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                    {configLoading ? <Skeleton className="h-64 w-full md:col-span-2"/> : (
                        <>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-primary">II. Kualitas Pelayanan</h3>
                            {Object.keys(questionConfig.kualitas).map(key => (
                                <div key={key}>
                                    <Label htmlFor={`kualitas-${key}`} className="text-sm font-medium text-muted-foreground uppercase">{key}</Label>
                                    <Textarea id={`kualitas-${key}`} value={questionConfig.kualitas[key]} onChange={(e) => handleConfigChange('kualitas', key, e.target.value)} className="mt-1"/>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-primary">III. Penyimpangan Pelayanan</h3>
                            {Object.keys(questionConfig.penyimpangan).map(key => (
                                <div key={key}>
                                    <Label htmlFor={`penyimpangan-${key}`} className="text-sm font-medium text-muted-foreground uppercase">{key}</Label>
                                    <Textarea id={`penyimpangan-${key}`} value={questionConfig.penyimpangan[key]} onChange={(e) => handleConfigChange('penyimpangan', key, e.target.value)} className="mt-1"/>
                                </div>
                            ))}
                            <h3 className="font-semibold text-lg text-primary mt-8">IV. Opsi Perbaikan</h3>
                            {Object.keys(questionConfig.perbaikan).map(key => (
                                <div key={key}>
                                    <Label htmlFor={`perbaikan-${key}`} className="text-sm font-medium text-muted-foreground uppercase">{key}</Label>
                                    <Input id={`perbaikan-${key}`} value={questionConfig.perbaikan[key]} onChange={(e) => handleConfigChange('perbaikan', key, e.target.value)} className="mt-1"/>
                                </div>
                            ))}
                        </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
