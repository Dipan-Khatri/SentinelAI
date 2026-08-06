import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
 
  Upload,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";


import AICopilot from "../components/dashboard/AICopilot";
import AIIncidentSummary from "../components/dashboard/AIIncidentSummary";
import AttackChainVisualization from "../components/dashboard/AttackChainVisualization";
import AuthenticationActivityChart from "../components/dashboard/AuthenticationActivityChart";
import AuthenticationOverview from "../components/dashboard/AuthenticationOverview";
import ExecutiveOverview from "../components/dashboard/ExecutiveOverview";
import LatestIncidents from "../components/dashboard/LatestIncidents";
import LiveEventFeed from "../components/dashboard/LiveEventFeed";
import LiveThreatMap from "../components/dashboard/LiveThreatMap";
import MitreTechniques from "../components/dashboard/MitreTechniques";
import RecentAlerts from "../components/dashboard/RecentAlerts";
import RecentDetectionTimeline from "../components/dashboard/RecentDetectionTimeline";
import RecommendationPanel from "../components/dashboard/RecommendationPanel";
import RiskGauge from "../components/dashboard/RiskGauge";
import RiskOverview from "../components/dashboard/RiskOverview";
import SecurityActivityTimeline from "../components/dashboard/SecurityActivityTimeline";
import SeverityDistribution from "../components/dashboard/SeverityDistribution";
import SOCAnalystActivity from "../components/dashboard/SOCAnalystActivity_temp";
import ThreatIntelligenceCenter from "../components/dashboard/ThreatIntelligenceCenter";
import TopSuspiciousIps from "../components/dashboard/TopSuspiciousIps";


import {
  getInvestigations,
  type Investigation,
  type UploadResult,
} from "../services/api";



const STORAGE_KEY =
  "sentinelai_latest_analysis";



function Dashboard() {


  const [analysis,setAnalysis] =
    useState<UploadResult | null>(null);


  const [
    investigations,
    setInvestigations,
  ] = useState<Investigation[]>([]);



  const [caseError,setCaseError] =
    useState("");





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

      }catch{

        localStorage.removeItem(
          STORAGE_KEY
        );

      }

    }




    async function loadCases(){

      try{

        const data =
          await getInvestigations();


        setInvestigations(data);


      }catch(error){

        setCaseError(
          error instanceof Error
          ?
          error.message
          :
          "Unable to load investigations."
        );

      }

    }


    void loadCases();



  },[]);







  const topSuspiciousIps =
    useMemo(()=>{


      if(!analysis)
        return [];


      return [
        ...analysis.suspicious_ips
      ]
      .sort(
        (a,b)=>
          b.attempts-a.attempts
      )
      .slice(0,5);



    },[analysis]);








  const recentDetections =
    useMemo(()=>{


      if(!analysis)
        return [];


      return [
        ...analysis.detections
      ]
      .slice(0,5);



    },[analysis]);









  if(!analysis){

    return <EmptyDashboard/>;

  }







  return (

    <div className="min-h-screen bg-slate-900 p-4 text-white sm:p-6 lg:p-8">


      <div className="mx-auto max-w-7xl">





        <header className="flex flex-wrap items-start justify-between gap-5">


          <div>


            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">

              SentinelAI SOC Dashboard

            </p>



            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">

              Good Morning, Dipan 👋

            </h1>



            <p className="mt-2 text-slate-400">

              SentinelAI analyzed{" "}

              {analysis.entries.toLocaleString()}

              {" "}security events from{" "}


              <span className="font-medium text-slate-300">

                {analysis.filename}

              </span>


            </p>


          </div>





          <Link

            to="/upload"

            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 hover:bg-blue-700"

          >

            <Upload className="h-5 w-5"/>

            Analyze New Logs


          </Link>



        </header>






        {
          caseError &&

          <div className="mt-6 rounded-lg bg-amber-500/10 p-4 text-amber-300">

            {caseError}

          </div>

        }









        <ExecutiveOverview

          analysis={analysis}

          investigations={investigations}

        />







        <LatestIncidents

          analysis={analysis}

          investigations={investigations}

        />







        <section className="mt-8">

          <SOCAnalystActivity

            investigations={investigations}

          />

        </section>







        <section className="mt-8">


          <RecentDetectionTimeline

            detections={recentDetections}

          />


        </section>







        <section className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">


          <RiskOverview

            analysis={analysis}

          />



          <AuthenticationOverview

            analysis={analysis}

          />


        </section>








        <section className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">


          <AuthenticationActivityChart

            analysis={analysis}

          />



          <RiskGauge

            analysis={analysis}

          />


        </section>







        <AIIncidentSummary

          analysis={analysis}

        />





        <AttackChainVisualization

          analysis={analysis}

        />







        <AICopilot

          analysis={analysis}

        />







        <LiveEventFeed

          analysis={analysis}

        />







        <LiveThreatMap

          suspiciousIps={
            analysis.suspicious_ips
          }

        />







        <ThreatIntelligenceCenter

          suspiciousIps={
            analysis.suspicious_ips
          }

        />







        <section className="mt-8 grid gap-6 xl:grid-cols-2">


          <RecentAlerts

            detections={recentDetections}

          />



          <TopSuspiciousIps

            suspiciousIps={topSuspiciousIps}

          />


        </section>







        <section className="mt-8 grid gap-6 xl:grid-cols-2">


          <SeverityDistribution

            analysis={analysis}

          />



          <MitreTechniques

            detections={
              analysis.detections
            }

          />


        </section>







        <section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">


          <SecurityActivityTimeline

            analysis={analysis}

          />



          <RecommendationPanel

            analysis={analysis}

          />


        </section>





      </div>

    </div>


  );

}









function EmptyDashboard(){


return (

<div className="min-h-screen bg-slate-900 p-8 text-white">


<h1 className="text-4xl font-bold">

Good Morning, Dipan 👋

</h1>


<p className="mt-3 text-slate-400">

Upload security logs to start SentinelAI analysis.

</p>


<Link

to="/upload"

className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3"

>

Upload Logs

</Link>


</div>

);


}





export default Dashboard;
