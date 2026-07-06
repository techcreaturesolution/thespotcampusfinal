package com.techcreaturesolution.spotcampus

import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity: FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // Prevent screenshots and screen recording for proctoring security
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }
}
