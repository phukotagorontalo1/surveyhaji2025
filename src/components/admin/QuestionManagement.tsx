
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
                    setQuestionConfig(configSnap.data());
                }
            } catch (err: any) {
                console.error("Error fetching config: ", err);
                if (err.code === 'permission-denied') {
                    toast({ variant: "destructive", title: "Izin Ditolak", description: "Tidak dapat memuat konfigurasi. Periksa aturan keamanan Firestore." });
                } else {
                    toast({ variant: "destructive", title: "Gagal memuat konfigurasi." });
                }
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
                <CardContent className="grid md:grid-cols-2 gap-8 pt-6">
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
                </CardContent>
            </Card>
        </div>
    )
}
