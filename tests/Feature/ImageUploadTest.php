<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

test('authenticated user can access images index page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/images');
    $response->assertStatus(200);
});

test('guest cannot access images page', function () {
    $response = $this->get('/images');

    $response->assertRedirect('/login');
});

test('authenticated user can upload an image', function () {
    $user = User::factory()->create();
    $file = UploadedFile::fake()->image('test-image.jpg', 500, 500)->size(1024);

    $response = $this->actingAs($user)->post('/images', [
        'image' => $file,
    ]);

    $response->assertRedirect('/images');
    $response->assertSessionHas('success', '画像がアップロードされました。');

    // Check that a file was stored in the images directory
    $files = Storage::disk('public')->files('images');
    expect($files)->toHaveCount(1);
    expect($files[0])->toContain('test-image.jpg');
});

test('image upload requires authentication', function () {
    $file = UploadedFile::fake()->image('test-image.jpg');

    $response = $this->post('/images', [
        'image' => $file,
    ]);

    $response->assertRedirect('/login');
    $files = Storage::disk('public')->files('images');
    expect($files)->toBeEmpty();
});

test('image upload requires valid image file', function () {
    $user = User::factory()->create();
    $file = UploadedFile::fake()->create('document.pdf', 1024, 'application/pdf');

    $response = $this->actingAs($user)->post('/images', [
        'image' => $file,
    ]);

    $response->assertSessionHasErrors(['image']);
    $files = Storage::disk('public')->files('images');
    expect($files)->toBeEmpty();
});

test('image upload validates file size limit', function () {
    $user = User::factory()->create();
    $file = UploadedFile::fake()->image('large-image.jpg')->size(3072); // 3MB

    $response = $this->actingAs($user)->post('/images', [
        'image' => $file,
    ]);

    $response->assertSessionHasErrors(['image']);
    $files = Storage::disk('public')->files('images');
    expect($files)->toBeEmpty();
});

test('image upload validates file types', function () {
    $user = User::factory()->create();
    $file = UploadedFile::fake()->create('image.bmp', 1024, 'image/bmp');

    $response = $this->actingAs($user)->post('/images', [
        'image' => $file,
    ]);

    $response->assertSessionHasErrors(['image']);
});

test('image upload requires image field', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/images', []);

    $response->assertSessionHasErrors(['image']);
});

test('storage directory is created and files are listed correctly', function () {
    // Create some fake files in storage
    Storage::disk('public')->put('images/test1.jpg', 'fake content');
    Storage::disk('public')->put('images/test2.png', 'fake content');

    // Test that files are listed correctly
    $files = Storage::disk('public')->files('images');
    expect($files)->toHaveCount(2);
    expect($files)->toContain('images/test1.jpg');
    expect($files)->toContain('images/test2.png');
});
