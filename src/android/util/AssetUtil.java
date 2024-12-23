/*
 * Apache 2.0 License
 *
 * Copyright (c) Sebastian Katzer 2017
 * Copyright (c) Manuel Beck 2024
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 */

package de.appplant.cordova.plugin.localnotification.util;

import android.content.ContentResolver;
import android.content.Context;
import android.content.res.AssetManager;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.StrictMode;
import android.util.Log;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.util.UUID;

import android.graphics.Color;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Paint;
import android.graphics.Canvas;

/**
 * Util class to map unified asset URIs to native URIs. See {@link AssetUtil#getUri(String, int)}.
 */
public final class AssetUtil {

    public static final String TAG = "AssetUtil";

    /**
     * Needed for access the resources and app directory.
     */
    private final Context context;

    public static final int RESOURCE_TYPE_DRAWABLE = 0;
    public static final int RESOURCE_TYPE_RAW = 1;

    public AssetUtil(Context context) {
        this.context = context;
    }

    /**
     * The Uri for a path.
     * @param path The path to get the Uri for.
     * @param resourceType Only needed, if the path is a res:// path. Represents the type of the resource,
     * can be {@link AssetUtil#RESOURCE_TYPE_DRAWABLE} or {@link AssetUtil#RESOURCE_TYPE_RAW}.
     * @return The Uri for the path or {@link Uri.EMPTY} if the path is empty, does not exists or is not recognizeable.
     */
    public Uri getUri(String path, int resourceType) {
        if (path == null || path.isEmpty()) return Uri.EMPTY;

        // Resource file from res directory
        if (path.startsWith("res:")) return getUriForResource(path, resourceType);

        // File from www folder
        if (path.startsWith("www") || path.startsWith("file://")) return getSharedUriForAssetFile(path);

        // Shared file in the shared_files directory
        if (path.startsWith("shared://")) {
            // Create content:// Uri
            return getSharedUri(new File(getSharedDirectory(), path.replace("shared://", "")));
        }

        // Path not recognizeable
        Log.e(TAG, "Path not recognizeable: " + path);
        return Uri.EMPTY;
    }

    /**
     * Gets the URI for a resource in the res directory.
     * @param resourcePath Path like res://mySound, res://myImage.png, etc.
     * @param resourceType Can be {@link AssetUtil#RESOURCE_TYPE_DRAWABLE} or {@link AssetUtil#RESOURCE_TYPE_RAW}
     * @return {@link Uri.EMPTY} if a resource could not be found.
     */
    public Uri getUriForResource(String resourcePath, int resourceType) {
        // Get from app resources
        Resources resources = context.getResources();
        int resourceId = getResourceId(resources, resourcePath, resourceType);

        // Get from system resources
        if (resourceId == 0) {
            resources = Resources.getSystem();
            resourceId = getResourceId(resources, resourcePath, resourceType);
        }

        if (resourceId == 0) {
            Log.w(TAG, "Resspurce not found: " + resourcePath);
            return Uri.EMPTY;
        }

        // Will be something like:
        // App Resource: android.resource://com.example.app/raw/mySound
        return new Uri.Builder()
            // Scheme: android.resource
            .scheme(ContentResolver.SCHEME_ANDROID_RESOURCE)
            // Authority: com.example.app (for the App)
            .authority(resources.getResourcePackageName(resourceId))
            // Resource directory: raw
            .appendPath(resources.getResourceTypeName(resourceId))
            // Resource name: mySound
            .appendPath(resources.getResourceEntryName(resourceId))
            .build();
    }

    /**
     * Get the resource Id for a given resourceType. Searches in the App resources first, then in the system resources.
     * @param resourcePath Resource path, for e.g. "res://mySound", "res://myImage.png", etc.
     * @param resourceType Can be {@link AssetUtil#RESOURCE_TYPE_DRAWABLE} or {@link AssetUtil#RESOURCE_TYPE_RAW}
     * @return The resource ID or 0 if not found.
     */
    public int getResourceId(String resourcePath, int resourceType) {
        // Get resource from App
        int resourceId = getResourceId(context.getResources(), resourcePath, resourceType);
        
        // Get resource from system, if not found
        if (resourceId == 0) return getResourceId(Resources.getSystem(), resourcePath, resourceType);

        return resourceId;
    }

    /**
     * Get the resource Id for a given resourceType.
     * @param resources The resources where to look for, can be {@link Context#getResources()} or {@link Resources#getSystem()}
     * @param resourcePath The path of the resource, for e.g. "res://mySound", "res://myImage.png", etc.
     * @param resourceType Can be {@link AssetUtil#RESOURCE_TYPE_DRAWABLE} or {@link AssetUtil#RESOURCE_TYPE_RAW}
     * @return The resource ID or 0 if not found.
     */
    public int getResourceId(Resources resources, String resourcePath, int resourceType) {
        if (resourceType == RESOURCE_TYPE_DRAWABLE) {
            // Try first in drawable
            int resourceId = getResourceId(resources, resourcePath, "drawable");

            // Try in mipmap if not found
            if (resourceId == 0) {
                resourceId = getResourceId(resources, resourcePath, "mipmap");
            }

            return resourceId;

            // Get sound, video, etc.
        } else if (resourceType == RESOURCE_TYPE_RAW) {
            return getResourceId(resources, resourcePath, "raw");
        }

        // Resource type unknown
        Log.e(TAG, "Unknown resource type: " + resourceType);
        return 0;
    }

    /**
     * Get the resource Id. Searches in a given resource directory and resources.
     * @param resources The resources where to look for, can be {@link Context#getResources()} or {@link Resources#getSystem()}
     * @param resourcePath The path of the resource, for e.g. "res://mySound", "res://myImage.png", etc.
     * @param resourceDirectory The directory of the resource, for e.g. "mipmap", "drawable", "raw", etc.
     * @return The resource ID or 0 if not found.
     */
    public int getResourceId(Resources resources, String resourcePath, String resourceDirectory) {
        return resources.getIdentifier(getResourceName(resourcePath), resourceDirectory, getPackageName(resources));
    }

    /**
     * Gets the resource name from the path.
     * @param resourcePath Resource path as string.
     */
    public static String getResourceName(String resourcePath) {
        String resourceName = resourcePath;

        // Get the filename without the path
        if (resourceName.contains("/")) {
            resourceName = resourceName.substring(resourceName.lastIndexOf('/') + 1);
        }

        // Remove file extension
        if (resourceName.contains(".")) {
            resourceName = resourceName.substring(0, resourceName.lastIndexOf('.'));
        }

        return resourceName;
    }

    /**
     * Package name specified by the resource bundle.
     * @return "android" if system resources are used, otherwise the package name of the app.
     */
    private String getPackageName(Resources resources) {
        return resources == Resources.getSystem() ? "android" : context.getPackageName();
    }

    /**
     * Shared Uri for an asset file.
     * Copies the asset file to the shared directory [App path]/files/shared_files, to make it accessible
     * through a content:// Uri.
     * @param assetPath Path like www/myFile.png or file://myFile.png
     * @return content:// Uri pointing to the shared asset file in [App path]/files/shared_files.
     * E.g. content://com.example.app.localnotifications.provider/shared_files/www/myAssetFile.png
     */
    private Uri getSharedUriForAssetFile(String assetPath) {
        // Change file:// to www folder
        assetPath = assetPath.replaceFirst("file://", "www/");

        // Create all directories specified by the asset path
        File sharedDirectory = new File(
            getSharedDirectory(), 
            // www/my/subfolder
            assetPath.substring(0, assetPath.lastIndexOf('/')));
        
        // Create sub directories for the shared directory
        sharedDirectory.mkdirs();

        // Get the asset file to copy to the shared directory
        String assetFilename = assetPath.substring(assetPath.lastIndexOf('/') + 1);
        File sharedAssetFile = new File(sharedDirectory, assetFilename);

        try {
            copyFile(context.getAssets().open(assetPath), new FileOutputStream(sharedAssetFile));
        } catch (Exception exception) {
            Log.e(TAG, "File not found: " + assetPath, exception);
            return Uri.EMPTY;
        }

        return getSharedUri(sharedAssetFile);
    }

    /**
     * Get the content:// Uri for a shared file.
     * @param sharedFile The file to get the Uri from
     * @return E.g. content://com.example.app.localnotifications.provider/shared_files/mySharedFile.png
     * or Uri.EMPTY if the file is outside the paths supported by the provider.
     */
    private Uri getSharedUri(File sharedFile) {
        try {
            return PluginFileProvider.getUriForFile(context, context.getPackageName() + ".localnotifications.provider", sharedFile);

            // When the given sharedFile is outside the paths supported by the provider.
        } catch (IllegalArgumentException exception) {
            Log.e(TAG, "sharedFile is outside the paths supported by the provider: " + sharedFile.getAbsolutePath(), exception);
            return Uri.EMPTY;
        }
    }

    /**
     * Get the shared directory for the app, defined by the file provider paths.
     */
    public File getSharedDirectory() {
        return new File(context.getFilesDir(), "shared_files");
    }

    /**
     * Convert URI to Bitmap.
     *
     * @param uri Internal image URI
     */
    public Bitmap getIconFromUri(Uri uri) throws IOException {
        return BitmapFactory.decodeStream(context.getContentResolver().openInputStream(uri));
    }

    /**
     * Convert a bitmap to a circular bitmap.
     * This code has been extracted from the Phonegap Plugin Push plugin:
     * https://github.com/phonegap/phonegap-plugin-push
     *
     * @param bitmap Bitmap to convert.
     * @return Circular bitmap.
     */
    public static Bitmap getCircleBitmap(Bitmap bitmap) {
        if (bitmap == null) return null;

        final Bitmap output = Bitmap.createBitmap(bitmap.getWidth(), bitmap.getHeight(), Bitmap.Config.ARGB_8888);
        final Canvas canvas = new Canvas(output);
        final int color = Color.RED;
        final Paint paint = new Paint();
        final Rect rect = new Rect(0, 0, bitmap.getWidth(), bitmap.getHeight());
        final RectF rectF = new RectF(rect);

        paint.setAntiAlias(true);
        canvas.drawARGB(0, 0, 0, 0);
        paint.setColor(color);
        float cx = bitmap.getWidth() / 2;
        float cy = bitmap.getHeight() / 2;
        float radius = cx < cy ? cx : cy;
        canvas.drawCircle(cx, cy, radius, paint);

        paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
        canvas.drawBitmap(bitmap, rect, rect, paint);

        bitmap.recycle();

        return output;
    }

    /**
     * Copy content from input stream into output stream.
     *
     * @param in  The input stream.
     * @param out The output stream.
     */
    public static void copyFile(InputStream in, FileOutputStream out) {
        byte[] buffer = new byte[1024];
        int read;

        try {
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
            out.flush();
            out.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
