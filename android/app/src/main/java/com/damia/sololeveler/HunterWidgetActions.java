package com.damia.sololeveler;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

final class HunterWidgetActions {
    private HunterWidgetActions() {}

    static PendingIntent openAction(Context context, String hunterAction, int requestCode) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction("com.damia.sololeveler.HUNTER_WIDGET_" + hunterAction);
        intent.putExtra("hunter_action", hunterAction);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, requestCode, intent, flags);
    }
}
