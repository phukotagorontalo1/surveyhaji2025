
"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query, orderBy, Timestamp, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, FileDown, AreaChart, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface SurveyData {
    id: string;
    informasiHaji: { [key: string]: number };
    rekomendasiPaspor: { [key: string]: number };
    createdAt: Timestamp;
    [key: string]: any;
}

interface CalculatedScores {
    iih: number;
    ikp: number;
}

export function DashboardDisplay() {
    const [surveys, setSurveys] = useState<SurveyData[]>([]);
    const [scores, setScores] = useState<CalculatedScores>({ iih: 0, ikp: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [questionConfig, setQuestionConfig] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch config first
                const configDoc = await getDoc(doc(db, "config", "questions"));
                if (configDoc.exists()) {
                    const configData = configDoc.data();
                    setQuestionConfig(configData);

                    // Then fetch surveys
                    const q = query(collection(db, "surveys"), orderBy("createdAt", "desc"));
                    const querySnapshot = await getDocs(q);
                    const surveyData: SurveyData[] = [];
                    querySnapshot.forEach((doc) => {
                        surveyData.push({ id: doc.id, ...doc.data() } as SurveyData);
                    });

                    if (surveyData.length > 0) {
                        calculateMetrics(surveyData, configData);
                    }
                    
                    setSurveys(surveyData);
                } else {
                     toast({
                        variant: "destructive",
                        title: "Konfigurasi tidak ditemukan",
                        description: "Konfigurasi pertanyaan survei tidak ditemukan.",
                    });
                }

            } catch (error: any) {
                console.error("Error fetching data: ", error);
                 if (error.code === 'permission-denied') {
                    toast({
                        variant: "destructive",
                        title: "Izin Ditolak Firestore",
                        description: "Gagal memuat data dasbor. Periksa aturan keamanan Firestore Anda.",
                    });
                } else {
                    toast({
                        variant: "destructive",
                        title: "Gagal memuat data",
                        description: "Terjadi kesalahan saat mengambil data dasbor.",
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    const calculateMetrics = (data: SurveyData[], config: any) => {
        let totalIihScore = 0;
        let totalIkpScore = 0;
        const informasiQuestionKeys = Object.keys(config.informasiHaji || {});
        const pasporQuestionKeys = Object.keys(config.rekomendasiPaspor || {});

        const informasiTotals: { [key: string]: number } = informasiQuestionKeys.reduce((acc, key) => ({...acc, [key]: 0}), {});

        data.forEach(survey => {
            if (survey.informasiHaji) {
                const informasiSum = Object.values(survey.informasiHaji).reduce((a, b) => a + b, 0);
                totalIihScore += (informasiSum / (informasiQuestionKeys.length * 5)) * 100;
            }
            if (survey.rekomendasiPaspor) {
                const pasporSum = Object.values(survey.rekomendasiPaspor).reduce((a, b) => a + b, 0);
                totalIkpScore += (pasporSum / (pasporQuestionKeys.length * 5)) * 100;
            }
            
            Object.keys(informasiTotals).forEach(key => {
                informasiTotals[key] += survey.informasiHaji?.[key] || 0;
            });
        });
        
        const numSurveys = data.length;
        setScores({
            iih: numSurveys > 0 ? totalIihScore / numSurveys : 0,
            ikp: numSurveys > 0 ? totalIkpScore / numSurveys : 0,
        });

        const newChartData = Object.keys(informasiTotals).map(key => ({
            name: `Q${key.substring(1)}`, // Shorten name for chart, e.g., "Q1", "Q2"
            fullName: config.informasiHaji[key],
            "Rata-rata Skor": numSurveys > 0 ? informasiTotals[key] / numSurveys : 0,
        }));
        setChartData(newChartData);
    };

    const handleDownload = () => {
        if (surveys.length === 0) {
            toast({ title: "Tidak ada data untuk diunduh." });
            return;
        }

        const flattenedData = surveys.map(s => {
            const flat: {[key: string]: any} = {
                id: s.id,
                nama: s.nama || '',
                nomorHp: s.nomorHp,
                pekerjaan: s.pekerjaan,
                usia: s.usia,
                jenisKelamin: s.jenisKelamin,
                pendidikan: s.pendidikan,
                ...Object.fromEntries(Object.entries(s.informasiHaji || {}).map(([k,v]) => [`informasiHaji_${k}`,v])),
                ...Object.fromEntries(Object.entries(s.rekomendasiPaspor || {}).map(([k,v]) => [`rekomendasiPaspor_${k}`,v])),
                saranInformasiHaji: s.saranInformasiHaji || '',
                saranRekomendasiPaspor: s.saranRekomendasiPaspor || '',
                tidakDiarahkan: s.tidakDiarahkan,
                perbaikan: s.perbaikan.join('; '),
                createdAt: s.createdAt.toDate().toISOString(),
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
        link.setAttribute('download', 'hasil-survey-kepuasan-haji.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="p-2 bg-background border rounded-md shadow-lg">
                    <p className="font-bold">{data.name}</p>
                    <p className="text-sm text-muted-foreground">{data.fullName}</p>
                    <p className="text-primary mt-2">Rata-rata: {payload[0].value.toFixed(2)}</p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
             <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-7 w-16" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-4 w-32" /></CardHeader><CardContent><Skeleton className="h-7 w-16" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-4 w-28" /></CardHeader><CardContent><Skeleton className="h-7 w-10" /></CardContent></Card>
                </div>
                <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-[350px] w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
            </div>
        )
    }

    if (surveys.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Belum Ada Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Belum ada responden yang mengisi survei. Hasil akan ditampilkan di sini setelah data tersedia.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Indeks Informasi Haji (IIH)</CardTitle>
                        <AreaChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{scores.iih.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Nilai rata-rata dari semua responden</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Indeks Kepuasan Paspor (IKP)</CardTitle>
                        <AreaChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{scores.ikp.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Nilai rata-rata dari semua responden</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Responden</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{surveys.length}</div>
                        <p className="text-xs text-muted-foreground">Jumlah survei yang telah diisi</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Grafik Informasi Tahapan Haji</CardTitle>
                    <CardDescription>Rata-rata skor untuk setiap aspek informasi (skala 1-5).</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" interval={0} style={{ fontSize: '12px' }} />
                                <YAxis domain={[0, 5]} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))'}} />
                                <Bar dataKey="Rata-rata Skor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Tabulasi Data</CardTitle>
                            <CardDescription>Menampilkan data dari responden yang telah mengisi survei.</CardDescription>
                        </div>
                        <Button onClick={handleDownload}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Unduh Data (CSV)
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Pekerjaan</TableHead>
                                    <TableHead>Usia</TableHead>
                                    <TableHead>Jenis Kelamin</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {surveys.map((survey) => (
                                    <TableRow key={survey.id}>
                                        <TableCell>{survey.createdAt.toDate().toLocaleDateString('id-ID')}</TableCell>
                                        <TableCell>{survey.pekerjaan}</TableCell>
                                        <TableCell>{survey.usia}</TableCell>
                                        <TableCell>{survey.jenisKelamin}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

    