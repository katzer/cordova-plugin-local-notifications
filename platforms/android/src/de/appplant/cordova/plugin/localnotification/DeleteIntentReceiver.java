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

import java.util.Date;

import org.json.JSONException;
import org.json.JSONObject;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

public class DeleteIntentReceiver extends BroadcastReceiver {

    public static final String OPTIONS = "LOCAL_NOTIFICATION_OPTIONS";
	
	@Override
	public void onReceive(Context context, Intent intent) {
        Options options = null;
        Bundle bundle   = intent.getExtras();
        JSONObject args;

        try {
            args    = new JSONObject(bundle.getString(OPTIONS));
            options = new Options(context).parse(args);
        } catch (JSONException e) {
            return;
        }

        // The context may got lost if the app was not running before
        LocalNotification.setContext(context);
        
        Date now = new Date();
		if ((options.getInterval()!=0)){
			LocalNotification.persist(options.getId(), setInitDate(args));
		}
		else if((new Date(options.getDate()).before(now))){
			LocalNotification.unpersist(options.getId());
		}
		
		fireClearEvent(options);
	}
	
	private JSONObject setInitDate(JSONObject arguments){
    	long initialDate = arguments.optLong("date", 0) * 1000;
    	try {
    		arguments.put("initialDate", initialDate);
		} catch (JSONException e) {
			e.printStackTrace();
		}
    	return arguments;
    }
	
    /**
     * Fires onclear event.
     */
    private void fireClearEvent (Options options) {
        LocalNotification.fireEvent("clear", options.getId(), options.getJSON());
    }

}
