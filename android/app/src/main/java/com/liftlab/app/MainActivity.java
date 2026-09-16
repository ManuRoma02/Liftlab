package com.liftlab.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LiveWorkoutPlugin.class);
        super.onCreate(savedInstanceState);
        applyEdgeToEdge();
        getWindow().getDecorView().post(this::applyEdgeToEdge);
    }

    @Override
    public void onResume() {
        super.onResume();
        applyEdgeToEdge();
    }

    private void applyEdgeToEdge() {
        Window window = getWindow();
        window.setFlags(
            android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );
        window.getDecorView().setBackgroundColor(Color.rgb(9, 10, 11));
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        WindowCompat.setDecorFitsSystemWindows(window, false);
        WindowInsetsControllerCompat controller =
            new WindowInsetsControllerCompat(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);

    }
}
