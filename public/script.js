(function () {
    function signaturePad() {
        if (window.location.href.endsWith("petition")) {
            // Thanks to Matt Morgante. I used this source for the signature pad http://www.mattmorgante.com/technology/javascript-draw-html5-canvas
            let canvas = document.querySelector("#signatureCanvas");
            let ctx = canvas.getContext("2d");
            let canvasHidden = document.querySelector("#hiddenSignature");
            let signatureCheck = document.querySelector("#signatureCheck");
            let submit = document.querySelector(".submitSignUp");

            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#000000";

            let isDrawing = false;
            let lastX = 0;
            let lastY = 0;

            function draw(e) {
                // stop the function if they are not mouse down
                if (!isDrawing) return;
                //listen for mouse move event
                // console.log(e);
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(e.offsetX, e.offsetY);
                ctx.stroke();
                [lastX, lastY] = [e.offsetX, e.offsetY];
            }

            canvas.addEventListener("mousedown", (e) => {
                isDrawing = true;
                //Checks if signature pad is filled with something
                signatureCheck.value = true;
                [lastX, lastY] = [e.offsetX, e.offsetY];
            });

            canvas.addEventListener("mousemove", draw);
            canvas.addEventListener("mouseup", () => (isDrawing = false));
            canvas.addEventListener("mouseout", () => (isDrawing = false));

            //Sending data to the hidden canvas field
            submit.addEventListener("mousedown", () => {
                canvasHidden.value = canvas.toDataURL();
            });
        } else {
            return;
        }
    }

    signaturePad();

    //end of iife
})();
