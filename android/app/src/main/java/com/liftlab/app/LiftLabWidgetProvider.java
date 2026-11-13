package com.liftlab.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;

public class LiftLabWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(LiveWorkoutPlugin.PREFS_NAME, Context.MODE_PRIVATE);
        boolean isActive = prefs.getBoolean(LiveWorkoutPlugin.KEY_ACTIVE, false);
        String exercise = prefs.getString(LiveWorkoutPlugin.KEY_EXERCISE, "Live Workout");
        String setInfo = prefs.getString(LiveWorkoutPlugin.KEY_SET_INFO, "In corso");
        boolean isResting = prefs.getBoolean(LiveWorkoutPlugin.KEY_IS_RESTING, false);
        boolean isRestFinished = prefs.getBoolean(LiveWorkoutPlugin.KEY_IS_REST_FINISHED, false);
        int restSeconds = prefs.getInt(LiveWorkoutPlugin.KEY_REST_SECONDS, 0);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.liftlab_widget);

        if (isActive) {
            if (isResting && restSeconds > 0) {
                int mins = restSeconds / 60;
                int secs = restSeconds % 60;
                String timeStr = mins > 0 ? String.format("%d:%02d", mins, secs) : String.format("%ds", secs);
                views.setTextViewText(R.id.widget_status_pill, "RECUPERO");
                views.setTextViewText(R.id.widget_primary_text, exercise);
                views.setTextViewText(R.id.widget_secondary_text, "Timer di riposo: " + timeStr);
                views.setTextViewText(R.id.widget_action_btn, "Vai alla Sessione");
            } else if (isRestFinished) {
                views.setTextViewText(R.id.widget_status_pill, "RECUPERO FINITO");
                views.setTextViewText(R.id.widget_primary_text, exercise);
                views.setTextViewText(R.id.widget_secondary_text, "Tocca per iniziare la serie");
                views.setTextViewText(R.id.widget_action_btn, "Nuova Serie");
            } else {
                views.setTextViewText(R.id.widget_status_pill, "IN CORSO");
                views.setTextViewText(R.id.widget_primary_text, exercise);
                views.setTextViewText(R.id.widget_secondary_text, setInfo);
                views.setTextViewText(R.id.widget_action_btn, "Continua Allenamento");
            }
        } else {
            views.setTextViewText(R.id.widget_status_pill, "PRONTO");
            views.setTextViewText(R.id.widget_primary_text, "Pronto per l'allenamento?");
            views.setTextViewText(R.id.widget_secondary_text, "Tocca per aprire le tue schede");
            views.setTextViewText(R.id.widget_action_btn, "Avvia Allenamento");
        }

        // Tap action to launch LiftLab MainActivity
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, flags);

        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_action_btn, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void updateAllWidgets(Context context) {
        if (context == null) return;
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        if (manager != null) {
            ComponentName widget = new ComponentName(context, LiftLabWidgetProvider.class);
            int[] ids = manager.getAppWidgetIds(widget);
            if (ids != null && ids.length > 0) {
                for (int id : ids) {
                    updateAppWidget(context, manager, id);
                }
            }
        }
    }
}
