/*
    Copyright 2013-2014 appPlant UG

    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

package de.appplant.cordova.plugin.localnotification;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Calendar;
import java.util.Date;

import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.app.AlarmManager;
import android.content.Context;
import android.content.res.AssetManager;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.StrictMode;
import android.os.StrictMode.ThreadPolicy;
import android.util.Log;

/**
 * Class that helps to store the options that can be specified per alarm.
 */
public class Options {
	static protected final String STORAGE_FOLDER = "/localnotification";
    private JSONObject options = new JSONObject();
    private String packageName = null;
    private long interval      = 0;

    Options (Activity activity) {
        packageName = activity.getPackageName();
    }

    Options (Context context) {
        packageName = context.getPackageName();
    }

    /**
     * Parses the given properties
     */
    public Options parse (JSONObject options) {
        String repeat = options.optString("repeat");

        this.options = options;

        if (repeat.equalsIgnoreCase("secondly")) {
            interval = 1000;
        } if (repeat.equalsIgnoreCase("minutely")) {
            interval = AlarmManager.INTERVAL_FIFTEEN_MINUTES / 15;
        } if (repeat.equalsIgnoreCase("hourly")) {
            interval = AlarmManager.INTERVAL_HOUR;
        } if (repeat.equalsIgnoreCase("daily")) {
            interval = AlarmManager.INTERVAL_DAY;
        } else if (repeat.equalsIgnoreCase("weekly")) {
            interval = AlarmManager.INTERVAL_DAY*7;
        } else if (repeat.equalsIgnoreCase("monthly")) {
            interval = AlarmManager.INTERVAL_DAY*31; // 31 days
        } else if (repeat.equalsIgnoreCase("yearly")) {
            interval = AlarmManager.INTERVAL_DAY*365;
        } else {
            try {
                interval = Integer.parseInt(repeat) * 60000;
            } catch (Exception e) {};
        }

        return this;
    }

    /**
     * Set new time according to interval
     */
    public Options moveDate () {
        try {
            options.put("date", (getDate() + interval) / 1000);
        } catch (JSONException e) {}

        return this;
    }
    
    /**
     * Returns options as JSON object
     */
    public JSONObject getJSONObject() {
        return options;
    }

    /**
     * Returns time in milliseconds when notification is scheduled to fire
     */
    public long getDate() {
        return options.optLong("date", 0) * 1000;
    }
    
    /**
     * Returns time in milliseconds when the notification was scheduled first
     */
    public long getInitialDate() {
    	return options.optLong("initialDate", 0);
    }

    /**
     * Returns time as calender
     */
    public Calendar getCalendar () {
        Calendar calendar = Calendar.getInstance();

        calendar.setTime(new Date(getDate()));

        return calendar;
    }

    /**
     * Returns the notification's message
     */
    public String getMessage () {
        return options.optString("message", "");
    }

    /**
     * Returns the notification's title
     */
    public String getTitle () {
        return options.optString("title", "");
    }

    /**
     * Returns the path of the notification's sound file
     */
    public Uri getSound () {
        String sound = options.optString("sound", null);

        if (sound != null) {
            try {
                int soundId = (Integer) RingtoneManager.class.getDeclaredField(sound).get(Integer.class);

                return RingtoneManager.getDefaultUri(soundId);
            } catch (Exception e) {
            	return getURIfromPath(sound);
            }
        }

        return null;
    }

    /**
     * Returns the icon's ID
     */
    public Bitmap getIcon () {
        String icon = options.optString("icon", "icon");
        Bitmap bmp = null;

        if (icon.startsWith("http")) {
            bmp = getIconFromURL(icon);
        } else if (icon.startsWith("file://") || (icon.startsWith("res"))) {
            bmp = getIconFromURI(icon);
        }

        if (bmp == null) {
            bmp = getIconFromRes(icon);
        }

        return bmp;
    }

    /**
     * Returns the small icon's ID
     */
    public int getSmallIcon () {
        int resId       = 0;
        String iconName = options.optString("smallIcon", "");

        resId = getIconValue(packageName, iconName);

        if (resId == 0) {
            resId = getIconValue("android", iconName);
        }

        if (resId == 0) {
            resId = getIconValue(packageName, "icon");
        }

        return options.optInt("smallIcon", resId);
    }

    /**
     * Returns notification repetition interval (daily, weekly, monthly, yearly)
     */
    public long getInterval () {
        return interval;
    }

    /**
     * Returns notification badge number
     */
    public int getBadge () {
        return options.optInt("badge", 0);
    }

    /**
     * Returns PluginResults' callback ID
     */
    public String getId () {
        return options.optString("id", "0");
    }

    /**
     * Returns whether notification is cancelled automatically when clicked.
     */
    public Boolean getAutoCancel () {
        return options.optBoolean("autoCancel", false);
    }

    /**
     * Returns whether the notification is ongoing (uncancellable). Android only.
     */
    public Boolean getOngoing () {
        return options.optBoolean("ongoing", false);
    }

    /**
     * Returns additional data as string
     */
    public String getJSON () {
        return options.optString("json", "");
    }

    /**
     * @return
     *      The notification color for LED
     */
   public int getColor () {
        String hexColor = options.optString("led", "000000");
        int aRGB        = Integer.parseInt(hexColor,16);

        aRGB += 0xFF000000;

        return aRGB;
    }

    /**
     * Returns numerical icon Value
     *
     * @param {String} className
     * @param {String} iconName
     */
    private int getIconValue (String className, String iconName) {
        int icon = 0;

        try {
            Class<?> klass  = Class.forName(className + ".R$drawable");

            icon = (Integer) klass.getDeclaredField(iconName).get(Integer.class);
        } catch (Exception e) {}

        return icon;
    }

    /**
     * Converts an resource to Bitmap.
     *
     * @param icon
     *      The resource name
     * @return
     *      The corresponding bitmap
     */
    private Bitmap getIconFromRes (String icon) {
        Resources res = LocalNotification.context.getResources();
        int iconId = 0;

        iconId = getIconValue(packageName, icon);

        if (iconId == 0) {
            iconId = getIconValue("android", icon);
        }

        if (iconId == 0) {
            iconId = android.R.drawable.ic_menu_info_details;
        }

        Bitmap bmp = BitmapFactory.decodeResource(res, iconId);

        return bmp;
    }

    /**
     * Converts an Image URL to Bitmap.
     *
     * @param src
     *      The external image URL
     * @return
     *      The corresponding bitmap
     */
    private Bitmap getIconFromURL (String src) {
        Bitmap bmp = null;
        ThreadPolicy origMode = StrictMode.getThreadPolicy();

        try {
            URL url = new URL(src);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();

            StrictMode.ThreadPolicy policy =
                    new StrictMode.ThreadPolicy.Builder().permitAll().build();

            StrictMode.setThreadPolicy(policy);

            connection.setDoInput(true);
            connection.connect();

            InputStream input = connection.getInputStream();

            bmp = BitmapFactory.decodeStream(input);
        } catch (Exception e) {
            e.printStackTrace();
        }

        StrictMode.setThreadPolicy(origMode);

        return bmp;
    }

    /**
     * Converts an Image URI to Bitmap.
     *
     * @param src
     *      The internal image URI
     * @return
     *      The corresponding bitmap
     */
    private Bitmap getIconFromURI (String src) {
        Bitmap bmp = null;
        Uri uri = getURIfromPath(src);

        try {           
            InputStream input = LocalNotification.activity.getContentResolver().openInputStream(uri);
            bmp = BitmapFactory.decodeStream(input);
        } catch (IOException e) {
            e.printStackTrace();
        }

        return bmp;
    }
    
	/**
	 * The URI for a path.
	 * 
	 * @param path The given path
	 * 
	 * @return The URI pointing to the given path
	 */
    private Uri getURIfromPath(String path){
		if (path.startsWith("res:")) {
			return getUriForResourcePath(path);
		} else if (path.startsWith("file:///")) {
			return getUriForAbsolutePath(path);
		} else if (path.startsWith("file://")) {
			return getUriForAssetPath(path);
		}
		return Uri.parse(path);
	}
    
	/**
	 * The URI for a file.
	 * 
	 * @param path
	 *            The given absolute path
	 * 
	 * @return The URI pointing to the given path
	 */
	private Uri getUriForAbsolutePath(String path) {
		String absPath = path.replaceFirst("file://", "");
		File file = new File(absPath);
		if (!file.exists()) {
			Log.e("LocalNotifocation", "File not found: " + file.getAbsolutePath());
		}
		return Uri.fromFile(file);
	}

	/**
	 * The URI for an asset.
	 * 
	 * @param path
	 *            The given asset path
	 * 
	 * @return The URI pointing to the given path
	 */
	private Uri getUriForAssetPath(String path) {
		String resPath = path.replaceFirst("file:/", "www");
		String fileName = resPath.substring(resPath.lastIndexOf('/') + 1);
		File dir = 		LocalNotification.activity.getExternalCacheDir();
		if (dir == null) {
			Log.e("LocalNotifocation", "Missing external cache dir");
			return Uri.EMPTY;
		}
		String storage = dir.toString() + STORAGE_FOLDER;
		File file = new File(storage, fileName);
		new File(storage).mkdir();
		try {
			AssetManager assets = LocalNotification.activity.getAssets();
			FileOutputStream outStream = new FileOutputStream(file);
			InputStream inputStream = assets.open(resPath);
			copyFile(inputStream, outStream);
			outStream.flush();
			outStream.close();
		} catch (Exception e) {
			Log.e("LocalNotifocation", "File not found: assets/" + resPath);
			e.printStackTrace();
		}
		return Uri.fromFile(file);
	}

	/**
	 * The URI for a resource.
	 * 
	 * @param path
	 *            The given relative path
	 * 
	 * @return The URI pointing to the given path
	 */
	private Uri getUriForResourcePath(String path) {
		String resPath = path.replaceFirst("res://", "");
		String fileName = resPath.substring(resPath.lastIndexOf('/') + 1);
		String resName = fileName.substring(0, fileName.lastIndexOf('.'));
		String extension = resPath.substring(resPath.lastIndexOf('.'));
		File dir = LocalNotification.activity.getExternalCacheDir();
		if (dir == null) {
			Log.e("LocalNotifocation", "Missing external cache dir");
			return Uri.EMPTY;
		}
		String storage = dir.toString() + STORAGE_FOLDER;
		int resId = getResId(resPath);
		File file = new File(storage, resName + extension);
		if (resId == 0) {
			Log.e("LocalNotifocation", "File not found: " + resPath);
		}
		new File(storage).mkdir();
		try {
			Resources res = LocalNotification.activity.getResources();
			FileOutputStream outStream = new FileOutputStream(file);
			InputStream inputStream = res.openRawResource(resId);
			copyFile(inputStream, outStream);
			outStream.flush();
			outStream.close();
		} catch (Exception e) {
			e.printStackTrace();
		}
		return Uri.fromFile(file);
	}

	/**
	 * Writes an InputStream to an OutputStream
	 * 
	 * @param in
	 *            The input stream
	 * @param out
	 *            The output stream
	 */
	private void copyFile(InputStream in, OutputStream out) throws IOException {
		byte[] buffer = new byte[1024];
		int read;
		while ((read = in.read(buffer)) != -1) {
			out.write(buffer, 0, read);
		}
	}

	/**
	 * @return The resource ID for the given resource.
	 */
	private int getResId(String resPath) {
		Resources res = LocalNotification.activity.getResources();
		int resId;
		String pkgName = getPackageName();
		String dirName = "drawable";
		String fileName = resPath;
		if (resPath.contains("/")) {
			dirName = resPath.substring(0, resPath.lastIndexOf('/'));
			fileName = resPath.substring(resPath.lastIndexOf('/') + 1);
		}
		String resName = fileName.substring(0, fileName.lastIndexOf('.'));
		resId = res.getIdentifier(resName, dirName, pkgName);
		if (resId == 0) {
			resId = res.getIdentifier(resName, "drawable", pkgName);
		}
		return resId;
	}
	
	/**
	 * The name for the package.
	 * 
	 * @return The package name
	 */
	private String getPackageName() {
		return LocalNotification.activity.getPackageName();
	}
	
	/**
	 * Shows the behavior of notifications when the application is in foreground
	 * 
	 * 
	 */
	public boolean getForegroundMode(){
		return options.optBoolean("foregroundMode",false);	
	}
	
}
