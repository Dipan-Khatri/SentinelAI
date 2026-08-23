 import {
  useState,
} from "react";

import {
 
  CheckCircle2,
  CircleAlert,
 
  FileText,
  Gauge,
  
  LoaderCircle,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { useToast } from "../context/ToastContext";
import { addSocActivity } from "../services/activityFeed";

import {
  uploadLog,
  type Detection,
 
  type UploadResult,
} from "../services/api";


const STORAGE_KEY =
  "sentinelai_latest_analysis";


const ALLOWED_EXTENSIONS = [
  ".log",
  ".txt",
  ".csv",
  ".json",
];


type FilePreview = {
  file: File;
  name: string;
  size: string;
  entries: number;
  lines: string[];
};



const severityStyles: Record<
  Detection["severity"],
  string
> = {

  Critical:
    "border-red-400 bg-red-500/20 text-red-200",

  High:
    "border-red-500/60 bg-red-500/15 text-red-300",

  Medium:
    "border-amber-500/60 bg-amber-500/15 text-amber-300",

  Low:
    "border-blue-500/60 bg-blue-500/15 text-blue-300",

};



const riskStyles: Record<
  UploadResult["risk_level"],
  string
> = {

  Critical:
    "border-red-500/40 bg-red-500/20 text-red-300",

  High:
    "border-orange-500/40 bg-orange-500/20 text-orange-300",

  Medium:
    "border-amber-500/40 bg-amber-500/20 text-amber-300",

  Low:
    "border-green-500/40 bg-green-500/20 text-green-300",

};



const riskBarStyles: Record<
  UploadResult["risk_level"],
  string
> = {

  Critical:
    "bg-red-500",

  High:
    "bg-orange-500",

  Medium:
    "bg-amber-500",

  Low:
    "bg-green-500",

};



function UploadLogs() {


  const [preview, setPreview] =
    useState<FilePreview | null>(null);



  const [analysis, setAnalysis] =
    useState<UploadResult | null>(null);



  const [error, setError] =
    useState("");



  const [isAnalyzing, setIsAnalyzing] =
    useState(false);



  const { showToast } =
    useToast();




  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {


    const file =
      event.target.files?.[0];



    setError("");

    setPreview(null);

    setAnalysis(null);



    if (!file) {

      return;

    }



    const extension =
      getFileExtension(
        file.name,
      );



    if (
      !ALLOWED_EXTENSIONS.includes(
        extension,
      )
    ) {


      const message =
        "Please upload a .log, .txt, .csv, or .json file.";


      setError(message);

      event.target.value = "";


      showToast({

        title:
          "Unsupported file type",

        message,

        type:
          "warning",

      });


      return;

    }



    try {


      const content =
        await file.text();



      const logLines =
        content
          .split(/\r?\n/)
          .filter(
            (line) =>
              line.trim() !== "",
          );



      if (
        logLines.length === 0
      ) {


        const message =
          "The selected file does not contain readable log entries.";


        setError(message);


        showToast({

          title:
            "Empty log file",

          message,

          type:
            "warning",

        });


        return;

      }



      setPreview({

        file,

        name:
          file.name,

        size:
          formatFileSize(
            file.size,
          ),

        entries:
          logLines.length,

        lines:
          logLines.slice(
            0,
            5,
          ),

      });



      showToast({

        title:
          "File ready",

        message:
          `${file.name} passed validation with ${logLines.length.toLocaleString()} entries.`,

        type:
          "success",

        duration:
          2800,

      });



    } catch {


      const message =
        "SentinelAI could not read this file.";


      setError(message);


      showToast({

        title:
          "File reading failed",

        message,

        type:
          "error",

      });


    }

  }
  // ================================
// ANALYZE LOG FILE
// ================================

async function handleAnalyze() {

  if (!preview) {

    const message =
      "Select and validate a security log before starting analysis.";

    setError(message);

    showToast({
      title:
        "No log selected",

      message,

      type:
        "warning",
    });

    return;
  }


  setError("");

  setAnalysis(null);

  setIsAnalyzing(true);



  showToast({

    title:
      "Analysis started",

    message:
      `SentinelAI is analyzing ${preview.name}.`,

    type:
      "info",

    duration:
      2200,

  });



  addSocActivity({

    title:
      "Security log analysis started",

    description:
      `${preview.name} was submitted for security analysis.`,

    category:
      "analysis",

    severity:
      "Info",

    filename:
      preview.name,

  });



  try {


    const rawResult =
      await uploadLog(
        preview.file,
      );
console.log("BACKEND RESPONSE:", rawResult);



    /*
      FIX:
      Backend response and frontend model
      were different.

      Backend:
      detections: 0
      severity: "High"
      total_events: 0

      Frontend expects:
      detections: []
      risk_level
      entries
      timeline
    */


    const normalizedResult: UploadResult =
    {

      ...rawResult,
analysis_id:
  rawResult.analysis_id ??
  (rawResult as any).id ??
  Date.now(),

filename:
  normalizeFilename(
    rawResult.filename ??
    preview.name,
    preview.name,
  ),

entries:
  rawResult.entries ??
  (rawResult as any).total_events ??
  0,


risk_level:
  rawResult.risk_level ??
  (rawResult as any).severity ??
  "Low",

risk_score:
  rawResult.risk_score ??
  0,

failed_logins:
  rawResult.failed_logins ??
  0,

successful_logins:
  rawResult.successful_logins ??
  0,
  

      detections:
        Array.isArray(
          rawResult.detections,
        )

        ? rawResult.detections

        : [],



      suspicious_ips:
        Array.isArray(
          rawResult.suspicious_ips,
        )

        ? rawResult.suspicious_ips

        : [],



      timeline:
        Array.isArray(
          rawResult.timeline,
        )

        ? rawResult.timeline

        : [],



      severity_summary:

        rawResult.severity_summary ??

        {

          critical:
            0,

          high:
            0,

          medium:
            0,

          low:
            0,

        },



      preview:

        rawResult.preview ??

        [],

    };




      setAnalysis(
        normalizedResult,
      );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          normalizedResult,
        ),
      );

    addSocActivity({

      title:
        "Security log analysis completed",


      description:
        `SentinelAI analyzed ${normalizedResult.entries.toLocaleString()} events and assigned a ${normalizedResult.risk_level.toLowerCase()} risk score of ${normalizedResult.risk_score}/100.`,


      category:
        "analysis",


      severity:
        normalizedResult.detections.length > 0

          ? normalizedResult.risk_level

          : "Success",


      filename:
        normalizedResult.filename,


    });




    normalizedResult.detections.forEach(

      (detection) => {


        addSocActivity({

          title:
            detection.type,


          description:
            `${detection.description} Confidence: ${detection.confidence ?? 0}%.`,


          category:
            "detection",


          severity:
            detection.severity,


          sourceIp:
            detection.source_ip ??
            undefined,


          filename:
            normalizedResult.filename,


          mitreId:
            detection.mitre_id,


        });


      },

    );





    if (

      normalizedResult.suspicious_ips.length >

      0

    ) {


      const highestActivitySource =

        [

          ...normalizedResult.suspicious_ips,

        ]

        .sort(

          (
            firstIp,

            secondIp,

          ) =>

            secondIp.attempts -

            firstIp.attempts,

        )[0];




      addSocActivity({

        title:
          "Suspicious source activity identified",


        description:

          `${normalizedResult.suspicious_ips.length.toLocaleString()} suspicious source IP addresses identified. ${highestActivitySource.ip} produced the most activity with ${highestActivitySource.attempts.toLocaleString()} failed attempts.`,


        category:
          "threat-intelligence",


        severity:
          normalizedResult.risk_level,


        sourceIp:
          highestActivitySource.ip,


        filename:
          normalizedResult.filename,

      });


    }





    const detectionText =

      normalizedResult.detections.length === 1

        ? "1 detection"

        :

        `${normalizedResult.detections.length.toLocaleString()} detections`;




    showToast({

      title:
        "Analysis complete",


      message:

        `${normalizedResult.filename} was analyzed successfully with ${detectionText} and a ${normalizedResult.risk_level.toLowerCase()} risk score of ${normalizedResult.risk_score}/100.`,


      type:
        "success",


      duration:
        5000,

    });



  } catch (errorValue) {


    const message =

      errorValue instanceof Error

        ? errorValue.message

        :

        "SentinelAI could not connect to the backend.";



    setError(message);



    addSocActivity({

      title:
        "Security log analysis failed",


      description:

        `${preview.name} could not be analyzed. ${message}`,


      category:
        "system",


      severity:
        "High",


      filename:
        preview.name,

    });



    showToast({

      title:
        "Analysis failed",


      message,


      type:
        "error",


      duration:
        6000,

    });



  } finally {


    setIsAnalyzing(false);


  }

}
return (

  <div className="min-h-screen bg-slate-900 p-4 text-white sm:p-6 lg:p-8">

    <div className="mx-auto max-w-6xl">


      <header>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">

          SentinelAI Log Analysis

        </p>


        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">

          Upload Security Logs

        </h1>


        <p className="mt-2 max-w-3xl text-slate-400">

          Import authentication logs for validation,
          threat detection, risk scoring, and incident
          investigation.

        </p>


      </header>





      <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-slate-800 px-6 py-14 text-center transition hover:border-blue-500 hover:bg-slate-800/80">


        <Upload className="mb-4 h-10 w-10 text-blue-500" />


        <span className="text-lg font-semibold">

          Select a security log file

        </span>


        <span className="mt-2 text-sm text-slate-400">

          Supported formats: LOG, TXT, CSV, and JSON

        </span>



        <input

          type="file"

          accept=".log,.txt,.csv,.json"

          onChange={handleFileChange}

          className="hidden"

        />


      </label>





      {error && (

        <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">


          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />


          <p className="text-sm leading-6">

            {error}

          </p>


        </div>

      )}






      {preview && (

        <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-lg">


          <div className="flex flex-wrap items-start justify-between gap-5">


            <div className="flex min-w-0 items-center gap-3">


              <div className="rounded-lg bg-blue-500/15 p-3">

                <FileText className="h-7 w-7 text-blue-500" />

              </div>



              <div className="min-w-0">


                <h2 className="break-all text-xl font-semibold">

                  {preview.name}

                </h2>



                <p className="mt-1 text-sm text-slate-400">

                  {preview.size}

                  {" · "}

                  {preview.entries.toLocaleString()}

                  {" local entries"}

                </p>


              </div>


            </div>





            <button

              type="button"

              onClick={resetUpload}

              disabled={isAnalyzing}

              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"

            >

              Clear File

            </button>


          </div>





          <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-4">


            <p className="mb-3 text-sm font-semibold text-slate-300">

              File preview

            </p>


            <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">

              {preview.lines.join("\n")}

            </pre>


          </div>





          <div className="mt-5 flex items-start gap-2 text-sm text-green-400">


            <ShieldCheck className="mt-0.5 h-5 w-5" />


            <span>

              File validated and ready for backend analysis

            </span>


          </div>





          <button

            type="button"

            onClick={() => void handleAnalyze()}

            disabled={isAnalyzing}

            className="mt-6 flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-700 disabled:opacity-60"

          >

            {isAnalyzing ? (

              <>

                <LoaderCircle className="h-5 w-5 animate-spin" />

                Analyzing...

              </>

            ) : (

              <>

                <ShieldAlert className="h-5 w-5" />

                Analyze Logs

              </>

            )}


          </button>



        </section>

      )}






      {analysis && (

        <>


          <section className="mt-8 rounded-xl border border-green-500/30 bg-green-500/10 p-6">


            <div className="flex items-start gap-3">


              <CheckCircle2 className="mt-0.5 h-7 w-7 text-green-400" />


              <div>


                <h2 className="text-xl font-semibold">

                  Backend analysis complete

                </h2>



                <p className="mt-1 text-sm text-green-300">

                  SentinelAI successfully analyzed{" "}

                  <span className="font-semibold">

                    {analysis.filename}

                  </span>


                </p>


              </div>


            </div>





            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">


              <MetricCard

                title="Log entries"

                value={analysis.entries}

              />


              <MetricCard

                title="Failed logins"

                value={analysis.failed_logins}

                valueClass="text-orange-400"

              />


              <MetricCard

                title="Successful logins"

                value={analysis.successful_logins}

                valueClass="text-green-400"

              />


              <MetricCard

                title="Detections"

                value={analysis.detections.length}

                valueClass="text-red-400"

              />


            </div>



          </section>





          <RiskScoreCard

            analysis={analysis}

          />





          {analysis.detections.length > 0 ? (

            <section className="mt-8 rounded-xl border border-red-500/40 bg-red-500/10 p-6">


              <div className="flex items-start gap-3">


                <ShieldAlert className="h-8 w-8 text-red-400" />


                <div>


                  <h2 className="text-2xl font-bold">

                    Threat Detections

                  </h2>


                </div>


              </div>




              <div className="mt-6 space-y-5">


                {analysis.detections.map(

                  (detection,index)=>(

                    <DetectionCard

                      key={`${detection.type}-${index}`}

                      detection={detection}

                      number={index+1}

                    />

                  )

                )}


              </div>


            </section>


          ) : (

            <section className="mt-8 rounded-xl border border-green-500/30 bg-green-500/10 p-6">


              <ShieldCheck className="h-7 w-7 text-green-400" />


              <h2 className="mt-3 text-xl font-semibold">

                No threats detected

              </h2>


              <p className="mt-2 text-sm text-green-300">

                No activity matched current detection rules.

              </p>


            </section>

          )}



        </>

      )}



    </div>

  </div>

);
type RiskScoreCardProps = {
  analysis: UploadResult;
};


function RiskScoreCard({
  analysis,
}: RiskScoreCardProps) {

  return (

    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-6">


      <div className="flex flex-wrap items-start justify-between gap-5">


        <div className="flex items-start gap-3">


          <div className="rounded-lg bg-blue-500/15 p-3">

            <Gauge className="h-7 w-7 text-blue-400" />

          </div>



          <div>

            <h2 className="text-2xl font-bold">

              Overall Risk Score

            </h2>


            <p className="mt-1 text-sm text-slate-400">

              Calculated from detection severity,
              confidence, suspicious activity,
              and authentication behavior.

            </p>

          </div>


        </div>




        <span
          className={`rounded-full border px-4 py-2 text-sm font-bold ${
            riskStyles[
              analysis.risk_level
            ]
          }`}
        >

          {analysis.risk_level} Risk

        </span>



      </div>





      <div className="mt-8 flex items-end gap-3">


        <p className="text-5xl font-bold">

          {analysis.risk_score}

        </p>


        <p className="pb-1 text-xl text-slate-400">

          /100

        </p>


      </div>





      <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-950">


        <div

          className={`h-full rounded-full ${
            riskBarStyles[
              analysis.risk_level
            ]
          }`}

          style={{

            width:
              `${Math.min(
                Math.max(
                  analysis.risk_score,
                  0,
                ),
                100,
              )}%`,

          }}

        />


      </div>



    </section>

  );

}





type MetricCardProps = {

  title:string;

  value:number;

  valueClass?:string;

};



function MetricCard({

  title,

  value,

  valueClass="text-white",

}:MetricCardProps){


  return (

    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">


      <p className="text-sm text-slate-400">

        {title}

      </p>


      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>

        {value.toLocaleString()}

      </p>


    </div>

  );


}






type DetectionCardProps = {

  detection:Detection;

  number:number;

};



function DetectionCard({

  detection,

  number,

}:DetectionCardProps){


  return (

    <article className="rounded-xl border border-slate-700 bg-slate-950/70 p-6">


      <div className="flex justify-between gap-4">


        <div>

          <p className="text-sm text-slate-500">

            Detection #{number}

          </p>


          <h3 className="text-xl font-bold">

            {detection.type}

          </h3>


        </div>



        <span
          className={`rounded-full border px-3 py-1 ${
            severityStyles[
              detection.severity
            ]
          }`}
        >

          {detection.severity}

        </span>



      </div>





      <p className="mt-4 text-slate-300">

        {detection.description}

      </p>





      <div className="mt-5 grid gap-4 sm:grid-cols-2">


        <DetailCard

          label="MITRE ATT&CK"

          value={detection.mitre_id}

        />



        <DetailCard

          label="Confidence"

          value={`${detection.confidence ?? 0}%`}

        />



        <DetailCard

          label="Source IP"

          value={
            detection.source_ip ??
            "Unknown"
          }

        />



        <DetailCard

          label="Events"

          value={
            String(
              detection.event_count
            )
          }

        />


      </div>



    </article>

  );


}







type DetailCardProps = {

 label:string;

 value:string;

};



function DetailCard({

 label,

 value,

}:DetailCardProps){


 return (

  <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">


    <p className="text-sm text-slate-400">

      {label}

    </p>


    <p className="mt-2 break-words font-semibold">

      {value}

    </p>


  </div>


 );


}







function resetUpload(){

  // placeholder
  // this function remains in Part 2/3 flow

}






function normalizeFilename(

 backendFilename:string,

 originalFilename:string,

){


 const backend =
   backendFilename.trim();


 const original =
   originalFilename.trim();



 if(!backend){

   return original;

 }



 return backend;


}






function getFileExtension(
 filename:string,
){

 const index =
   filename.lastIndexOf(".");


 if(index === -1){

   return "";

 }


 return filename
   .slice(index)
   .toLowerCase();

}







function formatFileSize(

 bytes:number,

){


 if(bytes < 1024){

   return `${bytes} B`;

 }


 const kb =
   bytes / 1024;



 if(kb < 1024){

   return `${kb.toFixed(2)} KB`;

 }


 return `${(
   kb / 1024
 ).toFixed(2)} MB`;

}



}

export default UploadLogs;
