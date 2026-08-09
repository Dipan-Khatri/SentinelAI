import { useEffect, useState } from "react";

import {
  AlertTriangle,
  Activity,
  ShieldAlert,
  
  RefreshCcw,
  FileText,
} from "lucide-react";


import {
  getAnalyses,
  getAnalysisById,
  historicalAnalysisToUploadResult,
  type UploadResult,
  type AnalysisHistoryItem,
  type Detection,
} from "../services/api";



function Reports() {


  const [history,setHistory] =
    useState<AnalysisHistoryItem[]>([]);


  const [report,setReport] =
    useState<UploadResult | null>(null);


  const [loading,setLoading] =
    useState(false);


  const [error,setError] =
    useState("");





  useEffect(()=>{

    loadReports();

  },[]);





  async function loadReports(){


    try{

      const data =
        await getAnalyses();


      setHistory(data);


    }catch(err){


      setError(
        err instanceof Error
        ? err.message
        : "Failed loading reports"
      );


    }

  }






  async function selectReport(id:number){


    try{


      setLoading(true);


      const data =
        await getAnalysisById(id);



      const converted =
        historicalAnalysisToUploadResult(
          data
        );


      setReport(converted);



    }catch(err){


      setError(
        err instanceof Error
        ? err.message
        : "Failed loading report"
      );


    }finally{


      setLoading(false);


    }


  }







return (

<div className="p-6 space-y-6">


<div className="flex justify-between">


<div>

<h1 className="text-3xl font-bold">
Security Reports
</h1>


<p className="text-gray-500">
SentinelAI investigation history
</p>


</div>



<button

onClick={loadReports}

className="
flex gap-2
bg-blue-600
text-white
px-4
py-2
rounded
"

>

<RefreshCcw size={18}/>

Refresh

</button>


</div>





{error && (

<div className="bg-red-100 text-red-700 p-3 rounded">

{error}

</div>

)}





<div className="grid grid-cols-1 md:grid-cols-4 gap-4">


<Card

title="Reports"

value={history.length}

icon={<FileText/>}

/>


<Card

title="Detections"

value={report?.detections.length ?? 0}

icon={<ShieldAlert/>}

/>



<Card

title="Risk Score"

value={report?.risk_score ?? 0}

icon={<Activity/>}

/>



<Card

title="Risk Level"

value={report?.risk_level ?? "None"}

icon={<AlertTriangle/>}

/>



</div>
      <div className="
      grid
      grid-cols-1
      lg:grid-cols-2
      gap-6
      ">



        <div className="
        bg-white
        rounded-xl
        shadow
        p-5
        ">



          <h2 className="
          text-xl
          font-semibold
          mb-4
          ">

            Previous Reports

          </h2>





          {history.length === 0 && (

            <p className="text-gray-500">

              No analysis history found.

            </p>

          )}




          <div className="space-y-3">


          {history.map((item)=> (


            <button

            key={item.id}

            onClick={() =>
              selectReport(item.id)
            }


            className="
            w-full
            text-left
            border
            rounded-lg
            p-4
            hover:bg-gray-50
            "

            >


              <div className="
              flex
              justify-between
              ">


                <div>


                  <p className="
                  font-semibold
                  ">

                    {item.filename}

                  </p>



                  <p className="
                  text-sm
                  text-gray-500
                  ">

                    Risk:
                    {" "}
                    {item.risk_level}

                  </p>



                </div>




                <div className="
                text-sm
                text-gray-500
                ">


                  Score:

                  {" "}

                  {item.risk_score}


                </div>


              </div>



            </button>


          ))}


          </div>


        </div>







        <div className="
        bg-white
        rounded-xl
        shadow
        p-5
        ">



          <h2 className="
          text-xl
          font-semibold
          mb-4
          ">

          Report Details

          </h2>




          {loading && (

            <p>

              Loading report...

            </p>

          )}




          {!loading && !report && (

            <p className="text-gray-500">

              Select a report from the left.

            </p>

          )}






          {report && (


          <div className="space-y-4">



            <div>


              <p className="font-semibold">

                Filename

              </p>


              <p>

                {report.filename}

              </p>


            </div>





            <div className="
            grid
            grid-cols-2
            gap-3
            ">



              <InfoBox

              title="Entries"

              value={report.entries}

              />



              <InfoBox

              title="Failed Logins"

              value={report.failed_logins}

              />



              <InfoBox

              title="Successful Logins"

              value={report.successful_logins}

              />



              <InfoBox

              title="Risk"

              value={
                `${report.risk_level} (${report.risk_score})`
              }

              />



            </div>





          </div>


          )}



        </div>




      </div>





      {report && (

      <div className="
      bg-white
      rounded-xl
      shadow
      p-5
      ">


        <h2 className="
        text-xl
        font-semibold
        mb-4
        ">

        Detections

        </h2>




        {report.detections.length === 0 && (

          <p className="text-gray-500">

          No detections found.

          </p>

        )}






        <div className="space-y-4">


        {report.detections.map(

          (detection:Detection,index:number)=>(


          <div

          key={index}

          className="
          border
          rounded-lg
          p-4
          "

          >



            <div className="
            flex
            justify-between
            ">



              <div>


                <h3 className="font-semibold">

                {detection.type}

                </h3>



                <p className="text-sm text-gray-600">

                {detection.description}

                </p>



              </div>





              <span className="
              bg-red-100
              text-red-700
              px-3
              py-1
              rounded-full
              h-fit
              ">

              {detection.severity}

              </span>



            </div>






            <div className="
            grid
            grid-cols-2
            gap-2
            mt-3
            text-sm
            ">


              <p>

              MITRE:
              {" "}
              {detection.mitre_id}

              </p>



              <p>

              Confidence:
              {" "}
              {detection.confidence}

              %

              </p>



              <p>

              Source IP:
              {" "}
              {detection.source_ip ?? "Unknown"}

              </p>



              <p>

              Events:
              {" "}
              {detection.event_count}

              </p>



            </div>



          </div>


        ))}


        </div>



      </div>

      )}

      {report && report.timeline.length > 0 && (

        <div className="
        bg-white
        rounded-xl
        shadow
        p-5
        ">



          <h2 className="
          text-xl
          font-semibold
          mb-4
          ">

            Event Timeline

          </h2>





          <div className="space-y-4">


          {report.timeline.map(
            (event,index)=>(


            <div

            key={index}

            className="
            border-l-4
            border-blue-500
            pl-4
            "

            >


              <p className="font-semibold">

                {event.title}

              </p>




              <p className="text-sm text-gray-500">

                {event.timestamp}

              </p>



              <p className="text-sm">

                {event.raw}

              </p>



            </div>


          ))}



          </div>


        </div>


      )}




    </div>


  );


}







function Card({

title,

value,

icon,

}:{

title:string;

value:string | number;

icon:React.ReactNode;


}){


return (

<div className="
bg-white
rounded-xl
shadow
p-5
flex
justify-between
items-center
">


<div>


<p className="text-gray-500 text-sm">

{title}

</p>



<h3 className="
text-2xl
font-bold
">

{value}

</h3>


</div>




<div className="text-blue-600">

{icon}

</div>



</div>


);


}







function InfoBox({

title,

value,

}:{

title:string;

value:string | number;


}){


return (

<div className="
border
rounded-lg
p-3
">


<p className="text-sm text-gray-500">

{title}

</p>



<p className="font-semibold">

{value}

</p>



</div>

);


}






export default Reports;
