export function addTimeline(msg){

    const panel=document.getElementById("timeline");

    if(!panel)return;

    panel.insertAdjacentHTML(

        "beforeend",

        `<div class="timeline-item">

            <span>${new Date().toLocaleTimeString()}</span>

            <div>${msg}</div>

        </div>`

    );

}
