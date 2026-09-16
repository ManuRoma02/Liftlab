package com.liftlab.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;

public class LiveWorkoutService extends Service {
    public static final String CHANNEL_ID = "liftlab_live_workout";
    public static final int NOTIFICATION_ID = 9001;

    public static final String EXTRA_EXERCISE_NAME = "exercise_name";
    public static final String EXTRA_SET_INFO = "set_info";
    public static final String EXTRA_REST_SECONDS = "rest_seconds";
    public static final String EXTRA_IS_RESTING = "is_resting";

    private static LiveWorkoutService instance;
    private NotificationManager notificationManager;
    private Handler timerHandler;
    private Runnable timerRunnable;

    private String currentExercise = "Live Workout";
    private String currentSetInfo = "In corso";
    private int restRemainingSeconds = 0;
    private boolean isResting = false;

    public static LiveWorkoutService getInstance() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        timerHandler = new Handler(Looper.getMainLooper());
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            if (intent.hasExtra(EXTRA_EXERCISE_NAME)) {
                currentExercise = intent.getStringExtra(EXTRA_EXERCISE_NAME);
            }
            if (intent.hasExtra(EXTRA_SET_INFO)) {
                currentSetInfo = intent.getStringExtra(EXTRA_SET_INFO);
            }
            if (intent.hasExtra(EXTRA_REST_SECONDS)) {
                restRemainingSeconds = intent.getIntExtra(EXTRA_REST_SECONDS, 0);
            }
            if (intent.hasExtra(EXTRA_IS_RESTING)) {
                isResting = intent.getBooleanExtra(EXTRA_IS_RESTING, false);
            }
            persistState();
        } else if (!restoreState()) {
            stopSelf();
            return START_NOT_STICKY;
        }

        Notification notification = buildNotification();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        if (isResting && restRemainingSeconds > 0) {
            startRestCountdown();
        } else {
            stopRestCountdown();
        }

        return START_STICKY;
    }

    public void updateState(String exercise, String setInfo, int restSeconds, boolean resting) {
        this.currentExercise = exercise != null ? exercise : this.currentExercise;
        this.currentSetInfo = setInfo != null ? setInfo : this.currentSetInfo;
        this.restRemainingSeconds = restSeconds;
        this.isResting = resting;

        if (isResting && restRemainingSeconds > 0) {
            startRestCountdown();
        } else {
            stopRestCountdown();
        }
        persistState();

        if (notificationManager != null) {
            notificationManager.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    public void addRestSeconds(int deltaSeconds) {
        this.restRemainingSeconds = Math.max(0, this.restRemainingSeconds + deltaSeconds);
        this.isResting = this.restRemainingSeconds > 0;
        if (this.isResting) {
            startRestCountdown();
        }
        if (notificationManager != null) {
            notificationManager.notify(NOTIFICATION_ID, buildNotification());
        }
        persistState();
    }

    public void skipRest() {
        this.restRemainingSeconds = 0;
        this.isResting = false;
        stopRestCountdown();
        if (notificationManager != null) {
            notificationManager.notify(NOTIFICATION_ID, buildNotification());
        }
        persistState();
    }

    private void startRestCountdown() {
        stopRestCountdown();
        timerRunnable = new Runnable() {
            @Override
            public void run() {
                if (restRemainingSeconds > 0) {
                    restRemainingSeconds--;
                    if (notificationManager != null) {
                        notificationManager.notify(NOTIFICATION_ID, buildNotification());
                    }
                    persistState();
                    timerHandler.postDelayed(this, 1000);
                } else {
                    isResting = false;
                    triggerRestFinishedAlert();
                    persistState();
                    if (notificationManager != null) {
                        notificationManager.notify(NOTIFICATION_ID, buildNotification());
                    }
                }
            }
        };
        timerHandler.postDelayed(timerRunnable, 1000);
    }

    private void stopRestCountdown() {
        if (timerRunnable != null && timerHandler != null) {
            timerHandler.removeCallbacks(timerRunnable);
            timerRunnable = null;
        }
    }

    private void triggerRestFinishedAlert() {
        try {
            android.net.Uri notificationSound = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION);
            android.media.Ringtone ringtone = android.media.RingtoneManager.getRingtone(getApplicationContext(), notificationSound);
            if (ringtone != null) {
                ringtone.play();
            }
        } catch (Exception ignored) {}

        try {
            Vibrator vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    if (vibrator.areAllPrimitivesSupported(
                            VibrationEffect.Composition.PRIMITIVE_CLICK,
                            VibrationEffect.Composition.PRIMITIVE_TICK)) {
                        VibrationEffect effect = VibrationEffect.startComposition()
                                .addPrimitive(VibrationEffect.Composition.PRIMITIVE_CLICK, 1.0f)
                                .addPrimitive(VibrationEffect.Composition.PRIMITIVE_TICK, 0.8f, 100)
                                .addPrimitive(VibrationEffect.Composition.PRIMITIVE_CLICK, 1.0f, 150)
                                .compose();
                        vibrator.vibrate(effect);
                        return;
                    }
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    long[] timings = {0, 200, 100, 200, 100, 300};
                    int[] amplitudes = {0, 255, 0, 255, 0, 255};
                    vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1));
                } else {
                    vibrator.vibrate(new long[]{0, 200, 100, 200, 100, 300}, -1);
                }
            }
        } catch (Exception ignored) {}
    }

    private Notification buildNotification() {
        Intent appIntent = new Intent(this, MainActivity.class);
        appIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
                this,
                0,
                appIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        String title;
        String contentText;

        if (isResting && restRemainingSeconds > 0) {
            int mins = restRemainingSeconds / 60;
            int secs = restRemainingSeconds % 60;
            String timeFormatted = String.format("%02d:%02d", mins, secs);
            title = "⏱️ Recupero: " + timeFormatted;
            contentText = "Prossimo: " + currentExercise + " (" + currentSetInfo + ")";
        } else if (!isResting && restRemainingSeconds == 0) {
            title = "LiftLab • " + currentExercise;
            contentText = currentSetInfo;
        } else {
            title = "🔔 Recupero Concluso!";
            contentText = "Tocca a: " + currentExercise + " (" + currentSetInfo + ")";
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(contentText)
                .setContentIntent(contentIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        // Android 16/17 Live Updates & Promoted Ongoing Notification
        builder.getExtras().putBoolean("android.requestPromotedOngoing", true);
        try {
            java.lang.reflect.Method setPromoted = builder.getClass().getMethod("setRequestPromotedOngoing", boolean.class);
            setPromoted.invoke(builder, true);
        } catch (Exception ignored) {}

        // Android 16/17 Status Bar Chip critical text & Chronometer
        if (isResting && restRemainingSeconds > 0) {
            int mins = restRemainingSeconds / 60;
            int secs = restRemainingSeconds % 60;
            String chipText = String.format("%02d:%02d", mins, secs);
            builder.getExtras().putCharSequence("android.shortCriticalText", chipText);
            try {
                java.lang.reflect.Method setShortText = builder.getClass().getMethod("setShortCriticalText", CharSequence.class);
                setShortText.invoke(builder, chipText);
            } catch (Exception ignored) {}

            builder.setUsesChronometer(true);
            builder.setChronometerCountDown(true);
            builder.setWhen(System.currentTimeMillis() + (restRemainingSeconds * 1000L));
            builder.setShowWhen(true);
        } else {
            builder.getExtras().putCharSequence("android.shortCriticalText", "LIFT");
            builder.setShowWhen(false);
            builder.setUsesChronometer(false);
        }

        if (isResting && restRemainingSeconds > 0) {
            // Action +30s
            Intent add30sIntent = new Intent(this, LiveWorkoutReceiver.class);
            add30sIntent.setAction(LiveWorkoutReceiver.ACTION_ADD_REST_30S);
            PendingIntent add30sPending = PendingIntent.getBroadcast(
                    this,
                    1,
                    add30sIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );
            builder.addAction(0, "+30s", add30sPending);

            // Action Skip Rest
            Intent skipIntent = new Intent(this, LiveWorkoutReceiver.class);
            skipIntent.setAction(LiveWorkoutReceiver.ACTION_SKIP_REST);
            PendingIntent skipPending = PendingIntent.getBroadcast(
                    this,
                    2,
                    skipIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );
            builder.addAction(0, "Salta", skipPending);
        } else {
            // Action Complete Set
            Intent completeIntent = new Intent(this, LiveWorkoutReceiver.class);
            completeIntent.setAction(LiveWorkoutReceiver.ACTION_COMPLETE_SET);
            PendingIntent completePending = PendingIntent.getBroadcast(
                    this,
                    3,
                    completeIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );
            builder.addAction(0, "✅ Completa Serie", completePending);
        }

        return builder.build();
    }

    private void persistState() {
        SharedPreferences.Editor editor = getSharedPreferences(LiveWorkoutPlugin.PREFS_NAME, MODE_PRIVATE).edit();
        editor.putBoolean(LiveWorkoutPlugin.KEY_ACTIVE, true);
        editor.putString(LiveWorkoutPlugin.KEY_EXERCISE, currentExercise);
        editor.putString(LiveWorkoutPlugin.KEY_SET_INFO, currentSetInfo);
        editor.putInt(LiveWorkoutPlugin.KEY_REST_SECONDS, restRemainingSeconds);
        editor.putBoolean(LiveWorkoutPlugin.KEY_IS_RESTING, isResting);
        if (isResting && restRemainingSeconds > 0) {
            editor.putLong(LiveWorkoutPlugin.KEY_REST_END_AT, System.currentTimeMillis() + restRemainingSeconds * 1000L);
        } else {
            editor.putLong(LiveWorkoutPlugin.KEY_REST_END_AT, 0);
        }
        editor.apply();
    }

    private boolean restoreState() {
        SharedPreferences prefs = getSharedPreferences(LiveWorkoutPlugin.PREFS_NAME, MODE_PRIVATE);
        if (!prefs.getBoolean(LiveWorkoutPlugin.KEY_ACTIVE, false)) {
            return false;
        }
        currentExercise = prefs.getString(LiveWorkoutPlugin.KEY_EXERCISE, currentExercise);
        currentSetInfo = prefs.getString(LiveWorkoutPlugin.KEY_SET_INFO, currentSetInfo);
        long restEndAt = prefs.getLong(LiveWorkoutPlugin.KEY_REST_END_AT, 0);
        if (restEndAt > System.currentTimeMillis()) {
            restRemainingSeconds = (int) Math.ceil((restEndAt - System.currentTimeMillis()) / 1000.0);
            isResting = true;
        } else {
            restRemainingSeconds = prefs.getInt(LiveWorkoutPlugin.KEY_REST_SECONDS, 0);
            isResting = false;
            if (restEndAt > 0) {
                restRemainingSeconds = 0;
            }
        }
        return true;
    }

    private void clearPersistedState() {
        getSharedPreferences(LiveWorkoutPlugin.PREFS_NAME, MODE_PRIVATE).edit().clear().apply();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Allenamento in Corso",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Mostra il progresso dell'allenamento e il timer di recupero");
            channel.enableVibration(true);
            channel.setShowBadge(false);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        stopRestCountdown();
        clearPersistedState();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        if (notificationManager != null) {
            notificationManager.cancel(NOTIFICATION_ID);
        }
        instance = null;
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        stopRestCountdown();
        clearPersistedState();
        stopSelf();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
