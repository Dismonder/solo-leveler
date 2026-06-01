package com.damia.sololeveler;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "HunterMotion")
public class HunterMotionPlugin extends Plugin implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor accelerometer;
    private boolean active = false;
    private long lastEmitAtNanos = 0L;
    private int minEmitIntervalMs = 32;
    private final float[] gravity = new float[] { 0f, 0f, 0f };
    private boolean hasGravityEstimate = false;

    @Override
    public void load() {
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        }
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", accelerometer != null);

        if (accelerometer != null) {
            result.put("name", accelerometer.getName());
            result.put("vendor", accelerometer.getVendor());
            result.put("resolution", accelerometer.getResolution());
            result.put("maximumRange", accelerometer.getMaximumRange());
            result.put("minDelay", accelerometer.getMinDelay());
        }

        call.resolve(result);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (sensorManager == null || accelerometer == null) {
            call.reject("Akcelerometr nie jest dostępny na tym urządzeniu.");
            return;
        }

        minEmitIntervalMs = Math.max(16, call.getInt("intervalMs", 32));
        int delayUs = Math.max(10000, call.getInt("delayUs", 20000));
        hasGravityEstimate = false;
        lastEmitAtNanos = 0L;

        if (active) {
            sensorManager.unregisterListener(this);
        }

        active = sensorManager.registerListener(this, accelerometer, delayUs);
        if (!active) {
            call.reject("Nie udało się uruchomić akcelerometru.");
            return;
        }

        JSObject result = new JSObject();
        result.put("active", true);
        result.put("source", "android-native");
        result.put("intervalMs", minEmitIntervalMs);
        result.put("sensorName", accelerometer.getName());
        call.resolve(result);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopSensor();
        call.resolve();
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (!active || event.sensor.getType() != Sensor.TYPE_ACCELEROMETER) return;

        long now = event.timestamp;
        long minIntervalNanos = minEmitIntervalMs * 1_000_000L;
        if (lastEmitAtNanos > 0 && now - lastEmitAtNanos < minIntervalNanos) return;
        lastEmitAtNanos = now;

        float x = event.values[0];
        float y = event.values[1];
        float z = event.values[2];

        if (!hasGravityEstimate) {
            gravity[0] = x;
            gravity[1] = y;
            gravity[2] = z;
            hasGravityEstimate = true;
        } else {
            final float alpha = 0.82f;
            gravity[0] = alpha * gravity[0] + (1f - alpha) * x;
            gravity[1] = alpha * gravity[1] + (1f - alpha) * y;
            gravity[2] = alpha * gravity[2] + (1f - alpha) * z;
        }

        JSObject acceleration = new JSObject();
        acceleration.put("x", x - gravity[0]);
        acceleration.put("y", y - gravity[1]);
        acceleration.put("z", z - gravity[2]);

        JSObject accelerationIncludingGravity = new JSObject();
        accelerationIncludingGravity.put("x", x);
        accelerationIncludingGravity.put("y", y);
        accelerationIncludingGravity.put("z", z);

        JSObject data = new JSObject();
        data.put("source", "android-native");
        data.put("timestamp", System.currentTimeMillis());
        data.put("interval", minEmitIntervalMs);
        data.put("acceleration", acceleration);
        data.put("accelerationIncludingGravity", accelerationIncludingGravity);
        notifyListeners("sample", data, false);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        JSObject data = new JSObject();
        data.put("source", "android-native");
        data.put("accuracy", accuracy);
        notifyListeners("accuracy", data, false);
    }

    @Override
    protected void handleOnPause() {
        stopSensor();
    }

    @Override
    protected void handleOnStop() {
        stopSensor();
    }

    @Override
    protected void handleOnDestroy() {
        stopSensor();
    }

    private void stopSensor() {
        if (sensorManager != null && active) {
            sensorManager.unregisterListener(this);
        }
        active = false;
    }
}
