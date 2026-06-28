export function connectWarRoom(){

    const es=new EventSource("/api/war-room/stream");

    es.onmessage=e=>{

        const msg=JSON.parse(e.data);

        window.dispatchEvent(

            new CustomEvent("warroom-stream",{

                detail:msg

            })

        );

    };

    return es;

}
