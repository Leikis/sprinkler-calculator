"use client";

import { useState } from "react";

interface NodeInput {
  node_nr: number;
  k_faktor: number;
  min_trykk_bar: number;
  dekningsareal_m2: number;
  krav_mm_m2: number;
  diameter_mm: number;
  lengde_m: number;
  antall_90_bend: number;
  antall_tstykker: number;
  er_grenror: boolean;
}

interface RettsrekkInput {
  rs_nr: number;
  diameter_mm: number;
  lengde_m: number;
  antall_90_bend: number;
  antall_tstykker: number;
}

interface CalculationResult {
  success: boolean;
  error?: string;
  total_vannmengde_lpm?: number;
  total_trykk_bar?: number;
  noder?: Array<{
    node_nr: number;
    flow_lpm: number;
    pressure_at_node_bar: number;
    cumulative_flow_lpm?: number;
  }>;
  rettstrekk?: Array<{
    rs_nr: number;
    pressure_drop_per_m_bar: number;
    outlet_pressure_bar: number;
  }>;
}

const defaultNode1: NodeInput = {
  node_nr: 1,
  k_faktor: 80,
  min_trykk_bar: 0.5,
  dekningsareal_m2: 12,
  krav_mm_m2: 5,
  diameter_mm: 27.3,
  lengde_m: 3,
  antall_90_bend: 0,
  antall_tstykker: 0,
  er_grenror: false,
};

const defaultNode2: NodeInput = {
  node_nr: 2,
  k_faktor: 80,
  min_trykk_bar: 0.5,
  dekningsareal_m2: 0,
  krav_mm_m2: 0,
  diameter_mm: 27.3,
  lengde_m: 0,
  antall_90_bend: 0,
  antall_tstykker: 1,
  er_grenror: false,
};

const defaultRettstrekk: RettsrekkInput = {
  rs_nr: 2,
  diameter_mm: 36,
  lengde_m: 4,
  antall_90_bend: 0,
  antall_tstykker: 0,
};

export default function Home() {
  const [cFaktor, setCFaktor] = useState(120);
  const [hoydeAnlegg, setHoydeAnlegg] = useState(0);
  const [node1, setNode1] = useState<NodeInput>(defaultNode1);
  const [node2, setNode2] = useState<NodeInput>(defaultNode2);
  const [rettstrekk, setRettstrekk] = useState<RettsrekkInput>(defaultRettstrekk);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);

    const inputData = {
      generelle_parametre: {
        c_faktor: cFaktor,
        hoyde_anlegg_m: hoydeAnlegg,
      },
      noder: [node1, node2],
      rettstrekk: [rettstrekk],
      ventiler: {},
    };

    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputData),
      });

      const data = await response.json();
      setResult(data);

      if (!data.success) {
        setError(data.error || "Calculation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sprinkler Calculator
        </h1>
        <p className="text-gray-600 mb-8">
          Hydraulisk beregning av sprinkleranlegg etter NS 12845
        </p>

        {/* General Parameters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Generelle Parametre</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                C-faktor
              </label>
              <select
                value={cFaktor}
                onChange={(e) => setCFaktor(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value={100}>100</option>
                <option value={110}>110</option>
                <option value={120}>120</option>
                <option value={130}>130</option>
                <option value={140}>140</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Høyde anlegg (m)
              </label>
              <input
                type="number"
                value={hoydeAnlegg}
                onChange={(e) => setHoydeAnlegg(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Node 1 - First Sprinkler */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Node 1 - Første Sprinklerhode
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                K-faktor
              </label>
              <input
                type="number"
                value={node1.k_faktor}
                onChange={(e) =>
                  setNode1({ ...node1, k_faktor: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min. trykk (Bar)
              </label>
              <input
                type="number"
                step="0.1"
                value={node1.min_trykk_bar}
                onChange={(e) =>
                  setNode1({ ...node1, min_trykk_bar: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dekningsareal (m²)
              </label>
              <input
                type="number"
                value={node1.dekningsareal_m2}
                onChange={(e) =>
                  setNode1({ ...node1, dekningsareal_m2: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Krav (mm/min/m²)
              </label>
              <input
                type="number"
                value={node1.krav_mm_m2}
                onChange={(e) =>
                  setNode1({ ...node1, krav_mm_m2: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diameter (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={node1.diameter_mm}
                onChange={(e) =>
                  setNode1({ ...node1, diameter_mm: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lengde (m)
              </label>
              <input
                type="number"
                step="0.1"
                value={node1.lengde_m}
                onChange={(e) =>
                  setNode1({ ...node1, lengde_m: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                90° Bend (stk)
              </label>
              <input
                type="number"
                value={node1.antall_90_bend}
                onChange={(e) =>
                  setNode1({ ...node1, antall_90_bend: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                T-stykker (stk)
              </label>
              <input
                type="number"
                value={node1.antall_tstykker}
                onChange={(e) =>
                  setNode1({ ...node1, antall_tstykker: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Node 2 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Node 2</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                K-faktor
              </label>
              <input
                type="number"
                value={node2.k_faktor}
                onChange={(e) =>
                  setNode2({ ...node2, k_faktor: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diameter (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={node2.diameter_mm}
                onChange={(e) =>
                  setNode2({ ...node2, diameter_mm: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                T-stykker (stk)
              </label>
              <input
                type="number"
                value={node2.antall_tstykker}
                onChange={(e) =>
                  setNode2({ ...node2, antall_tstykker: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="grenror"
                checked={node2.er_grenror}
                onChange={(e) =>
                  setNode2({ ...node2, er_grenror: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="grenror" className="ml-2 text-sm text-gray-700">
                Grenrør
              </label>
            </div>
          </div>
        </div>

        {/* Rettstrekk 2 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Rettstrekk 2</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diameter (mm)
              </label>
              <input
                type="number"
                step="0.1"
                value={rettstrekk.diameter_mm}
                onChange={(e) =>
                  setRettstrekk({
                    ...rettstrekk,
                    diameter_mm: Number(e.target.value),
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lengde (m)
              </label>
              <input
                type="number"
                step="0.1"
                value={rettstrekk.lengde_m}
                onChange={(e) =>
                  setRettstrekk({
                    ...rettstrekk,
                    lengde_m: Number(e.target.value),
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                90° Bend (stk)
              </label>
              <input
                type="number"
                value={rettstrekk.antall_90_bend}
                onChange={(e) =>
                  setRettstrekk({
                    ...rettstrekk,
                    antall_90_bend: Number(e.target.value),
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                T-stykker (stk)
              </label>
              <input
                type="number"
                value={rettstrekk.antall_tstykker}
                onChange={(e) =>
                  setRettstrekk({
                    ...rettstrekk,
                    antall_tstykker: Number(e.target.value),
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <div className="mb-6">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {loading ? "Beregner..." : "Beregn"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {result && result.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4">
              Beregningsresultater
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-500">Total vannmengde</div>
                <div className="text-2xl font-bold text-gray-900">
                  {result.total_vannmengde_lpm?.toFixed(1)} l/min
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-500">Totalt trykk</div>
                <div className="text-2xl font-bold text-gray-900">
                  {result.total_trykk_bar?.toFixed(3)} Bar
                </div>
              </div>
            </div>

            {/* Node Results */}
            <h3 className="font-semibold text-green-800 mb-2">
              Noder (Sprinklerhoder)
            </h3>
            <div className="bg-white rounded-lg overflow-hidden mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Node
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Vannmengde
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Trykk
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Kumulativ Q
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {result.noder?.map((node) => (
                    <tr key={node.node_nr}>
                      <td className="px-4 py-2 text-sm font-medium">
                        S{node.node_nr}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {node.flow_lpm.toFixed(1)} l/min
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {node.pressure_at_node_bar.toFixed(3)} Bar
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {node.cumulative_flow_lpm?.toFixed(1) || "-"} l/min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rettstrekk Results */}
            {result.rettstrekk && result.rettstrekk.length > 0 && (
              <>
                <h3 className="font-semibold text-green-800 mb-2">
                  Rettstrekk (Rørføringer)
                </h3>
                <div className="bg-white rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          RS
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Trykktap/m
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Utløpstrykk
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.rettstrekk.map((rs) => (
                        <tr key={rs.rs_nr}>
                          <td className="px-4 py-2 text-sm font-medium">
                            RS{rs.rs_nr}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {rs.pressure_drop_per_m_bar.toFixed(6)} Bar/m
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {rs.outlet_pressure_bar.toFixed(3)} Bar
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Debug: Show raw JSON */}
        {result && (
          <details className="mt-6">
            <summary className="cursor-pointer text-gray-500 text-sm">
              Vis rå JSON-resultat
            </summary>
            <pre className="mt-2 bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
