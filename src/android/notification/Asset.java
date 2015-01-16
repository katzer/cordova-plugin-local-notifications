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

package de.appplant.cordova.plugin.notification;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.res.AssetManager;
import android.content.res.Resources;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.StrictMode;
import android.util.Log;


public class Asset {
	private Activity activity;
	protected final String STORAGE_FOLDER;
	
	/**
	 * Constructor of Asset Class. Takes Applications Activity and a foldername for temporary saving.
	 *
	 *@param activity Applications Activity
	 *@param storageFolder foldername for temporary saving.
	 */
	public Asset(Activity activity,String storageFolder){
		this.activity = activity;
		this.STORAGE_FOLDER = storageFolder;
	}
	
	/**
	 * Parse given PathStrings to Uris
	 * @param notification Notifications JSONObject
	 * @return	new Notification JSONObject with additional iconUri and soundUri
	 */
    public JSONObject parseURIs(JSONObject notification){
    	//sound
        String sound = notification.optString("sound", null);	
        Uri soundUri = null;
        if (sound != null) {
            try {
                int soundId = (Integer) RingtoneManager.class.getDeclaredField(sound).get(Integer.class);

                soundUri = RingtoneManager.getDefaultUri(soundId);
            } catch (Exception e) {
            	soundUri = getURIfromPath(sound);
            }
        }
        if (soundUri!= null&&soundUri!=Uri.EMPTY){
        	try{
        		notification.put("soundUri", soundUri.toString());
        	} catch (JSONException jse){
        		jse.printStackTrace();
        	}
        }
    	//image
        String icon = notification.optString("icon", "icon");
        Uri iconUri = null;
        iconUri = getURIfromPath(icon);
        if (iconUri != Uri.EMPTY&&iconUri != null){
        	try{
        		notification.put("iconUri", iconUri.toString());
        	} catch (JSONException jse){
        		jse.printStackTrace();
        	}
        }
        return notification;
    }
	
	/**
	 * The URI for a path.
	 * 
	 * @param path The given path
	 * 
	 * @return The URI pointing to the given path
	 */
    public Uri getURIfromPath(String path){
		if (path.startsWith("res:")) {
			return getUriForResourcePath(path);
		} else if (path.startsWith("file:///")) {
			return getUriForAbsolutePath(path);
		} else if (path.startsWith("file://")) {
			return getUriForAssetPath(path);
		} else if (path.startsWith("http")){
			return getUriForHTTP(path);
		}
		return Uri.EMPTY;
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
			Log.e("Asset", "File not found: " + file.getAbsolutePath());
			return Uri.EMPTY;
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
		File dir = 		activity.getExternalCacheDir();
		if (dir == null) {
			Log.e("Asset", "Missing external cache dir");
			return Uri.EMPTY;
		}
		String storage = dir.toString() + STORAGE_FOLDER;
		File file = new File(storage, fileName);
		new File(storage).mkdir();
		try {
			AssetManager assets = activity.getAssets();
			FileOutputStream outStream = new FileOutputStream(file);
			InputStream inputStream = assets.open(resPath);
			copyFile(inputStream, outStream);
			outStream.flush();
			outStream.close();
			return Uri.fromFile(file);
		} catch (Exception e) {
			Log.e("Asset", "File not found: assets/" + resPath);
			e.printStackTrace();
		}
		return Uri.EMPTY;
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
		File dir = activity.getExternalCacheDir();
		if (dir == null) {
			Log.e("Asset", "Missing external cache dir");
			return Uri.EMPTY;
		}
		String storage = dir.toString() + STORAGE_FOLDER;
		int resId = getResId(resPath);
		File file = new File(storage, resName + extension);
		if (resId == 0) {
			Log.e("Asset", "File not found: " + resPath);
			return Uri.EMPTY;
		}
		new File(storage).mkdir();
		try {
			Resources res = activity.getResources();
			FileOutputStream outStream = new FileOutputStream(file);
			InputStream inputStream = res.openRawResource(resId);
			copyFile(inputStream, outStream);
			outStream.flush();
			outStream.close();
			return Uri.fromFile(file);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return Uri.EMPTY;
	}
	
	/**
	 *Get Uri for HTTP Content
	 * @param path HTTP adress
	 * @return Uri of the downloaded file
	 */
	private Uri getUriForHTTP(String path) {
        try {
			URL url = new URL(path);
			String fileName = path.substring(path.lastIndexOf('/') + 1);
			String resName = fileName.substring(0, fileName.lastIndexOf('.'));
			String extension = path.substring(path.lastIndexOf('.'));
			File dir = activity.getExternalCacheDir();
			if (dir == null) {
				Log.e("Asset", "Missing external cache dir");
				return Uri.EMPTY;
			}
			String storage = dir.toString() + STORAGE_FOLDER;
			File file = new File(storage, resName + extension);
			new File(storage).mkdir();
			
			HttpURLConnection connection = (HttpURLConnection) url.openConnection();

			StrictMode.ThreadPolicy policy =
			        new StrictMode.ThreadPolicy.Builder().permitAll().build();

			StrictMode.setThreadPolicy(policy);

			connection.setDoInput(true);
			connection.connect();

			InputStream input = connection.getInputStream();
			FileOutputStream outStream = new FileOutputStream(file);		
			copyFile(input, outStream);
			outStream.flush();
			outStream.close();
			
			return Uri.fromFile(file);
		} catch (MalformedURLException e) {
			Log.e("Asset", "Incorrect URL");			
			e.printStackTrace();
		} catch (FileNotFoundException e) {
			Log.e("Asset", "Failed to create new File from HTTP Content");
			e.printStackTrace();
		} catch (IOException e) {
			Log.e("Asset", "No Input can be created from http Stream");
			e.printStackTrace();
		}
        return Uri.EMPTY;
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
		Resources res = activity.getResources();
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
		return activity.getPackageName();
	}

}
