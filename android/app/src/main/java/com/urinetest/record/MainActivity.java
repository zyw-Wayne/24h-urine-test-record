package com.urinetest.record;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(com.urinetest.record.plugins.SafeFilePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
