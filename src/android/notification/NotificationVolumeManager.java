package de.appplant.cordova.plugin.notification;

import android.annotation.SuppressLint;
import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.media.AudioManager;
import android.util.Log;

import java.util.Timer;
import java.util.TimerTask;

import static android.os.Build.VERSION.SDK_INT;
import static android.os.Build.VERSION_CODES.M;
import static java.lang.Thread.sleep;

/**
 * Class to handle all notification volume changes
 */
public class NotificationVolumeManager {
    /**
     * Amount of time to sleep while polling to see if all volume writers are closed.
     */
    final private int VOLUME_WRITER_POLLING_DURATION = 200;

    /**
     * Key for volume writer counter in shared preferences
     */
    final private String VOLUME_CONFIG_WRITER_COUNT_KEY = "volumeConfigWriterCount";

    /**
     * Tag for logs
     */
    final String TAG = "NotificationVolumeMgr";

    /**
     * Notification manager
     */
    private NotificationManager notificationManager;

    /**
     * Audio Manager
     */
    private AudioManager audioManager;

    /**
     * Shared preferences, used to store settings across processes
     */
    private SharedPreferences settings;

    /**
     * Options for the notification
     */
    private Options options;

    /**
     * Initialize the NotificationVolumeManager
     * @param context Application context
     */
    public NotificationVolumeManager (Context context, Options options) {
        this.settings = context.getSharedPreferences(context.getPackageName(), Context.MODE_PRIVATE);
        this.notificationManager = (NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        this.audioManager = (AudioManager)context.getSystemService(Context.AUDIO_SERVICE);
        this.options = options;
    }

    /**
     * Ensure that this is the only volume writer.
     * Wait until others have closed.
     * TODO: Better locking mechanism to ensure concurrency (file lock?)
     * @throws InterruptedException Throws an interrupted exception, required by sleep call.
     */
    @SuppressLint("ApplySharedPref")
    private void ensureOnlyVolumeWriter () throws InterruptedException {
        int writerCount = settings.getInt(VOLUME_CONFIG_WRITER_COUNT_KEY, 0) + 1;
        settings.edit().putInt(VOLUME_CONFIG_WRITER_COUNT_KEY, writerCount).commit();

        int resetDelay = options.getResetDelay();
        if (resetDelay == 0) {
            resetDelay = Options.DEFAULT_RESET_DELAY;
        }

        int resetDelayMs = resetDelay * 1000;
        int sleepTotal = 0;

        // Wait until we are the only writer left.
        while(writerCount > 1) {
            if (sleepTotal > resetDelayMs) {
                throw new InterruptedException("Volume writer timeout exceeded reset delay." +
                    "Something must have gone wrong. Reset volume writer counts to 0 " +
                    "and reset volume settings to user settings.");
            }

            sleep(VOLUME_WRITER_POLLING_DURATION);
            sleepTotal += VOLUME_WRITER_POLLING_DURATION;

            writerCount = settings.getInt(VOLUME_CONFIG_WRITER_COUNT_KEY, 0);
        }
    }

    /**
     * Remove one count from active volume writers.  Used when writer is finished.
     */
    @SuppressLint("ApplySharedPref")
    private void decrementVolumeWriter () {
        int writerCount = settings.getInt(VOLUME_CONFIG_WRITER_COUNT_KEY, 0) - 1;
        settings.edit().putInt(VOLUME_CONFIG_WRITER_COUNT_KEY, Math.max(writerCount, 0)).commit();
    }

    /**
     * Reset volume writer counts to 0.  To be used in error conditions.
     */
    @SuppressLint("ApplySharedPref")
    private void resetVolumeWriter () {
        settings.edit().putInt(VOLUME_CONFIG_WRITER_COUNT_KEY, 0).commit();
    }

    /**
     * Set the volume for our ringer
     * @param ringerMode ringer mode enum.  Normal ringer or vibration.
     * @param volume volume.
     */
    private void setVolume (int ringerMode, int volume) {
        // After delay, user could have set phone to do not disturb.
        //  If so and we can't change the ringer, quit so we don't create an error condition
        if (canChangeRinger()) {
            // Change ringer mode
            audioManager.setRingerMode(ringerMode);

            // Change to new Volume
            audioManager.setStreamVolume(AudioManager.STREAM_NOTIFICATION, volume, AudioManager.FLAG_REMOVE_SOUND_AND_VIBRATE);
        }
    }

    /**
     * Set the volume to the last user settings from shared preferences.
     */
    private void setVolumeToUserSettings () {
        int ringMode = settings.getInt("userRingerMode", -1);
        int volume = settings.getInt("userVolume", -1);

        setVolume(ringMode, volume);
    }

    /**
     * Figure out if we can change the ringer.
     * In Android M+, we can't change out of do not disturb if we don't have explicit permission.
     * @return whether or not we can change the ringer.
     */
    private boolean canChangeRinger() {
        return SDK_INT < M || notificationManager.isNotificationPolicyAccessGranted()
            || audioManager.getRingerMode() != AudioManager.RINGER_MODE_SILENT;
    }

    /**
     * Adjusts alarm Volume
     *      Options object.  Contains our volume, reset and vibration settings.
     */
    @SuppressLint("ApplySharedPref")
    public void adjustAlarmVolume () {
        Integer volume = options.getVolume();

        if (volume.equals(Options.VOLUME_NOT_SET) || !canChangeRinger()) {
            return;
        }

        try {
            ensureOnlyVolumeWriter();

            boolean vibrate = options.isWithVibration();

            int delay = options.getResetDelay();

            if (delay <= 0) {
                delay = Options.DEFAULT_RESET_DELAY;
            }

            // Count of all alarms currently sounding
            Integer count = settings.getInt("alarmCount", 0);
            settings.edit().putInt("alarmCount", count + 1).commit();

            // Get current phone volume
            int userVolume = audioManager.getStreamVolume(AudioManager.STREAM_NOTIFICATION);

            // Get Ringer mode
            int userRingerMode = audioManager.getRingerMode();

            // If this is the first alarm store the users ringer and volume settings
            if (count.equals(0)) {
                settings.edit().putInt("userVolume", userVolume).apply();
                settings.edit().putInt("userRingerMode", userRingerMode).apply();
            }

            // Calculates a new volume based on the study configure volume percentage and the devices max volume integer
            if (volume > 0) {
                // Gets devices max volume integer
                int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_NOTIFICATION);

                // Calculates new volume based on devices max volume
                double newVolume = Math.ceil(maxVolume * (volume / 100.00));

                setVolume(AudioManager.RINGER_MODE_NORMAL, (int) newVolume);
            } else {
                // Volume of 0
                if (vibrate) {
                    // Change mode to vibrate
                    setVolume(AudioManager.RINGER_MODE_VIBRATE, 0);
                }
            }

            // Timer to change users sound back
            Timer timer = new Timer();
            timer.schedule(new TimerTask() {
                public void run() {
                    int currentCount = settings.getInt("alarmCount", 0);
                    currentCount = Math.max(currentCount - 1, 0);
                    settings.edit().putInt("alarmCount", currentCount).apply();

                    if (currentCount == 0) {
                        setVolumeToUserSettings();
                    }
                }
            }, delay * 1000);
        } catch (InterruptedException e) {
            Log.e(TAG, "interrupted waiting for volume set. "
                + "Reset to user setting, and set counts to 0: " + e.toString());
            resetVolumeWriter();
            setVolumeToUserSettings();
        } finally {
            decrementVolumeWriter();
        }
    }
}
