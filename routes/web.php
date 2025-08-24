<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('images', [App\Http\Controllers\ImageUploadController::class, 'index'])->name('images.index');
    Route::post('images', [App\Http\Controllers\ImageUploadController::class, 'store'])->name('images.store');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
