package nl.xservices.plugins;

import android.view.Gravity;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/*
    // TODO nice way for the Toast plugin to offer a longer delay than the default short and long options
    // TODO also look at https://github.com/JohnPersano/Supertoasts
    new CountDownTimer(6000, 1000) {
      public void onTick(long millisUntilFinished) {toast.show();}
      public void onFinish() {toast.show();}
    }.start();

    Also, check https://github.com/JohnPersano/SuperToasts
 */
public class Toast extends CordovaPlugin {

  private static final String ACTION_SHOW_EVENT = "show";
  private static final String ACTION_HIDE_EVENT = "hide";

  private android.widget.Toast mostRecentToast;

  // note that webView.isPaused() is not Xwalk compatible, so tracking it poor-man style
  private boolean isPaused;

  @Override
  public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
    if (ACTION_HIDE_EVENT.equals(action)) {
      if (mostRecentToast != null) {
        mostRecentToast.cancel();
      }
      callbackContext.success();
      return true;

    } else if (ACTION_SHOW_EVENT.equals(action)) {

      if (this.isPaused) {
        return true;
      }

      final JSONObject options = args.getJSONObject(0);

      final String message = options.getString("message");
      final String duration = options.getString("duration");
      final String position = options.getString("position");
      final int addPixelsY = options.has("addPixelsY") ? options.getInt("addPixelsY") : 0;

      cordova.getActivity().runOnUiThread(new Runnable() {
        public void run() {
          android.widget.Toast toast = android.widget.Toast.makeText(
              cordova.getActivity().getApplicationContext(),
              message,
              "short".equals(duration) ? android.widget.Toast.LENGTH_SHORT : android.widget.Toast.LENGTH_LONG);

          if ("top".equals(position)) {
            toast.setGravity(Gravity.TOP|Gravity.CENTER_HORIZONTAL, 0, 20 + addPixelsY);
          } else  if ("bottom".equals(position)) {
            toast.setGravity(Gravity.BOTTOM|Gravity.CENTER_HORIZONTAL, 0, 20 - addPixelsY);
          } else if ("center".equals(position)) {
            toast.setGravity(Gravity.CENTER_VERTICAL|Gravity.CENTER_HORIZONTAL, 0, addPixelsY);
          } else {
            callbackContext.error("invalid position. valid options are 'top', 'center' and 'bottom'");
            return;
          }

          toast.show();
          mostRecentToast = toast;
          callbackContext.success();
        }
      });

      return true;
    } else {
      callbackContext.error("toast." + action + " is not a supported function. Did you mean '" + ACTION_SHOW_EVENT + "'?");
      return false;
    }
  }

  @Override
  public void onPause(boolean multitasking) {
    if (mostRecentToast != null) {
      mostRecentToast.cancel();
    }
    this.isPaused = true;
  }

  @Override
  public void onResume(boolean multitasking) {
    this.isPaused = false;
  }
}
