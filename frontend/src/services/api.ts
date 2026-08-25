// frontend/src/services/api.ts


const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://sentinelai-api-gbci.onrender.com";



// ================================
// BASIC TYPES
// ================================


export type RiskLevel =
  | "Critical"
  | "High"
  | "Medium"
  | "Low";



export interface SuspiciousIp {

  ip: string;

  attempts: number;

  targeted_users: string[];

}



export interface Detection {

  id?: number;

  type: string;

  severity: RiskLevel;

  mitre_id: string;

  description: string;

  confidence?: number;

  source_ip?: string | null;

  affected_users: string[];

  event_count: number;

  recommendations: string[];

}




export interface SeveritySummary {

  critical: number;

  high: number;

  medium: number;

  low: number;

}




export interface TimelineEvent {

  id?: number;

  timestamp: string;

  event_type?: string;

  title?: string;

  status?: string;

  ip?: string | null;

  user?: string | null;

  method?: string | null;

  raw?: string;

  invalid_user?: boolean;

  line_number?: number;

}






export interface UploadResult {



  id?: number;

  total_events?: number;

  severity?: RiskLevel;

  analysis_id?: number;


  saved_to_database?: boolean;


  filename: string;


  entries: number;


  preview: string[];


  failed_logins: number;


  successful_logins: number;


  suspicious_ips: SuspiciousIp[];


  detections: Detection[];


  severity_summary: SeveritySummary;


  risk_score: number;


  risk_level: RiskLevel;


  timeline: TimelineEvent[];


}







export interface AnalysisHistoryItem {
  id: number;
  filename: string;

  created_at?: string;
  upload_time?: string;

  risk_score: number;
  risk_level: RiskLevel;

  detection_count: number;

  failed_logins?: number;
  successful_logins?: number;

  entries?: number;
  total_events?: number;
}








export interface HistoricalAnalysisDetail {


  id: number;


  filename: string;


  upload_time: string | null;


  entries: number;


  failed_logins: number;


  successful_logins: number;


  risk_score: number;


  risk_level: RiskLevel;


  detections: Detection[];


  timeline: TimelineEvent[];


}








export interface DeleteAnalysisResponse {


  message: string;


  analysis_id: number;


  filename: string;


}


// ================================
// INVESTIGATION TYPES
// ================================


export type InvestigationStatus =
  | "Open"
  | "In Progress"
  | "Resolved"
  | "False Positive";





export interface Investigation {


  id: number;


  analysis_id: number;


  detection_id: number;


  status: InvestigationStatus;


  analyst: string;


  notes: string;


  completed_actions: string[];


  created_at: string | null;


  updated_at: string | null;


}







export interface SaveInvestigationPayload {


  analysis_id: number;


  detection_id: number;


  status: InvestigationStatus;


  analyst: string;


  notes: string;


  completed_actions: string[];


}







export interface UpdateInvestigationPayload {


  status: InvestigationStatus;


  analyst: string;


  notes: string;


  completed_actions: string[];


}







// ================================
// THREAT INTELLIGENCE TYPES
// ================================


export interface ThreatIntelligenceResponse {


  ip: string;


  country_code: string | null;


  country: string | null;


  continent_code: string | null;


  continent: string | null;


  asn: string | null;


  organization: string | null;


  organization_domain: string | null;


  source: string;


  cached: boolean;


  recommendation: string;


}








export interface ClearThreatIntelligenceCacheResponse {


  message: string;


  removed_entries: number;


}








// ================================
// API HELPERS
// ================================


function buildApiUrl(path: string): string {


  return (

    API_URL.replace(/\/$/, "")

    +

    (

      path.startsWith("/")

        ? path

        : `/${path}`

    )

  );


}







async function getErrorMessage(

  response: Response,

  fallback: string

): Promise<string> {



  try {


    const data = await response.json();



    if (typeof data.detail === "string") {

      return data.detail;

    }




    if (typeof data.message === "string") {

      return data.message;

    }



  } catch {

    // ignore

  }



  return fallback;


}







async function apiFetch(

  path: string,

  options?: RequestInit

): Promise<Response> {


  return fetch(

    buildApiUrl(path),

    options

  );


}
// ================================
// UPLOAD API
// ================================


export async function uploadLog(

  file: File

): Promise<UploadResult> {



  const formData = new FormData();


  formData.append(

    "file",

    file

  );




  const response = await apiFetch(

    "/api/upload",

    {

      method: "POST",

      body: formData,

    }

  );




  if (!response.ok) {


    throw new Error(

      await getErrorMessage(

        response,

        "Upload failed."

      )

    );


  }




  return response.json();


}









// ================================
// ANALYSIS API
// ================================



export async function getAnalyses()

: Promise<AnalysisHistoryItem[]> {



  const response = await apiFetch(

    "/api/analyses"

  );




  if (!response.ok) {


    throw new Error(

      await getErrorMessage(

        response,

        "Unable to load analyses."

      )

    );


  }





  return response.json();


}








export async function getAnalysisById(

  analysisId:number

): Promise<HistoricalAnalysisDetail> {



  const response = await apiFetch(

    `/api/analyses/${analysisId}`

  );




  if (!response.ok) {


    throw new Error(

      await getErrorMessage(

        response,

        "Unable to load analysis."

      )

    );


  }





  return response.json();


}








export async function deleteAnalysis(

  analysisId:number

): Promise<DeleteAnalysisResponse> {



  const response = await apiFetch(

    `/api/analyses/${analysisId}`,

    {

      method:"DELETE",

    }

  );




  if (!response.ok) {


    throw new Error(

      await getErrorMessage(

        response,

        "Unable to delete analysis."

      )

    );


  }





  return response.json();


}









// ================================
// INVESTIGATION API
// ================================



export async function getInvestigations()

: Promise<Investigation[]> {



  const response = await apiFetch(

    "/api/investigations"

  );




  if (!response.ok) {


    throw new Error(

      await getErrorMessage(

        response,

        "Unable to load investigations."

      )

    );


  }





  return response.json();


}








export async function getInvestigation(

  investigationId:number

): Promise<Investigation> {



  const response = await apiFetch(

    `/api/investigations/${investigationId}`

  );




  if (!response.ok) {


    throw new Error(

      await getErrorMessage(

        response,

        "Unable to load investigation."

      )

    );


  }





  return response.json();


}








export async function createInvestigation(

  payload:SaveInvestigationPayload

): Promise<Investigation> {



  const response = await apiFetch(

    "/api/investigations",

    {

      method:"POST",


      headers:{

        "Content-Type":

          "application/json",

      },


      body:

        JSON.stringify(payload),

    }

  );




  if (!response.ok) {


    throw new Error(

      await getErrorMessage(

        response,

        "Unable to create investigation."

      )

    );


  }





  return response.json();


}








// Compatibility for old component imports

export async function saveInvestigation(

  payload:SaveInvestigationPayload

): Promise<Investigation> {


  return createInvestigation(payload);


}








export async function updateInvestigation(

  investigationId:number,


  payload:UpdateInvestigationPayload

): Promise<Investigation> {



  const response = await apiFetch(

    `/api/investigations/${investigationId}`,

    {

      method:"PUT",


      headers:{

        "Content-Type":

          "application/json",

      },


      body:

        JSON.stringify(payload),

    }

  );




  if (!response.ok) {


    throw new Error(

      await getErrorMessage(

        response,

        "Unable to update investigation."

      )

    );


  }





  return response.json();


}
// ================================
// THREAT INTELLIGENCE API
// ================================



export async function getThreatIntelligence(

  ipAddress:string

):Promise<ThreatIntelligenceResponse>{



  const ip = ipAddress.trim();




  if(!ip){

    throw new Error(

      "IP address is required."

    );

  }






  const response = await apiFetch(

    `/api/threat-intel/api/threat-intel/${encodeURIComponent(ip)}`

  );






  if(!response.ok){


    throw new Error(

      await getErrorMessage(

        response,

        "Unable to get threat intelligence."

      )

    );


  }





  return response.json();


}









export async function clearThreatIntelligenceCache()

:Promise<ClearThreatIntelligenceCacheResponse>{



  const response = await apiFetch(

    "/api/threat-intel/api/threat-intel/cache",

    {

      method:"DELETE",

    }

  );






  if(!response.ok){


    throw new Error(

      await getErrorMessage(

        response,

        "Unable to clear cache."

      )

    );


  }





  return response.json();


}









// ================================
// HISTORICAL ANALYSIS CONVERTER
// ================================



export function historicalAnalysisToUploadResult(

  historicalAnalysis:HistoricalAnalysisDetail

):UploadResult {



  const severity_summary:SeveritySummary = {



    critical:

      historicalAnalysis.detections.filter(

        d => d.severity === "Critical"

      ).length,



    high:

      historicalAnalysis.detections.filter(

        d => d.severity === "High"

      ).length,



    medium:

      historicalAnalysis.detections.filter(

        d => d.severity === "Medium"

      ).length,



    low:

      historicalAnalysis.detections.filter(

        d => d.severity === "Low"

      ).length,


  };







  const ipMap = new Map<string,SuspiciousIp>();






  historicalAnalysis.detections.forEach(

    detection => {


      if(!detection.source_ip){

        return;

      }





      const current =

        ipMap.get(

          detection.source_ip

        );






      if(current){



        current.attempts = Math.max(

          current.attempts,

          detection.event_count

        );




        current.targeted_users = [

          ...new Set([

            ...current.targeted_users,

            ...detection.affected_users,

          ])

        ];



      }

      else{



        ipMap.set(

          detection.source_ip,

          {


            ip:detection.source_ip,


            attempts:

              detection.event_count,


            targeted_users:

              detection.affected_users,


          }

        );


      }



    }

  );









  return {


    analysis_id:

      historicalAnalysis.id,



    saved_to_database:

      true,



    filename:

      historicalAnalysis.filename,



    entries:

      historicalAnalysis.entries,



    preview:

      [],



    failed_logins:

      historicalAnalysis.failed_logins,



    successful_logins:

      historicalAnalysis.successful_logins,



    suspicious_ips:

      Array.from(

        ipMap.values()

      ),



    detections:

      historicalAnalysis.detections,



    severity_summary,



    risk_score:

      historicalAnalysis.risk_score,



    risk_level:

      historicalAnalysis.risk_level,



    timeline:

      historicalAnalysis.timeline ?? [],



  };


}
