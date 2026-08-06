import {
  useParams,
} from "react-router-dom";

import InvestigationHeader from "../components/investigation/InvestigationHeader";
import InvestigationTimeline from "../components/investigation/InvestigationTimeline";
import EvidencePanel from "../components/investigation/EvidencePanel";
import ThreatIntelligenceCard from "../components/investigation/ThreatIntelligenceCard";
import GlobalThreatMap from "../components/investigation/GlobalThreatMap";
import AIInvestigationReport from "../components/investigation/AIInvestigationReport";


function InvestigationWorkspace() {

  const { id } = useParams();


  return (

    <div className="min-h-screen bg-slate-900 p-4 text-white sm:p-6 lg:p-8">


      <div className="mx-auto max-w-7xl space-y-8">



        {/* Investigation Header */}

        <InvestigationHeader

          id={`INC-${id ?? "001"}`}

          title="Brute Force Attack Investigation"

          severity="Critical"

          status="In Progress"

          analyst="Dipan Khatri"

          riskScore={92}

          createdAt="Aug 5, 2026 10:15 AM"

          updatedAt="2 minutes ago"

        />




        {/* Attack Timeline */}

        <InvestigationTimeline />




        {/* Technical Evidence */}

        <EvidencePanel

          sourceIp="185.220.101.12"

          username="administrator"

          hostname="WIN-SERVER-01"

          technique="T1110 - Brute Force"

          attempts={15}

        />




        {/* Threat Intelligence */}

        <ThreatIntelligenceCard

          ip="185.220.101.12"

        />




        {/* Global Threat Map */}

        <GlobalThreatMap />




        {/* AI Investigation Report */}

        <AIInvestigationReport />



      </div>


    </div>

  );

}


export default InvestigationWorkspace;
