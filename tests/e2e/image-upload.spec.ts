import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Image Upload Feature', () => {
    test.beforeEach(async ({ page }) => {
        // Login with existing test user
        await page.goto('/login');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password');
        await page.click('button[type="submit"]');
        
        // Wait for redirect to dashboard
        await page.waitForURL('**/dashboard');
    });

    test('should investigate image upload issue', async ({ page }) => {
        // Setup response logging before navigating
        const responses: Array<{ status: number; url: string }> = [];
        page.on('response', response => {
            responses.push({ status: response.status(), url: response.url() });
        });

        // Navigate to images page
        await page.goto('/images');
        console.log('Successfully navigated to /images');

        // Take initial screenshot
        await page.screenshot({ path: 'debug-initial-state.png', fullPage: true });

        // Check if page loaded correctly
        await expect(page.locator('h1')).toContainText('画像アップロード');
        console.log('Page title found');

        // Check existing images count
        const imageGrid = page.locator('img');
        const initialImageCount = await imageGrid.count();
        console.log('Initial image count:', initialImageCount);

        // Create a simple test image file
        const testImagePath = path.join(__dirname, 'test-image.jpg');
        const testImageData = Buffer.from([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00,
            0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c,
            0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c,
            0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00,
            0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x0c, 0x03, 0x01, 0x00, 0x02, 0x11,
            0x03, 0x11, 0x00, 0x3f, 0x00, 0x80, 0x00, 0xff, 0xd9,
        ]);

        fs.writeFileSync(testImagePath, testImageData);

        try {
            // Upload the image
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(testImagePath);
            console.log('File selected for upload');

            // Click upload button and wait for navigation
            await Promise.all([
                page.waitForResponse(response => response.url().includes('/images') && response.request().method() === 'POST'),
                page.click('button:has-text("アップロード")')
            ]);
            console.log('Upload request completed');

            // Take screenshot after upload
            await page.screenshot({ path: 'debug-after-upload.png', fullPage: true });

            // Check for success message
            const hasSuccessMessage = await page.locator('text=画像がアップロードされました').isVisible();
            console.log('Success message visible:', hasSuccessMessage);

            // Wait a bit and check for new images
            await page.waitForTimeout(2000);
            const finalImageCount = await imageGrid.count();
            console.log('Final image count:', finalImageCount);

            // Check if images are actually loading
            const imageElements = await imageGrid.all();
            for (let i = 0; i < imageElements.length; i++) {
                const src = await imageElements[i].getAttribute('src');
                console.log(`Image ${i + 1} src:`, src);
                
                // Check if image loads successfully
                if (src) {
                    const imageResponse = await page.request.get(src);
                    console.log(`Image ${i + 1} response status:`, imageResponse.status());
                }
            }

            // Log all network responses
            console.log('\nAll network responses:');
            responses.forEach(response => {
                console.log(`${response.status} ${response.url}`);
            });

        } finally {
            // Clean up test file
            if (fs.existsSync(testImagePath)) {
                fs.unlinkSync(testImagePath);
            }
        }
    });

    test('should handle storage symlink issues', async ({ page }) => {
        // Navigate to images page
        await page.goto('/images');

        // Check if storage symlink exists by trying to access a test URL
        const response = await page.request.get('/storage/test');
        console.log('Storage access response status:', response.status());

        // Check if public/storage directory exists
        await page.evaluate(() => {
            fetch('/storage/images/')
                .then((response) => {
                    console.log('Storage images directory response:', response.status);
                })
                .catch((error) => {
                    console.log('Storage images directory error:', error.message);
                });
        });
    });
});
