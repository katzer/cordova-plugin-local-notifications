/*
 * Apache 2.0 License
 *
 * Copyright (c) Sebastian Katzer 2017
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

package de.appplant.cordova.plugin.notification.util;

import java.util.HashMap;
import java.util.Random;

import org.apache.cordova.CallbackContext;

/**
 * Utils class to handle callback contexts.
 * Most of the code in this class was copied from the Diagnostic plugin: https://github.com/dpa99c/cordova-diagnostic-plugin
 */
public final class CallbackContextUtil {

    // Map of permission request code to callback context.
    protected static HashMap<Integer, CallbackContext> callbackContexts = new HashMap<Integer, CallbackContext>();

    /**
     * Constructor
     */
    private CallbackContextUtil() {
    }

    /**
     * Gets a callback context.
     *
     * @param requestId Request ID.
     * @return Callback context.
     */
    public static CallbackContext getContext(int requestId) throws Exception {
        if (!callbackContexts.containsKey(requestId)) {
            throw new Exception("No context found for request id=" + requestId);
        }

        return callbackContexts.get(requestId);
    }

    /**
     * Store a callback context.
     *
     * @param callbackContext Context to store.
     * @return Random request ID.
     */
    public static int storeContext(CallbackContext callbackContext){
        Integer requestId = generateRandomRequestId();
        callbackContexts.put(requestId, callbackContext);

        return requestId;
    }

    /**
     * Removes a callback context.
     *
     * @param requestId Request ID.
     */
    public static void clearContext(int requestId) {
        if (!callbackContexts.containsKey(requestId)) {
            return;
        }

        callbackContexts.remove(requestId);
    }

    /**
     * Generate a random request ID.
     *
     * @return Random request ID.
     */
    private static Integer generateRandomRequestId() {
        Integer requestId = null;

        while (requestId == null) {
            requestId = generateRandom();
            if (callbackContexts.containsKey(requestId)) {
                requestId = null;
            }
        }

        return requestId;
    }

    /**
     * Generate a random number.
     *
     * @return Random number.
     */
    private static Integer generateRandom() {
        Random rn = new Random();

        return rn.nextInt(1000000) + 1;
    }

}
