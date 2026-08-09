import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Fingerprint,
  Loader2,
  Network,
  PlayCircle,
  Save,
  ShieldAlert,
  Target,
  UserRound,
   
} from "lucide-react";

import { Link } from "react-router-dom";


import CopyButton from "../components/CopyButton";


import { useToast } from "../context/ToastContext";


import {
  getInvestigation,
  saveInvestigation,
} from "../services/api";


import type {
  Detection,
  Investigation,
  InvestigationStatus,
  TimelineEvent,
  UploadResult,
} from "../services/api";


import exportInvestigationPdf from "../utils/exportInvestigationPdf";



const STORAGE_KEY =
  "sentinelai_latest_analysis";


const SELECTED_KEY =
  "sentinelai_selected_detection";






const severityColors = {

  Critical:
    "border-red-500/40 bg-red-500/10 text-red-300",

  High:
    "border-orange-500/40 bg-orange-500/10 text-orange-300",

  Medium:
    "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",

  Low:
    "border-blue-500/40 bg-blue-500/10 text-blue-300",

};





const statusColors = {


  Open:
    "border-red-500/40 bg-red-500/10 text-red-300",


  "In Progress":
    "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",


  Resolved:
    "border-green-500/40 bg-green-500/10 text-green-300",


  "False Positive":
    "border-slate-500/40 bg-slate-500/10 text-slate-300",


};







type EvidenceItem = {

  label:string;

  value:string;

  icon:any;

};








export default function Investigations(){



const {showToast} = useToast();





const [analysis,setAnalysis] =

useState<UploadResult | null>(null);





const [selectedIndex,setSelectedIndex] =

useState(0);





const [investigation,setInvestigation] =

useState<Investigation | null>(null);





const [status,setStatus] =

useState<InvestigationStatus>("Open");





const [analyst,setAnalyst] =

useState("Dipan");





const [notes,setNotes] =

useState("");





const [saving,setSaving] =

useState(false);





const [loading,setLoading] =

useState(false);





const [message,setMessage] =

useState("");





const [error,setError] =

useState("");







// Load latest analysis

useEffect(()=>{


const saved =

localStorage.getItem(

STORAGE_KEY

);



if(saved){


try{


setAnalysis(

JSON.parse(saved)

);


}

catch(err){


console.error(

"Analysis load failed",

err

);


}



}



},[]);







const detections:Detection[] =

analysis?.detections ?? [];





const selectedDetection =

detections[selectedIndex];








// Restore selected detection

useEffect(()=>{


const saved =

localStorage.getItem(

SELECTED_KEY

);



if(saved){


const index =

Number(saved);



if(

!Number.isNaN(index)

&&

detections[index]

){


setSelectedIndex(index);


}


}



},[detections]);






// Load saved investigation

useEffect(()=>{


async function load(){



if(!selectedDetection?.id){

return;

}



try{


setLoading(true);



const result =

await getInvestigation(

selectedDetection.id

);



setInvestigation(result);



setStatus(

result.status

);



setAnalyst(

result.analyst ?? "Dipan"

);



setNotes(

result.notes ?? ""

);



}

catch(err){


console.log(

"No investigation found"

);


}

finally{


setLoading(false);


}



}



load();



},[selectedDetection]);






const timeline:TimelineEvent[] =

useMemo(()=>{


return (

analysis?.timeline ?? []

).map((event,index)=>(

{

id:event.id ?? index,

timestamp:event.timestamp,

event_type:event.event_type,

title:event.title,

status:event.status,

ip:event.ip,

user:event.user,

method:event.method,

invalid_user:event.invalid_user,

line_number:event.line_number,

raw:event.raw,


}

));


},[analysis]);

// =====================================
// EVIDENCE DATA
// =====================================


const evidence:EvidenceItem[] =

useMemo(()=>{


if(!selectedDetection){

return [];

}



const items:EvidenceItem[] = [];





if(selectedDetection.source_ip){


items.push({

label:"Source IP",

value:selectedDetection.source_ip,

icon:Network,

});


}





if(selectedDetection.mitre_id){


items.push({

label:"MITRE Technique",

value:selectedDetection.mitre_id,

icon:Target,

});


}







(selectedDetection.affected_users ?? [])

.forEach((user)=>{


items.push({

label:"Affected User",

value:user,

icon:UserRound,

});


});





return items;



},[selectedDetection]);









// =====================================
// SAVE INVESTIGATION
// =====================================



const handleSave = async()=>{



if(!selectedDetection){


setError(

"No detection selected"

);


return;


}





try{


setSaving(true);

setError("");





const result =

await saveInvestigation({



analysis_id:

analysis?.analysis_id ?? 0,



detection_id:

selectedDetection.id ?? 0,



status,



analyst,



notes,



completed_actions:[],


});





setInvestigation(result);



setMessage(

"Investigation saved successfully."

);

showToast?.({
  title: "Success",
  message: "Investigation saved",
  type: "success",
});





}

catch(err){



setError(

err instanceof Error

?

err.message

:

"Unable to save investigation"

);



}

finally{


setSaving(false);


}



};









// =====================================
// EXPORT PDF
// =====================================



const handleExport = ()=>{



if(!selectedDetection){

return;

}





try{


exportInvestigationPdf({

  detection:selectedDetection,

  investigation,

  analyst,

  notes,

 analysis: analysis!,

  relatedTimeline: timeline,

  completedActions: [],

});

showToast?.({
  title: "Success",
  message: "PDF exported",
  type: "success",
});

}

catch(err){


console.error(err);



showToast?.({
  title: "Error",
  message: "PDF export failed",
  type: "error",
});

}



};









// =====================================
// CHANGE DETECTION
// =====================================



const changeDetection=(index:number)=>{


setSelectedIndex(index);



localStorage.setItem(

SELECTED_KEY,

String(index)

);



};









const severity =

selectedDetection?.severity ?? "Low";




const currentStatus =

status;



const recommendations =

selectedDetection?.recommendations ?? [];

// =====================================
// JSX UI
// =====================================


return (

<div className="min-h-screen bg-slate-950 text-white p-6">


{/* HEADER */}

<div className="flex justify-between items-center mb-8">


<div className="flex items-center gap-4">


<Link

to="/dashboard"

className="text-slate-400 hover:text-white flex gap-2 items-center"

>

<ArrowLeft size={18}/>

Dashboard

</Link>



<div>

<h1 className="text-3xl font-bold">

Investigation Center

</h1>


<p className="text-slate-400">

SOC incident investigation workspace

</p>


</div>


</div>






<button

onClick={handleExport}

disabled={!selectedDetection}

className="flex gap-2 items-center bg-cyan-500 text-black px-4 py-2 rounded-lg disabled:opacity-50"

>

<Download size={18}/>

Export PDF

</button>



</div>









{error && (

<div className="border border-red-500/40 bg-red-500/10 text-red-300 p-4 rounded-lg mb-5">

<div className="flex gap-2 items-center">

<AlertCircle size={18}/>

{error}

</div>

</div>

)}







{message && (

<div className="border border-green-500/40 bg-green-500/10 text-green-300 p-4 rounded-lg mb-5">

<div className="flex gap-2 items-center">

<CheckCircle2 size={18}/>

{message}

</div>

</div>

)}









<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">







{/* LEFT SIDE */}


<div className="xl:col-span-2 space-y-6">







{/* DETECTIONS */}


<div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">


<h2 className="text-xl font-semibold flex gap-2 items-center mb-5">


<ShieldAlert size={20}/>

Detections


</h2>





<div className="space-y-3">


{detections.map((item,index)=>(


<button


key={item.id ?? index}


onClick={()=>changeDetection(index)}


className={`w-full text-left p-4 rounded-lg border transition ${

index===selectedIndex

?

"border-cyan-400 bg-cyan-500/10"

:

"border-slate-700 hover:border-slate-500"

}`}


>


<div className="flex justify-between">


<div>

<p className="font-medium">

{item.type}

</p>


<p className="text-sm text-slate-400 mt-1">

{item.description}

</p>


</div>




<span

className={`px-3 py-1 rounded-full text-xs border ${

severityColors[item.severity]

}`}

>

{item.severity}

</span>



</div>



</button>



))}



</div>


</div>









{/* SELECTED DETECTION */}



{selectedDetection && (


<div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">


<div className="flex justify-between">


<div>


<h2 className="text-2xl font-bold">

{selectedDetection.type}

</h2>


<p className="text-slate-400 mt-2">

{selectedDetection.description}

</p>


</div>




<span

className={`border rounded-full px-3 py-1 h-fit ${

severityColors[severity]

}`}

>

{severity}

</span>



</div>







<div className="grid md:grid-cols-3 gap-4 mt-6">



<div className="bg-slate-800 rounded-lg p-4">

<p className="text-slate-400 text-sm">

Events

</p>

<p className="text-2xl font-bold">

{selectedDetection.event_count}

</p>

</div>






<div className="bg-slate-800 rounded-lg p-4">

<p className="text-slate-400 text-sm">

MITRE

</p>

<p>

{selectedDetection.mitre_id ?? "-"}

</p>

</div>






<div className="bg-slate-800 rounded-lg p-4">

<p className="text-slate-400 text-sm">

Confidence

</p>

<p>

{selectedDetection.confidence ?? "-"}

</p>

</div>




</div>



</div>


)}









{/* EVIDENCE */}



<div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">


<h2 className="font-semibold text-xl flex gap-2 items-center mb-5">

<Fingerprint size={20}/>

Evidence

</h2>





<div className="grid md:grid-cols-2 gap-4">


{evidence.map((item,index)=>{


const Icon=item.icon;


return (

<div

key={index}

className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"

>


<div className="flex gap-2 items-center text-slate-400 text-sm">

<Icon size={16}/>

{item.label}

</div>



<div className="flex justify-between items-center mt-2">

<span className="text-cyan-300 break-all">

{item.value}

</span>



<CopyButton

 value={item.value} />




</div>


</div>


)


})}



</div>


</div>









{/* TIMELINE */}



<div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">


<h2 className="text-xl font-semibold flex gap-2 items-center mb-5">


<Clock3 size={20}/>

Timeline


</h2>





<div className="space-y-3">


{timeline.length===0 && (

<p className="text-slate-400">

No timeline events available.

</p>

)}






{timeline.map((event,index)=>(


<div

key={event.id ?? index}

className="border border-slate-700 rounded-lg p-4 bg-slate-800/40"

>


<p className="font-medium">

{event.title ??

event.event_type ??

"Event"}

</p>


<p className="text-sm text-slate-400">

{event.timestamp}

</p>



<div className="grid grid-cols-2 gap-2 mt-3 text-sm">


<p>

IP: {event.ip ?? "-"}

</p>


<p>

User: {event.user ?? "-"}

</p>


<p>

Method: {event.method ?? "-"}

</p>


<p>

Status: {event.status ?? "-"}

</p>



</div>


</div>



))}



</div>


</div>






{/* CLOSE LEFT COLUMN */}

</div>









{/* RIGHT SIDEBAR */}


<div className="space-y-6">







{/* STATUS PANEL */}


<div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">


<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">


<PlayCircle size={20}/>

Investigation Status


</h2>






<div className="space-y-3">


{(

[

"Open",

"In Progress",

"Resolved",

"False Positive",

] as InvestigationStatus[]

).map((item)=>(


<button


key={item}


onClick={()=>setStatus(item)}


className={`w-full text-left px-4 py-3 rounded-lg border transition ${

status === item

?

statusColors[item]

:

"border-slate-700 bg-slate-800/40 hover:bg-slate-800"

}`}


>


{item}


</button>



))}



</div>



</div>









{/* INVESTIGATION NOTES */}



<div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">


<h2 className="text-xl font-semibold flex items-center gap-2 mb-5">


<FileText size={20}/>

Investigation Notes


</h2>






<label className="text-sm text-slate-400">

Analyst

</label>



<input


value={analyst}


onChange={(e)=>setAnalyst(e.target.value)}


className="w-full mt-2 mb-5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"


placeholder="Analyst name"

/>








<label className="text-sm text-slate-400">

Notes

</label>



<textarea


value={notes}


onChange={(e)=>setNotes(e.target.value)}


rows={6}


className="w-full mt-2 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"


placeholder="Write investigation notes..."



/>







<button


onClick={handleSave}


disabled={saving || !selectedDetection}


className="mt-5 w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500 text-black font-semibold py-3 hover:bg-cyan-400 disabled:opacity-50"



>


{

saving

?

<>

<Loader2

size={18}

className="animate-spin"

/>

Saving...

</>


:

<>

<Save size={18}/>

Save Investigation

</>

}


</button>



</div>









{/* RECOMMENDATIONS */}


<div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">


<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">


<Target size={20}/>

Recommendations


</h2>





{recommendations.length === 0 ? (


<p className="text-slate-400 text-sm">

No recommendations available.

</p>



):(


<ul className="space-y-2">


{recommendations.map((item,index)=>(


<li


key={index}


className="border border-slate-700 rounded-lg p-3 text-sm bg-slate-800/40"


>


{item}


</li>



))}



</ul>


)}



</div>









</div>









</div>






</div>

);


}