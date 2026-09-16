package com.liftlab.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class LiveWorkoutReceiver extends BroadcastReceiver {
    public static final String ACTION_COMPLETE_SET = "com.liftlab.app.ACTION_COMPLETE_SET";
    public static final String ACTION_ADD_REST_30S = "com.liftlab.app.ACTION_ADD_REST_30S";
    public static final String ACTION_SKIP_REST = "com.liftlab.app.ACTION_SKIP_REST";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        String action = intent.getAction();
        if (ACTION_COMPLETE_SET.equals(action)) {
            LiveWorkoutPlugin.handleNativeAction(context, "complete_set");
        } else if (ACTION_ADD_REST_30S.equals(action)) {
            LiveWorkoutPlugin.handleNativeAction(context, "add_30s");
        } else if (ACTION_SKIP_REST.equals(action)) {
            LiveWorkoutPlugin.handleNativeAction(context, "skip_rest");
        }
    }
}
