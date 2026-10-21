package com.liftlab.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LiveWorkoutPlugin")
public class LiveWorkoutPlugin extends Plugin {
    public static final String PREFS_NAME = "liftlab_live_workout";
    public static final String KEY_PENDING_ACTION = "pending_action";
    public static final String KEY_ACTIVE = "active";
    public static final String KEY_EXERCISE = "exercise_name";
    public static final String KEY_SET_INFO = "set_info";
    public static final String KEY_REST_SECONDS = "rest_seconds";
    public static final String KEY_IS_RESTING = "is_resting";
    public static final String KEY_REST_END_AT = "rest_end_at";
    public static final String KEY_SET_NUMBER = "set_number";
    public static final String KEY_TOTAL_SETS = "total_sets";
    public static final String KEY_DEFAULT_REST = "default_rest";
    public static final String KEY_TARGET_WEIGHT_REPS = "target_weight_reps";
    public static final String KEY_IS_REST_FINISHED = "is_rest_finished";

    private static LiveWorkoutPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static void handleNativeAction(Context context, String action) {
        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("action", action);
            ret.put("timestamp", System.currentTimeMillis());
            instance.notifyListeners("notificationAction", ret);
        } else if (context != null) {
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                    .edit()
                    .putString(KEY_PENDING_ACTION, action)
                    .apply();
        }

        LiveWorkoutService service = LiveWorkoutService.getInstance();
        if (service != null) {
            if ("complete_set".equals(action)) {
                service.completeSet();
            } else if ("add_30s".equals(action)) {
                service.addRestSeconds(30);
            } else if ("skip_rest".equals(action)) {
                service.skipRest();
            }
        }
    }

    @PluginMethod
    public void drainPendingActions(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String pending = prefs.getString(KEY_PENDING_ACTION, null);
        JSObject ret = new JSObject();
        if (pending != null && !pending.isEmpty()) {
            prefs.edit().remove(KEY_PENDING_ACTION).apply();
            ret.put("action", pending);
            ret.put("timestamp", System.currentTimeMillis());
            notifyListeners("notificationAction", ret);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void startLiveService(PluginCall call) {
        Context context = getContext();
        String exercise = call.getString("currentExercise", "Live Workout");
        String setInfo = call.getString("currentSetInfo", "In corso");
        int restSeconds = call.getInt("restRemainingSeconds", 0);
        boolean isResting = call.getBoolean("isResting", false);
        int setNum = call.getInt("setNumber", 1);
        int totalSets = call.getInt("totalSets", 3);
        int defaultRest = call.getInt("defaultRestSeconds", 90);
        String weightReps = call.getString("weightRepsInfo", "");
        boolean isRestFinished = call.getBoolean("isRestFinished", false);

        Intent serviceIntent = new Intent(context, LiveWorkoutService.class);
        serviceIntent.putExtra(LiveWorkoutService.EXTRA_EXERCISE_NAME, exercise);
        serviceIntent.putExtra(LiveWorkoutService.EXTRA_SET_INFO, setInfo);
        serviceIntent.putExtra(LiveWorkoutService.EXTRA_REST_SECONDS, restSeconds);
        serviceIntent.putExtra(LiveWorkoutService.EXTRA_IS_RESTING, isResting);
        serviceIntent.putExtra(LiveWorkoutService.EXTRA_SET_NUMBER, setNum);
        serviceIntent.putExtra(LiveWorkoutService.EXTRA_TOTAL_SETS, totalSets);
        serviceIntent.putExtra(LiveWorkoutService.EXTRA_DEFAULT_REST, defaultRest);
        serviceIntent.putExtra(LiveWorkoutService.EXTRA_TARGET_WEIGHT_REPS, weightReps);
        serviceIntent.putExtra(LiveWorkoutService.EXTRA_IS_REST_FINISHED, isRestFinished);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to start LiveWorkoutService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void updateLiveService(PluginCall call) {
        String exercise = call.getString("currentExercise", "Live Workout");
        String setInfo = call.getString("currentSetInfo", "In corso");
        int restSeconds = call.getInt("restRemainingSeconds", 0);
        boolean isResting = call.getBoolean("isResting", false);
        int setNum = call.getInt("setNumber", 0);
        int totalSets = call.getInt("totalSets", 0);
        int defaultRest = call.getInt("defaultRestSeconds", 0);
        String weightReps = call.getString("weightRepsInfo", null);
        boolean isRestFinished = call.getBoolean("isRestFinished", false);

        LiveWorkoutService service = LiveWorkoutService.getInstance();
        if (service != null) {
            service.updateState(exercise, setInfo, restSeconds, isResting, setNum, totalSets, defaultRest, weightReps, isRestFinished);
            call.resolve();
        } else {
            startLiveService(call);
        }
    }

    @PluginMethod
    public void stopLiveService(PluginCall call) {
        Context context = getContext();
        Intent serviceIntent = new Intent(context, LiveWorkoutService.class);
        try {
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().clear().apply();
            context.stopService(serviceIntent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to stop LiveWorkoutService: " + e.getMessage());
        }
    }
}
