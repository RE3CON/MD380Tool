package com.travisgoodspeed.md380tool;


import java.util.HashMap;
import java.util.Iterator;

import android.app.PendingIntent;
import android.content.Intent;
import android.hardware.usb.UsbConfiguration;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbInterface;
import android.util.Log;

import android.content.Context;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;

/**
 * Created by tgoodspeed on 2/19/16.
 *
 * This class will implement the Device Firmware Update protocol, as well as the standard MD380
 * extensions for use in Android.  MD380Tool extensions are managed by the MD380Tool class,
 * not by this one.
 */
public class MD380DFU {
    //This is passed from the GUI activity.
    UsbManager manager;
    //This is the connection to the device, which requires permissions.
    UsbDeviceConnection connection=null;
    UsbInterface usbInterface;

    static final int VID=0x0483;
    static final int PID=0xDF11;

    //Control Requests
    static final int DETACH=0;
    static final int DNLOAD=1;
    static final int UPLOAD=2;
    static final int GETSTATUS=3;
    static final int CLRSTATUS=4;
    static final int GETSTATE=5;
    static final int ABORT=6;


    MD380DFU(UsbManager manager){
        this.manager=manager;
    }

    private boolean connected=false;
    public boolean isConnected(){
        return connected;
    }

    /* Don't call this until after permission has been granted.*/
    public boolean connect(){
        HashMap<String, UsbDevice> deviceList = manager.getDeviceList();
        Iterator<UsbDevice> deviceIterator = deviceList.values().iterator();

        String i = "";
        while (deviceIterator.hasNext()) {
            UsbDevice device = deviceIterator.next();
            if(device.getVendorId()==VID &&
                    device.getProductId()==PID){
                //If you haven't gotten permission yet, this will crash.

                //Open the device.
                connection=manager.openDevice(device);


                Log.d("MD380","Trying to open interface on 0");
                usbInterface = device.getInterface(0);
                if (usbInterface==null || !connection.claimInterface(usbInterface, true)) {
                    Log.d("MD380","Could not claim interface on 0");
                    return false;
                }

                //We're good, so return true.
                Log.d("MD380","Connected");
                connected=true;
                return true;
            }
        }

        //Couldn't connect.
        return false;
    }

    public void disconnect(){
        connected=false;
        connection.close();
    }


    /* Gets the DFU status. */
    public byte[] getStatus() throws MD380Exception{
        byte buf[]=new byte[6];
        int len=0;

        if(connection.controlTransfer(0xA1,GETSTATUS,0,0,buf,6,3000)<0) {
            connected=false;
            throw new MD380Exception("Transfer Error");
        }

        return buf;
    }

    /* Gets the DFU state. */
    public int getState() throws MD380Exception{
        byte[] buf=new byte[1];
        if(connection.controlTransfer(0xA1,GETSTATE,0,0,buf,1,3000)<0) {
            connected=false;
            throw new MD380Exception("Transfer Error");
        }
        return (int) buf[0];
    }

    /* Sets the DFU target address. */
    public void setAddress(int address) throws MD380Exception{
        byte buf[]=new byte[5];

        //Secret command code to set the address when writing to Block 0.
        buf[0]=0x21;
        //Little-endian representation of the address.
        buf[1]=(byte) (address&0xFF);
        buf[2]=(byte) ((address>>8)&0xFF);
        buf[3]=(byte) ((address>>16)&0xFF);
        buf[4]=(byte) ((address>>24)&0xFF);


        download(0,buf);

        return;
    }

    /* Sets the DFU target address. */
    public void eraseBlock(int address) throws MD380Exception{
        byte buf[]=new byte[5];

        //Secret command code to set the address when writing to Block 0.
        buf[0]=0x41;
        //Little-endian representation of the address.
        buf[1]=(byte) (address&0xFF);
        buf[2]=(byte) ((address>>8)&0xFF);
        buf[3]=(byte) ((address>>16)&0xFF);
        buf[4]=(byte) ((address>>24)&0xFF);


        download(0,buf);

        return;
    }

    /* Detaches from the target.  The STM32's DFU will execute the application when this is called. */
    void detach(){
        //This will probably timeout.  So it goes.
        connection.controlTransfer(0x21, DETACH, 0, 0, null, 0, 3000);
    }

    /* Uploads data from the radio at the target address. */
    public byte[] upload(int block, int length) throws MD380Exception{
        byte[] data=new byte[length];
        if(connection.controlTransfer(0xA1,UPLOAD,block,0,data,length,3000)<0) {
            connected=false;
            throw new MD380Exception("Transfer Error");
        }

        getStatus();

        return data;
    }

    /* Gets the command response. */
    byte[] getCommand() throws MD380Exception{
        /* The command block comes from block zero.  The size is always 32. */
        return upload(0,32);
    }

    /* Downloads data to a target block. */
    public byte[] download(int block, byte buf[]) throws MD380Exception{
        Log.d("DNLOAD",block+"---"+bytes2hexstr(buf));
        if(connection.controlTransfer(0x21,DNLOAD,block,0,buf,buf.length,3000)<0)
            Log.d("download()","Declining to toss an exception.");//throw new MD380Exception("Transfer Error");
        //First we apply the change.
        getStatus();

        //Then we return the result.
        return getStatus();
    }

    /* Calls an MD380 custom DFU command. */
    public void md380cmd(byte a, byte b) throws MD380Exception{
        byte data[]=new byte[2];
        data[0]=a;
        data[1]=b;
        download(0,data);
    }

    /* Reboots the radio. */
    public void reboot() throws MD380Exception{
        //This is one of the custom commands in the 91 series.
        md380cmd((byte) 0x91, (byte) 0x05);
    }
    /* Halts all threads and displays "Programming Mode" on the screen. */
    public void programMode() throws MD380Exception{
        //This is one of the custom commands in the 91 series.
        md380cmd((byte) 0x91, (byte) 0x01);
    }

    //Convenience function that hexdumps some data.
    public static String bytes2hexstr(byte[] data){
        String str="";
        int i,j;
        for(i=0;i<data.length;i++){
            byte b=data[i];
            //str=str+Byte.toString(b)+" ";
            str=str+String.format("%02x ",b);
            if(i%32==16)
                str=str+" ";
            if(i%32==31)
                str=str+"\n";
        }
        return str;
    }

    //Convenience function to grab the unsigned value of a byte.
    public static int u8(byte b){
        return ((int)b)&0xFF;
    }
    //Convenience function to yank a 32-bit word from a byte array.
    public static int intfrombytes(byte[] data, int i){
        int j=0;
        j= (int) (
                 u8(data[i])
                         | (u8(data[i+1])<<8)
                |(u8(data[i+2])<<16)
                |(u8(data[i+3])<<24)
        );
        return j;
    }
}
