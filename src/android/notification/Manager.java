package de.appplant.cordova.plugin.notification;

import java.util.Date;
import java.util.Map;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.os.Build;

public class Manager {	
    //---------------Global Parameter------------------------------------------------------------
	private Context context;
	private final String PLUGIN_NAME;
	
    //---------------Constructor-----------------------------------------------------------------
	/**
	 * Constructor of NotificationWrapper-Class
	 */
	public Manager(Context context,String PluginName){
		this.context = context;
		this.PLUGIN_NAME = PluginName;
	}
	
    //---------------Public Functions------------------------------------------------------------
	/**
     * Checks if a notification with an ID is scheduled.
     *
     * @param id
     *          The notification ID to be check.
     * @return true if the notification is scheduled
     */
    public boolean isScheduled (String id) {
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        boolean isScheduled        = alarms.containsKey(id);
        boolean isNotTriggered	   = false;
        
        if (isScheduled) {
        	JSONObject arguments;
			try {
				arguments = new JSONObject(alarms.get(id).toString());
	        	Options options      = new Options(context).parse(arguments);
	        	Date fireDate        = new Date(options.getDate());
	        	isNotTriggered = new Date().before(fireDate);
			} catch (JSONException e) {
				isNotTriggered = false;
				e.printStackTrace();
			}
        	
        }
        
        return (isScheduled && isNotTriggered);
    }
    
    /**
     * Checks if a notification with an ID was triggered.
     *
     * @param id
     *          The notification ID to be check.
     * @return true if the notification is triggered
     */
    public boolean isTriggered (String id) {
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        boolean isScheduled        = alarms.containsKey(id);
        boolean isTriggered        = isScheduled;

        if (isScheduled) {
        	JSONObject arguments;
			try {
				arguments = new JSONObject(alarms.get(id).toString());
	        	Options options      = new Options(context).parse(arguments);
	        	Date fireDate        = new Date(options.getInitialDate());
	        	isTriggered = new Date().after(fireDate);
			} catch (JSONException e) {
				isTriggered = false;
				e.printStackTrace();
			}
        	
        }
        return isTriggered;
    }
    /**
     * Checks whether a notification with an ID exist.
     *
     * @param id
     *          The notification ID to check.
     * @return true if the notification exist
     */
    public boolean exist(String id){
    	boolean exist;
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        exist = alarms.containsKey(id);
    	return exist;
    }

    /**
     * Retrieves a list with all currently pending notification Ids.
     *
     * @return JSONArray with all Id-Strings
     */
    public JSONArray getScheduledIds () {
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();
        JSONArray scheduledIds     = new JSONArray();
        
        for (String id : alarmIds) {
        	boolean isScheduled;
        	JSONObject arguments;
 			try {
 				arguments = new JSONObject(alarms.get(id).toString());
 	        	Options options      = new Options(context).parse(arguments);
 	        	Date fireDate        = new Date(options.getDate());
 	        	isScheduled = new Date().before(fireDate);
 			} catch (JSONException e) {
 				isScheduled = false;
 				e.printStackTrace();
 			}
 			if (isScheduled){
 				scheduledIds.put(id);
 			}
        }

        
        
        return scheduledIds;
    }



    /**
     * Retrieves a list with all currently triggered notification Ids.
     *
     * @return JSONArray with all Id-Strings
     */
    public JSONArray getTriggeredIds () {
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();
        JSONArray triggeredIds     = new JSONArray();
        Date now                   = new Date();

        for (String id : alarmIds) {
        	boolean isTriggered;
        	JSONObject arguments;
        	try{
        		arguments = new JSONObject(alarms.get(id).toString());
        		Options options      = new Options(context).parse(arguments);
        		Date fireDate        = new Date(options.getInitialDate());
        		isTriggered  = now.after(fireDate);
            } catch(ClassCastException cce) {
            	cce.printStackTrace();
            	isTriggered = false;
            } catch(JSONException jse) {
        		jse.printStackTrace();
            	isTriggered = false;
            }

            if (isTriggered == true) {
                triggeredIds.put(id);
            }
        }

        return triggeredIds;
    }
    
    /**
     * Retrieves a list with all currently triggered or scheduled notification-Ids.
     * @return JSONArray with all Id-Strings
     */
    public JSONArray getAllIds (){
        JSONArray allIds     = new JSONArray();
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();
        for (String id : alarmIds) {
        	allIds.put(id);
        }
        return allIds;
    }
    
    /**
     * Retrieves a list with all currently pending notification JSONObject.
     *
     * @return JSONArray with all notification-JSONObjects
     */
    public JSONArray getAll(){
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();
        JSONArray all     = new JSONArray();

        for (String id : alarmIds) {
        	JSONObject arguments;
        	try{
        		arguments = new JSONObject(alarms.get(id).toString());
        		all.put(arguments);
        	} catch(JSONException jse) {
        		jse.printStackTrace();
            }
        }
        return all;
    }
    /**
     * Retrieves a list with all currently scheduled notification-JSONObjects.
     *
     * @return JSONArray with all notification-JSONObjects
     */
    public JSONArray getScheduled(){
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();
        JSONArray scheduled     = new JSONArray();
        
        for (String id : alarmIds) {
        	boolean isScheduled;
        	JSONObject arguments = null;
 			try {
 				arguments = new JSONObject(alarms.get(id).toString());
 	        	Options options      = new Options(context).parse(arguments);
 	        	Date fireDate        = new Date(options.getDate());
 	        	isScheduled = new Date().before(fireDate);
 			} catch (JSONException e) {
 				isScheduled = false;
 				e.printStackTrace();
 			}
 			if (isScheduled){
 				scheduled.put(arguments);
 			}
        }

        
        
        return scheduled;
    	
    }
    
    /**
     * Retrieves a list with all currently triggered notification-JSONObjects.
     *
     * @return JSONArray with all notification-JSONObjects
     */
    public JSONArray getTriggered(){
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();
        JSONArray triggered     = new JSONArray();
        Date now                   = new Date();

        for (String id : alarmIds) {
        	boolean isTriggered;
        	JSONObject arguments = null;
        	try{
        		arguments = new JSONObject(alarms.get(id).toString());
        		Options options      = new Options(context).parse(arguments);
        		Date fireDate        = new Date(options.getInitialDate());
        		isTriggered  = now.after(fireDate);
            } catch(ClassCastException cce) {
            	cce.printStackTrace();
            	isTriggered = false;
            } catch(JSONException jse) {
        		jse.printStackTrace();
            	isTriggered = false;
            }

            if (isTriggered == true) {
                triggered.put(arguments);
            }
        }

        return triggered;
    }
    
    
    /**
     * Retrieves a list with all currently pending notification JSONObjects that matches with the given String-Array
     *
     * @return JSONArray with notification-JSONObjects 
     */
    public JSONArray getAll(JSONArray ids){
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();
        JSONArray all     = new JSONArray();
        for (String id : alarmIds) {
        	for(int i=0;i<ids.length();i++){
        		if(ids.optString(i).equals(id)){
		        	JSONObject arguments;
		        	try{
		        		arguments = new JSONObject(alarms.get(id).toString());
		        		all.put(arguments);
		        	} catch(JSONException jse) {
		        		jse.printStackTrace();
		            }
        		}
        	}
        }
        return all;
    }
    /**
     * Retrieves a list with all currently scheduled notification-JSONObjects.
     *
     * @return JSONArray with all notification-JSONObjects
     */
    public JSONArray getScheduled(JSONArray ids){
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();
        JSONArray scheduled     = new JSONArray();
        boolean isScheduled;
        
        for (String id : alarmIds) {
        	for(int i=0;i<ids.length();i++){
        		if(ids.optString(i).equals(id)){
		        	JSONObject arguments = null;
		 			try {
		 				arguments = new JSONObject(alarms.get(id).toString());
		 	        	Options options      = new Options(context).parse(arguments);
		 	        	Date fireDate        = new Date(options.getDate());
		 	        	isScheduled = new Date().before(fireDate);
		 			} catch (JSONException e) {
		 				isScheduled = false;
		 				e.printStackTrace();
		 			}
		 			if (isScheduled){
		 				scheduled.put(arguments);
		 			}
        		}
        	}
        }

        
        
        return scheduled;
    	
    }
    
    /**
     * Retrieves a list with all currently triggered notification-JSONObjects.
     *
     * @return JSONArray with all notification-JSONObjects
     */
    public JSONArray getTriggered(JSONArray ids){
        SharedPreferences settings = getSharedPreferences();
        Map<String, ?> alarms      = settings.getAll();
        Set<String> alarmIds       = alarms.keySet();
        JSONArray triggered     = new JSONArray();
        Date now                   = new Date();

        for (String id : alarmIds) {
        	for(int i=0;i<ids.length();i++){
        		if(ids.optString(i).equals(id)){
		        	boolean isTriggered;
		        	JSONObject arguments = null;
		        	try{
		        		arguments = new JSONObject(alarms.get(id).toString());
		        		Options options      = new Options(context).parse(arguments);
		        		Date fireDate        = new Date(options.getInitialDate());
		        		isTriggered  = now.after(fireDate);
		            } catch(ClassCastException cce) {
		            	cce.printStackTrace();
		            	isTriggered = false;
		            } catch(JSONException jse) {
		        		jse.printStackTrace();
		            	isTriggered = false;
		            }
		
		            if (isTriggered == true) {
		                triggered.put(arguments);
		            }
        		}
        	}
        }

        return triggered;
    }
    
    
    
    //---------------Manage Shared Preferences---------------------------------------------------
    
    /**
     * The Local storage for the application.
     */
    private SharedPreferences getSharedPreferences () {
        return context.getSharedPreferences(PLUGIN_NAME, Context.MODE_PRIVATE);
    }
    
    /**
     * Persist the information of this alarm to the Android Shared Preferences.
     * This will allow the application to restore the alarm upon device reboot.
     * Also this is used by the cancelAll method.
     *
     * @param alarmId
     *            The Id of the notification that must be persisted.
     * @param args
     *            The assumption is that parse has been called already.
     */
    public void persist (String alarmId, JSONObject args) {
        Editor editor = getSharedPreferences().edit();

        if (alarmId != null) {
            editor.putString(alarmId, args.toString());
            if (Build.VERSION.SDK_INT<9) {
                editor.commit();
            } else {
                editor.apply();
            }
        }
    }
    
    /**
     * Remove a specific alarm from the Android shared Preferences.
     *
     * @param alarmId
     *            The Id of the notification that must be removed.
     */
    public void unpersist (String alarmId) {
        Editor editor = getSharedPreferences().edit();

        if (alarmId != null) {
            editor.remove(alarmId);
            if (Build.VERSION.SDK_INT<9) {
                editor.commit();
            } else {
                editor.apply();
            }
        }
    }


}
