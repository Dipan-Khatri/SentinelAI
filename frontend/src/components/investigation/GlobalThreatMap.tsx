import {
  Globe2,

  Radio,
  ShieldAlert,
} from "lucide-react";


type ThreatSource = {
  country: string;
  city: string;
  ip: string;
  attempts: number;
  risk: "Critical" | "High" | "Medium";
  x: number;
  y: number;
};


const threatSources: ThreatSource[] = [
  {
    country: "Germany",
    city: "Frankfurt",
    ip: "185.220.101.12",
    attempts: 15,
    risk: "Critical",
    x: 560,
    y: 180,
  },

  {
    country: "China",
    city: "Beijing",
    ip: "103.45.77.20",
    attempts: 22,
    risk: "High",
    x: 760,
    y: 220,
  },

  {
    country: "Russia",
    city: "Moscow",
    ip: "91.198.174.5",
    attempts: 11,
    risk: "High",
    x: 650,
    y: 140,
  },

  {
    country: "Brazil",
    city: "Sao Paulo",
    ip: "177.55.33.10",
    attempts: 8,
    risk: "Medium",
    x: 350,
    y: 330,
  },
];


function GlobalThreatMap() {


  const destination = {
    x: 250,
    y: 220,
  };


  return (

    <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">


      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-700 p-6">


        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Threat Visualization
          </p>


          <h2 className="mt-2 text-2xl font-bold text-white">
            Global Attack Map
          </h2>


          <p className="mt-2 text-sm text-slate-400">
            Visual representation of active threat
            sources targeting SentinelAI.
          </p>

        </div>



        <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300">

          <Radio className="h-4 w-4 animate-pulse"/>

          Live Monitoring

        </div>


      </div>





      <div className="grid lg:grid-cols-[1fr_300px]">


        <div className="relative min-h-[450px] overflow-hidden bg-slate-950">


          <svg
            viewBox="0 0 1000 500"
            className="h-full min-h-[450px] w-full"
          >


            <rect
              width="1000"
              height="500"
              fill="#020617"
            />



            {/* Grid */}

            {Array.from({
              length: 10,
            }).map(
              (_,index)=>(
                <line
                  key={index}
                  x1={index*100}
                  y1="0"
                  x2={index*100}
                  y2="500"
                  stroke="#1e293b"
                  opacity="0.5"
                />
              ),
            )}



            {/* Fake continents */}

            <path
              d="M100 130 L220 80 L350 130 L300 230 L150 220 Z"
              fill="#0f172a"
              stroke="#334155"
            />


            <path
              d="M430 120 L600 90 L700 170 L650 250 L480 220 Z"
              fill="#0f172a"
              stroke="#334155"
            />


            <path
              d="M700 280 L850 250 L920 350 L760 410 Z"
              fill="#0f172a"
              stroke="#334155"
            />




            {/* Attack paths */}

            {threatSources.map(
              (source)=>(
                <g key={source.ip}>


                  <path
                    d={`
                    M ${source.x}
                    ${source.y}

                    Q ${(source.x + destination.x)/2}
                    ${(source.y + destination.y)/2 - 80}

                    ${destination.x}
                    ${destination.y}
                    `}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="3"
                    strokeDasharray="10 10"
                  >


                    <animate
                      attributeName="stroke-dashoffset"
                      from="40"
                      to="0"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />


                  </path>




                  <circle
                    cx={source.x}
                    cy={source.y}
                    r="10"
                    fill={
                      source.risk==="Critical"
                      ? "#ef4444"
                      : "#f97316"
                    }
                  >


                    <animate
                      attributeName="r"
                      values="8;15;8"
                      dur="2s"
                      repeatCount="indefinite"
                    />


                  </circle>



                  <text
                    x={source.x+15}
                    y={source.y}
                    fill="white"
                    fontSize="14"
                  >
                    {source.country}
                  </text>


                </g>
              ),
            )}





            {/* SOC Destination */}

            <circle
              cx={destination.x}
              cy={destination.y}
              r="18"
              fill="#22d3ee"
              opacity="0.4"
            >


              <animate
                attributeName="r"
                values="15;30;15"
                dur="2s"
                repeatCount="indefinite"
              />


            </circle>



            <circle
              cx={destination.x}
              cy={destination.y}
              r="7"
              fill="#22d3ee"
            />



            <text
              x={destination.x+15}
              y={destination.y}
              fill="#67e8f9"
              fontSize="16"
              fontWeight="bold"
            >
              SentinelAI SOC
            </text>


          </svg>


        </div>





        <div className="border-t border-slate-700 bg-slate-900/50 p-5 lg:border-l lg:border-t-0">


          <h3 className="flex items-center gap-2 font-semibold text-white">

            <Globe2 className="h-5 w-5 text-cyan-400"/>

            Active Threats

          </h3>




          <div className="mt-5 space-y-3">


            {threatSources.map(
              (source)=>(
                <div
                  key={source.ip}
                  className="rounded-lg border border-slate-700 bg-slate-950 p-3"
                >

                  <div className="flex justify-between">


                    <div>

                      <p className="font-semibold text-white">
                        {source.country}
                      </p>

                      <p className="text-xs text-slate-500">
                        {source.city}
                      </p>

                    </div>


                    <ShieldAlert
                      className={
                        source.risk==="Critical"
                        ? "text-red-400"
                        : "text-orange-400"
                      }
                    />

                  </div>


                  <p className="mt-2 font-mono text-xs text-slate-400">
                    {source.ip}
                  </p>


                  <p className="mt-1 text-xs text-red-300">
                    {source.attempts} attempts
                  </p>


                </div>
              ),
            )}


          </div>



        </div>


      </div>


    </section>

  );

}


export default GlobalThreatMap;
