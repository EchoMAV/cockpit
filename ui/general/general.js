const scriptLocation = "/usr/local/h31/"
const confLocation = "/usr/local/h31/conf/"
const version = document.getElementById("version");
const losHost = document.getElementById("losHost");
const losPort = document.getElementById("losPort");
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
const atakPeriodArray = [ "Disabled", "1", "3", "5", "10" ];

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
    
    cockpit.file(confLocation + "mavproxy.conf")
        .read().then((content, tag) => SuccessReadFile(content))
            .catch(error => FailureReadFile(error));
}

function SuccessReadFile(content) {
    try{
        var splitResult = content.split("\n");
        
        if(splitResult.length >= CONFIG_LENGTH) {
            cockpit.script(scriptLocation + "cockpitScript.sh -s")
                .then((content) => AddDropDown(fmuDevice, AddPathToDeviceFile(content.split("\n")), splitResult[2].split("=")[1]))
                .catch(error => Fail(error));
            AddDropDown(baudrate, baudRateArray, splitResult[1].split("=")[1]);
            fmuId.value = splitResult[13].split("=")[1];
            losHost.value = splitResult[6].split("=")[1];
            losPort.value = splitResult[9].split("=")[1];
            cockpit.script(scriptLocation + "cockpitScript.sh -i")
                .then((content) => AddDropDown(losIface, content.split("\n"), splitResult[4].split("=")[1]))
                .catch(error => Fail(error));          
            atakHost.value = splitResult[10].split("=")[1];
            atakPort.value = splitResult[11].split("=")[1];
            AddDropDown(atakPeriod, atakPeriodArray, splitResult[12].split("=")[1]);           
        }
        else{
            FailureReadFile(new Error("To few parameters in file"));
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
    var fileString = "[Service]\n" + 
        "BAUD=" + baudrate.value + "\n" +
        "DEVICE=" + fmuDevice.value + "\n" +
        "FLAGS=--rtscts\n" +
        "IFACE=" + losIface.value + "\n" +
        "PROTOCOL=udp\n" +
        "HOST=" + losHost.value + "\n" +
        "LOCALAPDATA=/tmp\n" +
        "MAVPROXY=/usr/local/bin/h31proxy.py\n" +  //not used
        "PORT=" + losPort.value + "\n" +      
        "ATAK_HOST=" + atakHost.value + "\n" +
        "ATAK_PORT=" + atakPort.value + "\n" +
        "ATAK_PERIOD=" + atakPeriod.value + "\n" +
        "SYSID=" + fmuId.value + "\n";

    cockpit.file(confLocation + "mavproxy.conf", { superuser : "try" }).replace(fileString)
        .then(Success)
        .catch(Fail);

    cockpit.spawn(["systemctl", "restart", "h31proxy"], { superuser : "try" });
}

function Success() {
    result.style.color = "green";
    result.innerHTML = "Success, telemetry restarting...";
    setTimeout(() => result.innerHTML = "", 5000);
}

function Fail(error) {
    result.style.color = "red";
    result.innerHTML = error.message;
}
// Send a 'init' message.  This tells integration tests that we are ready to go
cockpit.transport.wait(function() { });
