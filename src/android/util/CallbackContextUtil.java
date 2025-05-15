/*
 * Apache 2.0 License
 *
 * Copyright (c) Sebastian Katzer 2017
 * Copyright (c) Manuel Beck 2025
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

import android.util.Log;
import de.appplant.cordova.plugin.localnotification.Manager;

import java.util.HashMap;

import org.apache.cordova.CallbackContext;

/**
 * Utils class to store and reuse a CallbackContext.
 * Most of the code in this class was copied from the Diagnostic plugin:
 * https://github.com/dpa99c/cordova-diagnostic-plugin
 */
public final class CallbackContextUtil {

    private static final String TAG = "CallbackContextUtil";

    // Map of permission request code to callback context.
    protected static HashMap<Integer, CallbackContext> callbackContexts = new HashMap<Integer, CallbackContext>();

    /**
     * Constructor
     */
    private CallbackContextUtil() {}

    /**
     * Gets a callback context for a request code or null if not found.
     * @return CallbackContext or null if not found.
     */
    public static CallbackContext getCallbackContext(int requestCode) {
        CallbackContext callbackContext = callbackContexts.get(requestCode);

        // Log error, if no context found
        if (callbackContexts == null) {
            Log.e(TAG, "No context found for request code=" + requestCode);
        }

        return callbackContext;
    }

    /**
     * Store a {@link CallbackContext} for later retrieval and return a random request code.
     * @return Random request code for the stored context.
     */
    public static int storeContext(CallbackContext callbackContext) {
        return storeContext(callbackContext, Manager.getRandomRequestCode());
    }

    /**
     * Store a {@link CallbackContext} for later retrieval and return the request code.
     * @return Request code for the stored context.
     */
    public static int storeContext(CallbackContext callbackContext, int requestCode){
        callbackContexts.put(requestCode, callbackContext);
        return requestCode;
    }

    /**
     * Removes the stored {@link CallbackContext} for a request code.
     */
    public static void clearContext(int requestCode) {
        if (!callbackContexts.containsKey(requestCode)) return;
        callbackContexts.remove(requestCode);
    }
}
