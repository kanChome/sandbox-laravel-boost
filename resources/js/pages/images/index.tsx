import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Image {
    path: string;
    url: string;
    name: string;
    size: number;
}

interface Props {
    images: Image[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: '画像アップロード',
        href: '/images',
    },
];

export default function ImageIndex({ images }: Props) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = () => {
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', selectedFile);

        router.post('/images', formData, {
            onFinish: () => {
                setUploading(false);
                setSelectedFile(null);
                // Reset file input
                const fileInput = document.getElementById('image-input') as HTMLInputElement;
                if (fileInput) {
                    fileInput.value = '';
                }
            },
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="画像アップロード" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold">画像アップロード</h1>
                    <p className="mt-2 text-muted-foreground">JPEG、PNG、JPG、GIF、WEBP形式の画像をアップロードできます（最大2MB）</p>
                </div>

                {/* Upload Form */}
                <div className="rounded-lg border bg-card p-6">
                    <h2 className="mb-4 text-xl font-semibold">新しい画像をアップロード</h2>

                    <div className="space-y-4">
                        <div>
                            <input
                                id="image-input"
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                onChange={handleFileSelect}
                                className="block w-full cursor-pointer text-sm text-muted-foreground file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                            />
                        </div>

                        {selectedFile && (
                            <div className="text-sm text-muted-foreground">
                                選択されたファイル: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                            </div>
                        )}

                        <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full sm:w-auto">
                            {uploading ? 'アップロード中...' : 'アップロード'}
                        </Button>
                    </div>
                </div>

                {/* Images Grid */}
                <div>
                    <h2 className="mb-4 text-xl font-semibold">アップロード済み画像</h2>

                    {images.length === 0 ? (
                        <div className="rounded-lg border bg-muted/50 py-12 text-center">
                            <p className="text-muted-foreground">アップロードされた画像はありません</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {images.map((image) => (
                                <div key={image.path} className="overflow-hidden rounded-lg border bg-card">
                                    <div className="aspect-square overflow-hidden">
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <p className="truncate text-sm font-medium" title={image.name}>
                                            {image.name}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">{formatFileSize(image.size)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
