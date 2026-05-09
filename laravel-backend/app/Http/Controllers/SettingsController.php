<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\Carousel;
use App\Models\LoginImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    public function index()
    {
        try {
            $settings = Setting::all()->pluck('value', 'key')->toArray();
            
            $defaults = [
                'notifyLogin' => true,
                'notifyScan' => true,
                'notifyEvents' => false,
            ];
            
            foreach ($defaults as $key => $default) {
                if (!isset($settings[$key])) {
                    $settings[$key] = $default;
                }
                if ($settings[$key] === 'true') $settings[$key] = true;
                if ($settings[$key] === 'false') $settings[$key] = false;
            }
            
            return response()->json($settings);
            
        } catch (\Exception $e) {
            Log::error('Settings index error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function update(Request $request)
    {
        try {
            $settings = $request->all();
            
            foreach ($settings as $key => $value) {
                if (is_bool($value)) {
                    $value = $value ? 'true' : 'false';
                }
                
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value]
                );
            }
            
            return response()->json(['success' => true, 'message' => 'Settings saved']);
            
        } catch (\Exception $e) {
            Log::error('Settings update error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

   public function getCarouselItems()
    {
        try {
            $items = Carousel::orderBy('created_at', 'desc')->get();
            
            // Generate full URLs for each image
            foreach ($items as $item) {
                // Your images are stored in private/admins/ folder
                $item->image_url = url('/api/carousel-image/' . basename($item->image_path));
            }
            
            return response()->json(['success' => true, 'data' => $items]);
        } catch (\Exception $e) {
            Log::error('Get carousel items error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function addCarouselItem(Request $request)
    {
        try {
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'description' => 'nullable|string|max:500',
                'is_active' => 'boolean',
            ]);

            if ($request->hasFile('image')) {
                $image = $request->file('image');
                // Generate unique filename
                $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                
                // Store in private/admins/ directory
                $path = $image->storeAs('admins', $filename, 'private');
                
                $carouselItem = Carousel::create([
                    'image_path' => $path, // This will be: admins/filename.jpg
                    'description' => $request->input('description'),
                    'is_active' => $request->input('is_active', true),
                ]);
                
                // Add URL to response
                $carouselItem->image_url = url('/api/carousel-image/' . $filename);
                
                return response()->json(['success' => true, 'data' => $carouselItem], 201);
            }
            
            return response()->json(['error' => 'No image uploaded'], 400);
            
        } catch (\Exception $e) {
            Log::error('Add carousel item error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateCarouselItem(Request $request, $id)
    {
        try {
            $item = Carousel::findOrFail($id);
            
            $request->validate([
                'description' => 'nullable|string|max:500',
                'is_active' => 'boolean',
            ]);
            
            if ($request->hasFile('image')) {
                $request->validate([
                    'image' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                ]);
                
                // Delete old image from private storage
                if ($item->image_path && Storage::disk('private')->exists($item->image_path)) {
                    Storage::disk('private')->delete($item->image_path);
                }
                
                // Upload new image
                $image = $request->file('image');
                $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('admins', $filename, 'private');
                $item->image_path = $path;
            }
            
            if ($request->has('description')) {
                $item->description = $request->description;
            }
            
            if ($request->has('is_active')) {
                $item->is_active = $request->is_active;
            }
            
            $item->save();
            
            return response()->json(['success' => true, 'data' => $item]);
            
        } catch (\Exception $e) {
            Log::error('Update carousel item error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function deleteCarouselItem($id)
    {
        try {
            $item = Carousel::findOrFail($id);
            
            // Delete image file from private storage
            if ($item->image_path && Storage::disk('private')->exists($item->image_path)) {
                Storage::disk('private')->delete($item->image_path);
            }
            
            $item->delete();
            
            return response()->json(['success' => true, 'message' => 'Item deleted']);
            
        } catch (\Exception $e) {
            Log::error('Delete carousel item error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Add this method to serve images
    public function serveCarouselImage($filename)
{
    // Define the possible paths where images might be stored
    $possiblePaths = [
        storage_path('app/private/admin/carousel/' . $filename),
        storage_path('app/private/admins/' . $filename),
        storage_path('app/private/carousel/' . $filename),
    ];
    
    // Also try with the full path from database (admin/carousel/filename)
    $dbPaths = [
        storage_path('app/private/admin/carousel/' . $filename),
        storage_path('app/private/admins/' . $filename),
    ];
    
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            return response()->file($path);
        }
    }
    
    // Try to find the file recursively
    $privatePath = storage_path('app/private');
    $files = glob($privatePath . '/**/' . $filename, GLOB_BRACE);
    
    if (!empty($files) && file_exists($files[0])) {
        return response()->file($files[0]);
    }
    
    return response()->json(['error' => 'Image not found: ' . $filename], 404);
}
  public function getLoginImages()
    {
        try {
            $images = LoginImage::orderBy('created_at', 'desc')->get();
            
            foreach ($images as $image) {
                $image->image_url = url('/api/login-image/' . basename($image->image_path));
            }
            
            // Get active image
            $activeImage = LoginImage::where('is_active', true)->first();
            
            return response()->json([
                'success' => true, 
                'data' => $images,
                'active' => $activeImage ? url('/api/login-image/' . basename($activeImage->image_path)) : null
            ]);
        } catch (\Exception $e) {
            Log::error('Get login images error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function addLoginImage(Request $request)
{
    try {
        Log::info('Add login image request received');
        Log::info('Request files: ', $request->allFiles());
        Log::info('Has file: ' . ($request->hasFile('image') ? 'Yes' : 'No'));
        
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        if (!$request->hasFile('image')) {
            Log::error('No image file in request');
            return response()->json(['error' => 'No image uploaded'], 400);
        }

        $image = $request->file('image');
        
        if (!$image->isValid()) {
            Log::error('Invalid image file');
            return response()->json(['error' => 'Invalid image file'], 400);
        }
        
        Log::info('Image details:', [
            'name' => $image->getClientOriginalName(),
            'size' => $image->getSize(),
            'mime' => $image->getMimeType(),
            'error' => $image->getError()
        ]);
        
        $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
        Log::info('Generated filename: ' . $filename);
        
        // Ensure directory exists
        $storagePath = storage_path('app/private/login_images');
        if (!file_exists($storagePath)) {
            mkdir($storagePath, 0777, true);
            Log::info('Created directory: ' . $storagePath);
        }
        
        // Store in private/login_images directory
        $path = $image->storeAs('login_images', $filename, 'private');
        
        if (!$path) {
            Log::error('Failed to store image');
            return response()->json(['error' => 'Failed to store image'], 500);
        }
        
        Log::info('Image stored at: ' . $path);
        
        // If this is set as active, deactivate others
        $isActive = $request->input('is_active', false);
        if ($isActive) {
            LoginImage::where('is_active', true)->update(['is_active' => false]);
            Log::info('Deactivated other login images');
        }
        
        $loginImage = LoginImage::create([
            'image_path' => $path,
            'description' => $request->input('description', ''),
            'is_active' => $isActive,
        ]);
        
        Log::info('Login image created with ID: ' . $loginImage->id);
        
        $filename = basename($path);
        $loginImage->image_url = url('/api/login-image/' . $filename);
        
        return response()->json(['success' => true, 'data' => $loginImage], 201);
        
    } catch (\Exception $e) {
        Log::error('Add login image error: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        return response()->json(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
}

    public function updateLoginImage(Request $request, $id)
{
    try {
        Log::info('Update login image request for ID: ' . $id);
        Log::info('Request data: ', $request->all());
        
        $loginImage = LoginImage::findOrFail($id);
        
        // Validate - make description optional
        $request->validate([
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);
        
        // Handle is_active toggle
        if ($request->has('is_active')) {
            $isActive = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
            if ($isActive) {
                // Deactivate all other images
                LoginImage::where('id', '!=', $id)->update(['is_active' => false]);
            }
            $loginImage->is_active = $isActive;
            Log::info('Setting is_active to: ' . ($isActive ? 'true' : 'false'));
        }
        
        // Handle image upload
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            ]);
            
            // Delete old image
            if ($loginImage->image_path && Storage::disk('private')->exists($loginImage->image_path)) {
                Storage::disk('private')->delete($loginImage->image_path);
                Log::info('Deleted old image: ' . $loginImage->image_path);
            }
            
            // Upload new image
            $image = $request->file('image');
            $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs('login_images', $filename, 'private');
            $loginImage->image_path = $path;
            Log::info('Uploaded new image: ' . $path);
        }
        
        // Handle description update - IMPORTANT FIX
        // Check for description in request body (not just has('description'))
        if ($request->filled('description') || $request->has('description')) {
            $loginImage->description = $request->input('description');
            Log::info('Updating description to: ' . $request->input('description'));
        }
        
        $loginImage->save();
        Log::info('Login image updated successfully, description is now: ' . $loginImage->description);
        
        return response()->json(['success' => true, 'data' => $loginImage]);
        
    } catch (\Exception $e) {
        Log::error('Update login image error: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    public function deleteLoginImage($id)
    {
        try {
            $loginImage = LoginImage::findOrFail($id);
            
            // Delete image file
            if ($loginImage->image_path && Storage::disk('private')->exists($loginImage->image_path)) {
                Storage::disk('private')->delete($loginImage->image_path);
            }
            
            $loginImage->delete();
            
            return response()->json(['success' => true, 'message' => 'Image deleted']);
            
        } catch (\Exception $e) {
            Log::error('Delete login image error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function setActiveLoginImage($id)
    {
        try {
            // Deactivate all
            LoginImage::where('is_active', true)->update(['is_active' => false]);
            
            // Activate selected
            $image = LoginImage::findOrFail($id);
            $image->is_active = true;
            $image->save();
            
            return response()->json(['success' => true, 'message' => 'Active image updated']);
            
        } catch (\Exception $e) {
            Log::error('Set active login image error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function serveLoginImage($filename)
    {
        $path = storage_path('app/private/login_images/' . $filename);
        
        if (file_exists($path)) {
            return response()->file($path);
        }
        
        return response()->json(['error' => 'Image not found'], 404);
    }
}