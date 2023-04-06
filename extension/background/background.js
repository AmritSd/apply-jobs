chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if(request.type === "completion") {
        console.log(request.text);
        var api_url = "http://127.0.0.1:5173/api/complete";
        fetch(api_url, {
            method: 'POST',
            body: JSON.stringify({
                text : request.text
            })
        }).then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            sendResponse(data.data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
        }
        return true;
    }
);