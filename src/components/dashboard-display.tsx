
"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query, orderBy, Timestamp, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, FileDown, AreaChart, Users, Calculator } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface SurveyData {
    id: string;
    informasiHaji: { [key: string]: number };
    rekomendasiPaspor: { [key: string]: number };
    biovisa?: { [key: string]: number };
    penjemputanKoper?: { [key: string]: number };
    mobilisasi?: { [key: string]: number };
    createdAt: Timestamp;
    [key: string]: any;
}

interface CalculatedScores {
    iih: number;
    ikp: number;
    ibv: number;
    ipk: number;
    imh: number;
}

const DEFAULT_QUESTIONS = {
    informasiHaji: {
        q1: 'Saya memahami urutan tahapan haji dalam negeri (administrasi, manasik, keberangkatan, dll) dengan jelas.',
        q2: 'Penjelasan mengenai tahapan haji disampaikan secara rinci dan terstruktur.',
        q3: 'Informasi tahapan haji disampaikan dengan bahasa yang mudah dimengerti.',
        q4: 'Informasi mengenai tahapan haji mudah diakses melalui berbagai media (cetak, digital, bimbingan).',
        q5: 'Petugas atau narasumber memberikan informasi yang cukup dan akurat terkait setiap tahapan.',
        q6: 'Informasi setiap tahapan disampaikan sesuai waktu yang dibutuhkan (tidak terlambat/tidak terlalu dini).',
        q7: 'Perubahan jadwal atau prosedur disampaikan dengan segera dan jelas.',
        q8: 'Media penyampaian informasi (aplikasi, media sosial, leaflet, bimbingan manasik) sangat membantu memahami tahapan.',
        q9: 'Bimbingan manasik efektif dalam menjelaskan setiap tahapan haji yang harus dijalani.',
        q10: 'Secara keseluruhan, saya puas terhadap penyampaian informasi mengenai tahapan haji dalam negeri.',
    },
    rekomendasiPaspor: {
        rp1: 'Seberapa puas Anda terhadap kejelasan informasi yang diberikan terkait proses penerbitan rekomendasi paspor?',
        rp2: 'Seberapa mudah proses pengajuan rekomendasi paspor yang Anda alami?',
        rp3: 'Seberapa cepat proses penerbitan rekomendasi paspor setelah Anda mengajukan permohonan?',
        rp4: 'Seberapa puas Anda terhadap sikap dan pelayanan petugas dalam proses penerbitan rekomendasi paspor?',
        rp5: 'Seberapa efektif komunikasi yang Anda terima terkait status permohonan rekomendasi paspor Anda?',
        rp6: 'Secara keseluruhan, seberapa puas Anda terhadap layanan penerbitan rekomendasi paspor?',
    },
    biovisa: {
        bv1: 'Seberapa jelas informasi yang Anda terima terkait proses perekaman sidik jari untuk biovisa?',
        bv2: 'Seberapa mudah proses pendaftaran atau antrean perekaman sidik jari?',
        bv3: 'Seberapa puas Anda terhadap fasilitas atau kenyamanan tempat perekaman sidik jari?',
        bv4: 'Seberapa profesional dan ramah petugas yang melayani perekaman sidik jari?',
        bv5: 'Seberapa puas Anda terhadap komunikasi atau notifikasi jadwal perekaman sidik jari?',
        bv6: 'Seberapa puas Anda terhadap keseluruhan layanan perekaman sidik jari untuk keperluan biovisa?',
    },
    penjemputanKoper: {
        pk1: 'Seberapa puas Anda terhadap ketepatan waktu penjemputan dan penyerahan koper jemaah?',
        pk2: 'Seberapa puas Anda terhadap kejelasan informasi mengenai jadwal dan lokasi penjemputan dan penyerahan koper?',
        pk3: 'Seberapa puas Anda terhadap kemudahan proses penyerahan koper kepada petugas?',
        pk4: 'Seberapa puas Anda terhadap sikap dan pelayanan petugas saat penjemputan dan penyerahan koper?',
        pk5: 'Seberapa puas Anda terhadap koordinasi antara petugas dan jemaah dalam proses penjemputan dan penyerahan koper?',
        pk6: 'Seberapa puas Anda secara keseluruhan terhadap layanan penjemputan dan penyerahan koper?',
    },
    mobilisasi: {
        mh1: "Seberapa puas Anda terhadap kejelasan informasi jadwal keberangkatan dan rute perjalanan?",
        mh2: "Seberapa puas Anda terhadap jumlah armada yang disediakan sesuai kebutuhan jumlah jemaah?",
        mh3: "Seberapa puas Anda terhadap keteraturan dan koordinasi saat proses naik-turun kendaraan?",
        mh4: "Seberapa puas Anda terhadap bantuan petugas selama proses mobilisasi jemaah?",
        mh5: "Seberapa puas Anda secara keseluruhan terhadap pelayanan mobilisasi dari Masjid Jami' ke Asrama Haji?"
    },
     perbaikan: {
        informasi: "Penyampaian Informasi Tahapan Haji",
        paspor: "Penerbitan Rekomendasi Paspor",
        biovisa: "Perekaman Sidik Jari untuk Biovisa",
        koper: "Pelayanan Penjemputan dan Penyerahan Koper",
        mobilisasi: "Mobilisasi ke Asrama Haji",
        tidak_ada: "Tidak ada yang perlu diperbaiki"
    }
};

export function DashboardDisplay() {
    const [surveys, setSurveys] = useState<SurveyData[]>([]);
    const [scores, setScores] = useState<CalculatedScores>({ iih: 0, ikp: 0, ibv: 0, ipk: 0, imh: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [questionConfig, setQuestionConfig] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch config first
                const configDoc = await getDoc(doc(db, "config", "questions"));
                let effectiveConfig = DEFAULT_QUESTIONS;
                
                if (configDoc.exists()) {
                    const dbConfig = configDoc.data();
                    const perbaikanOptions = (dbConfig.perbaikan && dbConfig.perbaikan.kebijakan)
                        ? DEFAULT_QUESTIONS.perbaikan
                        : { ...DEFAULT_QUESTIONS.perbaikan, ...(dbConfig.perbaikan || {}) };

                     effectiveConfig = {
                        informasiHaji: { ...DEFAULT_QUESTIONS.informasiHaji, ...(dbConfig.informasiHaji || {}) },
                        rekomendasiPaspor: { ...DEFAULT_QUESTIONS.rekomendasiPaspor, ...(dbConfig.rekomendasiPaspor || {}) },
                        biovisa: { ...DEFAULT_QUESTIONS.biovisa, ...(dbConfig.biovisa || {}) },
                        penjemputanKoper: { ...DEFAULT_QUESTIONS.penjemputanKoper, ...(dbConfig.penjemputanKoper || {}) },
                        mobilisasi: { ...DEFAULT_QUESTIONS.mobilisasi, ...(dbConfig.mobilisasi || {}) },
                        perbaikan: perbaikanOptions,
                    };
                }
                setQuestionConfig(effectiveConfig);

                // Then fetch surveys
                const q = query(collection(db, "surveys"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const surveyData: SurveyData[] = [];
                querySnapshot.forEach((doc) => {
                    surveyData.push({ id: doc.id, ...doc.data() } as SurveyData);
                });

                if (surveyData.length > 0) {
                    calculateMetrics(surveyData, effectiveConfig);
                }
                
                setSurveys(surveyData);

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
        let totalIbvScore = 0;
        let totalIpkScore = 0;
        let totalImhScore = 0;

        const informasiQuestionKeys = Object.keys(config.informasiHaji || {});
        const pasporQuestionKeys = Object.keys(config.rekomendasiPaspor || {});
        const biovisaQuestionKeys = Object.keys(config.biovisa || {});
        const koperQuestionKeys = Object.keys(config.penjemputanKoper || {});
        const mobilisasiQuestionKeys = Object.keys(config.mobilisasi || {});

        const surveysWithBiovisa = data.filter(s => s.biovisa);
        const surveysWithKoper = data.filter(s => s.penjemputanKoper);
        const surveysWithMobilisasi = data.filter(s => s.mobilisasi);

        data.forEach(survey => {
            if (survey.informasiHaji && informasiQuestionKeys.length > 0) {
                const informasiSum = Object.values(survey.informasiHaji).reduce((a, b) => a + b, 0);
                totalIihScore += (informasiSum / (informasiQuestionKeys.length * 5)) * 100;
            }
            if (survey.rekomendasiPaspor && pasporQuestionKeys.length > 0) {
                const pasporSum = Object.values(survey.rekomendasiPaspor).reduce((a, b) => a + b, 0);
                totalIkpScore += (pasporSum / (pasporQuestionKeys.length * 5)) * 100;
            }
            if (survey.biovisa && biovisaQuestionKeys.length > 0) {
                const biovisaSum = Object.values(survey.biovisa).reduce((a, b) => a + b, 0);
                totalIbvScore += (biovisaSum / (biovisaQuestionKeys.length * 5)) * 100;
            }
            if (survey.penjemputanKoper && koperQuestionKeys.length > 0) {
                const koperSum = Object.values(survey.penjemputanKoper).reduce((a, b) => a + b, 0);
                totalIpkScore += (koperSum / (koperQuestionKeys.length * 5)) * 100;
            }
            if (survey.mobilisasi && mobilisasiQuestionKeys.length > 0) {
                const mobilisasiSum = Object.values(survey.mobilisasi).reduce((a, b) => a + b, 0);
                totalImhScore += (mobilisasiSum / (mobilisasiQuestionKeys.length * 5)) * 100;
            }
        });
        
        const numSurveys = data.length;
        const newScores = {
            iih: numSurveys > 0 ? totalIihScore / numSurveys : 0,
            ikp: numSurveys > 0 ? totalIkpScore / numSurveys : 0,
            ibv: surveysWithBiovisa.length > 0 ? totalIbvScore / surveysWithBiovisa.length : 0,
            ipk: surveysWithKoper.length > 0 ? totalIpkScore / surveysWithKoper.length : 0,
            imh: surveysWithMobilisasi.length > 0 ? totalImhScore / surveysWithMobilisasi.length : 0,
        };
        setScores(newScores);

        const newChartData = [
            { name: "IIH", 'Skor Indeks': parseFloat(newScores.iih.toFixed(2)), fullName: "Indeks Informasi Haji" },
            { name: "IKP", 'Skor Indeks': parseFloat(newScores.ikp.toFixed(2)), fullName: "Indeks Kepuasan Paspor" },
            { name: "IBV", 'Skor Indeks': parseFloat(newScores.ibv.toFixed(2)), fullName: "Indeks Biovisa" },
            { name: "IPK", 'Skor Indeks': parseFloat(newScores.ipk.toFixed(2)), fullName: "Indeks Penjemputan Koper" },
            { name: "IMH", 'Skor Indeks': parseFloat(newScores.imh.toFixed(2)), fullName: "Indeks Mobilisasi Haji" },
        ];
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
                pekerjaan: s.pekerjaan,
                usia: s.usia,
                jenisKelamin: s.jenisKelamin,
                pendidikan: s.pendidikan,
                ...Object.fromEntries(Object.entries(s.informasiHaji || {}).map(([k,v]) => [`informasiHaji_${k}`,v])),
                ...Object.fromEntries(Object.entries(s.rekomendasiPaspor || {}).map(([k,v]) => [`rekomendasiPaspor_${k}`,v])),
                ...Object.fromEntries(Object.entries(s.biovisa || {}).map(([k,v]) => [`biovisa_${k}`,v])),
                ...Object.fromEntries(Object.entries(s.penjemputanKoper || {}).map(([k,v]) => [`penjemputanKoper_${k}`,v])),
                ...Object.fromEntries(Object.entries(s.mobilisasi || {}).map(([k,v]) => [`mobilisasi_${k}`,v])),
                saranInformasiHaji: s.saranInformasiHaji || '',
                saranRekomendasiPaspor: s.saranRekomendasiPaspor || '',
                saranBiovisa: s.saranBiovisa || '',
                saranPenjemputanKoper: s.saranPenjemputanKoper || '',
                saranMobilisasi: s.saranMobilisasi || '',
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
                    <p className="text-primary mt-2">Skor Indeks: {payload[0].value.toFixed(2)}</p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
             <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
                    <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-7 w-16" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-4 w-32" /></CardHeader><CardContent><Skeleton className="h-7 w-16" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-7 w-16" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-4 w-28" /></CardHeader><CardContent><Skeleton className="h-7 w-16" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-4 w-28" /></CardHeader><CardContent><Skeleton className="h-7 w-16" /></CardContent></Card>
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
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Indeks Informasi Haji (IIH)</CardTitle>
                        <AreaChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{scores.iih.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Nilai rata-rata</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Indeks Kepuasan Paspor (IKP)</CardTitle>
                        <AreaChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{scores.ikp.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Nilai rata-rata</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Indeks Biovisa (IBV)</CardTitle>
                        <AreaChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{scores.ibv.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Nilai rata-rata</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Indeks Penjemputan Koper (IPK)</CardTitle>
                        <AreaChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{scores.ipk.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Nilai rata-rata</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Indeks Mobilisasi Haji (IMH)</CardTitle>
                        <AreaChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{scores.imh.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Nilai rata-rata</p>
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
                    <CardTitle>Grafik Indeks Pelayanan Haji</CardTitle>
                    <CardDescription>Visualisasi perbandingan skor akhir untuk setiap indeks pelayanan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" interval={0} style={{ fontSize: '12px' }} />
                                <YAxis domain={[0, 100]} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))'}} />
                                <Legend />
                                <Bar dataKey="Skor Indeks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-6 w-6 text-primary" />
                        <span>Bagaimana Indeks Dihitung?</span>
                    </CardTitle>
                    <CardDescription>
                        Setiap indeks kepuasan dihitung berdasarkan rata-rata jawaban responden dan dikonversi ke skala 100.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                   <p className="text-sm">
                       Nilai Indeks Pelayanan dihitung menggunakan pendekatan Nilai Rata-Rata Tertimbang. Setiap jawaban responden pada skala 1-5 diberi bobot yang setara.
                   </p>
                    <div className="bg-muted p-4 rounded-md text-center">
                        <p className="font-mono text-sm sm:text-base">
                            Indeks = (Total Nilai Persepsi / Total Nilai Maksimal) x 100
                        </p>
                    </div>
                     <p className="text-xs text-muted-foreground pt-2">
                       <strong>Total Nilai Persepsi</strong> adalah jumlah skor jawaban dari semua responden untuk satu unit layanan. <br/>
                       <strong>Total Nilai Maksimal</strong> adalah jumlah responden dikalikan jumlah pertanyaan dikalikan 5 (nilai tertinggi).
                   </p>
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
