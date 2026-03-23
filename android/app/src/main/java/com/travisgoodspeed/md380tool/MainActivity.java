package com.travisgoodspeed.md380tool;

import android.app.Activity;
import android.content.Context;
import android.hardware.usb.UsbManager;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private TextView statusText;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        statusText = new TextView(this);
        statusText.setTextSize(16);
        statusText.setPadding(50, 50, 50, 50);
        statusText.setText("MD380Tool v1.0\n\n" +
            "Waiting for USB device...\n\n" +
            "To enter programming mode:\n" +
            "1. Turn off radio\n" +
            "2. Hold PTT + button above PTT\n" +
            "3. Turn on radio\n" +
            "4. Select 'PC Program USB Mode'\n\n" +
            "Supported Radios:\n" +
            "- MD-380 / MD-380G\n" +
            "- MD-390 / MD-390G\n" +
            "- Retevis RT3 / RT8");
        
        setContentView(statusText);
        
        checkUsb();
    }
    
    private void checkUsb() {
        UsbManager manager = (UsbManager) getSystemService(Context.USB_SERVICE);
        if (manager != null) {
            Toast.makeText(this, "USB Service ready", Toast.LENGTH_SHORT).show();
        }
    }
}
