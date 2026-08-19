package com.damia.sololeveler;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "HunterWidgets")
public class HunterWidgetsPlugin extends Plugin {
    @PluginMethod
    public void updateState(PluginCall call) {
        JSObject data = call.getData();
        HunterWidgetState.write(getContext(), data != null ? data : new JSONObject());
        HunterWidgetRenderer.updateAll(getContext());
        JSObject result = new JSObject();
        result.put("updated", true);
        call.resolve(result);
    }

    @PluginMethod
    public void snoozeReminder(PluginCall call) {
        long minutes = call.getLong("minutes", 45L);
        HunterWidgetState.snooze(getContext(), minutes);
        HunterWidgetRenderer.updateAll(getContext());
        JSObject result = new JSObject();
        result.put("snoozed", true);
        result.put("minutes", minutes);
        call.resolve(result);
    }
}
