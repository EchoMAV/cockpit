const scriptLocation = "/usr/local/echopilot/"
const confLocation = "/etc/mavlink-router/"
const version = document.getElementById("version");
const file_location = document.getElementById("file_location");
const losHost = document.getElementById("losHost");
const losPort = document.getElementById("losPort");
const tcpHost = document.getElementById("tcpHost");
const tcpPort = document.getElementById("tcpPort");

const losIface = document.getElementById("losIface");
const backupHost = document.getElementById("backupHost");
const backupPort = document.getElementById("backupPort");
const backupIface = document.getElementById("backupIface");
const fmuDevice = document.getElementById("fmuDevice");
const baudrate = document.getElementById("baudrate");
const fmuId = document.getElementById("fmuId");
const atakHost = document.getElementById("atakHost");
const atakPort = document.getElementById("atakPort");
const atakPeriod = document.getElementById("atakPeriod");
const CONFIG_LENGTH = 11;
// standard Baud rates
const baudRateArray = [ 38400, 57600, 115200, 230400, 460800, 500000, 921600 ];
const udpModeArray = [ "Normal", "Server"];
const udpStatusArray = [ "Enabled", "Disabled"];
const tcpStatusArray = [ "Enabled", "Disabled"];
const atakPeriodArray = [ "Disabled", "1", "3", "5", "10" ];

var isUdpEnabled = "Disabled";
var istcpEnabled = "Disabled";

enabled = true;
// Runs the initPage when the document is loaded
document.onload = InitPage();
// Save file button
document.getElementById("save").addEventListener("click", SaveSettings);



// This attempts to read the conf file, if it exists, then it will parse it and fill out the table
// if it fails then the values are loaded with defaults.
function InitPage() {
    cockpit.script(scriptLocation + "cockpitScript.sh -v")
    .then((content) => version.innerHTML=content)
    .catch(error => Fail(error));      
    cockpit.script(scriptLocation + "cockpitScript.sh -u")
    .then(function(content) {
        ipsubnet1.innerHTML=content;
        ipsubnet2.innerHTML=content;
    })
    .catch(error => Fail(error));   
    
    file_location.innerHTML = confLocation + "main.conf";
    
    cockpit.file(confLocation + "main.conf")
        .read().then((content, tag) => SuccessReadFile(content))
            .catch(error => FailureReadFile(error));

    }

function getValueByKey(text, sectionName, sectionLength, key){
    //function to extract key values from a file with sections 
    //this should work if the section is commented out or not
    var lines = text.split("\n");
    var sectionBody = "";
    for(let t = 0; t < lines.length; t++){
        if (lines[t] === sectionName || lines[t] === "#" + sectionName)
        {
            for(let n = 0; n < sectionLength; n++){ 
                if (lines[t].startsWith("#"))
                {
                    sectionBody += lines[t+n+1].slice(1) + "\n";
                }
                else
                    sectionBody += lines[t+n+1] + "\n";
            }
            break;   
        }
    }
    if (sectionBody === "")
        return null;
    var regex = new RegExp("^" + key + " =(.*)$", "m");
    var match = regex.exec(sectionBody);
    if(match)
        return match[1].trim();
    else
        return null;
}

function isSectionEnabled(text, sectionName)
{
    var lines = text.split("\n");
    
    for(let t = 0; t < lines.length; t++){
        if (lines[t] === sectionName)
        {
            if (!lines[t].startsWith("#"))
            {
                return "Enabled";
            }  
            return "Disabled";
            break;
        }
    }
    return "Disabled";
}

function setSectionEnabled(text, sectionName, sectionLength, enabled)
{

    //if enabled, find the section and remove leading #
    //if disabled, find the section and add leading #
    //return content
    var lines = text.split("\n");
    if (enabled)
    {
        //do action to enable the section
        for(let t = 0; t < lines.length; t++){
            if (lines[t] === "#" + sectionName)
            {
                    for(let n = 0; n < sectionLength+1; n++){ 
                        if (lines[t+n].startsWith("#"))
                        {
                            lines[t+n] = lines[t+n].slice(1);  
                        }                     
                    }                   
                break;
            }
        }
        
    }
    else 
    {
        //do action to disable the section
        for(let t = 0; t < lines.length; t++){
            if (lines[t] === sectionName)
            {
                for(let n = 0; n < sectionLength+1; n++){ 
                    lines[t+n] = "#" +  lines[t+n];      
                                                
                }  
                break;
            }
        }
        
    }

    return lines.join("\n");
}

function setValueByKey(text, sectionName, sectionLength, key, value)
{
    //find the sectionName in the text, then replace the key value with the one specified
    //return the new contents

    //skip until we find section, then look forward X lines for the key/value

    var lines = text.split("\n");
    
    for(let t = 0; t < lines.length; t++){
        if (lines[t] === sectionName)
        {
            for(let n = 0; n < sectionLength; n++){ 
                if (lines[t+n+1].split('=')[0].trim() == key)
                {
                    lines[t+n+1] = key + " = " + value; 
                    break;
                }
            }  
        }
    }

    return lines.join("\n");


}

function SuccessReadFile(content) {
    try{
       
        //FMU Endpoint
        var currentfmuDevice = getValueByKey(content, "[UartEndpoint alpha]", 2, "Device");
        var currentbaudRate = getValueByKey(content, "[UartEndpoint alpha]", 2, "Baud");
        cockpit.script(scriptLocation + "cockpitScript.sh -s")
                .then((content) => AddDropDown(fmuDevice, content.split("\n"), currentfmuDevice))
                .catch(error => Fail(error));   
        AddDropDown(baudrate, baudRateArray, currentbaudRate);

        //UDP Telemetry
        isUdpEnabled = isSectionEnabled(content, "[UdpEndpoint alpha]");

        //to do, if disabled, gray out the values
        var currentudpMode = getValueByKey(content, "[UdpEndpoint alpha]", 3, "Mode"); 
        losHost.value = getValueByKey(content, "[UdpEndpoint alpha]", 3, "Address");
        losPort.value = getValueByKey(content, "[UdpEndpoint alpha]", 3, "Port");    

        $(udpStatus).change(function() {
            if ($(this).val() === null)
            return;
            if ($(this).val() == "Disabled") {
                isUdpEnabled = "Disabled";
                $(udpMode).attr("disabled", "disabled");
                $(losHost).attr("disabled", "disabled");
                $(losPort).attr("disabled", "disabled");
            } else {
                isUdpEnabled = "Enabled";
                $(udpMode).removeAttr("disabled");
                $(losHost).removeAttr("disabled");
                $(losPort).removeAttr("disabled");
            }
            }).trigger("change");


    
        AddDropDown(udpMode, udpModeArray, currentudpMode);
        AddDropDown(udpStatus, udpStatusArray, isUdpEnabled);

        // init state of UDP fields
        if (isUdpEnabled === "Disabled")
        {
            $(udpMode).attr("disabled", "disabled");
            $(losHost).attr("disabled", "disabled");
            $(losPort).attr("disabled", "disabled");
        }

        //TCP Telemetry
        istcpEnabled = isSectionEnabled(content, "[TcpEndpoint alpha]");

        tcpHost.value = getValueByKey(content, "[TcpEndpoint alpha]", 3, "Address");
        tcpPort.value = getValueByKey(content, "[TcpEndpoint alpha]", 3, "Port");


        $(tcpStatus).change(function() {
            if ($(this).val() === null)
                return;
            if ($(this).val() == "Disabled") {
                istcpEnabled = "Disabled";
                $(tcpHost).attr("disabled", "disabled");
                $(tcpPort).attr("disabled", "disabled");
            } else {
                istcpEnabled = "Enabled";
                $(tcpHost).removeAttr("disabled");
                $(tcpPort).removeAttr("disabled");
            }
            }).trigger("change");

        
        AddDropDown(tcpStatus, tcpStatusArray, istcpEnabled);

        // init state of TCP fields
        if (istcpEnabled === "Disabled")
        {
            $(tcpHost).attr("disabled", "disabled");
            $(tcpPort).attr("disabled", "disabled");
        }

        
    }
    catch(e){
        FailureReadFile(e);
    }
    
}

function AddPathToDeviceFile(incomingArray){
    for(let t = 0; t < incomingArray.length; t++){
        incomingArray[t] = "/dev/" + incomingArray[t];
    }
    return incomingArray;
}

function AddDropDown(box, theArray, defaultValue){
    try{
        for(let t = 0; t < theArray.length; t++){
            var option = document.createElement("option");
            option.text = theArray[t];
            box.add(option);
            if(defaultValue == option.text){
                box.value = option.text;
            }
        }
    }
    catch(e){
        Fail(e)
    }
}

function FailureReadFile(error) {
    // Display error message
    console.log("Error : " + error.message);
    output.innerHTML = "Error : " + error.message;
    // TODO :: Defaults should go here.
    losHost.value = "224.10.10.10";
    losPort.value = "14550";
    fmuId.value = "1";
    atakHost.value = "239.2.3.1";
    atakPort.value = "6969";   
    atakPeriod.value = "5"; 
}


function SaveSettings() {
  
        //lets do some validation
        
        var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        var portformat = /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;
        var errorFlag = false;
        var errorText = "";
        if (!losHost.value.match(ipformat) && (isUdpEnabled==="Enabled")) {
            losHost.focus();
            errorText += "Error in the UDP Host Address!<br>";
            errorFlag = true;
        }
        if (!losPort.value.match(portformat) && (isUdpEnabled==="Enabled")) {
            losPort.focus();
            errorText += "Error in the UDP Port Number! (0-65535 allowed)<br>";
            errorFlag = true;
        }
        if (!tcpHost.value.match(ipformat) && (istcpEnabled==="Enabled")) {
            tcpHost.focus();
            errorText += "Error in the TCP Host Address, should be x.x.x.x<br>";
            errorFlag = true;
        }
        if (!tcpPort.value.match(portformat) && (istcpEnabled==="Enabled")) {
            tcpPort.focus();
            errorText += "Error in the TCP Port Number! (0-65535 allowed)<br>";
            errorFlag = true;
        }

        if (errorFlag)
        {
            result.style.color = "red";
            result.innerHTML = errorText;
            return;
        }
    
        //open the file for writing, and callback function for modification

        cockpit.file(confLocation + "main.conf")
        .read().then((content, tag) => SuccessReadforSaveFile(content))
            .catch(error => FailureReadFile(error));
       
}

function SuccessReadforSaveFile(content) {
    try{
       
        //if udp is disabled, then skip those
        if (isUdpEnabled == "Disabled")
        {
            content = setSectionEnabled(content, "[UdpEndpoint alpha]", 3, false);
        }
        else
        {
            content = setSectionEnabled(content, "[UdpEndpoint alpha]", 3, true);
            content = setValueByKey(content, "[UdpEndpoint alpha]",3, "Address", losHost.value )
            content = setValueByKey(content, "[UdpEndpoint alpha]",3, "Port", losPort.value )
            content = setValueByKey(content, "[UdpEndpoint alpha]",3, "Mode", udpMode.value )
        }

        if (istcpEnabled == "Disabled")
        {
            content = setSectionEnabled(content, "[TcpEndpoint alpha]", 2, false);
        }
        else
        {
            content = setSectionEnabled(content, "[TcpEndpoint alpha]", 2, true);
            content = setValueByKey(content, "[TcpEndpoint alpha]",2, "Address", tcpHost.value )
            content = setValueByKey(content, "[TcpEndpoint alpha]",2, "Port", tcpPort.value )
           }
        
        //at this point we have the contents of the file, we need to replace keys
        content = setValueByKey(content, "[UartEndpoint alpha]",2, "Device", fmuDevice.value )
        content = setValueByKey(content, "[UartEndpoint alpha]",2, "Baud", baudrate.value )
       

      
    cockpit.file(confLocation + "main.conf", { superuser : "try" }).replace(content)
        .then(Success)
        .catch(Fail);

    cockpit.spawn(["systemctl", "restart", "mavlink-router"], { superuser : "try" }); 
    }
    catch(e){
        FailureReadFile(e);
    }
    
}

function Success() {
    result.style.color = "green";
    result.innerHTML = "Success, mavlink-router restarting...";
    setTimeout(() => result.innerHTML = "", 5000);
}

function Fail(error) {
    result.style.color = "red";
    result.innerHTML = error.message;
}
// Send a 'init' message.  This tells integration tests that we are ready to go
cockpit.transport.wait(function() { });
