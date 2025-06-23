
"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, query, orderBy, Timestamp, doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Image from "next/image"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2, Shield, LogIn, Eye, EyeOff, LogOut, Search, FileDown, CheckCircle2, XCircle } from "lucide-react"


const KUALITAS_QUESTIONS_LABELS: { [key: string]: string } = {
    q1: 'Persyaratan',
    q2: 'Prosedur',
    q3: 'Waktu',
    q4: 'Biaya/Tarif',
    q5: 'Hasil Pelayanan',
    q6: 'Kompetensi',
    q7: 'Sikap Petugas',
    q8: 'Sarana & Prasarana',
};

const PENYIMPANGAN_QUESTIONS_LABELS: { [key: string]: string } = {
    p1: 'Pungli',
    p2: 'Di luar prosedur',
    p3: 'Percaloan',
    p4: 'Gratifikasi',
    p5: 'Sistem pengaduan',
};

const PERBAIKAN_LABELS: { [key: string]: string } = {
    kebijakan: "Kebijakan pelayanan",
    sdm: "Profesionalisme SDM",
    sarpras: "Kualitas Sarana dan Prasarana",
    sistem: "Sistem informasi dan pelayanan publik",
    konsultasi: "Konsultasi dan pengaduan",
    pungli: "Penghilangan Praktik pungli",
    prosedur: "Penghilangan praktik diluar prosedur",
    calo: "Penghilangan praktik percaloan",
    tidak_ada: "Tidak ada yang perlu diperbaiki"
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
    
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "surveys"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const surveyData: SurveyData[] = [];
                querySnapshot.forEach((doc) => {
                    surveyData.push({ id: doc.id, ...doc.data() } as SurveyData);
                });
                setSurveys(surveyData);
            } catch (err) {
                console.error("Error fetching survey data: ", err);
                toast({
                    variant: "destructive",
                    title: "Gagal memuat data",
                    description: "Terjadi kesalahan saat mengambil data survei.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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

    const calculateScores = (survey: SurveyData) => {
        const kualitasSum = Object.values(survey.kualitas).reduce((a, b) => a + b, 0);
        const ikm = (kualitasSum / (Object.keys(KUALITAS_QUESTIONS_LABELS).length * 6)) * 100;

        const penyimpanganSum = Object.values(survey.penyimpangan).reduce((a, b) => a + b, 0);
        const ipak = (penyimpanganSum / (Object.keys(PENYIMPANGAN_QUESTIONS_LABELS).length * 6)) * 100;
        
        return { ikm, ipak };
    };

    const displayedSurveys = useMemo(() => {
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
    }, [surveys, searchTerm, sortConfig]);
    
    const handleDownload = () => {
        if (displayedSurveys.length === 0) {
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
                ...Object.fromEntries(Object.entries(s.kualitas).map(([k,v]) => [`Kualitas - ${KUALITAS_QUESTIONS_LABELS[k]}`,v])),
                'IKM': ikm.toFixed(2),
                ...Object.fromEntries(Object.entries(s.penyimpangan).map(([k,v]) => [`Penyimpangan - ${PENYIMPANGAN_QUESTIONS_LABELS[k]}`,v])),
                'IPAK': ipak.toFixed(2),
                'Pernyataan Mandiri': s.tidakDiarahkan ? 'Ya' : 'Tidak',
                'Area Perbaikan': s.perbaikan.map(p => PERBAIKAN_LABELS[p] || p).join('; '),
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
    
    if (loading) {
        return <div className="flex h-screen justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-4">Memuat data admin...</p></div>;
    }

    return (
        <main className="container mx-auto p-4 sm:p-6 md:p-8">
            <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
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
                             <CardDescription>Ditemukan {displayedSurveys.length} dari {surveys.length} total entri. Klik untuk melihat detail.</CardDescription>
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
                        <Accordion type="single" collapsible className="w-full">
                            {displayedSurveys.map(survey => {
                                const { ikm, ipak } = calculateScores(survey);
                                return (
                                <AccordionItem value={survey.id} key={survey.id}>
                                    <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                                        <div className="flex-1 text-left flex flex-col md:flex-row md:items-center md:justify-between">
                                            <div className="font-medium">{survey.nama || "Anonim"} - <span className="font-normal text-muted-foreground">{survey.createdAt.toDate().toLocaleString('id-ID')}</span></div>
                                            <div className="flex gap-4 text-sm mt-1 md:mt-0">
                                                <span>IKM: <span className="font-bold">{ikm.toFixed(2)}</span></span>
                                                <span>IPAK: <span className="font-bold">{ipak.toFixed(2)}</span></span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border-t bg-muted/20">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                                                <li key={key} className="flex justify-between"><span>{KUALITAS_QUESTIONS_LABELS[key]}:</span> <strong>{value}/6</strong></li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg mb-2">III. Jawaban Penyimpangan</h4>
                                                        <ul className="space-y-1 text-sm">
                                                            {Object.entries(survey.penyimpangan).map(([key, value]) => (
                                                                <li key={key} className="flex justify-between"><span>{PENYIMPANGAN_QUESTIONS_LABELS[key]}:</span> <strong>{value}/6</strong></li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg mb-2">IV. Evaluasi & Verifikasi</h4>
                                                    <div className="space-y-2 text-sm">
                                                        <p><strong>Area Perbaikan:</strong> {survey.perbaikan.map(p => PERBAIKAN_LABELS[p] || p).join(', ')}</p>
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
                                                <div className="pt-4">
                                                     <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">
                                                                <Trash2 className="mr-2 h-4 w-4"/>
                                                                Hapus Entri
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
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                )
                            })}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
