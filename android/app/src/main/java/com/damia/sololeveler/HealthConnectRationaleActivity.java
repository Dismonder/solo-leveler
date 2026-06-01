package com.damia.sololeveler;

import android.app.Activity;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.ScrollView;
import android.widget.TextView;

public class HealthConnectRationaleActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        TextView text = new TextView(this);
        int padding = (int) (24 * getResources().getDisplayMetrics().density);
        text.setPadding(padding, padding, padding, padding);
        text.setGravity(Gravity.START);
        text.setTextSize(16);
        text.setLineSpacing(0, 1.15f);
        text.setTextColor(0xFFE5F7FF);
        text.setBackgroundColor(0xFF020617);
        text.setText(
            "Solo Leveler używa Health Connect tylko po Twojej zgodzie.\n\n" +
            "Dane, które aplikacja może odczytać:\n" +
            "- kroki,\n" +
            "- dystans,\n" +
            "- aktywne kalorie,\n" +
            "- sesje ćwiczeń,\n" +
            "- tętno.\n\n" +
            "Te dane są używane lokalnie do uzupełnienia dziennego questa i podglądu aktywności. " +
            "Nie wysyłamy ich na serwer i nie działamy w tle."
        );

        ScrollView scrollView = new ScrollView(this);
        scrollView.addView(
            text,
            new ScrollView.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        );
        setContentView(scrollView);
    }
}
