<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImageUploadRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ImageUploadController extends Controller
{
    public function index(): Response
    {
        $images = collect(Storage::disk('public')->files('images'))
            ->map(fn (string $path): array => [
                'path' => $path,
                'url' => Storage::disk('public')->url($path),
                'name' => basename($path),
                'size' => Storage::disk('public')->size($path),
            ])
            ->values();

        return Inertia::render('images/index', [
            'images' => $images,
        ]);
    }

    public function store(ImageUploadRequest $request): RedirectResponse
    {
        $file = $request->file('image');
        $filename = time().'_'.$file->getClientOriginalName();

        $path = $file->storeAs('images', $filename, 'public');

        return redirect()->route('images.index')->with('success', '画像がアップロードされました。');
    }
}
