import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import MainLayout from "../../components/MainLayout";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

/* ------------------------------------------------------------------ */
/* Icônes SVG                                                          */
/* ------------------------------------------------------------------ */
const Icone = ({ d, className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {Array.isArray(d) ? (
      d.map((p, i) => <path key={i} d={p} />)
    ) : (
      <path d={d} />
    )}
  </svg>
);

const I = {
  personnes: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 010 7.75",
  batiment: "M3 21h18M6 21V7l6-4 6 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01",
  calendrier: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  plus: "M12 5v14M5 12h14",
  reglage: "M12 6V4m0 16v-2m6-8h2M4 12H2m15.364 6.364l1.414 1.414M4.222 4.222l1.414 1.414m12.728 0l-1.414 1.414M5.636 18.364l-1.414 1.414",
  fleche: "M5 12h14M13 6l6 6-6 6",
};

export default function DashboardAdminPage() {
  const [kpis, setKpis] = useState({
    totalEmployes: 0,
    totalDivisions: 0,
    totalServices: 0,
    totalJoursFeries: 0,
  });

  const [dataEvolution, setDataEvolution] = useState([]);
  const [dataDivisions, setDataDivisions] = useState([]);
  const [chargement, setChargement] = useState(true);

  /* ============================================================
     CHARGEMENT DU DASHBOARD & CALCULS DYNAMIQUES
  ============================================================ */

  async function chargerDashboard() {
    setChargement(true);

    try {
      // 1. Récupération des utilisateurs
      let resEmp = null;
      for (const ep of ["/users/", "/users/utilisateurs/", "/utilisateurs/"]) {
        try {
          resEmp = await api.get(ep);
          break;
        } catch (e) { /* ignore */ }
      }

      // 2. Appel des routes Django selon la configuration URLconf réelle
      const [resDiv, resSrv, resFer, resDem] = await Promise.all([
        api.get("/organisation/divisions/").catch(() => ({ data: [] })),
        api.get("/organisation/services/").catch(() => ({ data: [] })),
        api.get("/jours-feries/").catch(() => ({ data: [] })),
        api.get("/demandes/").catch(() => ({ data: [] })),
      ]);

      const listEmp = Array.isArray(resEmp?.data) ? resEmp.data : resEmp?.data?.results ?? [];
      const listDiv = Array.isArray(resDiv.data) ? resDiv.data : resDiv.data?.results ?? [];
      const listSrv = Array.isArray(resSrv.data) ? resSrv.data : resSrv.data?.results ?? [];
      const listFer = Array.isArray(resFer.data) ? resFer.data : resFer.data?.results ?? [];
      const listDem = Array.isArray(resDem.data) ? resDem.data : resDem.data?.results ?? [];

      // KPIs
      setKpis({
        totalEmployes: listEmp.length,
        totalDivisions: listDiv.length,
        totalServices: listSrv.length,
        totalJoursFeries: listFer.length,
      });

      // 📊 Diagramme 1 : Répartition par Division
      const couleurs = ["#3c0038", "#0097ff", "#93003f", "#10b981", "#f59e0b", "#8b5cf6"];
      
      const repartition = listDiv.map((div, idx) => {
        let totalAgentsDivision = 0;

        if (Array.isArray(div.services)) {
          totalAgentsDivision = div.services.reduce((acc, srv) => {
            return acc + (srv.nombre_agents || 0);
          }, 0);
        }

        return {
          nom: div.nom || div.code || `Division ${div.id}`,
          nombre: totalAgentsDivision,
          couleur: couleurs[idx % couleurs.length],
        };
      });

      setDataDivisions(repartition);

      // 📈 Diagramme 2 : Évolution dynamique des absences
      const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
      const statsMois = {};
      const auj = new Date();

      // Initialisation par défaut des 6 derniers mois
      for (let i = 5; i >= 0; i--) {
        const d = new Date(auj.getFullYear(), auj.getMonth() - i, 1);
        const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        statsMois[cle] = { mois: `${moisNoms[d.getMonth()]}`, demandes: 0 };
      }

      // Extraction sans décalage de fuseau horaire
      listDem.forEach((d) => {
        const rawDate = d.date_debut || d.created_at;
        if (!rawDate) return;

        const match = String(rawDate).match(/^(\d{4})-(\d{2})/);
        if (match) {
          const annee = match[1];
          const moisIdx = parseInt(match[2], 10) - 1;
          const cle = `${annee}-${match[2]}`;

          if (!statsMois[cle]) {
            statsMois[cle] = { mois: `${moisNoms[moisIdx]}`, demandes: 0 };
          }
          statsMois[cle].demandes += 1;
        }
      });

      // Tri chronologique des 6 derniers mois
      const resultatsTries = Object.keys(statsMois)
        .sort()
        .slice(-6)
        .map((key) => statsMois[key]);

      setDataEvolution(resultatsTries);
    } catch (err) {
      console.error("Erreur de chargement du dashboard :", err);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerDashboard();
  }, []);

  /* ============================================================
     AFFICHAGE
  ============================================================ */

  return (
    <MainLayout>
      <div className="min-h-full bg-gradient-to-b from-[#e7ffff] via-[#f4fdff] to-[#eef4ff] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* En-tête */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#3c0038] sm:text-3xl">
                Administration & Organisation
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Gestion de l'effectif, de la structure organisationnelle et des paramètres globaux
              </p>
            </div>
            <button
              onClick={chargerDashboard}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-white/80 bg-white/80 px-4 py-2 text-xs font-semibold text-[#3c0038] shadow-sm backdrop-blur transition hover:bg-white"
            >
              Actualiser
            </button>
          </div>

          {chargement ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3c0038] border-t-transparent" />
              <p className="mt-4 text-sm font-semibold text-[#3c0038]">Chargement de la configuration...</p>
            </div>
          ) : (
            <div className="space-y-8">

              {/* Cartes KPI */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                
                {/* KPI 1 : Employés */}
                <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Total Employés
                    </span>
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#3c0038]/10 text-[#3c0038]">
                      <Icone d={I.personnes} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-[#3c0038]">
                      {kpis.totalEmployes}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                      Actifs
                    </span>
                  </div>
                </div>

                {/* KPI 2 : Divisions */}
                <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Divisions
                    </span>
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0097ff]/10 text-[#0097ff]">
                      <Icone d={I.batiment} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-[#3c0038]">
                      {kpis.totalDivisions}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#0097ff]">
                      Unités
                    </span>
                  </div>
                </div>

                {/* KPI 3 : Services */}
                <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Services
                    </span>
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-700">
                      <Icone d={I.batiment} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-[#3c0038]">
                      {kpis.totalServices}
                    </span>
                    <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-600">
                      Sous-unités
                    </span>
                  </div>
                </div>

                {/* KPI 4 : Jours Fériés */}
                <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Jours Fériés
                    </span>
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#93003f]/10 text-[#93003f]">
                      <Icone d={I.calendrier} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-[#93003f]">
                      {kpis.totalJoursFeries}
                    </span>
                    <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-[#93003f]">
                      Configurés
                    </span>
                  </div>
                </div>

              </div>

              {/* Raccourcis de Gestion */}
              <div className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <h2 className="text-base font-bold text-[#3c0038] mb-4">
                  Actions de Configuration Rapide
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Link
                    to="/admin/employes"
                    className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-white p-4 transition hover:border-[#3c0038] hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#3c0038]/10 text-[#3c0038]">
                        <Icone d={I.plus} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#3c0038]">Gestion des employés</p>
                        <p className="text-xs text-neutral-500">Ajout & mise à jour</p>
                      </div>
                    </div>
                    <Icone d={I.fleche} className="h-4 w-4 text-neutral-400" />
                  </Link>

                  <Link
                    to="/admin/structure"
                    className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-white p-4 transition hover:border-[#0097ff] hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#0097ff]/10 text-[#0097ff]">
                        <Icone d={I.batiment} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#3c0038]">Structure Organique</p>
                        <p className="text-xs text-neutral-500">Divisions & Services</p>
                      </div>
                    </div>
                    <Icone d={I.fleche} className="h-4 w-4 text-neutral-400" />
                  </Link>

                  <Link
                    to="/admin/jours-feries"
                    className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-white p-4 transition hover:border-[#93003f] hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#93003f]/10 text-[#93003f]">
                        <Icone d={I.reglage} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#3c0038]">Jours Fériés</p>
                        <p className="text-xs text-neutral-500">Calendrier des congés</p>
                      </div>
                    </div>
                    <Icone d={I.fleche} className="h-4 w-4 text-neutral-400" />
                  </Link>
                </div>
              </div>

              {/* Graphiques */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Graphique 1 : Évolution des demandes */}
                <div className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur lg:col-span-2">
                  <div className="mb-6">
                    <h2 className="text-base font-bold text-[#3c0038]">
                      Volume global des absences
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Évolution du nombre total de demandes déposées par mois
                    </p>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dataEvolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDemandes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3c0038" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3c0038" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                          }}
                        />
                        <Area type="monotone" dataKey="demandes" stroke="#3c0038" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDemandes)" name="Total Demandes" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Graphique 2 : Répartition par Division */}
                <div className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                  <div className="mb-6">
                    <h2 className="text-base font-bold text-[#3c0038]">
                      Répartition par Division
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Nombre d'employés affectés par entité
                    </p>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dataDivisions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="nom" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                        <Tooltip
                          cursor={{ fill: "transparent" }}
                          contentStyle={{
                            backgroundColor: "#fff",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                          }}
                        />
                        <Bar dataKey="nombre" radius={[8, 8, 0, 0]} name="Employés">
                          {dataDivisions.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.couleur} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}