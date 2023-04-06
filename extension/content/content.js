/*
This file is injected in the root of every page. It's job is to retrieve all the inputs on the page and send them to openai-gpt to get a response.
It then parses the response and displays it in a div with id suggestions. If a user accepts a suggestion it is filled into the input field.
*/

// Global variables to store openai inputs and outputs -----------------//
var text = "";
var responses = [];
var inputs_final = [];
// --------------------------------------------------------------------//


// On load retrieve background information about the user. This is stored in content/text.txt --------------------------------------//
// Create a element in the top left corner of the page with id suggestions. This is where the suggestions will be displayed. -------//
window.onload = async function() {
    var file = chrome.runtime.getURL("content/text.txt");
    // Use fetch
    var data = await fetch(file);
    text = await data.text();
    console.log(text);

    // Make div with id suggestions
    var suggestions = document.createElement('div');
    suggestions.id = 'suggestions';
    suggestions.style = "position: fixed; top: 0; left: 0; width: 100px; height: 100px; background-color: blue; color: white; z-index: 9999;";
    document.body.appendChild(suggestions);
}
// ---------------------------------------------------------------------------------------------------------------------------------//



// Get all inputs on the page and return them as a string. This is done by getting all the labels and then joining them with new lines. -----------------//
function get_inputs() {

    console.log("running");

    var labels = [];
    inputs_final = [];

    // Get all input, textarea, select elements
    var inputs = document.querySelectorAll('input, textarea, select');

    // console.log(len(inputs));
    // Iterate over all elements
    var subCounter = 'a';
    var currName = undefined;
    var j = 0;
    for (var i = 0; i < inputs.length; i++) {
        // Check if element has a name attribute
        var name = inputs[i].getAttribute('name');
        // If input is radio button
        if(inputs[i].getAttribute('type') == 'radio') {
            // If name is not set
            if(currName != name) {
                if(subCounter != 'a') {
                    j++;
                }
                currName = name;
                subCounter = 'a';
            }
            else {
                subCounter = String.fromCharCode(subCounter.charCodeAt(0) + 1);
            }
        }
        else {
            currName = undefined;
            if(subCounter != 'a') {
                j++;
            }
            subCounter = 'a';
        }

        if(!name) {
            name = inputs[i].getAttribute('aria-describedby');
        }
        if (name) {
            // If name contains square brackets then make name just the content inside the brackets
            if (name.includes('[')) {
                name = name.split('[')[1].split(']')[0];
            }

            // Get label element
            var label = document.querySelector('label[for="' + name + '"]');
            var labelText = undefined;
            // Check if label exists
            if (label) {
                // Get label text
                labelText = label.innerText;
            }
            else {
                // Check if input might be wrapped in a label element
                var parent = inputs[i].parentNode;
                var father = parent.parentNode;
                if (parent.tagName == 'LABEL') {
                    labelText = parent.innerText;
                }
                else if (father.tagName == 'LABEL') {
                    labelText = father.innerText;
                }
            }
            if(!labelText) {
                // Try getting placeholder attribute
                labelText = inputs[i].getAttribute('placeholder');
            }
            if (labelText) {
                // Set placeholder attribute
                console.log(labelText + ":");
                var question_label = j;
                if(currName != undefined) {
                    question_label = j + "-" + subCounter;
                }
                
                labels.push(question_label + "." + labelText + ":");
                inputs_final.push({
                    input: inputs[i],
                    label: labelText,
                    labelIndex : question_label
                });

                if(currName == undefined) {
                    j++;
                }
                
            }
        }
    }

    // Join labels with new line
    var labelsString = labels.join('\n');

    console.log(labelsString);

    return text + labelsString;
}
// ---------------------------------------------------------------------------------------------------------------------------------------------//


// Get inputs after 5 seconds, on page load
function wrapper() {
    get_inputs();
}
setTimeout(wrapper(), 5000);




// On pressing cntrl key pressed get inputs again, but this time send them to openai-gpt to get a response. ------------------------------//
document.addEventListener('keydown',async function(event) {
    if (event.ctrlKey) {
        var resp = await chrome.runtime.sendMessage({type: "completion", text: get_inputs()});
        resp = resp.content;
        // Split response by new line
        resp = resp.split('\n');
        resp = resp.map((item) => {
            var sp = item.split(".");
            if(sp.length == 2) {
                return sp[1];
            }
            return undefined;
        });

        // Removed undefined values
        resp = resp.filter((item) => item != undefined);
        console.log(resp);

        // Get all input, textarea, select elements
        var inputs = document.querySelectorAll('input, textarea, select');

        if(inputs_final.length != resp.length) {
            alert("Number of inputs and responses do not match " + inputs_final.length + " " + resp.length);

            return;
        }

        responses = resp;

        inputs_final.forEach((item, index) => {
            document.addEventListener('focusin', function(event) {
                if (event.target == item.input) {
                    const suggestedValue = responses[index];
                    // get div with id suggestions
                    var suggestions = document.getElementById('suggestions');
                    suggestions.innerHTML = suggestedValue;
                }
            });
        });
    }
});


