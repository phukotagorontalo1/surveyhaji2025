
"use client"

import { useEffect, useState } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Save } from "lucide-react"

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

const questionStructure = {
    informasiHaji: {
        title: "II. Penyampaian Informasi Tahapan Haji dalam Negeri",
        sections: {
            "A. Kejelasan Informasi Tahapan Haji": ['q1', 'q2', 'q3'],
            "B. Ketersediaan dan Akses Informasi": ['q4', 'q5'],
            "C. Waktu Penyampaian Informasi": ['q6', 'q7'],
            "D. Efektivitas Media dan Bimbingan": ['q8', 'q9'],
            "E. Kepuasan Umum": ['q10'],
        }
    },
    rekomendasiPaspor: {
        title: "III. Penerbitan Rekomendasi Paspor"
    },
    biovisa: {
        title: "IV. Perekaman Sidik Jari untuk Biovisa"
    },
    penjemputanKoper: {
        title: "V. Pelayanan Penjemputan dan Penyerahan Koper"
    },
    mobilisasi: {
        title: "VI. Mobilisasi ke Asrama Haji"
    },
    perbaikan: {
        title: "VII. Opsi Perbaikan"
    }
}


export default function QuestionManagement() {
    const [questionConfig, setQuestionConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            try {
                const configRef = doc(db, "config", "questions");
                const configSnap = await getDoc(configRef);
                if (!configSnap.exists()) {
                    await setDoc(configRef, DEFAULT_QUESTIONS);
                    setQuestionConfig(DEFAULT_QUESTIONS);
                } else {
                    const dbConfig = configSnap.data();
                     const mergedConfig = {
                        informasiHaji: { ...DEFAULT_QUESTIONS.informasiHaji, ...(dbConfig.informasiHaji || {}) },
                        rekomendasiPaspor: { ...DEFAULT_QUESTIONS.rekomendasiPaspor, ...(dbConfig.rekomendasiPaspor || {}) },
                        biovisa: { ...DEFAULT_QUESTIONS.biovisa, ...(dbConfig.biovisa || {}) },
                        penjemputanKoper: { ...DEFAULT_QUESTIONS.penjemputanKoper, ...(dbConfig.penjemputanKoper || {}) },
                        mobilisasi: { ...DEFAULT_QUESTIONS.mobilisasi, ...(dbConfig.mobilisasi || {}) },
                        perbaikan: { ...DEFAULT_QUESTIONS.perbaikan, ...(dbConfig.perbaikan || {}) },
                    };
                    setQuestionConfig(mergedConfig);
                }
            } catch (err: any) {
                console.error("Error fetching config: ", err);
                if (err.code === 'permission-denied') {
                    toast({ variant: "destructive", title: "Izin Ditolak", description: "Tidak dapat memuat konfigurasi. Periksa aturan keamanan Firestore." });
                } else {
                    toast({ variant: "destructive", title: "Gagal memuat konfigurasi." });
                }
                 setQuestionConfig(DEFAULT_QUESTIONS);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [toast]);

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
        setIsSaving(true);
        try {
            const configRef = doc(db, "config", "questions");
            await setDoc(configRef, questionConfig);
            toast({
                title: "Konfigurasi disimpan",
                description: "Perubahan pertanyaan survei telah berhasil disimpan.",
            });
        } catch(err: any) {
            console.error("Error saving config:", err);
            if (err.code === 'permission-denied') {
                toast({ variant: "destructive", title: "Izin Ditolak", description: "Tidak dapat menyimpan konfigurasi. Periksa aturan keamanan Firestore." });
            } else {
                toast({ variant: "destructive", title: "Gagal menyimpan", description: "Terjadi kesalahan saat menyimpan konfigurasi." });
            }
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-1/4"/>
                <Card><CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader><CardContent><Skeleton className="h-64 w-full md:col-span-2"/></CardContent></Card>
            </div>
        )
    }
    
    if (!questionConfig) return null;

    return (
        <div className="space-y-6">
             <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">
                        Manajemen Pertanyaan
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Ubah redaksi pertanyaan yang tampil di formulir survei publik.
                    </p>
                </div>
                 <Button onClick={handleSaveConfig} disabled={isSaving}>
                     {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="mr-2 h-4 w-4"/> Simpan Perubahan</>}
                 </Button>
            </header>
            
            <Card>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
                    <div className="space-y-4 lg:col-span-1">
                        <h3 className="font-semibold text-lg text-primary">{questionStructure.informasiHaji.title}</h3>
                        {Object.entries(questionStructure.informasiHaji.sections).map(([sectionTitle, keys]) => (
                            <div key={sectionTitle} className="space-y-2 pt-2">
                                <h4 className="font-medium text-md">{sectionTitle}</h4>
                                {keys.map(key => (
                                    <div key={key}>
                                        <Label htmlFor={`informasiHaji-${key}`} className="text-sm font-medium text-muted-foreground uppercase">{key}</Label>
                                        <Textarea id={`informasiHaji-${key}`} value={questionConfig.informasiHaji[key]} onChange={(e) => handleConfigChange('informasiHaji', key, e.target.value)} className="mt-1"/>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4 lg:col-span-1">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-primary">{questionStructure.rekomendasiPaspor.title}</h3>
                            {Object.keys(questionConfig.rekomendasiPaspor).map(key => (
                                <div key={key}>
                                    <Label htmlFor={`rekomendasiPaspor-${key}`} className="text-sm font-medium text-muted-foreground uppercase">{key}</Label>
                                    <Textarea id={`rekomendasiPaspor-${key}`} value={questionConfig.rekomendasiPaspor[key]} onChange={(e) => handleConfigChange('rekomendasiPaspor', key, e.target.value)} className="mt-1"/>
                                </div>
                            ))}
                        </div>
                         <div className="space-y-4 mt-8">
                            <h3 className="font-semibold text-lg text-primary">{questionStructure.biovisa.title}</h3>
                            {Object.keys(questionConfig.biovisa).map(key => (
                                <div key={key}>
                                    <Label htmlFor={`biovisa-${key}`} className="text-sm font-medium text-muted-foreground uppercase">{key}</Label>
                                    <Textarea id={`biovisa-${key}`} value={questionConfig.biovisa[key]} onChange={(e) => handleConfigChange('biovisa', key, e.target.value)} className="mt-1"/>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4 lg:col-span-1">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-primary">{questionStructure.penjemputanKoper.title}</h3>
                            {Object.keys(questionConfig.penjemputanKoper).map(key => (
                                <div key={key}>
                                    <Label htmlFor={`penjemputanKoper-${key}`} className="text-sm font-medium text-muted-foreground uppercase">{key}</Label>
                                    <Textarea id={`penjemputanKoper-${key}`} value={questionConfig.penjemputanKoper[key]} onChange={(e) => handleConfigChange('penjemputanKoper', key, e.target.value)} className="mt-1"/>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4 mt-8">
                            <h3 className="font-semibold text-lg text-primary">{questionStructure.mobilisasi.title}</h3>
                            {Object.keys(questionConfig.mobilisasi).map(key => (
                                <div key={key}>
                                    <Label htmlFor={`mobilisasi-${key}`} className="text-sm font-medium text-muted-foreground uppercase">{key}</Label>
                                    <Textarea id={`mobilisasi-${key}`} value={questionConfig.mobilisasi[key]} onChange={(e) => handleConfigChange('mobilisasi', key, e.target.value)} className="mt-1"/>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4 mt-8">
                            <h3 className="font-semibold text-lg text-primary">{questionStructure.perbaikan.title}</h3>
                            {Object.keys(questionConfig.perbaikan).map(key => (
                                <div key={key}>
                                    <Label htmlFor={`perbaikan-${key}`} className="text-sm font-medium text-muted-foreground uppercase">{key}</Label>
                                    <Input id={`perbaikan-${key}`} value={questionConfig.perbaikan[key]} onChange={(e) => handleConfigChange('perbaikan', key, e.target.value)} className="mt-1"/>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
