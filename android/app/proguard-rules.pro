# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Preserve annotations and line numbers for stack traces
-keepattributes *Annotation*,EnclosingMethod,Signature,InnerClasses,SourceFile,LineNumberTable

# Capacitor Bridge & Core Plugins
-keep public class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# LiftLab Native Components & Foreground Service
-keep public class com.liftlab.app.** { *; }
-keepclassmembers class com.liftlab.app.** {
    public *;
}

# AppWidget Provider Protection
-keep public class * extends android.appwidget.AppWidgetProvider {
    public *;
}

# Strip debug and verbose logs in release build to optimize APK size
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
}
